'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';

const links = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/dashboard/forms', label: 'Formulaires' },
  { href: '/dashboard/analytics', label: 'Statistiques' }
];

export const Navbar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!pathname || ['/login', '/register'].includes(pathname) || pathname.startsWith('/f/')) {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <span className="rounded bg-primary/10 px-3 py-1 text-sm">Lilead</span>
          <span className="hidden text-sm text-slate-500 sm:block">Préqualification intelligente</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-500 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname?.startsWith(link.href)
                  ? 'text-primary underline decoration-primary underline-offset-4'
                  : 'hover:text-primary'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:block">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
