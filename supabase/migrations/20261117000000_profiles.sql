-- =============================================================================
-- NEXUS v0.3.0 – Accounts and profiles
--
-- * public.profiles   one row per user (created automatically on sign-up)
-- * usernames         unique, lowercase, 3–20 chars of a–z 0–9 _
-- * avatars           storage bucket; each user may only write inside their own folder
-- * helper functions  username_available(), delete_own_account()
--
-- Row Level Security is ON for everything. The app only ever uses the
-- publishable/anon key, so these policies are what actually protect the data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Reserved usernames (keep in sync with src/renderer/src/features/auth/validation.ts)
-- ---------------------------------------------------------------------------
create function public.is_reserved_username(name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(name) = any (array[
    'admin', 'administrator', 'nexus', 'support', 'moderator', 'mod', 'staff',
    'system', 'root', 'null', 'undefined', 'me', 'settings', 'help', 'official'
  ]);
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  username            text not null unique
                        constraint username_format check (username ~ '^[a-z0-9_]{3,20}$')
                        constraint username_not_reserved check (not public.is_reserved_username(username)),
  display_name        text constraint display_name_length check (char_length(display_name) between 1 and 32),
  bio                 text constraint bio_length check (char_length(bio) <= 160),
  -- Path inside the "avatars" bucket. Must live in the user's own folder: "<user id>/<file>"
  avatar_path         text constraint avatar_path_own_folder
                        check (avatar_path is null or (avatar_path like id::text || '/%' and char_length(avatar_path) <= 200)),
  profile_color       text constraint profile_color_hex check (profile_color ~ '^#[0-9a-f]{6}$'),
  favorite_game       text constraint favorite_game_length check (char_length(favorite_game) <= 60),
  favorite_anime      text constraint favorite_anime_length check (char_length(favorite_anime) <= 60),
  username_changed_at timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.profiles is 'Public profile for each NEXUS user. Visible to all signed-in users.';

alter table public.profiles enable row level security;

create policy "Signed-in users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert/delete policies: rows are created by the sign-up trigger and
-- removed automatically when the auth user is deleted.

-- Only these columns may be changed by users themselves.
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_path, profile_color, favorite_game, favorite_anime)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh and rate-limit username changes (once per 7 days)
-- ---------------------------------------------------------------------------
create function public.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.username is distinct from old.username then
    if old.username_changed_at is not null and old.username_changed_at > now() - interval '7 days' then
      raise exception 'You can only change your username once every 7 days.'
        using errcode = 'P0001', hint = 'username_cooldown';
    end if;
    new.username_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger profiles_before_update
  before update on public.profiles
  for each row execute function public.profiles_before_update();

-- ---------------------------------------------------------------------------
-- Create a profile automatically when someone signs up.
-- The app passes { username, display_name } as sign-up metadata.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  display text := nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 32), '');
begin
  if wanted !~ '^[a-z0-9_]{3,20}$' or public.is_reserved_username(wanted) then
    wanted := 'user_' || left(replace(new.id::text, '-', ''), 10);
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, wanted, coalesce(display, wanted));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- username_available('name') – lets the sign-up form check names as you type.
-- ---------------------------------------------------------------------------
create function public.username_available(name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(name) ~ '^[a-z0-9_]{3,20}$'
     and not public.is_reserved_username(name)
     and not exists (select 1 from public.profiles p where p.username = lower(name));
$$;

revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- delete_own_account() – permanently deletes the signed-in user.
-- (The app removes the user's avatar files first through the Storage API.)
-- ---------------------------------------------------------------------------
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Avatars bucket: public to read, 1 MB max, images only.
-- Files must be stored as "<user id>/<anything>".
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can see their own avatar files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can replace their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
