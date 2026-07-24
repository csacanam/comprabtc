/**
 * PÁGINA DE RETIRO
 * =================
 * Envía tu Bitcoin (WBTC) a otra dirección. Los fondos ya son autocustodiados:
 * MiniPay no expone este WBTC en su UI, así que esta pantalla es la palanca
 * para moverlo. Flujo on-chain: transfer(to, amount) del ERC-20 WBTC.
 *
 * Gas: no lo patrocinamos. El usuario paga la comisión de red (en un stablecoin
 * vía fee currency de Celo; MiniPay lo abstrae). Si se quedó sin stablecoin, la
 * billetera dará su propio error — el "cómo lo pagamos" es un problema aparte.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract, usePublicClient, useBalance } from 'wagmi';
import { isAddress, parseEther } from 'viem';
import { Button, Input, Card, CardContent } from '@/components/neo-brutal';
import { USDT, WBTC, erc20Abi, attributionSuffix, SATS_PER_BTC } from '@/lib/web3/contracts';
import { isMiniPay } from '@/lib/web3/config';
import { usePrefs, formatBtcAmount } from '@/lib/prefs';

// Billeteras de browser pagan gas en CELO; con el aviso claro el usuario sabe
// qué falta. MiniPay abstrae la comisión → no aplica. Es una sola tx simple.
const MIN_GAS_CELO = parseEther('0.001');

export default function WithdrawPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { t, unit, locale } = usePrefs();

  const { data: wbtcBalance, refetch: refetchBalance } = useReadContract({
    address: WBTC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
  const walletSats = wbtcBalance != null ? Number(wbtcBalance) : null;

  // Con qué pagar la comisión de red: USDT (fee currency que abstrae MiniPay)
  // o CELO nativo. Si no hay ninguno, avisamos antes de que la firma falle.
  const { data: usdtBalance } = useReadContract({
    address: USDT,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
  const { data: celoBalance } = useBalance({
    address,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
  const noFeeBalance =
    walletSats != null && walletSats > 0 &&
    usdtBalance != null && usdtBalance === BigInt(0) &&
    celoBalance != null && celoBalance.value < MIN_GAS_CELO;

  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  // El monto se escribe en la unidad activa (sats o BTC). Internamente todo va
  // en sats, que en WBTC (8 decimales) coincide con la unidad base del token.
  const parseToSats = (raw: string): number => {
    const n = parseFloat(raw);
    if (!isFinite(n) || n <= 0) return 0;
    return unit === 'btc' ? Math.round(n * SATS_PER_BTC) : Math.floor(n);
  };
  const satsToSend = parseToSats(amount);

  const onAmountChange = (raw: string) => {
    // sats = enteros; btc = decimales
    const cleaned = unit === 'btc' ? raw.replace(/[^\d.]/g, '') : raw.replace(/[^\d]/g, '');
    setAmount(cleaned);
  };

  const fillMax = () => {
    if (walletSats == null || walletSats <= 0) return;
    setAmount(unit === 'btc' ? (walletSats / SATS_PER_BTC).toFixed(8) : String(walletSats));
  };

  const addressError = to.length > 0 && !isAddress(to) ? t('wd.toError') : '';
  const amountError =
    amount.length > 0 && satsToSend === 0
      ? t('wd.amountZero')
      : walletSats != null && satsToSend > walletSats
        ? t('wd.amountError')
        : '';

  const canSubmit =
    isAddress(to) &&
    satsToSend > 0 &&
    walletSats != null &&
    satsToSend <= walletSats &&
    !sending;

  // En browser, verificar CELO para la comisión ANTES de pedir la firma.
  const hasGasForFees = async (): Promise<boolean> => {
    if (isMiniPay() || !publicClient || !address) return true;
    try {
      const balance = await publicClient.getBalance({ address });
      return balance >= MIN_GAS_CELO;
    } catch {
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !address || !publicClient) return;
    setError('');
    if (!(await hasGasForFees())) {
      setError(t('wd.gasError'));
      return;
    }
    setSending(true);
    try {
      const hash = await writeContractAsync({
        address: WBTC,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to as `0x${string}`, BigInt(satsToSend)],
        dataSuffix: attributionSuffix(),
      });
      // Tx enviada → mostrar éxito ya; confirmar recibo es mejor-esfuerzo.
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash }).catch(() => {});
      await refetchBalance();
    } catch (err) {
      console.error(err);
      setError(t('wd.error'));
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setTxHash(null);
    setTo('');
    setAmount('');
    setError('');
  };

  // ===== Éxito =====
  if (txHash) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <Card variant="primary">
          <CardContent className="py-8 text-center space-y-3">
            <div className="text-5xl">✅</div>
            <p className="font-bold text-lg">{t('wd.successTitle')}</p>
            <p className="text-sm text-primary-foreground/80">{t('wd.successBody')}</p>
            <a
              href={`https://celoscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm underline"
            >
              {t('wd.viewTx')}
            </a>
          </CardContent>
        </Card>
        <Button fullWidth variant="outline" onClick={reset}>
          {t('wd.again')}
        </Button>
        <Link href="/app" className="block">
          <Button fullWidth>{t('wd.back')}</Button>
        </Link>
      </div>
    );
  }

  // ===== Sin saldo =====
  if (walletSats === 0) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('wd.title')}</h1>
          <p className="text-muted-foreground">{t('wd.subtitle')}</p>
        </div>
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">{t('wd.empty')}</p>
          </CardContent>
        </Card>
        <Link href="/app" className="block">
          <Button fullWidth variant="outline">{t('wd.back')}</Button>
        </Link>
      </div>
    );
  }

  // ===== Formulario =====
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t('wd.title')}</h1>
        <p className="text-muted-foreground">{t('wd.subtitle')}</p>
      </div>

      {/* Disponible */}
      <Card variant="primary">
        <CardContent className="py-4 flex items-center justify-between gap-2">
          <span className="text-sm text-primary-foreground/80">{t('wd.available')}</span>
          <span className="font-bold">
            {walletSats != null ? formatBtcAmount(walletSats, unit, locale) : '—'}
          </span>
        </CardContent>
      </Card>

      {/* Sin saldo para la comisión de red: avisar y llevar a fondear */}
      {noFeeBalance && (
        <Card className="bg-warning/10 border-warning">
          <CardContent className="space-y-3 py-4">
            <p className="font-bold text-sm">{t('wd.noGasTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('wd.noGasBody')}</p>
            <Link href="/app/fund" className="block">
              <Button fullWidth variant="primary" size="sm">{t('wd.addFunds')}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label={t('wd.toLabel')}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('wd.toPlaceholder')}
          value={to}
          onChange={(e) => setTo(e.target.value.trim())}
          error={addressError}
        />

        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label={t('wd.amountLabel')}
                type="text"
                inputMode={unit === 'btc' ? 'decimal' : 'numeric'}
                placeholder={unit === 'btc' ? '0.00000000' : '0'}
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                error={amountError}
              />
            </div>
            <Button type="button" variant="outline" onClick={fillMax} className="shrink-0">
              {t('wd.max')}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">⚡ {t('wd.gasNote')}</p>
        <p className="text-xs text-muted-foreground">{t('wd.warning')}</p>

        {error && (
          <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" disabled={!canSubmit} isLoading={sending}>
          {sending ? t('wd.sending') : t('wd.submit')}
        </Button>
      </form>
    </div>
  );
}
