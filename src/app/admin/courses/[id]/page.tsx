import { supabaseServer } from '@/lib/supabaseServer';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

/**
 * Admin page for a single course. Lists all registrations for the course.
 */
export default async function AdminCourseDetail({ params }: PageProps) {
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
  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', params.id)
    .single();
  const { data: registrations } = await supabase
    .from('registrations')
    .select(
      `id, status, created_at, user_id, profiles (full_name, phone)`
    )
    .eq('course_id', params.id)
    .order('created_at', { ascending: true });
  return (
    <main className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">{course?.title}</h1>
      <h2 className="text-xl font-medium">Registrovaní účastníci</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Jméno</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Telefon</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Stav</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Čas registrace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(registrations || []).map((reg) => (
              <tr key={reg.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                  {reg.profiles?.full_name || reg.user_id}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                  {reg.profiles?.phone || '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                  {reg.status}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                  {new Date(reg.created_at).toLocaleString('cs-CZ', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/admin" className="text-blue-600 hover:underline">← Zpět na administraci</Link>
    </main>
  );
}