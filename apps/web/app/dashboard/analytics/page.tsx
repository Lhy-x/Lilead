'use client';

import { useQuery } from '@tanstack/react-query';

import { RequireAuth } from '@/components/require-auth';
import { api } from '@/lib/api';
import { FormSummary } from '@/types/form';

const fetchForms = async () => {
  const { data } = await api.get<FormSummary[]>('/forms');
  return data;
};

export default function AnalyticsPage() {
  const { data: forms, isLoading } = useQuery({ queryKey: ['forms'], queryFn: fetchForms });

  return (
    <RequireAuth>
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold">Analyse détaillée</h1>
          <p className="text-sm text-slate-500">
            Comparez les performances de vos formulaires et identifiez les campagnes les plus efficaces.
          </p>
        </header>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">
                  Formulaire
                </th>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">
                  État
                </th>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">
                  Soumissions
                </th>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">
                  Visites
                </th>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-500">
                  Conversion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              )}
              {forms?.map((form) => {
                const conversion = form._count.visits
                  ? Math.round((form._count.submissions / form._count.visits) * 100)
                  : 0;
                return (
                  <tr key={form.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{form.name}</div>
                      <div className="text-xs text-slate-500">{form.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          form.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {form.isPublished ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{form._count.submissions}</td>
                    <td className="px-6 py-4 font-semibold">{form._count.visits}</td>
                    <td className="px-6 py-4 font-semibold">{conversion}%</td>
                  </tr>
                );
              })}
              {!isLoading && !forms?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                    Aucun formulaire disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </RequireAuth>
  );
}
