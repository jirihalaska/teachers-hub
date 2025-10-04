import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';
import Image from 'next/image';

/**
 * Tutors index page. Displays a list of all tutors with their names and photos.
 */
export default async function TutorsPage() {
  const supabase = supabaseServer();
  const { data: tutors, error } = await supabase
    .from('tutors')
    .select('id, name, photo_url');
  if (error) {
    console.error('Failed to fetch tutors', error);
  }
  return (
    <main className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-3xl font-semibold">Naši lektoři</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {(tutors || []).map((tutor) => (
          <Link
            key={tutor.id}
            href={`/tutors/${tutor.id}`}
            className="flex flex-col items-center bg-white p-4 rounded-2xl border shadow hover:bg-gray-50 transition-colors"
          >
            {tutor.photo_url && (
              <Image
                src={tutor.photo_url}
                alt={tutor.name}
                width={120}
                height={120}
                className="rounded-full object-cover mb-2"
              />
            )}
            <p className="font-medium">{tutor.name}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}