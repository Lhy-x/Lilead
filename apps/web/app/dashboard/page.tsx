'use client';

import { useQuery } from '@tanstack/react-query';

import { RequireAuth } from '@/components/require-auth';
import { api } from '@/lib/api';
import { OverviewStats } from '@/types/stats';

const statCards: { key: keyof OverviewStats; title: string; suffix?: string }[] = [
  { key: 'forms', title: 'Formulaires actifs' },
  { key: 'visits', title: 'Visiteurs uniques' },
  { key: 'submissions', title: 'Soumissions' },
  { key: 'qualified', title: 'Leads qualifiés' },
  { key: 'verificationRate', title: 'Taux de vérification', suffix: '%' },
  { key: 'conversionRate', title: 'Taux de conversion', suffix: '%' }
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['overview-stats'],
    queryFn: async () => {
      const response = await api.get<OverviewStats>('/stats/overview');
      return response.data;
    }
  });

  return (
    <RequireAuth>
      <section className="space-y-8">
        <header>
          <h1 className="text-3xl font-semibold">Bonjour 👋</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-300">
            Retrouvez l'état de vos campagnes de qualification en un coup d'œil.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm text-slate-500">{card.title}</p>
              <p className="mt-2 text-2xl font-semibold">
                {isLoading || !data ? '...' : `${data[card.key]}${card.suffix ?? ''}`}
              </p>
            </div>
          ))}
        </div>
      </section>
    </RequireAuth>
  );
}
