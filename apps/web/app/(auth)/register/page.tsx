'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

type RegisterResponse = {
  token: string;
};

export default function RegisterPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = Object.fromEntries(formData.entries());

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post<RegisterResponse>('/auth/register', payload);
      await login(data.token);
    } catch (err) {
      console.error(err);
      setError("Impossible de créer le compte. Vérifiez les informations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 shadow dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-3xl font-semibold">Créer un compte Lilead</h1>
      <p className="mt-2 text-sm text-slate-500">
        Configurez votre espace en quelques clics pour commencer à qualifier vos leads.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Nom complet</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email professionnel</label>
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
            minLength={8}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Nom de l'entreprise</label>
          <input
            name="companyName"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Couleur de marque (hex)</label>
          <input
            name="brandColor"
            placeholder="#6366f1"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Thème</label>
          <select
            name="themePreference"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="system">Automatique</option>
          </select>
        </div>
        {error && <p className="sm:col-span-2 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow"
        >
          {loading ? 'Création...' : 'Créer mon espace'}
        </button>
        <p className="sm:col-span-2 text-center text-sm text-slate-500">
          Déjà inscrit ?{' '}
          <Link href="/login" className="text-primary">
            Connectez-vous ici
          </Link>
        </p>
      </form>
    </div>
  );
}
