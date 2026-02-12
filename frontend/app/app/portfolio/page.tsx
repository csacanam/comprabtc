/**
 * PÁGINA DE PORTAFOLIO (ANTI-PÁNICO)
 * ====================================
 * Visualización del portafolio diseñada para tranquilizar, no alarmar.
 * 
 * Principios de diseño anti-pánico:
 * - KPI principal: BTC acumulado (no PnL)
 * - Precio promedio destacado
 * - PnL en sección colapsable secundaria
 * - Mensajes positivos cuando el mercado baja
 * - Colores neutrales por defecto
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDcaStore } from '@/stores/dcaStore';
import { WithdrawBitcoinModal } from '@/components/WithdrawBitcoinModal';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  HelpIcon,
} from '@/components/neo-brutal';
import {
  formatCOP,
  formatBTC,
  formatBTCCompact,
  formatDateFull,
  formatRelativeDate,
  calculateTotalBTC,
  calculateTotalInvested,
  calculateAveragePrice,
  calculatePortfolioValue,
  calculatePnL,
  calculateStreak,
  nextPurchaseDate,
  formatDate,
} from '@/domain/utils';
import { PURCHASE_STATUS_LABELS, type PurchaseStatus } from '@/domain/models';
import { cn } from '@/lib/utils';

// Mensajes anti-pánico para cuando el mercado está bajando
const ANTI_PANIC_MESSAGES = [
  'Bajar no es fallar: estás acumulando a mejor precio.',
  'Tu meta es constancia, no adivinar el mercado.',
  'El precio baja, pero tus satoshis siguen ahí.',
  'DCA funciona mejor cuando el precio varía.',
  'Cada compra baja tu precio promedio cuando el mercado baja.',
];

export default function PortfolioPage() {
  const { plan, purchases, currentPrice, isLoading } = useDcaStore();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Estado para sección avanzada
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calcular métricas
  const totalBtc = calculateTotalBTC(purchases);
  const totalInvested = calculateTotalInvested(purchases);
  const averagePrice = calculateAveragePrice(purchases);
  const portfolioValue = calculatePortfolioValue(purchases, currentPrice);
  const pnl = calculatePnL(purchases, currentPrice);
  const streak = calculateStreak(purchases, plan);
  const nextPurchase = plan ? nextPurchaseDate(plan.frequency, 
    purchases[0] ? new Date(purchases[0].createdAt) : null
  ) : null;

  // Determinar si mostrar mensaje anti-pánico (si hay pérdida)
  const showAntiPanic = pnl.percentage < -5;
  const antiPanicMessage = ANTI_PANIC_MESSAGES[Math.floor(Math.random() * ANTI_PANIC_MESSAGES.length)];

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted w-1/2" />
          <div className="h-48 bg-muted" />
          <div className="h-32 bg-muted" />
        </div>
      </div>
    );
  }

  // Vista si no hay compras
  if (purchases.length === 0) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Billetera</h1>

        <Card className="text-center">
          <CardContent className="py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-secondary border-[3px] border-foreground flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold">Aún no tienes compras</h2>
              <p className="text-muted-foreground">
                {plan?.isActive 
                  ? 'Tu primera compra se realizará pronto según tu plan configurado.'
                  : 'Configura tu plan DCA para empezar a acumular Bitcoin.'}
              </p>
            </div>

            {!plan?.isActive && (
              <Link href="/app/plan">
                <Button>Configurar plan</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {plan?.isActive && nextPurchase && (
          <Card variant="secondary">
            <CardContent>
              <p className="text-sm">
                <strong>Próxima compra:</strong> {formatDate(nextPurchase)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Tu portafolio</h1>

      {/* KPI Principal: BTC Acumulado */}
      <Card variant="primary">
        <CardContent className="space-y-4">
          <p className="text-sm text-primary-foreground/80">Bitcoin acumulado</p>
          <div className="text-4xl font-bold">
            {formatBTC(totalBtc)}
          </div>
          <p className="text-sm text-primary-foreground/70">
            {formatBTCCompact(totalBtc)}
          </p>
        </CardContent>
      </Card>

      {/* Botón de retirar */}
      {totalBtc > 0 && (
        <>
          <Button 
            variant="outline" 
            fullWidth 
            size="lg"
            onClick={() => setWithdrawModalOpen(true)}
          >
            Retirar Bitcoin
          </Button>
          <WithdrawBitcoinModal
            open={withdrawModalOpen}
            onOpenChange={setWithdrawModalOpen}
            totalBtc={totalBtc}
          />
        </>
      )}

      {/* Métricas secundarias */}
      <div className="grid grid-cols-2 gap-4">
        {/* Costo promedio de compra */}
        <Card>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Costo promedio de compra</p>
              <HelpIcon 
                tooltip="Es el precio al que compraste en promedio. Si el precio actual está arriba, vas ganando."
                className="w-4 h-4"
              />
            </div>
            <p className="font-bold text-lg">
              {formatCOP(averagePrice)}
            </p>
          </CardContent>
        </Card>

        {/* Próxima compra */}
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Próxima compra</p>
            <p className="font-bold text-lg">
              {nextPurchase ? formatDate(nextPurchase) : 'Sin plan'}
            </p>
          </CardContent>
        </Card>

        {/* Compras realizadas */}
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Compras realizadas</p>
            <p className="font-bold text-lg">{purchases.length}</p>
          </CardContent>
        </Card>

        {/* Compras ejecutadas */}
        <Card>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Compras ejecutadas</p>
              <HelpIcon 
                tooltip="Compras consecutivas según tu frecuencia programada. ¡Mantén la constancia!"
                className="w-4 h-4"
              />
            </div>
            <p className="font-bold text-lg">
              {streak} {streak === 1 ? 'compra' : 'compras'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mensaje anti-pánico si aplica */}
      {showAntiPanic && (
        <Card variant="secondary" className="border-warning">
          <CardContent className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0" role="img" aria-label="Calma">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </span>
            <div>
              <p className="font-bold text-sm">No te preocupes por el rojo</p>
              <p className="text-sm text-muted-foreground mt-1">
                {antiPanicMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección avanzada (colapsable) */}
      <div className="border-[3px] border-foreground">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-4 py-3 flex items-center justify-between bg-secondary hover:bg-muted transition-colors"
        >
          <span className="font-bold text-sm">Ver rendimiento (avanzado)</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-200',
              showAdvanced && 'rotate-180'
            )}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {showAdvanced && (
          <div className="p-4 bg-card space-y-4 border-t-3 border-foreground">
            {/* Valor actual */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor estimado actual</span>
              <span className="font-bold">{formatCOP(portfolioValue)}</span>
            </div>

            {/* Total invertido */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total invertido</span>
              <span className="font-bold">{formatCOP(totalInvested)}</span>
            </div>

            {/* PnL */}
            <div className="flex justify-between items-center pt-2 border-t-2 border-border">
              <span className="text-sm text-muted-foreground">Ganancia/Pérdida</span>
              <div className="text-right">
                <span className={cn(
                  'font-bold',
                  pnl.amount >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {pnl.amount >= 0 ? '+' : ''}{formatCOP(pnl.amount)}
                </span>
                <span className={cn(
                  'text-sm ml-2',
                  pnl.percentage >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  ({pnl.percentage >= 0 ? '+' : ''}{pnl.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Precio actual de mercado */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Precio de mercado actual</span>
              <span>{formatCOP(currentPrice)}/BTC</span>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground bg-secondary p-2">
              El rendimiento pasado no garantiza resultados futuros. 
              El valor puede subir o bajar.
            </p>
          </div>
        )}
      </div>

      {/* Historial de compras */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Historial de compras</h2>
        
        <div className="space-y-3">
          {purchases.slice(0, 10).map((purchase) => {
            const status = (purchase.status ?? 'enviado') as PurchaseStatus;
            const statusVariant = status === 'enviado' ? 'success' : status === 'procesando' ? 'warning' : 'secondary';
            return (
              <Card key={purchase.id}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold">{formatBTCCompact(purchase.btcAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(new Date(purchase.createdAt))}
                      </p>
                      <Badge variant={statusVariant} className="mt-1">
                        {PURCHASE_STATUS_LABELS[status]}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCOP(purchase.amountCop)}</p>
                      <p className="text-xs text-muted-foreground">
                        1 BTC = {formatCOP(purchase.marketPriceCopPerBtc)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {purchases.length > 10 && (
            <p className="text-center text-sm text-muted-foreground">
              Mostrando las últimas 10 de {purchases.length} compras
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
