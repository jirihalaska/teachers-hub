import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Returns a Supabase client configured for server components. The current
 * cookies are passed through so that authenticated requests work as expected.
 */
export function supabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
}