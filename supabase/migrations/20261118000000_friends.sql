-- =============================================================================
-- NEXUS v0.4.0 – Friends
--
-- * public.friendships   one row per pair of users: 'pending' request or 'accepted'
-- * public.blocks        who has blocked whom
-- * public.user_status   online / last-seen, visible only to yourself and your friends
--
-- Users never write these tables directly. Every change goes through the
-- functions below, which check the rules (no self-requests, blocks, limits...).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.friendships (
  id           bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'pending' constraint friendship_status check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint not_self check (requester_id <> addressee_id)
);

-- Only one row per pair, whichever direction it was sent in.
create unique index friendships_one_per_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee on public.friendships (addressee_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint not_self check (blocker_id <> blocked_id)
);
create index blocks_blocked on public.blocks (blocked_id);

create table public.user_status (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  online         boolean not null default false,
  appear_offline boolean not null default false,
  last_seen_at   timestamptz not null default now()
);

alter table public.friendships enable row level security;
alter table public.blocks      enable row level security;
alter table public.user_status enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers (security definer so policies can use them without recursion)
-- ---------------------------------------------------------------------------
create function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(a, b)
      and greatest(f.requester_id, f.addressee_id) = greatest(a, b)
  );
$$;

create function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks bl
    where (bl.blocker_id = a and bl.blocked_id = b) or (bl.blocker_id = b and bl.blocked_id = a)
  );
$$;

revoke execute on function public.are_friends(uuid, uuid) from public, anon;
revoke execute on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Read policies (no write policies: writes go through the functions below)
-- ---------------------------------------------------------------------------
create policy "See your own friendships and requests"
  on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "See the people you blocked"
  on public.blocks for select to authenticated
  using ((select auth.uid()) = blocker_id);

create policy "See your own status and your friends' status"
  on public.user_status for select to authenticated
  using (user_id = (select auth.uid()) or public.are_friends(user_id, (select auth.uid())));

-- People who blocked you can no longer see your profile, and you can't see theirs.
drop policy "Signed-in users can view profiles" on public.profiles;
create policy "Signed-in users can view profiles (except across blocks)"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or not public.is_blocked_between(id, (select auth.uid())));

-- Live updates for the app.
alter publication supabase_realtime add table public.friendships, public.user_status;

-- ---------------------------------------------------------------------------
-- Friend requests
-- ---------------------------------------------------------------------------

