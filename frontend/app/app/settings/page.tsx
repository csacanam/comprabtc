/**
 * PÁGINA DE CONFIGURACIÓN
 * ========================
 * Idioma, unidades, billetera conectada y transparencia del protocolo.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent, Select } from '@/components/neo-brutal';
import { EXECUTOR } from '@/lib/web3/contracts';
import { isMiniPay, shortAddress } from '@/lib/web3/config';
import { fetchTelegramStatus, sendTelegramTest } from '@/services/api';
import { usePrefs, type Lang, type BtcUnit } from '@/lib/prefs';

export default function SettingsPage() {
  const { address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { t, lang, setLang, unit, setUnit } = usePrefs();

  // Estado del vínculo Telegram: mientras no esté conectado, se consulta cada
  // 5s — así, al volver de tocar "Iniciar" en el bot, la tarjeta cambia sola.
  const { data: tgStatus } = useQuery({
    queryKey: ['telegram-status', address],
    queryFn: () => fetchTelegramStatus(address!),
    enabled: !!address && !!process.env.NEXT_PUBLIC_TELEGRAM_BOT,
    refetchInterval: (query) => (query.state.data?.linked ? false : 5000),
  });
  const tgLinked = tgStatus?.linked === true;

  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const handleTelegramTest = async () => {
    if (!address) return;
    setTestState('sending');
    try {
      await sendTelegramTest(address);
      setTestState('sent');
    } catch {
      setTestState('error');
    }
    setTimeout(() => setTestState('idle'), 4000);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Preferencias */}
      <Card>
        <CardContent className="space-y-4">
          <Select
            label={t('settings.language')}
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            options={[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
            ]}
          />
          <Select
            label={t('settings.units')}
            value={unit}
            onChange={(e) => setUnit(e.target.value as BtcUnit)}
            options={[
              { value: 'sats', label: t('settings.unitsSats') },
              { value: 'btc', label: t('settings.unitsBtc') },
            ]}
          />
        </CardContent>
      </Card>

      {/* Billetera */}
      <Card>
        <CardContent className="space-y-3">
          <p className="font-bold text-sm">{t('settings.wallet')}</p>
          <div className="bg-secondary border-2 border-foreground px-3 py-3">
            <p className="font-mono text-xs break-all">{address}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {isMiniPay()
              ? t('settings.viaMiniPay')
              : t('settings.via', { name: connector?.name ?? 'wallet' })}
          </p>
          {!isMiniPay() && (
            <Button fullWidth variant="outline" onClick={() => disconnect()}>
              {t('settings.disconnect')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Alertas Telegram */}
      {process.env.NEXT_PUBLIC_TELEGRAM_BOT && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{t('settings.telegram')}</p>
              <span className={`text-xs font-bold px-2 py-0.5 border-2 border-foreground ${tgLinked ? 'bg-success text-success-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {tgLinked ? t('settings.telegramLinked') : t('settings.telegramNotLinked')}
              </span>
            </div>

            {tgLinked ? (
              <>
                <p className="text-sm text-muted-foreground">{t('settings.telegramLinkedBody')}</p>
                <Button
                  fullWidth
                  variant="outline"
                  onClick={handleTelegramTest}
                  isLoading={testState === 'sending'}
                >
                  {testState === 'sent'
                    ? t('settings.telegramTestSent')
                    : testState === 'error'
                      ? t('settings.telegramTestError')
                      : t('settings.telegramTest')}
                </Button>
              </>
            ) : (
              <>
                <ol className="text-sm text-muted-foreground space-y-2 list-none">
                  {(['settings.telegramStep1', 'settings.telegramStep2', 'settings.telegramStep3'] as const).map((key, i) => (
                    <li key={key} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground flex items-center justify-center border-2 border-foreground font-bold text-xs">
                        {i + 1}
                      </span>
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ol>
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT}?start=${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button fullWidth variant="outline">{t('settings.telegramConnect')}</Button>
                </a>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan */}
      <Card>
        <CardContent className="space-y-3">
          <p className="font-bold text-sm">{t('settings.plan')}</p>
          <p className="text-sm text-muted-foreground">{t('settings.planBody')}</p>
          <Link href="/app/plan" className="block">
            <Button fullWidth variant="outline">{t('settings.goToPlan')}</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Transparencia */}
      <Card>
        <CardContent className="space-y-3">
          <p className="font-bold text-sm">{t('settings.transparency')}</p>
          <p className="text-sm text-muted-foreground">{t('settings.transparencyBody')}</p>
          <a
            href={`https://celoscan.io/address/${EXECUTOR}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button fullWidth variant="outline">{t('settings.viewContract')}</Button>
          </a>
        </CardContent>
      </Card>

      {/* Info */}
      <p className="text-center text-xs text-muted-foreground">
        {t('settings.footer')} · {shortAddress(EXECUTOR)}
      </p>
    </div>
  );
}
