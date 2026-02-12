/**
 * PÁGINA DE INICIO DEL DASHBOARD
 * ================================
 * Vista principal con resumen del estado del usuario.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useDcaStore } from '@/stores/dcaStore';
import { Button, Card, CardContent, Badge } from '@/components/neo-brutal';
import {
  formatCOP,
  formatBTC,
  formatBTCCompact,
  truncateBtcAddress,
  calculateTotalBTC,
  calculateTotalInvested,
  calculatePortfolioValue,
  calculatePnL,
  calculateAveragePrice,
  nextPurchaseDate,
  formatDate,
} from '@/domain/utils';
import { FREQUENCY_LABELS, getPlanStatus } from '@/domain/models';
import { cn } from '@/lib/utils';

export default function DashboardHome() {
  const { session } = useAuthStore();
  const { plan, bankLink, purchases, currentPrice, destinationAddress, isLoading } = useDcaStore();

  // Estado para sección avanzada
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Estados del usuario
  const hasPlan = !!plan;
  const hasBank = bankLink?.status === 'connected';
  const planStatus = plan ? getPlanStatus(plan) : null;
  const isActive = plan?.isActive && hasBank;
  const showPlanSummary = hasPlan && (planStatus === 'active' || planStatus === 'paused' || planStatus === 'payment_failed');

  // Métricas básicas
  const totalBtc = calculateTotalBTC(purchases);
  const totalInvested = calculateTotalInvested(purchases);
  const purchaseCount = purchases.length;
  const averagePrice = purchases.length > 0 ? calculateAveragePrice(purchases) : 0;
  const portfolioValue = currentPrice > 0 ? calculatePortfolioValue(purchases, currentPrice) : 0;
  const pnl = currentPrice > 0 ? calculatePnL(purchases, currentPrice) : { amount: 0, percentage: 0 };
  const nextPurchase = plan ? nextPurchaseDate(plan.frequency, 
    purchases[0] ? new Date(purchases[0].createdAt) : null
  ) : null;

  // Saludo
  const getGreeting = () => {
    return 'Hola';
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted w-3/4" />
          <div className="h-32 bg-muted" />
          <div className="h-24 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Saludo */}
      <div className="space-y-1">
        <p className="text-muted-foreground">{getGreeting()}</p>
        <h1 className="text-2xl font-bold">
          {session?.email.split('@')[0]}
        </h1>
      </div>

      {/* Estado actual */}
      {showPlanSummary ? (
        // Tiene plan (activo, pausado o fallo de pago) - mostrar resumen
        <>
          <Card variant="primary">
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-primary-foreground/80">
                  Bitcoin comprado
                </span>
              </div>
              <div className="text-3xl font-bold">
                {formatBTC(totalBtc)}
              </div>
              {currentPrice > 0 && (
                <div className="text-sm text-primary-foreground/80">
                  ≈ {formatCOP(portfolioValue)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billetera destino: advertencia si no está, card normal si sí */}
          {!destinationAddress ? (
            <Card className="bg-warning/10 border-warning">
              <CardContent className="space-y-3 py-4">
                <p className="font-bold">Billetera destino sin configurar</p>
                <p className="text-sm text-muted-foreground">
                  Tus compras no podrán ejecutarse hasta que configures una Billetera destino.
                </p>
                <Link href="/app/settings" className="block">
                  <Button fullWidth variant="primary">Configurar billetera destino</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">Billetera destino</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {truncateBtcAddress(destinationAddress)}
                    </p>
                  </div>
                  <Link href="/app/settings">
                    <Button variant="outline" size="sm">
                      Cambiar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección avanzada (colapsable) */}
          {purchases.length > 0 && (
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
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Valor estimado actual</span>
                    <p className="font-bold text-lg">{formatCOP(portfolioValue)}</p>
                  </div>

                  {/* Total invertido */}
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Total invertido</span>
                    <p className="font-bold text-lg">{formatCOP(totalInvested)}</p>
                  </div>

                  {/* PnL */}
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Ganancia/Pérdida</span>
                    <div>
                      <span className={cn(
                        'font-bold text-lg',
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

                  {/* Precios para comparación */}
                  <div className="pt-2 border-t border-border/30 space-y-4">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Precio promedio de compra</span>
                      <p className="font-bold text-lg">{formatCOP(averagePrice)}/BTC</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Precio de mercado actual</span>
                      <p className="font-bold text-lg">{formatCOP(currentPrice)}/BTC</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card inferior según estado del plan */}
          {planStatus === 'paused' && (
            <Card className="bg-warning/10 border-warning">
              <CardContent className="space-y-4">
                <p className="font-bold">Tu plan está en pausa</p>
                <p className="text-sm text-muted-foreground">
                  Las compras automáticas están detenidas. Reactívalo cuando quieras seguir acumulando.
                </p>
                <Link href="/app/plan">
                  <Button fullWidth>Reactivar plan</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {planStatus === 'payment_failed' && (
            <Card className="bg-destructive/10 border-destructive">
              <CardContent className="space-y-4">
                <p className="font-bold">No pudimos ejecutar tu última compra</p>
                <p className="text-sm text-muted-foreground">
                  Revisa tu conexión bancaria o saldo disponible para continuar con las compras automáticas.
                </p>
                <Link href="/app/bank-connect">
                  <Button fullWidth variant="primary">Reconectar banco</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {planStatus === 'active' && nextPurchase && plan && (
            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Próxima compra</p>
                  <p className="font-bold">{formatDate(nextPurchase)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Monto</p>
                  <p className="font-bold">{formatCOP(plan.amountCop)}</p>
                </div>
              </CardContent>
            </Card>
          )}

        </>
      ) : (
        // Sin plan activo - onboarding
        <>
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-xl font-bold">
                Crea tu primer plan de ahorro en Bitcoin
              </h2>

              {/* Checklist de pasos */}
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex-shrink-0 w-6 h-6 flex items-center justify-center border-2 border-foreground text-sm font-bold',
                    hasPlan ? 'bg-success text-success-foreground' : 'bg-secondary'
                  )}>
                    {hasPlan ? '✓' : '1'}
                  </span>
                  <span className={hasPlan ? 'line-through text-muted-foreground' : ''}>
                    Configurar tu plan DCA
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex-shrink-0 w-6 h-6 flex items-center justify-center border-2 border-foreground text-sm font-bold',
                    hasBank ? 'bg-success text-success-foreground' : 'bg-secondary'
                  )}>
                    {hasBank ? '✓' : '2'}
                  </span>
                  <span className={hasBank ? 'line-through text-muted-foreground' : ''}>
                    Conectar tu banco
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex-shrink-0 w-6 h-6 flex items-center justify-center border-2 border-foreground text-sm font-bold',
                    isActive ? 'bg-success text-success-foreground' : 'bg-secondary'
                  )}>
                    {isActive ? '✓' : '3'}
                  </span>
                  <span>
                    Empieza a acumular automáticamente
                  </span>
                </div>
              </div>

              <Link href={hasPlan ? '/app/bank-connect' : '/app/plan'}>
                <Button fullWidth>
                  {hasPlan ? 'Conectar banco' : 'Crear plan de ahorro'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Info educativa */}
          <Card variant="secondary">
            <CardContent>
              <h3 className="font-bold mb-2">¿Qué es DCA?</h3>
              <p className="text-sm text-muted-foreground">
                Dollar Cost Averaging (DCA) es una estrategia usada para acumular Bitcoin a largo plazo, reduciendo el impacto de la volatilidad y evitando decisiones impulsivas.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
