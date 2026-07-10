/**
 * PÁGINA DE PLAN DCA
 * ===================
 * Configurar o gestionar el plan de compras automáticas de Bitcoin.
 * Flujo on-chain: approve(USDT, presupuesto) + createPlan(monto, intervalo).
 * Los fondos se quedan en la billetera del usuario; el agente cobra por cuotas.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parseUnits, formatUnits } from 'viem';
import { Button, Input, Select, Card, CardContent, Badge } from '@/components/neo-brutal';
import {
  USDT, WBTC, POOL_FEE, EXECUTOR, erc20Abi, dcaExecutorAbi, attributionSuffix,
} from '@/lib/web3/contracts';
import { usePrefs, type DictKey } from '@/lib/prefs';
import { fetchPlan, registerPlan } from '@/services/api';

// Frecuencias disponibles en el formulario (segundos → minInterval del contrato).
// Etapa hackathon: solo las de alta frecuencia. DISPLAY incluye todas para
// mostrar bien planes viejos.
const FREQUENCIES = ['3600', '21600', '43200'] as const;
const DISPLAY_FREQUENCIES = ['3600', '21600', '43200', '86400', '604800'];

// Montos sugeridos por cuota (USDT)
const suggestedAmounts = [0.1, 1, 5, 20];

// Cuántas cuotas autoriza el approve (presupuesto = monto × cuotas)
const BUDGET_RUNS = ['10', '25', '50'] as const;

const MIN_AMOUNT_USDT = 0.1;
const MAX_AMOUNT_USDT = 50; // etapa hackathon: tickets chicos y frecuentes (liquidez WBTC: PLAN.md §2.5)

export default function PlanPage() {
  const router = useRouter();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const { t, locale } = usePrefs();

  const frequencyOptions = FREQUENCIES.map((value) => ({
    value,
    label: t(`freq.${value}` as DictKey),
  }));
  const budgetOptions = BUDGET_RUNS.map((value) => ({
    value,
    label: t('plan.budgetOption', { n: value }),
  }));

  // Estado del formulario
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<string>(FREQUENCIES[0]); // default = primera opción visible
  const [budgetRuns, setBudgetRuns] = useState('25');
  const [stopLoss, setStopLoss] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'approving' | 'creating' | 'registering'>('idle');

  // Plan on-chain (fuente de verdad)
  const { data: onchainPlan, refetch: refetchPlan } = useReadContract({
    address: EXECUTOR,
    abi: dcaExecutorAbi,
    functionName: 'plans',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Datos del backend (historial, próxima cuota)
  const { data: apiPlan } = useQuery({
    queryKey: ['plan', address],
    queryFn: () => fetchPlan(address!),
    enabled: !!address,
    refetchInterval: 30_000,
  });

  const isActive = onchainPlan?.[3] === true;

  const amountNumber = parseFloat(amount) || 0;
  const amountError =
    amountNumber > 0 && (amountNumber < MIN_AMOUNT_USDT || amountNumber > MAX_AMOUNT_USDT)
      ? t('plan.amountError', { min: MIN_AMOUNT_USDT, max: MAX_AMOUNT_USDT })
      : '';
  const stopLossNumber = parseFloat(stopLoss) || 0;
  const canSubmit =
    amountNumber >= MIN_AMOUNT_USDT && amountNumber <= MAX_AMOUNT_USDT && step === 'idle';

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
      await publicClient.waitForTransactionReceipt({ hash: createHash });

      // 3. registrar en el backend para que el agente lo ejecute
      setStep('registering');
      await registerPlan({
        walletAddress: address,
        frequencySeconds: Number(frequency),
        stopLossPct: stopLossNumber > 0 ? stopLossNumber : undefined,
      });

      await refetchPlan();
      await queryClient.invalidateQueries({ queryKey: ['plan', address] });
      router.push('/app');
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
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchPlan();
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
            placeholder="Ej: 5"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            error={amountError}
            hint={t('plan.amountHint', { min: MIN_AMOUNT_USDT, max: MAX_AMOUNT_USDT })}
          />
          <div className="flex flex-wrap gap-2">
            {suggestedAmounts.map((suggested) => (
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
        </div>

        {/* Frecuencia */}
        <Select
          label={t('plan.frequencyLabel')}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          options={frequencyOptions}
          hint={t('plan.frequencyHint')}
        />

        {/* Presupuesto autorizado */}
        <Select
          label={t('plan.budgetLabel')}
          value={budgetRuns}
          onChange={(e) => setBudgetRuns(e.target.value)}
          options={budgetOptions}
          hint={t('plan.budgetHint')}
        />

        {/* Stop-loss opcional */}
        <Input
          label={t('plan.stopLossLabel')}
          type="text"
          inputMode="decimal"
          placeholder="Ej: 15"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value.replace(/[^\d.]/g, ''))}
          hint={t('plan.stopLossHint')}
        />

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
