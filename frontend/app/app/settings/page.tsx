/**
 * PÁGINA DE CONFIGURACIÓN
 * ========================
 * Ajustes de la cuenta, cerrar sesión, y panel de desarrollo.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useDcaStore } from '@/stores/dcaStore';
import { getMockPlanState, setMockPlanState, type MockPlanState } from '@/services/mockApi';
import { getPlanStatus, type PlanStatus } from '@/domain/models';
import { validateBitcoinAddress } from '@/domain/withdraw';
import { truncateBtcAddress } from '@/domain/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Select, Input } from '@/components/neo-brutal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { MarketTrend } from '@/market/marketSim';

export default function SettingsPage() {
  const router = useRouter();
  const { session, logout, isLoading: authLoading } = useAuthStore();
  const {
    plan,
    destinationAddress,
    loadUserData,
    setDestinationAddress,
    simulatePurchase,
    generateHistoricalPurchases,
    generateSamplePurchasesWithStatuses,
    regenerateMarketPrices,
    isLoading: dcaLoading
  } = useDcaStore();

  // Estado local
  const [marketTrend, setMarketTrend] = useState<MarketTrend>('sideways');
  const [mockPlanState, setMockPlanStateLocal] = useState<MockPlanState | null>(() => getMockPlanState());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [destinoModalOpen, setDestinoModalOpen] = useState(false);
  const [destinoInput, setDestinoInput] = useState('');
  const [destinoError, setDestinoError] = useState('');

  // Sincronizar estado mock al montar (p. ej. vuelta desde otra pestaña)
  useEffect(() => {
    setMockPlanStateLocal(getMockPlanState());
  }, [plan]);

  const isLoading = authLoading || dcaLoading;

  // Estado derivado del plan para mostrar en el badge
  const planStatus: PlanStatus | null = plan ? getPlanStatus(plan) : null;
  const planStatusLabel =
    !planStatus
      ? 'Sin plan'
      : planStatus === 'active'
        ? 'Activo'
        : planStatus === 'paused'
          ? 'Pausado'
          : 'Problema de pago';

  const planStatusVariant: 'secondary' | 'success' | 'warning' | 'destructive' =
    !planStatus
      ? 'secondary'
      : planStatus === 'active'
        ? 'success'
        : planStatus === 'paused'
          ? 'warning'
          : 'destructive';

  // Cerrar sesión
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Simular una compra
  const handleSimulatePurchase = async () => {
    if (!session || !plan) {
      setMessage({ type: 'error', text: 'Necesitas un plan activo para simular compras.' });
      return;
    }

    const purchase = await simulatePurchase(session.userId);
    if (purchase) {
      setMessage({ type: 'success', text: '¡Compra simulada! Revisa tu portafolio.' });
    } else {
      setMessage({ type: 'error', text: 'Error al simular la compra.' });
    }

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setMessage(null), 3000);
  };

  // Generar historial
  const handleGenerateHistory = async () => {
    if (!session || !plan) {
      setMessage({ type: 'error', text: 'Necesitas un plan activo para generar historial.' });
      return;
    }

    await generateHistoricalPurchases(session.userId, 10);
    setMessage({ type: 'success', text: '¡10 compras históricas generadas!' });

    setTimeout(() => setMessage(null), 3000);
  };

  const handleGenerateSampleStatuses = async () => {
    if (!session || !plan) {
      setMessage({ type: 'error', text: 'Necesitas un plan activo.' });
      return;
    }
    await generateSamplePurchasesWithStatuses(session.userId);
    setMessage({ type: 'success', text: '¡6 compras de ejemplo añadidas (2 de cada estado)!' });
    setTimeout(() => setMessage(null), 3000);
  };

  // Cambiar tendencia del mercado
  const handleChangeMarketTrend = async (trend: string) => {
    setMarketTrend(trend as MarketTrend);
    await regenerateMarketPrices(trend as MarketTrend);
    setMessage({ type: 'success', text: `Mercado cambiado a: ${trendLabels[trend as MarketTrend]}` });

    setTimeout(() => setMessage(null), 3000);
  };

  const trendLabels: Record<MarketTrend, string> = {
    bullish: 'Alcista (sube)',
    bearish: 'Bajista (baja)',
    sideways: 'Lateral (estable)',
  };

  const openDestinoModal = () => {
    setDestinoInput(destinationAddress ?? '');
    setDestinoError('');
    setDestinoModalOpen(true);
  };

  const handleSaveDestino = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = destinoInput.trim();
    if (!session) return;
    if (trimmed) {
      const { valid, error } = validateBitcoinAddress('bitcoin', trimmed);
      if (!valid) {
        setDestinoError(error ?? 'Dirección inválida');
        return;
      }
    }
    try {
      await setDestinationAddress(session.userId, trimmed);
      setDestinoModalOpen(false);
      setMessage({ type: 'success', text: 'Dirección de destino actualizada.' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setDestinoError('Error al guardar. Intenta de nuevo.');
    }
  };

  // Cambiar estado mock del plan (solo desarrollo)
  const handleMockPlanStateChange = async (value: string) => {
    const next: MockPlanState | null = value === '' ? null : (value as MockPlanState);
    setMockPlanState(next);
    setMockPlanStateLocal(next);
    if (session) {
      await loadUserData(session.userId);
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Título */}
      <h1 className="text-2xl font-bold">Configuración</h1>

      {/* Mensaje de feedback */}
      {message && (
        <Card variant={message.type === 'success' ? 'success' : 'destructive' as "default"}>
          <CardContent className="py-3">
            <p className="font-medium text-foreground">{message.text}</p>
          </CardContent>
        </Card>
      )}

      {/* Info de cuenta */}
      <Card>
        <CardHeader>
          <CardTitle>Tu cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Correo electrónico</p>
            <p className="font-medium">{session?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado del plan</p>
            <Badge variant={planStatusVariant}>
              {planStatusLabel}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Billetera destino */}
      <div id="destino-btc">
      <Card>
        <CardHeader>
          <CardTitle>Billetera destino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Los Bitcoin que compres con tu plan se enviarán a esta dirección.
          </p>
          <div>
            <p className="text-sm font-bold text-foreground">
              {destinationAddress ? 'Dirección' : 'Sin configurar'}
            </p>
            {destinationAddress && (
              <p className="font-mono text-sm break-all text-muted-foreground mt-1">
                {truncateBtcAddress(destinationAddress, 12, 12)}
              </p>
            )}
          </div>
          <Button
            fullWidth
            variant={destinationAddress ? 'outline' : 'primary'}
            size="sm"
            onClick={openDestinoModal}
          >
            {destinationAddress ? 'Cambiar dirección' : 'Configurar billetera destino'}
          </Button>
        </CardContent>
      </Card>
      </div>

      <Dialog open={destinoModalOpen} onOpenChange={setDestinoModalOpen}>
        <DialogContent className="max-w-lg border-[3px] border-foreground" showCloseButton>
          <DialogHeader>
            <DialogTitle>Billetera destino</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Pega la dirección Bitcoin (1, 3 o bc1) en la que quieres recibir las compras.
            </p>
            <p className="text-sm font-medium text-warning bg-warning/10 px-4 py-3 border-2 border-warning">
              Esta es TU billetera. No podremos recuperar fondos enviados aquí.
            </p>
          </DialogHeader>
          <form onSubmit={handleSaveDestino} className="space-y-4">
            <Input
              label="Dirección Bitcoin"
              type="text"
              placeholder="bc1q... o 1A1z... o 3J98..."
              value={destinoInput}
              onChange={(e) => setDestinoInput(e.target.value)}
              error={destinoError}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cerrar sesión */}
      <Button
        variant="outline"
        fullWidth
        onClick={handleLogout}
        isLoading={authLoading}
      >
        Cerrar sesión
      </Button>

      {/* Panel de desarrollo */}
      <Card className="bg-warning/10 border-warning">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="warning">DEV</Badge>
            <CardTitle>Panel de desarrollo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estas opciones son solo para probar la app. En producción no existirían.
          </p>

          {/* Simular compra */}
          <div className="space-y-2">
            <p className="text-sm font-bold">Simular compras</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSimulatePurchase}
                disabled={isLoading || !plan}
              >
                +1 compra
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateHistory}
                disabled={isLoading || !plan}
              >
                +10 históricas
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateSampleStatuses}
                disabled={isLoading || !plan}
              >
                3 estados (ejemplo)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              &quot;3 estados&quot; añade 6 compras con 2 de cada estado.
            </p>
          </div>

          {/* Simular estado del plan */}
          <div className="space-y-2">
            <p className="text-sm font-bold">Simular estado del plan</p>
            <Select
              value={mockPlanState ?? ''}
              onChange={(e) => handleMockPlanStateChange(e.target.value)}
              options={[
                { value: '', label: 'Datos reales' },
                { value: 'no_plan', label: 'Usuario nuevo (sin plan)' },
                { value: 'paused', label: 'Plan pausado' },
                { value: 'payment_failed', label: 'Plan - fallo de pago' },
              ]}
              disabled={!session}
            />
            <p className="text-xs text-muted-foreground">
              Cambia cómo ve la app tu estado (Inicio, Mi Plan). No modifica datos reales.
            </p>
          </div>

          {/* Cambiar tendencia de mercado */}
          <div className="space-y-2">
            <p className="text-sm font-bold">Tendencia del mercado</p>
            <Select
              value={marketTrend}
              onChange={(e) => handleChangeMarketTrend(e.target.value)}
              options={[
                { value: 'sideways', label: 'Lateral (estable)' },
                { value: 'bullish', label: 'Alcista (sube)' },
                { value: 'bearish', label: 'Bajista (baja)' },
              ]}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Regenera 90 días de precios simulados con la tendencia seleccionada.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Versión */}
      <p className="text-center text-xs text-muted-foreground">
        CompraBTC v0.1.0 (Piloto)
      </p>
    </div>
  );
}
