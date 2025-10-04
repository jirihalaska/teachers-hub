import { supabaseServer } from '@/lib/supabaseServer';
import Link from 'next/link';

/**
 * Admin dashboard. Only users with the `admin` role can access this page.
 * Displays a list of courses along with registration counts.
 */
export default async function AdminDashboard() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-4">Přístup pouze pro přihlášené uživatele.</div>;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return <div className="p-4">Nemáte oprávnění ke zobrazení této stránky.</div>;
  }
  // fetch courses and registration counts
  // We query the `course_counts` view to get seats taken per course
  const { data: courseCounts } = await supabase
    .from('course_counts')
    .select('*');
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, starts_at, price_cents, capacity');
  const coursesWithCounts = (courses || []).map((course) => {
    const counts = courseCounts?.find((c) => c.course_id === course.id);
    return {
      ...course,
      taken: counts?.taken || 0,
    };
  });
  return (
    <main className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-3xl font-semibold">Administrace</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Název</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Začátek</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Cena (Kč)</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Kapacita</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Přihlášeni</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {coursesWithCounts.map((course) => (
              <tr key={course.id}>
                <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-800">
                  {course.title}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                  {new Date(course.starts_at).toLocaleString('cs-CZ', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                  {course.price_cents / 100}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                  {course.capacity}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                  {course.taken}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}