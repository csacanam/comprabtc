/**
 * CALCULADORA DCA (pública, adquisición)
 * =======================================
 * "¿Cuánto tendrías hoy si hubieras empezado a comprar poco a poco?"
 * Simula con precios históricos reales de Bitcoin (CoinGecko) en el browser.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Input, Select } from '@/components/neo-brutal';
import { usePrefs } from '@/lib/prefs';

interface Result {
  invested: number;
  sats: number;
  worth: number;
  purchases: number;
}

export default function CalcPage() {
  const { t, locale } = usePrefs();
  const [amount, setAmount] = useState('20');
  const [freq, setFreq] = useState<'weekly' | 'monthly'>('weekly');
  const [years, setYears] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const usd = (n: number) =>
    n.toLocaleString(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const calculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const perBuy = parseFloat(amount) || 0;
    if (perBuy <= 0) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const days = Number(years) * 365;
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      );
      if (!res.ok) throw new Error(`coingecko ${res.status}`);
      const data: { prices: [number, number][] } = await res.json();
      const prices = data.prices;
      if (!prices?.length) throw new Error('no prices');

      const step = freq === 'weekly' ? 7 : 30;
      let sats = 0;
      let purchases = 0;
      for (let i = 0; i < prices.length; i += step) {
        const price = prices[i][1];
        sats += (perBuy / price) * 1e8;
        purchases += 1;
      }
      const lastPrice = prices[prices.length - 1][1];
      setResult({
        invested: purchases * perBuy,
        sats: Math.round(sats),
        worth: (sats / 1e8) * lastPrice,
        purchases,
      });
    } catch (err) {
      console.error(err);
      setError(t('calc.error'));
    } finally {
      setLoading(false);
    }
  };

  const diff = result ? result.worth - result.invested : 0;
  const diffPct = result && result.invested > 0 ? (diff / result.invested) * 100 : 0;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b-3 border-foreground bg-card">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="text-xl font-bold">CompraBTC</Link>
        </div>
      </header>

      <section className="flex-1 px-6 py-10">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t('calc.title')}</h1>
            <p className="text-muted-foreground">{t('calc.subtitle')}</p>
          </div>

          <form onSubmit={calculate} className="space-y-4">
            <Input
              label={t('calc.amountLabel')}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            />
            <Select
              label={t('calc.freqLabel')}
              value={freq}
              onChange={(e) => setFreq(e.target.value as 'weekly' | 'monthly')}
              options={[
                { value: 'weekly', label: t('calc.freqWeekly') },
                { value: 'monthly', label: t('calc.freqMonthly') },
              ]}
            />
            <Select
              label={t('calc.periodLabel')}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              options={[
                { value: '1', label: t('calc.period1') },
                { value: '3', label: t('calc.period3') },
                { value: '5', label: t('calc.period5') },
              ]}
            />
            <Button type="submit" fullWidth size="lg" isLoading={loading}>
              {loading ? t('calc.loading') : t('calc.button')}
            </Button>
          </form>

          {error && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
              {error}
            </p>
          )}

          {result && (
            <div className="space-y-3">
              <Card variant="primary">
                <CardContent className="py-6 text-center space-y-2">
                  <p className="text-sm text-primary-foreground/80">{t('calc.wouldHave')}</p>
                  <p className="text-3xl font-bold">{result.sats.toLocaleString(locale)} sats</p>
                  <p className="text-sm text-primary-foreground/80">
                    {t('calc.worth')}: <strong>{usd(result.worth)}</strong>
                  </p>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="py-4">
                    <p className="text-xs text-muted-foreground">{t('calc.invested')}</p>
                    <p className="font-bold">{usd(result.invested)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-xs text-muted-foreground">{t('calc.change')}</p>
                    <p className={`font-bold ${diff >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {diff >= 0 ? '+' : ''}{usd(diff)} ({diffPct.toFixed(0)}%)
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Link href="/app" className="block">
                <Button fullWidth size="lg" variant="secondary">{t('calc.cta')}</Button>
              </Link>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t('calc.disclaimer')}</p>
        </div>
      </section>
    </main>
  );
}
