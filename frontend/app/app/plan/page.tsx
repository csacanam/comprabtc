/**
 * PÁGINA DE PLAN DCA
 * ===================
 * Configurar o gestionar el plan de compras automáticas de Bitcoin.
 * Flujo on-chain: approve(USDT, presupuesto) + createPlan(monto, intervalo).
 * Los fondos se quedan en la billetera del usuario; el agente cobra por cuotas.
 */

'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parseUnits, formatUnits } from 'viem';
import { Button, Input, Select, Card, CardContent, Badge } from '@/components/neo-brutal';
import {
  USDT, WBTC, POOL_FEE, EXECUTOR, erc20Abi, dcaExecutorAbi, attributionSuffix,
} from '@/lib/web3/contracts';
import {
  FREQUENCIES, SUGGESTED_AMOUNTS, MIN_AMOUNT_USDT, MAX_AMOUNT_USDT,
} from '@/lib/plan-config';
import { usePrefs, type DictKey } from '@/lib/prefs';
import { fetchPlan, registerPlan } from '@/services/api';

// DISPLAY incluye frecuencias retiradas del formulario para mostrar bien planes viejos.
const DISPLAY_FREQUENCIES = ['3600', '21600', '43200', '86400', '604800'];

// Cuotas sugeridas para el approve (presupuesto = monto × cuotas); también se puede escribir
const SUGGESTED_RUNS = [25, 50, 100, 200];
const MIN_RUNS = 1;
const MAX_RUNS = 1000;

