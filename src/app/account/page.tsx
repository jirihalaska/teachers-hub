import { supabaseServer } from '@/lib/supabaseServer';
import Link from 'next/link';

/**
 * Account page. Shows the logged‑in user's profile information and a list of
 * their registrations. If not authenticated it prompts the user to log in.
 */
export default async function AccountPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl p-4 space-y-4">
        <h1 className="text-2xl font-semibold">Můj účet</h1>
        <p>Pro zobrazení účtu se prosím přihlaste.</p>
        <LoginButton />
      </main>
    );
  }
  // fetch profile and registrations
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  const { data: registrations } = await supabase
    .from('registrations')
    .select(
      `id, status, created_at, courses (id, title, starts_at, ends_at, price_cents)`
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return (
    <main className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Můj účet</h1>
      <div className="border rounded-2xl p-4 bg-gray-50">
        <p className="font-medium">{profile?.full_name || user.email}</p>
        {profile?.phone && <p className="text-sm text-gray-600">Telefon: {profile.phone}</p>}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Moje registrace</h2>
        {(!registrations || registrations.length === 0) && <p>Nemáte žádné registrace.</p>}
        <div className="space-y-3">
          {(registrations || []).map((reg) => (
            <Link
              key={reg.id}
              href={`/courses/${reg.courses?.id}`}
              className="block border rounded-2xl p-3 bg-white shadow hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-medium">{reg.courses?.title}</h3>
              <p className="text-sm text-gray-600">
                {reg.courses?.starts_at && new Date(reg.courses.starts_at).toLocaleString('cs-CZ', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <p className="text-sm text-gray-600 mt-1">Stav: {reg.status}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

function LoginButton() {
  return (
    <form action="/login" method="post">
      {/* This could be replaced with a proper client component invoking supabase.auth.signInWithOAuth; left as link for brevity */}
      <button
        type="submit"
        className="px-4 py-2 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
      >
        Přihlásit se
      </button>
    </form>
  );
}