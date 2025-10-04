import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Home page shows a list of upcoming courses. Data is fetched from Supabase at
 * request time via the server‑side Supabase client. The environment variables
 * `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be
 * defined for this to work.
 */
export default async function HomePage() {
  // initialise Supabase client on the server using the incoming cookies for auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );

  // Fetch upcoming courses ordered by start time
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, starts_at, ends_at, price_cents, capacity')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Error fetching courses', error);
  }

  return (
    <main className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-3xl font-semibold">Upcoming Courses</h1>
      <div className="grid gap-4">
        {(courses || []).map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-4 shadow hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-medium mb-1">{course.title}</h2>
            <p className="text-sm text-gray-600">
              {new Date(course.starts_at!).toLocaleString('cs-CZ', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              &ndash;{' '}
              {new Date(course.ends_at!).toLocaleString('cs-CZ', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
            <p className="text-sm mt-1 text-gray-600">
              Kapacita: {course.capacity} | Cena: {course.price_cents / 100} Kč
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}