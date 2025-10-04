import { createBrowserClient } from '@supabase/ssr';

/**
 * Returns a Supabase client for use in browser/client components. It will
 * automatically persist the auth session to cookies and localStorage.
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}