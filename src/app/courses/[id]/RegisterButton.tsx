"use client";

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

interface Props {
  courseId: string;
}

/**
 * Client‑side register button. On click it ensures the user is logged in via
 * Supabase (Google OAuth by default) and then invokes the `/api/register`
 * endpoint to claim a seat in the course. Displays status messages to the
 * user while the request is in flight.
 */
export default function RegisterButton({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setMessage(null);

    const supabase = supabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();

    // If not authenticated, redirect to Google login
    if (!user) {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
      // This call will redirect; we won't reach here unless it fails.
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage('Úspěšně jste se přihlásili na kurz.');
      } else if (res.status === 409) {
        setMessage('Tento kurz je plný. Byli jste zařazeni na čekací listinu nebo zkuste jiný termín.');
      } else {
        setMessage(data.reason || 'Nastala neočekávaná chyba.');
      }
    } catch (err) {
      setMessage('Chyba při komunikaci se serverem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Přihlašuji…' : 'Přihlásit se'}
      </button>
      {message && <p className="text-sm text-gray-700">{message}</p>}
    </div>
  );
}