import { createBrowserClient } from "@supabase/ssr";

// Create authenticated Supabase client with storage options
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: fetch.bind(globalThis), // Ensure fetch is bound to avoid issues
    },
  }
);
