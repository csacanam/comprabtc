/**
 * SIMULADOR DCA (público, adquisición)
 * =====================================
 * "¿Cuánto tendrías hoy si hubieras comprado poquito a poquito?"
 * Carga sola una gráfica con precios históricos reales (Binance) y debajo
 * explica en lenguaje sencillo por qué la gente guarda en Bitcoin.
 */

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Button, Card, CardContent } from '@/components/neo-brutal';
import { SUGGESTED_AMOUNTS } from '@/lib/plan-config';
import { usePrefs, type DictKey } from '@/lib/prefs';

// Períodos simulables (días). Años, no meses: el gancho es la rentabilidad
// de largo plazo (el último año fue bajista y sale en rojo).
const PERIODS = ['365', '1095', '1825'] as const;

// Compra cada hora — la frecuencia estrella del plan real
const FREQ_SECONDS = 3600;

const DAY_MS = 86_400_000;

// Color de la serie "lo que tendrías": naranja marca oscurecido para cumplir
// contraste ≥3:1 sobre crema (#FFFEF5) y banda de luminosidad en modo oscuro
// (validado con dataviz/validate_palette.js en ambos modos).
const WORTH_COLOR = '#D97706';

// Precios diarios [timestamp, close] desde Binance (historia completa, CORS
// abierto, sin API key; 1000 velas por request → se pagina para 3-5 años).
async function fetchBinanceDaily(days: number): Promise<[number, number][]> {
  const end = Date.now();
  let start = end - days * DAY_MS;
  const out: [number, number][] = [];
  while (start < end) {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${start}&limit=1000`,
    );
    if (!res.ok) throw new Error(`binance ${res.status}`);
    const klines: [number, string, string, string, string][] = await res.json();
    if (!klines.length) break;
    for (const k of klines) out.push([k[0], Number(k[4])]);
    start = klines[klines.length - 1][0] + DAY_MS;
    if (klines.length < 1000) break;
  }
  return out;
}

// Respaldo si Binance falla (p. ej. bloqueo regional). La API pública de
// CoinGecko solo entrega los últimos 365 días, así que se recorta el período.
async function fetchCoinGeckoDaily(days: number): Promise<[number, number][]> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${Math.min(days, 365)}`,
  );
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const data: { prices: [number, number][] } = await res.json();
  return data.prices ?? [];
}

interface Point {
  ts: number;
  invested: number;
  worth: number;
}

// Simula compras de `perBuy` cada FREQ_SECONDS sobre los precios diarios.
// Las compras intradía se ejecutan al cierre del día (aproximación DCA).
function simulate(prices: [number, number][], perBuy: number) {
  const stepMs = FREQ_SECONDS * 1000;
  let sats = 0;
  let purchases = 0;
  let nextBuy = prices[0][0];
  const series: Point[] = prices.map(([ts, price]) => {
    while (ts >= nextBuy) {
      sats += (perBuy / price) * 1e8;
      purchases += 1;
      nextBuy += stepMs;
    }
    return { ts, invested: purchases * perBuy, worth: (sats / 1e8) * price };
  });
  const last = series[series.length - 1];
  return {
    series,
    sats: Math.round(sats),
    purchases,
    invested: last.invested,
    worth: last.worth,
  };
}

// Dos preguntas distintas: por qué el activo, y por qué nuestro método
const WHY_BTC = [
  { key: 'btc0', emoji: '🏛️' },
  { key: 'btc1', emoji: '🪙' },
  { key: 'btc2', emoji: '🌍' },
  { key: 'btc3', emoji: '🛡️' },
] as const;
const WHY_US = [
  { key: 'us1', emoji: '🧘' },
  { key: 'us2', emoji: '🔑' },
  { key: 'us3', emoji: '🔍' },
] as const;

