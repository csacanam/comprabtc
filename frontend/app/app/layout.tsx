/**
 * LAYOUT DEL DASHBOARD
 * =====================
 * Layout protegido que requiere billetera conectada.
 * En MiniPay la conexión es automática (sin botón).
 * Incluye navegación bottom bar mobile-first.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from '@/components/neo-brutal';
import { isMiniPay, shortAddress } from '@/lib/web3/config';
import { usePrefs, type DictKey } from '@/lib/prefs';
import { cn } from '@/lib/utils';

// Iconos de navegación
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function PlanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20"/>
      <path d="m17 5-5 5-5-5"/>
      <path d="m17 9-5 5-5-5"/>
      <path d="m17 13-5 5-5-5"/>
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// Items de navegación
const navItems: { href: string; labelKey: DictKey; Icon: (p: { className?: string }) => React.ReactElement }[] = [
  { href: '/app', labelKey: 'nav.home', Icon: HomeIcon },
  { href: '/app/plan', labelKey: 'nav.plan', Icon: PlanIcon },
  { href: '/app/fund', labelKey: 'nav.fund', Icon: WalletIcon },
  { href: '/app/settings', labelKey: 'nav.settings', Icon: SettingsIcon },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, isPending } = useConnect();
  const { t } = usePrefs();
  // Evitar mismatch SSR/cliente: la conexión solo se conoce en el browser
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Pantalla de conexión (no aplica dentro de MiniPay: auto-connect)
  if (!mounted || (!isConnected && (isConnecting || isPending))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">{t('connect.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-6 py-4 border-b-3 border-foreground bg-card">
          <div className="max-w-lg mx-auto">
            <span className="text-xl font-bold">CompraBTC</span>
          </div>
        </header>
        <div className="flex-1 px-6 py-12 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full space-y-6 text-center">
            <h1 className="text-2xl font-bold">{t('connect.title')}</h1>
            <p className="text-muted-foreground">{t('connect.subtitle')}</p>
            {!isMiniPay() && (
              <Button
                fullWidth
                size="lg"
                onClick={() => connect({ connector: injected() })}
              >
                {t('connect.button')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 border-b-3 border-foreground bg-card">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-xl font-bold">CompraBTC</span>
          <span className="text-sm text-muted-foreground font-mono">
            {shortAddress(address)}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-3 border-foreground">
        <div className="max-w-lg mx-auto">
          <div className="flex items-stretch">
            {navItems.map(({ href, labelKey, Icon }) => {
              const label = t(labelKey);
              // Verificar si es la ruta activa
              const isActive = pathname === href ||
                (href !== '/app' && pathname.startsWith(href));

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center py-3',
                    'transition-colors duration-150',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className={cn(
                    'text-xs mt-1',
                    isActive && 'font-bold'
                  )}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
