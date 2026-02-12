/**
 * PÁGINA DE PLAN DCA
 * ===================
 * Configurar o gestionar el plan de compras automáticas.
 */

'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useDcaStore } from '@/stores/dcaStore';
import { Button, Input, Select, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/neo-brutal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { formatCOP, nextPurchaseDate, formatDate, formatBTC, formatRelativeDate } from '@/domain/utils';
import { FREQUENCY_LABELS, getPlanStatus, PURCHASE_STATUS_LABELS, type DcaFrequency, type PurchaseStatus } from '@/domain/models';
import Link from 'next/link';
import { MIN_DCA_AMOUNT_COP } from '@/data/seed';

// Opciones de frecuencia
const frequencyOptions = [
  { value: 'weekly', label: 'Semanal (cada 7 días)' },
  { value: 'biweekly', label: 'Quincenal (cada 14 días)' },
  { value: 'monthly', label: 'Mensual (cada 30 días)' },
];

// Montos sugeridos
const suggestedAmounts = [100000, 200000, 500000, 1000000];

export default function PlanPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { plan, bankLink, purchases, destinationAddress, savePlan, togglePlan, isLoading } = useDcaStore();

  // Estado del formulario
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<DcaFrequency>('weekly');
  const [error, setError] = useState('');

  // Modal reactivar plan (solo en vista pausado)
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [reactivateAmount, setReactivateAmount] = useState('');
  const [reactivateFrequency, setReactivateFrequency] = useState<DcaFrequency>('weekly');
  const [reactivateError, setReactivateError] = useState('');

  // Inicializar con valores del plan existente
  useEffect(() => {
    if (plan) {
      setAmount(plan.amountCop.toString());
      setFrequency(plan.frequency);
    }
  }, [plan]);

  // Validación del monto
  const amountNumber = parseInt(amount.replace(/\D/g, '')) || 0;
  const amountError = amountNumber > 0 && amountNumber < MIN_DCA_AMOUNT_COP
    ? `El monto mínimo es ${formatCOP(MIN_DCA_AMOUNT_COP)}`
    : '';

  const canSubmit = amountNumber >= MIN_DCA_AMOUNT_COP && !isLoading;

  // Guardar plan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit || !session) return;

    try {
      await savePlan(session.userId, amountNumber, frequency);
      
      // Si no tiene banco conectado, ir a conectar
      if (!bankLink || bankLink.status !== 'connected') {
        router.push('/app/bank-connect');
      }
    } catch (err) {
      setError('Error al guardar el plan. Intenta de nuevo.');
    }
  };

  // Toggle plan activo/pausado
  const handleTogglePlan = async () => {
    if (!session || !plan) return;
    await togglePlan(session.userId, !plan.isActive);
  };

  // Abrir modal de reactivación con datos actuales del plan
  const openReactivateModal = () => {
    if (plan) {
      setReactivateAmount(plan.amountCop.toString());
      setReactivateFrequency(plan.frequency);
      setReactivateError('');
    }
    setReactivateModalOpen(true);
  };

  const reactivateAmountNumber = parseInt(reactivateAmount.replace(/\D/g, ''), 10) || 0;
  const reactivateAmountError = reactivateAmountNumber > 0 && reactivateAmountNumber < MIN_DCA_AMOUNT_COP
    ? `El monto mínimo es ${formatCOP(MIN_DCA_AMOUNT_COP)}`
    : '';
  const canReactivate = reactivateAmountNumber >= MIN_DCA_AMOUNT_COP && !isLoading;

  const handleReactivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !plan || !canReactivate) return;
    setReactivateError('');
    try {
      await savePlan(session.userId, reactivateAmountNumber, reactivateFrequency);
      await togglePlan(session.userId, true);
      setReactivateModalOpen(false);
    } catch (err) {
      setReactivateError('Error al reactivar. Intenta de nuevo.');
    }
  };

  // Formatear input de monto
  const handleAmountChange = (value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/\D/g, '');
    setAmount(numericValue);
  };

  const planStatus = plan ? getPlanStatus(plan) : null;
  const showActiveView = plan && (
    (planStatus === 'active' && bankLink?.status === 'connected') ||
    planStatus === 'payment_failed'
  );

  // Si ya tiene plan activo (o activo con fallo de pago), mostrar gestión
  if (showActiveView && plan) {
    const nextPurchase = nextPurchaseDate(plan.frequency);

    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Tu plan DCA</h1>

        {/* Alerta fallo de pago */}
        {planStatus === 'payment_failed' && (
          <Card className="bg-destructive/10 border-destructive">
            <CardContent className="space-y-3 py-4">
              <p className="font-bold">Última compra no procesada</p>
              <p className="text-sm text-muted-foreground">
                Verifica tu banco o saldo disponible. Intentaremos nuevamente en el próximo ciclo.
              </p>
              <Link href="/app/bank-connect">
                <Button fullWidth variant="primary" size="sm">Reconectar banco</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Aviso: billetera destino sin configurar */}
        {!destinationAddress && (
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
        )}

        {/* Plan actual */}
        <Card variant="primary">
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-foreground/80">Estado</span>
              <Badge variant="success">Activo</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-primary-foreground/20">
                <span className="text-sm text-primary-foreground/80">Monto por compra</span>
                <span className="font-bold">{formatCOP(plan.amountCop)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary-foreground/20">
                <span className="text-sm text-primary-foreground/80">Frecuencia</span>
                <span className="font-bold">{FREQUENCY_LABELS[plan.frequency]}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-primary-foreground/80">Próxima compra</span>
                <span className="font-bold">{formatDate(nextPurchase)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banco / Conexión bancaria */}
        <Card className={bankLink?.status !== 'connected' ? 'bg-destructive/5 border-destructive/50' : ''}>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-bold">Conexión bancaria</p>
                {bankLink?.status === 'connected' ? (
                  <p className="text-sm text-muted-foreground">{bankLink.bankName}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Necesitamos reconectar tu banco para procesar pagos.
                  </p>
                )}
              </div>
              <Badge variant={bankLink?.status === 'connected' ? 'success' : 'destructive'}>
                {bankLink?.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>

            {bankLink?.status !== 'connected' && (
              <Link href="/app/bank-connect" className="block">
                <Button fullWidth variant="primary">
                  Reconectar banco
                </Button>
              </Link>
            )}

            {bankLink?.status === 'connected' && (
              <Link href="/app/bank-connect" className="block">
                <Button fullWidth variant="outline">
                  Cambiar banco
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            fullWidth
            onClick={handleTogglePlan}
            isLoading={isLoading}
          >
            Pausar plan
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Pausar el plan detendrá las compras automáticas temporalmente.
          </p>
        </div>

        {/* Historial de compras */}
        {purchases.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Historial de compras ({purchases.length})</h2>
            
            <div className="space-y-3">
              {purchases.slice(0, 10).map((purchase) => {
                const status = (purchase.status ?? 'enviado') as PurchaseStatus;
                const statusVariant = status === 'enviado' ? 'success' : status === 'procesando' ? 'warning' : 'secondary';
                return (
                  <Card key={purchase.id}>
                    <CardContent className="py-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold">{formatBTC(purchase.btcAmount)}</p>
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
        )}
      </div>
    );
  }

  // Si plan está pausado
  if (plan && planStatus === 'paused' && bankLink?.status === 'connected') {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Plan pausado</h1>

        <Card>
          <CardContent className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto bg-warning/20 border-[3px] border-foreground flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-bold">Tu plan está en pausa</h2>
              <p className="text-muted-foreground mt-2">
                No se realizarán compras automáticas hasta que lo reactives.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button 
          fullWidth 
          size="lg"
          onClick={openReactivateModal}
          disabled={isLoading}
        >
          Reactivar plan
        </Button>

        <Dialog open={reactivateModalOpen} onOpenChange={setReactivateModalOpen}>
          <DialogContent className="max-w-lg border-[3px] border-foreground" showCloseButton={true}>
            <DialogHeader>
              <DialogTitle>Reactivar plan</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Revisa o cambia el monto y la frecuencia. Las compras automáticas se reanudarán con esta configuración.
              </p>
            </DialogHeader>
            <form onSubmit={handleReactivateSubmit} className="space-y-4">
              <div className="space-y-3">
                <Input
                  label="Monto por compra"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 200000"
                  value={reactivateAmount ? formatCOP(reactivateAmountNumber).replace('$', '').trim() : ''}
                  onChange={(e) => setReactivateAmount(e.target.value.replace(/\D/g, ''))}
                  error={reactivateAmountError}
                  hint={`Mínimo ${formatCOP(MIN_DCA_AMOUNT_COP)}`}
                />
                <div className="flex flex-wrap gap-2">
                  {suggestedAmounts.map((suggestedAmount) => (
                    <button
                      key={suggestedAmount}
                      type="button"
                      onClick={() => setReactivateAmount(suggestedAmount.toString())}
                      className={`px-3 py-1 text-sm font-medium border-2 border-foreground transition-colors
                        ${reactivateAmountNumber === suggestedAmount 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary hover:bg-muted'
                        }`}
                    >
                      {formatCOP(suggestedAmount)}
                    </button>
                  ))}
                </div>
              </div>
              <Select
                label="Frecuencia"
                value={reactivateFrequency}
                onChange={(e) => setReactivateFrequency(e.target.value as DcaFrequency)}
                options={frequencyOptions}
              />
              {reactivateError && (
                <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
                  {reactivateError}
                </p>
              )}
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={!canReactivate} isLoading={isLoading}>
                  Reactivar plan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Historial de compras (no cambia si el plan está pausado) */}
        {purchases.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Historial de compras ({purchases.length})</h2>
            <div className="space-y-3">
              {purchases.slice(0, 10).map((purchase) => {
                const status = (purchase.status ?? 'enviado') as PurchaseStatus;
                const statusVariant = status === 'enviado' ? 'success' : status === 'procesando' ? 'warning' : 'secondary';
                return (
                  <Card key={purchase.id}>
                    <CardContent className="py-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold">{formatBTC(purchase.btcAmount)}</p>
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
        )}
      </div>
    );
  }

  // Formulario para crear/editar plan
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {plan ? 'Editar plan' : 'Configura tu plan'}
        </h1>
        <p className="text-muted-foreground">
          Define cuánto y con qué frecuencia quieres ahorrar en Bitcoin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Monto */}
        <div className="space-y-3">
          <Input
            label="¿Cuánto quieres ahorrar en Bitcoin?"
            type="text"
            inputMode="numeric"
            placeholder="Ej: 200000"
            value={amount ? formatCOP(amountNumber).replace('$', '').trim() : ''}
            onChange={(e) => handleAmountChange(e.target.value)}
            error={amountError}
            hint={`Mínimo ${formatCOP(MIN_DCA_AMOUNT_COP)}`}
          />

          {/* Montos sugeridos */}
          <div className="flex flex-wrap gap-2">
            {suggestedAmounts.map((suggestedAmount) => (
              <button
                key={suggestedAmount}
                type="button"
                onClick={() => setAmount(suggestedAmount.toString())}
                className={`px-3 py-1 text-sm font-medium border-2 border-foreground transition-colors
                  ${amountNumber === suggestedAmount 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-muted'
                  }`}
              >
                {formatCOP(suggestedAmount)}
              </button>
            ))}
          </div>
        </div>

        {/* Frecuencia */}
        <Select
          label="¿Con qué frecuencia?"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as DcaFrequency)}
          options={frequencyOptions}
          hint="Recomendamos semanal para mejor promediado"
        />

        {/* Resumen */}
        {amountNumber >= MIN_DCA_AMOUNT_COP && (
          <Card variant="secondary">
            <CardContent>
              <p className="text-sm">
                Ahorrarás aproximadamente{' '}
                <strong>
                  {formatCOP(
                    frequency === 'weekly' 
                      ? amountNumber * 4 
                      : frequency === 'biweekly' 
                        ? amountNumber * 2 
                        : amountNumber
                  )}
                </strong>{' '}
                al mes en compras automáticas de Bitcoin.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
            {error}
          </p>
        )}

        {/* Submit */}
        <Button 
          type="submit" 
          fullWidth 
          size="lg"
          disabled={!canSubmit}
          isLoading={isLoading}
        >
          Continuar
        </Button>
      </form>

      {/* Info */}
      <Card>
        <CardContent>
          <h3 className="font-bold mb-2">¿Por qué funciona el DCA?</h3>
          <p className="text-sm text-muted-foreground">
            Al comprar Bitcoin de forma periódica, evitas depender de un solo momento del mercado. Con el tiempo, esto ayuda a bajar el precio promedio y a reducir el impacto de decisiones emocionales.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
