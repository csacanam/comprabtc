/**
 * LANDING PAGE
 * =============
 * Página de inicio: pitch del agente + entrada a la app.
 * Diseño neo-brutalista mobile-first.
 */

'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Button } from '@/components/neo-brutal';
import { isMiniPay } from '@/lib/web3/config';
import { usePrefs } from '@/lib/prefs';

export default function LandingPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { t } = usePrefs();

  // Conectado o dentro de MiniPay (auto-connect en curso): directo a la app
  useEffect(() => {
    if (isConnected || isMiniPay()) {
      router.replace('/app');
    }
  }, [isConnected, router]);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b-3 border-foreground bg-card">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-xl font-bold">CompraBTC</span>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 px-6 py-12 flex flex-col justify-center">
        <div className="max-w-lg mx-auto w-full space-y-8">
          {/* Título principal */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              {t('landing.title1')}
              <span className="block text-primary">{t('landing.title2')}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* Beneficios */}
          <div className="space-y-3">
            {(['landing.step1', 'landing.step2', 'landing.step3'] as const).map((key, i) => (
              <div key={key} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center border-2 border-foreground font-bold text-sm">
                  {i + 1}
                </span>
                <span className="text-foreground">{t(key)}</span>
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="space-y-4 pt-4">
            <Link href="/app" className="block">
              <Button fullWidth size="lg">
                {t('landing.cta')}
              </Button>
            </Link>
            <Link href="/calc" className="block">
              <Button fullWidth variant="outline">
                {t('calc.title')}
              </Button>
            </Link>
          </div>

          {/* Nota de no-custodia */}
          <p className="text-center text-sm text-muted-foreground">
            {t('landing.note')}
          </p>

          {/* Visión: oro y dólares digitales (solo en el landing, no en la app) */}
          <p className="text-center text-sm text-muted-foreground border-2 border-dashed border-foreground/30 px-4 py-3">
            {t('landing.roadmap')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t-3 border-foreground bg-secondary">
        <div className="max-w-lg mx-auto text-center text-sm text-muted-foreground space-y-1">
          <p>{t('landing.footer')}</p>
          <p>
            <Link href="/stats" className="underline">{t('stats.title')}</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
