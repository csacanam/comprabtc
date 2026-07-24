/**
 * DASHBOARD (INICIO)
 * ===================
 * Tu bóveda de Bitcoin: sats/BTC acumulados, precio promedio,
 * próxima compra e historial de ejecuciones del agente.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { Button, Card, CardContent, Badge } from '@/components/neo-brutal';
import { USDT, WBTC, EXECUTOR, erc20Abi, dcaExecutorAbi, SATS_PER_BTC } from '@/lib/web3/contracts';
import { usePrefs, formatBtcAmount, type DictKey } from '@/lib/prefs';
import { fetchPlan, fetchExecutions, type ExecutionRow } from '@/services/api';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  success: 'success',
  skipped_no_funds: 'warning',
  skipped_no_allowance: 'warning',
  skipped_stop_loss: 'warning',
  failed: 'destructive',
};

export default function DashboardPage() {
  const { address } = useAccount();
  const { t, unit, setUnit, locale } = usePrefs();

  const formatUsd = (n: number) =>
    n.toLocaleString(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  // Verdad on-chain: balance WBTC + estado del plan
  const { data: wbtcBalance } = useReadContract({
    address: WBTC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
  const { data: usdtBalance } = useReadContract({
    address: USDT,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
  const { data: onchainPlan } = useReadContract({
    address: EXECUTOR,
    abi: dcaExecutorAbi,
    functionName: 'plans',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  // Backend: historial + costo promedio + precio
  const { data: apiPlan, isLoading } = useQuery({
    queryKey: ['plan', address],
    queryFn: () => fetchPlan(address!),
    enabled: !!address,
    refetchInterval: 30_000,
  });

  // Historial paginado: carga de a 20, "ver más" trae la siguiente página
  const {
    data: execPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: execsLoading,
  } = useInfiniteQuery({
    queryKey: ['executions', address],
    queryFn: ({ pageParam }) => fetchExecutions(address!, pageParam),
    enabled: !!address,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.executions.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    refetchInterval: 60_000,
  });
  const executions = execPages?.pages.flatMap((page) => page.executions) ?? [];
  const totalExecutions = execPages?.pages[0]?.total ?? 0;

  const hasActivePlan = onchainPlan?.[3] === true;
  const usdt = usdtBalance != null ? Number(formatUnits(usdtBalance, 6)) : 0;
  const basis = apiPlan?.costBasis ?? null;
  const btcPrice = apiPlan?.btcPriceUsdt ?? null;

  // Dos verdades distintas:
  // - stackedSats: total comprado con la app (histórico, monotónico; no baja al retirar)
  // - walletSats: saldo real en la billetera hoy (baja a 0 tras un retiro)
  const stackedSats = basis?.totalSats ?? 0;
  const walletSats = wbtcBalance != null ? Number(wbtcBalance) : 0;
  const walletValueUsd = btcPrice != null ? (walletSats / SATS_PER_BTC) * btcPrice : null;

  const toggleUnit = () => setUnit(unit === 'sats' ? 'btc' : 'sats');

  // La bóveda nunca desaparece: si hay historial, sats acumulados o saldo en
  // billetera, se muestra aunque el plan esté pausado/cancelado.
  const hasHistory = totalExecutions > 0 || stackedSats > 0 || walletSats > 0;

  // ===== Sin plan ni historial: estado vacío =====
  if (!hasActivePlan && !hasHistory && !isLoading && !execsLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('dash.emptyTitle')}</h1>
          <p className="text-muted-foreground">{t('dash.emptySubtitle')}</p>
        </div>

        <Card variant="primary">
          <CardContent className="space-y-4 text-center py-8">
            <div className="text-5xl">₿</div>
            <p className="font-bold text-lg">{t('dash.noPlan')}</p>
            <p className="text-sm text-primary-foreground/80">{t('dash.noPlanHint')}</p>
            <Link href="/app/plan" className="block">
              <Button fullWidth size="lg" variant="secondary">
                {t('dash.createPlan')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {usdt <= 0 && (
          <Card>
            <CardContent className="space-y-3">
              <p className="font-bold text-sm">{t('dash.fundFirst')}</p>
              <p className="text-sm text-muted-foreground">{t('dash.fundFirstHint')}</p>
              <Link href="/app/fund" className="block">
                <Button fullWidth variant="outline">{t('dash.fundCta')}</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ===== Bóveda =====
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('dash.vault')}</h1>

      {/* Plan inactivo pero con historial: invitar a reactivar */}
      {!hasActivePlan && (
        <Card className="bg-warning/10 border-warning">
          <CardContent className="space-y-3 py-4">
            <p className="font-bold text-sm">{t('dash.planInactive')}</p>
            <p className="text-sm text-muted-foreground">{t('dash.planInactiveHint')}</p>
            <Link href="/app/plan" className="block">
              <Button fullWidth variant="primary" size="sm">{t('dash.reactivate')}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI principal — tap para alternar sats/BTC */}
      <Card variant="primary">
        <CardContent
          className="py-6 text-center space-y-2 cursor-pointer select-none"
          onClick={toggleUnit}
          title="sats ↔ BTC"
        >
          <p className="text-sm text-primary-foreground/80">{t('dash.accumulated')}</p>
          <p className="text-3xl font-bold">{formatBtcAmount(stackedSats, unit, locale)}</p>
          <p className="text-sm text-primary-foreground/80">{t('dash.accumulatedHint')}</p>
        </CardContent>
      </Card>

      {/* Saldo real en la billetera hoy (baja al retirar; complementa el histórico) */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t('dash.inWallet')}</p>
            <p className="font-bold">
              {formatBtcAmount(walletSats, unit, locale)}
              {walletValueUsd != null && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ≈ {formatUsd(walletValueUsd)}
                </span>
              )}
            </p>
          </div>
          {walletSats > 0 && (
            <Link href="/app/withdraw" className="block">
              <Button fullWidth variant="outline" size="sm">{t('dash.withdraw')}</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t('dash.avgPrice')}</p>
            <p className="font-bold">{basis ? formatUsd(basis.avgPriceUsdtPerBtc) : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t('dash.currentPrice')}</p>
            <p className="font-bold">{btcPrice != null ? formatUsd(btcPrice) : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t('dash.invested')}</p>
            <p className="font-bold">{basis ? formatUsd(basis.totalUsdt / 1e6) : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{t('dash.available')}</p>
            <p className="font-bold">{formatUsd(usdt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Aviso saldo bajo */}
      {onchainPlan && usdtBalance != null && usdtBalance < onchainPlan[0] && (
        <Card className="bg-warning/10 border-warning">
          <CardContent className="space-y-3 py-4">
            <p className="font-bold text-sm">{t('dash.lowBalance')}</p>
            <p className="text-sm text-muted-foreground">{t('dash.lowBalanceHint')}</p>
            <Link href="/app/fund" className="block">
              <Button fullWidth variant="primary" size="sm">{t('dash.fundNow')}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">{t('dash.history')} ({totalExecutions})</h2>
        {executions.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">{t('dash.historyEmpty')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {executions.map((execution: ExecutionRow) => {
              const variant = STATUS_VARIANT[execution.status] ?? 'secondary';
              const statusKey = `status.${execution.status}` as DictKey;
              return (
                <Card key={execution.id}>
                  <CardContent className="py-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-bold">
                          {execution.wbtc_out
                            ? formatBtcAmount(Number(execution.wbtc_out), unit, locale)
                            : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(execution.run_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <Badge variant={variant} className="mt-1">
                          {t(statusKey)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {execution.usdt_in ? formatUsd(Number(execution.usdt_in) / 1e6) : ''}
                        </p>
                        {execution.execute_tx && (
                          <a
                            href={`https://celoscan.io/tx/${execution.execute_tx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline"
                          >
                            {t('dash.viewTx')}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {hasNextPage && (
              <Button
                fullWidth
                variant="outline"
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                {t('dash.loadMore', { n: totalExecutions - executions.length })}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
