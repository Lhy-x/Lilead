'use client';

import Link from 'next/link';

import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <section className="space-y-10 py-12 text-center">
      <h1 className="text-4xl font-bold sm:text-5xl">
        Automatisez la préqualification de vos leads avec l'IA
      </h1>
      <p className="mx-auto max-w-2xl text-lg text-slate-500 dark:text-slate-300">
        Lilead vous aide à créer des formulaires anti-spam, à vérifier les emails en temps réel, et à
        qualifier automatiquement vos prospects grâce à vos propres critères.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href={user ? '/dashboard' : '/register'}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-white shadow"
        >
          {user ? 'Accéder au dashboard' : "Créer un compte"}
        </Link>
        <Link href="/f/demo" className="rounded-full border px-6 py-3 font-semibold text-primary">
          Voir un formulaire démo
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: 'Vérification email obligatoire',
            description: 'Empêchez les soumissions non vérifiées et réduisez le spam.'
          },
          {
            title: 'IA configurable',
            description: 'Ajoutez vos règles de qualification et combinez-les avec un modèle externe.'
          },
          {
            title: 'Statistiques en temps réel',
            description: 'Suivez les visites, conversions, validations et performances des campagnes.'
          }
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-200 bg-white/60 p-6 text-left shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50"
          >
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
