/**
 * PÁGINA DE BILLETERA (ANTI-PÁNICO)
 * ====================================
 * Visualización de la billetera diseñada para tranquilizar, no alarmar.
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
  calculatePnL,
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

export default function WalletPage() {
  const { plan, purchases, currentPrice, isLoading } = useDcaStore();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Calcular métricas
  const totalBtc = calculateTotalBTC(purchases);
  const pnl = calculatePnL(purchases, currentPrice);
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
      <h1 className="text-2xl font-bold">Billetera</h1>

      {/* KPI Principal: BTC Disponible */}
      <Card variant="primary">
        <CardContent className="space-y-4">
          <p className="text-sm text-primary-foreground/80">Bitcoin disponible</p>
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

      {/* Historial de movimientos de BTC */}
      {purchases.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Historial de movimientos</h2>
          
          <div className="space-y-3">
            {purchases
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((purchase) => {
                const status = (purchase.status ?? 'enviado') as PurchaseStatus;
                const statusVariant = status === 'enviado' ? 'success' : status === 'procesando' ? 'warning' : 'secondary';
                return (
                  <Card key={purchase.id}>
                    <CardContent className="py-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-success/20 border-2 border-success rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                              <path d="M12 5v14M19 12l-7 7-7-7"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-success">+{formatBTC(purchase.btcAmount)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Compra • {formatRelativeDate(new Date(purchase.createdAt))}
                            </p>
                            <Badge variant={statusVariant} className="mt-1">
                              {PURCHASE_STATUS_LABELS[status]}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatCOP(purchase.amountCop)}</p>
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
                Mostrando los últimos 10 de {purchases.length} movimientos
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
