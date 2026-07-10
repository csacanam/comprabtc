/**
 * PÁGINA DE STATS (pública)
 * ==========================
 * KPIs del agente en vivo: compras, volumen, sats, planes, usuarios, x402.
 * Sirve de prueba social para adquisición y de evidencia para jueces.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent } from '@/components/neo-brutal';
import { usePrefs, type DictKey } from '@/lib/prefs';
import { EXECUTOR } from '@/lib/web3/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface Stats {
  totalPurchases: number;
  totalVolumeUsdt: number;
  totalSats: number;
  activePlans: number;
  totalUsers: number;
  btcPriceUsdt: number | null;
  x402PaymentsSettled: number | null;
}

export default function StatsPage() {
  const { t, locale } = usePrefs();

  const { data } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/stats`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const fmt = (n: number) => n.toLocaleString(locale);
  const usd = (n: number) =>
    n.toLocaleString(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  const kpis: { key: DictKey; value: string }[] = data
    ? [
        { key: 'stats.purchases', value: fmt(data.totalPurchases) },
        { key: 'stats.volume', value: usd(data.totalVolumeUsdt / 1e6) },
        { key: 'stats.sats', value: `${fmt(data.totalSats)} sats` },
        { key: 'stats.x402', value: data.x402PaymentsSettled != null ? fmt(data.x402PaymentsSettled) : '—' },
        { key: 'stats.activePlans', value: fmt(data.activePlans) },
        { key: 'stats.users', value: fmt(data.totalUsers) },
      ]
    : [];

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b-3 border-foreground bg-card">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">CompraBTC</Link>
          {data?.btcPriceUsdt != null && (
            <span className="text-sm text-muted-foreground">
              {t('stats.btcPrice')}: {usd(data.btcPriceUsdt)}
            </span>
          )}
        </div>
      </header>

      <section className="flex-1 px-6 py-10">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t('stats.title')}</h1>
            <p className="text-muted-foreground">{t('stats.subtitle')}</p>
          </div>

          {kpis.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {kpis.map(({ key, value }, i) => (
                <Card key={key} variant={i === 0 ? 'primary' : undefined} className={i === 0 ? 'col-span-2' : ''}>
                  <CardContent className="py-5">
                    <p className={`text-xs ${i === 0 ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {t(key)}
                    </p>
                    <p className={`font-bold ${i === 0 ? 'text-3xl' : 'text-xl'}`}>{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Link href="/app" className="block">
              <Button fullWidth size="lg">{t('dash.createPlan')}</Button>
            </Link>
            <a
              href={`https://celoscan.io/address/${EXECUTOR}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button fullWidth variant="outline">{t('stats.viewContract')}</Button>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