-- Returns 'sent', or 'accepted' when they had already sent you a request.
create function public.send_friend_request(target uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  existing public.friendships;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if target = me then raise exception 'You can''t add yourself as a friend.'; end if;
  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'That user doesn''t exist.';
  end if;
  if public.is_blocked_between(me, target) then
    raise exception 'You can''t send a friend request to this user.';
  end if;

  select * into existing from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(me, target)
    and greatest(f.requester_id, f.addressee_id) = greatest(me, target)
  for update;

  if found then
    if existing.status = 'accepted' then raise exception 'You''re already friends.'; end if;
    if existing.requester_id = me then raise exception 'You already sent this person a request.'; end if;
    -- They asked first: accept it.
    update public.friendships set status = 'accepted', responded_at = now() where id = existing.id;
    return 'accepted';
  end if;

  if (select count(*) from public.friendships where requester_id = me and status = 'pending') >= 25 then
    raise exception 'You have too many pending requests. Wait for some answers first.';
  end if;

  insert into public.friendships (requester_id, addressee_id) values (me, target);
  return 'sent';
end;
$$;

create function public.respond_friend_request(request_id bigint, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in'; end if;
  if accept then
    update public.friendships set status = 'accepted', responded_at = now()
    where id = request_id and addressee_id = me and status = 'pending';
  else
    delete from public.friendships
    where id = request_id and addressee_id = me and status = 'pending';
  end if;
  if not found then raise exception 'That friend request no longer exists.'; end if;
end;
$$;

-- Cancels a sent request, or removes a friend.
create function public.remove_friendship(other uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in'; end if;
  delete from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(me, other)
    and greatest(f.requester_id, f.addressee_id) = greatest(me, other);
end;
$$;

-- ---------------------------------------------------------------------------
-- Blocking
-- ---------------------------------------------------------------------------
create function public.block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in'; end if;
  if target = me then raise exception 'You can''t block yourself.'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (me, target) on conflict do nothing;
  delete from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(me, target)
    and greatest(f.requester_id, f.addressee_id) = greatest(me, target);
end;
$$;

create function public.unblock_user(target uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.blocks where blocker_id = auth.uid() and blocked_id = target;
$$;

-- ---------------------------------------------------------------------------
-- Finding people
-- ---------------------------------------------------------------------------
create function public.search_users(query text)
returns table (
  id uuid, username text, display_name text, avatar_path text, profile_color text,
  relationship text  -- 'none' | 'friends' | 'outgoing' | 'incoming' | 'blocked'
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select replace(replace(replace(lower(trim(query)), '\', '\\'), '%', '\%'), '_', '\_') as term
  )
  select p.id, p.username, p.display_name, p.avatar_path, p.profile_color,
    case
      when exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.id) then 'blocked'
      when f.status = 'accepted' then 'friends'
      when f.requester_id = auth.uid() then 'outgoing'
      when f.addressee_id = auth.uid() then 'incoming'
      else 'none'
    end
  from public.profiles p
  cross join q
  left join public.friendships f
    on least(f.requester_id, f.addressee_id) = least(p.id, auth.uid())
   and greatest(f.requester_id, f.addressee_id) = greatest(p.id, auth.uid())
  where auth.uid() is not null
    and char_length(q.term) >= 2
    and p.id <> auth.uid()
    and not exists (select 1 from public.blocks b where b.blocker_id = p.id and b.blocked_id = auth.uid())
    and (p.username like q.term || '%' or lower(p.display_name) like '%' || q.term || '%')
  order by (p.username = lower(trim(query))) desc, (p.username like q.term || '%') desc, p.username
  limit 20;
$$;

-- ---------------------------------------------------------------------------
-- Everything the Friends page needs in one call
-- ---------------------------------------------------------------------------
create function public.friends_overview()
returns table (
  friendship_id bigint,
  kind text,              -- 'friend' | 'incoming' | 'outgoing'
  since timestamptz,      -- when the request was sent / accepted
  user_id uuid,
  username text,
  display_name text,
  avatar_path text,
  profile_color text,
  bio text,
  favorite_game text,
  favorite_anime text,
  joined_at timestamptz,
  online boolean,         -- null unless you are friends
  last_seen_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.id,
    case when f.status = 'accepted' then 'friend'
         when f.requester_id = auth.uid() then 'outgoing'
         else 'incoming' end,
    coalesce(f.responded_at, f.created_at),
    p.id, p.username, p.display_name, p.avatar_path, p.profile_color,
    p.bio, p.favorite_game, p.favorite_anime, p.created_at,
    case when f.status = 'accepted' then coalesce(s.online, false) end,
    case when f.status = 'accepted' and not coalesce(s.appear_offline, false) then s.last_seen_at end
  from public.friendships f
  join public.profiles p on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  left join public.user_status s on s.user_id = p.id
  where auth.uid() in (f.requester_id, f.addressee_id);
$$;

create function public.blocked_users()
returns table (user_id uuid, username text, display_name text, avatar_path text, profile_color text, blocked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_path, p.profile_color, b.created_at
  from public.blocks b join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Online status
-- ---------------------------------------------------------------------------

-- Called by the app about once a minute while it's open. Returns the server time
-- so the app can judge "online" without trusting the PC's clock.
create function public.heartbeat()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in'; end if;
  insert into public.user_status as s (user_id, online, last_seen_at)
  values (me, true, now())
  on conflict (user_id) do update
    set online = not s.appear_offline,
        last_seen_at = case when s.appear_offline then s.last_seen_at else now() end;
  return now();
end;
$$;

-- Called when signing out.
create function public.go_offline()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.user_status set online = false where user_id = auth.uid();
$$;

create function public.set_appear_offline(hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in'; end if;
  insert into public.user_status (user_id, appear_offline, online) values (me, hidden, not hidden)
  on conflict (user_id) do update
    set appear_offline = excluded.appear_offline,
        online = not excluded.appear_offline,
        last_seen_at = case when excluded.appear_offline then public.user_status.last_seen_at else now() end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: only signed-in users may call these.
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'send_friend_request(uuid)', 'respond_friend_request(bigint, boolean)', 'remove_friendship(uuid)',
    'block_user(uuid)', 'unblock_user(uuid)', 'search_users(text)', 'friends_overview()',
    'blocked_users()', 'heartbeat()', 'go_offline()', 'set_appear_offline(boolean)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end;
$$;
