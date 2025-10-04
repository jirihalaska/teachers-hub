import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * API endpoint to register the current user for a course. This endpoint runs on
 * the server and uses the service role key to call a Supabase Edge Function
 * (`claim-seat`) that handles capacity locking in an atomic transaction.
 */
export async function POST(req: Request) {
  const { courseId } = await req.json();
  if (!courseId) {
    return NextResponse.json({ ok: false, reason: 'Missing courseId' }, { status: 400 });
  }

  // Fetch the authenticated user via Supabase on the server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: 'Not authenticated' }, { status: 401 });
  }

  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/claim-seat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use the service role key here so the function can bypass RLS
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ course_id: courseId, user_id: user.id }),
      }
    );
    const body = await resp.json();
    return NextResponse.json(body, { status: resp.status });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, reason: 'Error invoking function' }, { status: 500 });
  }
}