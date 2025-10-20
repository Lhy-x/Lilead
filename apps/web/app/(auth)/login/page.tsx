'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

type LoginResponse = {
  token: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
      await login(data.token);
    } catch (err) {
      console.error(err);
      setError('Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <p className="mt-2 text-sm text-slate-500">Accédez à votre dashboard Lilead.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Mot de passe</label>
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary px-4 py-2 font-semibold text-white shadow"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-primary">
            Créez-le en 2 minutes
          </Link>
        </p>
      </form>
    </div>
  );
}
