import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import RegisterButton from './RegisterButton';

interface PageProps {
  params: { id: string };
}

/**
 * Course detail page. Displays the full information about a single course
 * including description, featured image, YouTube video and tutor details.
 */
export default async function CoursePage({ params }: PageProps) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );

  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .single();

  if (courseError || !course) {
    return <div className="p-4">Chyba při načítání kurzu.</div>;
  }

  // Fetch tutor information
  const { data: tutor, error: tutorError } = await supabase
    .from('tutors')
    .select('*')
    .eq('id', course.tutor_id)
    .single();

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      {/* Featured Image */}
      {course.featured_image_url && (
        <div className="relative h-64 w-full overflow-hidden rounded-2xl">
          <Image
            src={course.featured_image_url}
            alt={course.title}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      {/* YouTube video */}
      {course.youtube_url && (
        <div className="aspect-w-16 aspect-h-9">
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(course.youtube_url)}`}
            title={course.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-2xl"
          />
        </div>
      )}
      {/* Course meta */}
      <div className="space-y-1 text-gray-700">
        <p>
          <strong>Začátek:</strong>{' '}
          {new Date(course.starts_at).toLocaleString('cs-CZ', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
        <p>
          <strong>Konec:</strong>{' '}
          {new Date(course.ends_at).toLocaleString('cs-CZ', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
        <p>
          <strong>Délka:</strong> {course.duration_minutes} minut
        </p>
        <p>
          <strong>Cena:</strong> {course.price_cents / 100} Kč
        </p>
        <p>
          <strong>Kapacita:</strong> {course.capacity}
        </p>
      </div>
      {/* Description */}
      {course.description && (
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(course.description) }} />
      )}
      {/* Tutor information */}
      {tutor && (
        <div className="mt-6 flex items-center space-x-4 p-4 border rounded-2xl bg-gray-50">
          {tutor.photo_url && (
            <Image
              src={tutor.photo_url}
              alt={tutor.name}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-medium">{tutor.name}</p>
            {tutor.bio && <p className="text-sm text-gray-600">{tutor.bio}</p>}
          </div>
        </div>
      )}
      {/* Registration button */}
      <RegisterButton courseId={course.id} />
    </div>
  );
}

/**
 * Extracts a YouTube video ID from a full URL. Returns undefined if not found.
 */
function extractYouTubeId(url: string): string | undefined {
  try {
    const u = new URL(url);
    // Handle typical `watch?v=` and short urls
    const v = u.searchParams.get('v');
    if (v) return v;
    const pathname = u.pathname;
    return pathname.split('/').pop() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Convert Markdown to HTML. Because we don’t have a full Markdown parser in the browser here,
 * this helper escapes HTML. For real usage you may want to use a library like `marked`
 * or `react-markdown` on the client.
 */
function markdownToHtml(md: string): string {
  return md
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}