export default function CalcPage() {
  const { t, locale, lang, setLang } = usePrefs();
  const [amount, setAmount] = useState(SUGGESTED_AMOUNTS[0]); // $0.1 por hora
  const [days, setDays] = useState<string>('1825'); // 5 años: el período que muestra la rentabilidad DCA

  const usd = (n: number) =>
    n.toLocaleString(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const usdCompact = (n: number) =>
    n.toLocaleString(locale, {
      style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
    });

  const { data: prices, isLoading, isError } = useQuery({
    queryKey: ['btc-daily', days],
    queryFn: () => fetchBinanceDaily(Number(days)).catch(() => fetchCoinGeckoDaily(Number(days))),
    staleTime: 60 * 60 * 1000,
  });

  const result = useMemo(
    () => (prices?.length ? simulate(prices, amount) : null),
    [prices, amount],
  );

  // Muestreo para la gráfica (~180 puntos, siempre incluye el último)
  const chartData = useMemo(() => {
    if (!result) return [];
    const { series } = result;
    const step = Math.max(1, Math.ceil(series.length / 180));
    const sampled = series.filter((_, i) => i % step === 0);
    if (sampled[sampled.length - 1] !== series[series.length - 1]) {
      sampled.push(series[series.length - 1]);
    }
    return sampled;
  }, [result]);

  const diff = result ? result.worth - result.invested : 0;
  const diffPct = result && result.invested > 0 ? (diff / result.invested) * 100 : 0;

  const dateShort = (ts: number) =>
    new Date(ts).toLocaleDateString(locale, { month: 'short', year: '2-digit' });

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b-3 border-foreground bg-card">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">CompraBTC</Link>
          <button
            type="button"
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="text-sm font-medium border-2 border-foreground px-2 py-0.5 bg-secondary hover:bg-muted transition-colors"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
      </header>

      <section className="flex-1 px-6 py-10">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t('calc.title')}</h1>
            <p className="text-muted-foreground">{t('calc.subtitle')}</p>
          </div>

          {/* Controles: monto por hora + período */}
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-bold">{t('calc.amountLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_AMOUNTS.map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => setAmount(suggested)}
                    className={`px-3 py-1 text-sm font-medium border-2 border-foreground transition-colors
                      ${amount === suggested
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-muted'
                      }`}
                  >
                    ${suggested}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold">{t('calc.periodLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {PERIODS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDays(value)}
                    className={`px-3 py-1 text-sm font-medium border-2 border-foreground transition-colors
                      ${days === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-muted'
                      }`}
                  >
                    {t(`calc.period${value}` as DictKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isError && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
              {t('calc.error')}
            </p>
          )}

          {isLoading && (
            <div className="py-16 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-sm text-muted-foreground">{t('calc.loading')}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {/* Resultado principal */}
              <Card variant="primary">
                <CardContent className="py-6 text-center space-y-2">
                  <p className="text-sm text-primary-foreground/80">{t('calc.wouldHave')}</p>
                  <p className="text-3xl font-bold">{usd(result.worth)}</p>
                  <p className="text-sm text-primary-foreground/80">
                    {result.sats.toLocaleString(locale)} sats ·{' '}
                    {t('calc.purchases', { n: result.purchases.toLocaleString(locale), amount: `$${amount}` })}
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

              {/* Gráfica: lo que pusiste vs lo que tendrías */}
              <Card>
                <CardContent className="py-4 space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-0.5" style={{ backgroundColor: WORTH_COLOR }} />
                      <span className="text-muted-foreground">{t('calc.seriesWorth')}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-4 border-t-2 border-dashed"
                        style={{ borderColor: 'var(--muted-foreground)' }}
                      />
                      <span className="text-muted-foreground">{t('calc.seriesInvested')}</span>
                    </span>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--muted-foreground)"
                          strokeOpacity={0.15}
                        />
                        <XAxis
                          dataKey="ts"
                          tickFormatter={dateShort}
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.3 }}
                          minTickGap={40}
                        />
                        <YAxis
                          tickFormatter={usdCompact}
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          width={48}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            usd(value),
                            name === 'worth' ? t('calc.seriesWorth') : t('calc.seriesInvested'),
                          ]}
                          labelFormatter={(ts: number) =>
                            new Date(ts).toLocaleDateString(locale, { dateStyle: 'medium' })
                          }
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '2px solid var(--foreground)',
                            borderRadius: 0,
                            fontSize: 12,
                          }}
                        />
                        {/* Referencia: lo acumulado que pusiste (punteada, tinta muted) */}
                        <Line
                          type="monotone"
                          dataKey="invested"
                          stroke="var(--muted-foreground)"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="worth"
                          stroke={WORTH_COLOR}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Link href="/app" className="block">
                <Button fullWidth size="lg" variant="secondary">{t('calc.cta')}</Button>
              </Link>
            </div>
          )}

          {/* ¿Por qué Bitcoin? (el activo) — en lenguaje sencillo */}
          <div className="space-y-3 pt-4">
            <h2 className="text-xl font-bold">{t('calc.whyBtcTitle')}</h2>
            {WHY_BTC.map(({ key, emoji }) => (
              <Card key={key}>
                <CardContent className="py-4 space-y-1">
                  <p className="font-bold">
                    <span className="mr-2">{emoji}</span>
                    {t(`calc.${key}t` as DictKey)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t(`calc.${key}b` as DictKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ¿Por qué con CompraBTC? (el método) */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xl font-bold">{t('calc.whyUsTitle')}</h2>
            {WHY_US.map(({ key, emoji }) => (
              <Card key={key}>
                <CardContent className="py-4 space-y-1">
                  <p className="font-bold">
                    <span className="mr-2">{emoji}</span>
                    {t(`calc.${key}t` as DictKey)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t(`calc.${key}b` as DictKey)}</p>
                </CardContent>
              </Card>
            ))}
            <Link href="/app" className="block pt-1">
              <Button fullWidth size="lg">{t('calc.cta')}</Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">{t('calc.disclaimer')}</p>
        </div>
      </section>
    </main>
  );
}
