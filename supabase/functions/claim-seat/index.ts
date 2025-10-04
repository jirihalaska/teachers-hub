// Supabase Edge Function: claim-seat
//
// This function attempts to reserve a seat in a course for the given user. It
// works by first calling the `lock_course_and_count` RPC to lock the course
// row and retrieve the current taken count. If the course is full, it
// responds with a 409 status. Otherwise it inserts a new row into the
// registrations table with status `pending`.

import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { course_id, user_id } = await req.json();
    if (!course_id || !user_id) {
      return new Response(JSON.stringify({ ok: false, reason: 'Missing parameters' }), { status: 400 });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    // call RPC to lock course and count seats
    const { data: counts, error: countErr } = await supabase
      .rpc('lock_course_and_count', { p_course_id: course_id });
    if (countErr || !counts || counts.length === 0) {
      return new Response(JSON.stringify({ ok: false, reason: 'Course not found' }), { status: 404 });
    }
    const { capacity, taken } = counts[0];
    if (taken >= capacity) {
      return new Response(JSON.stringify({ ok: false, reason: 'full' }), { status: 409 });
    }
    // insert registration
    const { error: insertErr } = await supabase
      .from('registrations')
      .insert({ course_id, user_id, status: 'pending' });
    if (insertErr) {
      return new Response(JSON.stringify({ ok: false, reason: insertErr.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, reason: 'Invalid request' }), { status: 400 });
  }
});