export default function PlanPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const { t, locale } = usePrefs();

  const frequencyOptions = FREQUENCIES.map((value) => ({
    value,
    label: t(`freq.${value}` as DictKey),
  }));

  // Estado del formulario
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<string>(FREQUENCIES[0]); // default = primera opción visible
  const [budgetRuns, setBudgetRuns] = useState('25');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'approving' | 'creating' | 'registering'>('idle');

  // Plan on-chain (fuente de verdad)
  const { data: onchainPlan, refetch: refetchPlan } = useReadContract({
    address: EXECUTOR,
    abi: dcaExecutorAbi,
    functionName: 'plans',
    args: address ? [address] : undefined,
    // refresco suave como red de seguridad si un nodo respondió con estado viejo
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  // Fees reales del contrato (para mostrar la comisión sin hardcodear)
  const { data: feeBpsData } = useReadContract({
    address: EXECUTOR,
    abi: dcaExecutorAbi,
    functionName: 'feeBps',
    query: { staleTime: 300_000 },
  });
  const { data: feeFlatData } = useReadContract({
    address: EXECUTOR,
    abi: dcaExecutorAbi,
    functionName: 'feeFlat',
    query: { staleTime: 300_000 },
  });

  // Datos del backend (historial, próxima cuota)
  const { data: apiPlan } = useQuery({
    queryKey: ['plan', address],
    queryFn: () => fetchPlan(address!),
    enabled: !!address,
    refetchInterval: 30_000,
  });

  // Optimista: con la tx de cancelación enviada el plan ya es historia,
  // aunque el RPC público tarde en reflejar active=false.
  const [cancelled, setCancelled] = useState(false);
  const isActive = onchainPlan?.[3] === true && !cancelled;

  const amountNumber = parseFloat(amount) || 0;
  const amountError =
    amountNumber > 0 && (amountNumber < MIN_AMOUNT_USDT || amountNumber > MAX_AMOUNT_USDT)
      ? t('plan.amountError', { min: MIN_AMOUNT_USDT, max: MAX_AMOUNT_USDT })
      : '';

  // Comisión por cuota según los fees del contrato: flat + bps
  const feeBpsNum = feeBpsData != null ? Number(feeBpsData) : null;
  const feeFlatUsd = feeFlatData != null ? Number(feeFlatData) / 1e6 : null;
  const feeFor = (a: number) =>
    feeBpsNum != null && feeFlatUsd != null ? feeFlatUsd + (a * feeBpsNum) / 10_000 : null;
  const feePerRun = amountNumber > 0 ? feeFor(amountNumber) : null;
  const feePct = feePerRun != null ? (feePerRun / amountNumber) * 100 : null;
  // Tip: primer monto sugerido más grande donde la comisión baje del 2%
  const tipAmount =
    feePct != null && feePct > 2
      ? SUGGESTED_AMOUNTS.find((a) => {
          const f = feeFor(a);
          return a > amountNumber && f != null && (f / a) * 100 <= 2;
        }) ?? null
      : null;
  const tipPct = tipAmount != null ? ((feeFor(tipAmount)! / tipAmount) * 100) : null;

  // Cuotas autorizadas: número libre dentro de límites sanos
  const runsNumber = parseInt(budgetRuns, 10) || 0;
  const runsError =
    runsNumber > 0 && (runsNumber < MIN_RUNS || runsNumber > MAX_RUNS)
      ? t('plan.budgetError', { min: MIN_RUNS, max: MAX_RUNS })
      : '';

  // Saldo USDT actual: informativo, no bloquea — la plata puede ir llegando
  // (si una cuota no encuentra saldo, el agente la salta y sigue en la próxima).
  const { data: usdtBalance } = useReadContract({
    address: USDT,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
  const balanceUsdt = usdtBalance != null ? Number(formatUnits(usdtBalance, 6)) : null;
  const budgetUsdt = amountNumber * runsNumber;
  const coveredRuns =
    balanceUsdt != null && amountNumber > 0 ? Math.floor(balanceUsdt / amountNumber) : null;

  const canSubmit =
    amountNumber >= MIN_AMOUNT_USDT && amountNumber <= MAX_AMOUNT_USDT &&
    runsNumber >= MIN_RUNS && runsNumber <= MAX_RUNS && step === 'idle';

  const isLoading = step !== 'idle';
  const loadingLabel =
    step === 'approving' ? t('plan.approving')
    : step === 'creating' ? t('plan.creating')
    : step === 'registering' ? t('plan.registering')
    : '';

  // Crear plan: approve + createPlan + registro en backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !address || !publicClient) return;
    setError('');

    const amountPerRun = parseUnits(amount, 6);
    const budget = amountPerRun * BigInt(budgetRuns);
    const suffix = attributionSuffix();

    try {
      // 1. approve del presupuesto total (los fondos siguen en tu billetera)
      setStep('approving');
      const approveHash = await writeContractAsync({
        address: USDT,
        abi: erc20Abi,
        functionName: 'approve',
        args: [EXECUTOR, budget],
        dataSuffix: suffix,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // 2. createPlan con límites on-chain
      setStep('creating');
      const createHash = await writeContractAsync({
        address: EXECUTOR,
        abi: dcaExecutorAbi,
        functionName: 'createPlan',
        args: [amountPerRun, BigInt(frequency), WBTC, POOL_FEE],
        dataSuffix: suffix,
      });

      // Con la tx enviada el plan ya es un hecho: lo que sigue es mejor-esfuerzo.
      // El keeper descubre PlanCreated on-chain, así que si el RPC o el API
      // fallan aquí NO se muestra error (era el "no se pudo crear" fantasma).
      setStep('registering');
      await publicClient.waitForTransactionReceipt({ hash: createHash }).catch(() => {});
      await registerPlan({
        walletAddress: address,
        frequencySeconds: Number(frequency),
      }).catch(() => {});

      // Quedarse aquí mostrando el plan creado (no ir al home). Reintentar el
      // read hasta que el nodo refleje active=true (forno balancea nodos).
      setCancelled(false);
      for (let i = 0; i < 5; i++) {
        const { data } = await refetchPlan();
        if (data?.[3] === true) break;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await queryClient.invalidateQueries({ queryKey: ['plan', address] });
    } catch (err) {
      console.error(err);
      setError(t('plan.submitError'));
    } finally {
      setStep('idle');
    }
  };

  // Cancelar plan on-chain
  const [cancelling, setCancelling] = useState(false);
  const handleCancel = async () => {
    if (!address || !publicClient) return;
    setCancelling(true);
    setError('');
    try {
      const hash = await writeContractAsync({
        address: EXECUTOR,
        abi: dcaExecutorAbi,
        functionName: 'cancelPlan',
        dataSuffix: attributionSuffix(),
      });
      // Tx enviada → reflejar ya el estado en la UI; el resto es mejor-esfuerzo
      setCancelled(true);
      await publicClient.waitForTransactionReceipt({ hash }).catch(() => {});
      // forno balancea nodos y puede devolver estado viejo: reintentar el read
      for (let i = 0; i < 5; i++) {
        const { data } = await refetchPlan();
        if (data?.[3] === false) break;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await queryClient.invalidateQueries({ queryKey: ['plan', address] });
    } catch (err) {
      console.error(err);
      setError(t('plan.cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  // ===== Vista: plan activo =====
  if (isActive && onchainPlan) {
    const planAmount = formatUnits(onchainPlan[0], 6);
    const intervalSeconds = Number(onchainPlan[1]);
    const nextRunAt = apiPlan?.plan?.next_run_at ? new Date(apiPlan.plan.next_run_at) : null;

    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{t('plan.title')}</h1>

        <Card variant="primary">
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-foreground/80">{t('plan.state')}</span>
              <Badge variant="success">{t('plan.active')}</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-primary-foreground/20">
                <span className="text-sm text-primary-foreground/80">{t('plan.amountPerRun')}</span>
                <span className="font-bold">${planAmount} USDT</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary-foreground/20">
                <span className="text-sm text-primary-foreground/80">{t('plan.frequency')}</span>
                <span className="font-bold">
                  {DISPLAY_FREQUENCIES.includes(String(intervalSeconds))
                    ? t(`freq.${intervalSeconds}` as DictKey)
                    : `${intervalSeconds}s`}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-primary-foreground/80">{t('plan.nextRun')}</span>
                <span className="font-bold">
                  {nextRunAt ? nextRunAt.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : t('plan.soon')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm font-bold">{t('plan.custodyTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('plan.custodyBody')}</p>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
            {error}
          </p>
        )}

        <Button variant="outline" fullWidth onClick={handleCancel} isLoading={cancelling}>
          {t('plan.cancel')}
        </Button>
        <p className="text-xs text-center text-muted-foreground">{t('plan.cancelHint')}</p>
      </div>
    );
  }

  // ===== Vista: crear plan =====
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t('plan.createTitle')}</h1>
        <p className="text-muted-foreground">{t('plan.createSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Monto por cuota */}
        <div className="space-y-3">
          <Input
            label={t('plan.amountLabel')}
            type="text"
            inputMode="decimal"
            placeholder={t('plan.amountPlaceholder')}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            error={amountError}
            hint={t('plan.amountHint', { min: MIN_AMOUNT_USDT, max: MAX_AMOUNT_USDT })}
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_AMOUNTS.map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => setAmount(suggested.toString())}
                className={`px-3 py-1 text-sm font-medium border-2 border-foreground transition-colors
                  ${amountNumber === suggested
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-muted'
                  }`}
              >
                ${suggested}
              </button>
            ))}
          </div>

          {/* Comisión visible al elegir el monto + tip para bajarla */}
          {feePerRun != null && feePct != null && !amountError && (
            <div className="text-sm space-y-1">
              <p className={feePct > 2 ? 'text-warning-foreground bg-warning/20 px-3 py-2 border-2 border-foreground' : 'text-muted-foreground'}>
                {t('plan.feePerRun', {
                  fee: `$${feePerRun.toFixed(3)}`,
                  pct: feePct.toFixed(1),
                })}
              </p>
              {tipAmount != null && tipPct != null && (
                <p className="text-muted-foreground">
                  {t('plan.feeTip', { amount: `$${tipAmount}`, pct: tipPct.toFixed(1) })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Frecuencia */}
        <Select
          label={t('plan.frequencyLabel')}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          options={frequencyOptions}
          hint={t('plan.frequencyHint')}
        />

        {/* Presupuesto autorizado: número libre de cuotas + sugerencias */}
        <div className="space-y-3">
          <Input
            label={t('plan.budgetLabel')}
            type="text"
            inputMode="numeric"
            placeholder={t('plan.budgetPlaceholder')}
            value={budgetRuns}
            onChange={(e) => setBudgetRuns(e.target.value.replace(/[^\d]/g, ''))}
            error={runsError}
            hint={t('plan.budgetHint')}
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_RUNS.map((runs) => (
              <button
                key={runs}
                type="button"
                onClick={() => setBudgetRuns(runs.toString())}
                className={`px-3 py-1 text-sm font-medium border-2 border-foreground transition-colors
                  ${runsNumber === runs
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-muted'
                  }`}
              >
                {t('plan.budgetOption', { n: runs })}
              </button>
            ))}
          </div>

          {/* Saldo actual vs presupuesto: informa, no bloquea */}
          {balanceUsdt != null && amountNumber > 0 && runsNumber > 0 && !runsError && !amountError && (
            <p className="text-sm text-muted-foreground">
              {balanceUsdt >= budgetUsdt
                ? t('plan.balanceOk', { balance: balanceUsdt.toFixed(2) })
                : coveredRuns != null && coveredRuns > 0
                  ? t('plan.balancePartial', { balance: balanceUsdt.toFixed(2), runs: coveredRuns })
                  : t('plan.balanceNone')}
            </p>
          )}
        </div>

        {/* Resumen */}
        {canSubmit && (
          <Card variant="secondary">
            <CardContent>
              <p
                className="text-sm"
                dangerouslySetInnerHTML={{
                  __html: t('plan.summary', {
                    total: (amountNumber * Number(budgetRuns)).toFixed(2),
                    runs: budgetRuns,
                    amount: amountNumber,
                    freq: (frequencyOptions.find((f) => f.value === frequency)?.label ?? '').toLowerCase(),
                  }),
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">{t('plan.feeNote')}</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" disabled={!canSubmit} isLoading={isLoading}>
          {isLoading ? loadingLabel : t('plan.submit')}
        </Button>
      </form>

      <Card>
        <CardContent>
          <h3 className="font-bold mb-2">{t('plan.whyTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('plan.whyBody')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
