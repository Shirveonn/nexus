/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** e.g. https://abcd1234.supabase.co (see .env.example) */
  readonly RENDERER_VITE_SUPABASE_URL?: string;
  /** The PUBLISHABLE / anon key. Never the secret / service-role key. */
  readonly RENDERER_VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
