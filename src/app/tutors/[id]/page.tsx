import { supabaseServer } from '@/lib/supabaseServer';
import Image from 'next/image';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

/**
 * Tutor detail page. Shows tutor bio and their upcoming courses.
 */
export default async function TutorPage({ params }: PageProps) {
  const supabase = supabaseServer();
  const { data: tutor, error: tutorError } = await supabase
    .from('tutors')
    .select('*')
    .eq('id', params.id)
    .single();
  if (tutorError || !tutor) {
    return <div className="p-4">Lektor nenalezen.</div>;
  }
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, starts_at, ends_at, price_cents, capacity')
    .eq('tutor_id', params.id)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });
  return (
    <main className="mx-auto max-w-3xl p-4 space-y-6">
      <div className="flex items-center space-x-4">
        {tutor.photo_url && (
          <Image
            src={tutor.photo_url}
            alt={tutor.name}
            width={120}
            height={120}
            className="rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-semibold">{tutor.name}</h1>
          {tutor.bio && <p className="text-gray-700 mt-2">{tutor.bio}</p>}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-2">Nadcházející kurzy</h2>
        {(!courses || courses.length === 0) && <p>Tento lektor zatím nemá žádné budoucí kurzy.</p>}
        <div className="space-y-3">
          {(courses || []).map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="block border rounded-2xl p-3 bg-white shadow hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-medium">{course.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(course.starts_at).toLocaleString('cs-CZ', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                {' – '}
                {new Date(course.ends_at).toLocaleString('cs-CZ', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Kapacita: {course.capacity} | Cena: {course.price_cents / 100} Kč
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}