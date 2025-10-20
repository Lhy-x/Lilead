'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { RequireAuth } from '@/components/require-auth';
import { api } from '@/lib/api';
import { FormSummary } from '@/types/form';

const createForm = async (payload: { name: string; description?: string }) => {
  const { data } = await api.post<FormSummary>('/forms', payload);
  return data;
};

const fetchForms = async () => {
  const { data } = await api.get<FormSummary[]>('/forms');
  return data;
};

export default function FormsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { data: forms, isLoading } = useQuery({ queryKey: ['forms'], queryFn: fetchForms });

  const mutation = useMutation({
    mutationFn: createForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      setIsCreating(false);
    }
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    await mutation.mutateAsync({ name, description });
    event.currentTarget.reset();
  };

  return (
    <RequireAuth>
      <section className="space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold">Vos formulaires</h1>
            <p className="text-sm text-slate-500">
              Générez, personnalisez et suivez vos formulaires de préqualification.
            </p>
          </div>
          <button
            onClick={() => setIsCreating((prev) => !prev)}
            className="rounded-full bg-primary px-4 py-2 font-semibold text-white shadow"
          >
            {isCreating ? 'Annuler' : 'Nouveau formulaire'}
          </button>
        </header>

        {isCreating && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-dashed border-primary/40 bg-white p-6 shadow-sm dark:border-primary/30 dark:bg-slate-900"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Nom du formulaire</label>
                <input
                  name="name"
                  required
                  placeholder="Formulaire campagne LinkedIn"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="mt-4 rounded-full bg-primary px-4 py-2 font-semibold text-white"
            >
              {mutation.isPending ? 'Création...' : 'Créer'}
            </button>
          </form>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {isLoading && <p className="text-slate-500">Chargement...</p>}
          {forms?.map((form) => (
            <article
              key={form.id}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{form.name}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      form.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {form.isPublished ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{form.description || 'Sans description'}</p>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Soumissions</dt>
                    <dd className="font-semibold">{form._count.submissions}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Visites</dt>
                    <dd className="font-semibold">{form._count.visits}</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Link href={`/dashboard/forms/${form.id}`} className="text-sm font-semibold text-primary">
                  Gérer
                </Link>
                <a
                  href={`${process.env.NEXT_PUBLIC_PUBLIC_URL || 'http://localhost:3000'}/f/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500"
                >
                  Ouvrir le formulaire ↗
                </a>
              </div>
            </article>
          ))}
          {!isLoading && !forms?.length && (
            <p className="text-sm text-slate-500">
              Aucun formulaire pour le moment. Créez votre premier formulaire pour commencer à collecter des leads.
            </p>
          )}
        </div>
      </section>
    </RequireAuth>
  );
}
