/**
 * PÁGINA DE FONDEO
 * =================
 * Muestra el saldo USDT y la dirección para depositar.
 * En MiniPay: instrucción de usar el depósito nativo de la app.
 */

'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Button, Card, CardContent } from '@/components/neo-brutal';
import { USDT, erc20Abi } from '@/lib/web3/contracts';
import { isMiniPay } from '@/lib/web3/config';
import { usePrefs } from '@/lib/prefs';

export default function FundPage() {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);
  const { t, locale } = usePrefs();

  const { data: usdtBalance, refetch } = useReadContract({
    address: USDT,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const balance = usdtBalance != null ? Number(formatUnits(usdtBalance, 6)) : null;

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t('fund.title')}</h1>
        <p className="text-muted-foreground">{t('fund.subtitle')}</p>
      </div>

      {/* Saldo actual */}
      <Card variant="primary">
        <CardContent className="py-6 text-center space-y-2">
          <p className="text-sm text-primary-foreground/80">{t('fund.balance')}</p>
          <p className="text-3xl font-bold">
            {balance != null
              ? balance.toLocaleString(locale, { style: 'currency', currency: 'USD' })
              : '—'}
          </p>
          <p className="text-sm text-primary-foreground/80">{t('fund.network')}</p>
        </CardContent>
      </Card>

      {isMiniPay() ? (
        <Card>
          <CardContent className="space-y-3">
            <p className="font-bold">{t('fund.minipayTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('fund.minipayBody')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <p className="font-bold">{t('fund.sendTitle')}</p>
            <div className="bg-secondary border-2 border-foreground px-3 py-3">
              <p className="font-mono text-xs break-all">{address}</p>
            </div>
            <Button fullWidth variant="outline" onClick={handleCopy}>
              {copied ? t('fund.copied') : t('fund.copy')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('fund.warning')}</p>
          </CardContent>
        </Card>
      )}

      <Button fullWidth variant="outline" onClick={() => refetch()}>
        {t('fund.refresh')}
      </Button>

      <Card>
        <CardContent>
          <h3 className="font-bold mb-2">{t('fund.custodyTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('fund.custodyBody')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
