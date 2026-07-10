/**
 * PÁGINA DE CONFIGURACIÓN
 * ========================
 * Idioma, unidades, billetera conectada y transparencia del protocolo.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import { Button, Card, CardContent, Select } from '@/components/neo-brutal';
import { EXECUTOR } from '@/lib/web3/contracts';
import { isMiniPay, shortAddress } from '@/lib/web3/config';
import { usePrefs, type Lang, type BtcUnit } from '@/lib/prefs';

export default function SettingsPage() {
  const { address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { t, lang, setLang, unit, setUnit } = usePrefs();

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
            <p className="font-bold text-sm">{t('settings.telegram')}</p>
            <p className="text-sm text-muted-foreground">{t('settings.telegramBody')}</p>
            <a
              href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT}?start=${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button fullWidth variant="outline">{t('settings.telegramConnect')}</Button>
            </a>
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
