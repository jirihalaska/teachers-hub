"use client";

import { supabaseBrowser } from '@/lib/supabaseBrowser';

/**
 * Simple login page. Offers Google and Email login via Supabase. For email
 * login, we prompt for an email address and send a magic link.
 */
export default function LoginPage() {
  const handleGoogle = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = (event.currentTarget.elements.namedItem('email') as HTMLInputElement)?.value;
    if (!email) return;
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert('Chyba při odesílání e-mailu');
    } else {
      alert('Na váš e-mail byl odeslán odkaz pro přihlášení.');
    }
  };

  return (
    <main className="mx-auto max-w-sm p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Přihlášení</h1>
      <button
        onClick={handleGoogle}
        className="w-full px-4 py-2 bg-red-500 text-white rounded-2xl shadow hover:bg-red-600"
      >
        Přihlásit se pomocí Google
      </button>
      <form onSubmit={handleEmail} className="space-y-3">
        <input
          type="email"
          name="email"
          placeholder="Váš e-mail"
          className="w-full px-3 py-2 border rounded-2xl"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700"
        >
          Odeslat magický odkaz
        </button>
      </form>
    </main>
  );
}