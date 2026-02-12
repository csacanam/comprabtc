/**
 * PÁGINA DE CONEXIÓN BANCARIA
 * ============================
 * Flujo simulado de conexión con un banco para débitos automáticos.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useDcaStore } from '@/stores/dcaStore';
import { Button, Card, CardContent, Badge } from '@/components/neo-brutal';
import { AVAILABLE_BANKS } from '@/data/seed';
import { cn } from '@/lib/utils';

// Pasos del flujo
type Step = 'select-bank' | 'authorize' | 'confirming' | 'success';

export default function BankConnectPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { plan, connectBank, isLoading } = useDcaStore();

  // Estado del flujo
  const [step, setStep] = useState<Step>('select-bank');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Redirigir si no hay plan
  useEffect(() => {
    if (!plan) {
      router.push('/app/plan');
    }
  }, [plan, router]);

  // Obtener banco seleccionado
  const bank = AVAILABLE_BANKS.find(b => b.id === selectedBank);

  // Manejar selección de banco
  const handleSelectBank = (bankId: string) => {
    setSelectedBank(bankId);
  };

  // Continuar al siguiente paso
  const handleContinue = () => {
    if (step === 'select-bank' && selectedBank) {
      setStep('authorize');
    } else if (step === 'authorize') {
      setStep('confirming');
      // Simular proceso de autorización
      setTimeout(() => {
        handleConnect();
      }, 2000);
    }
  };

  // Conectar banco
  const handleConnect = async () => {
    if (!session || !bank) return;

    await connectBank(session.userId, bank.name);
    setStep('success');
  };

  // Volver al paso anterior
  const handleBack = () => {
    if (step === 'authorize') {
      setStep('select-bank');
    } else if (step === 'select-bank') {
      router.back();
    }
  };

  // Vista de éxito
  if (step === 'success') {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <Card variant="primary" className="text-center">
          <CardContent className="py-8 space-y-4">
            {/* Check icon */}
            <div className="w-20 h-20 mx-auto bg-background border-[3px] border-foreground flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">¡Todo listo!</h1>
              <p className="text-primary-foreground/80">
                Tu banco está conectado y tu plan DCA está activo.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-sm text-primary-foreground/70">
                Las compras se realizarán automáticamente según tu configuración.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" fullWidth size="lg" onClick={() => router.push('/app')}>
          Ir al inicio
        </Button>
      </div>
    );
  }

  // Vista de confirmando
  if (step === 'confirming') {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          {/* Spinner */}
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Conectando con {bank?.name}...</h2>
            <p className="text-muted-foreground">
              Esto solo tomará unos segundos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header con back */}
      <button 
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm font-bold hover:text-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7"/>
          <path d="M19 12H5"/>
        </svg>
        Volver
      </button>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'flex-1 h-2 border-2 border-foreground',
          step === 'select-bank' ? 'bg-primary' : 'bg-primary'
        )} />
        <div className={cn(
          'flex-1 h-2 border-2 border-foreground',
          step === 'authorize' ? 'bg-primary' : 'bg-secondary'
        )} />
      </div>

      {/* Paso 1: Seleccionar banco */}
      {step === 'select-bank' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Conecta tu banco</h1>
            <p className="text-muted-foreground">
              Selecciona el banco desde donde haremos los débitos automáticos.
            </p>
          </div>

          {/* Lista de bancos */}
          <div className="space-y-3">
            {AVAILABLE_BANKS.map((bankOption) => (
              <button
                key={bankOption.id}
                onClick={() => handleSelectBank(bankOption.id)}
                className={cn(
                  'w-full p-4 flex items-center gap-4 border-[3px] border-foreground transition-all',
                  selectedBank === bankOption.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-secondary'
                )}
                style={selectedBank === bankOption.id ? { boxShadow: '4px 4px 0px 0px #1A1A1A' } : undefined}
              >
                <span className="text-2xl">{bankOption.logo}</span>
                <span className="font-bold">{bankOption.name}</span>
                {selectedBank === bankOption.id && (
                  <span className="ml-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          <Button 
            fullWidth 
            size="lg"
            disabled={!selectedBank}
            onClick={handleContinue}
          >
            Continuar
          </Button>

          {/* Disclaimer */}
          <Card variant="secondary">
            <CardContent className="text-sm text-muted-foreground">
              <p>
                <strong>Nota:</strong> Esta es una simulación. En la versión real, 
                te redirigiremos a la página de tu banco para autorizar los débitos 
                de forma segura.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paso 2: Autorizar */}
      {step === 'authorize' && bank && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Autoriza débitos</h1>
            <p className="text-muted-foreground">
              Revisa y autoriza los débitos automáticos desde tu cuenta de {bank.name}.
            </p>
          </div>

          {/* Resumen de autorización */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b-2 border-border">
                <span className="text-3xl">{bank.logo}</span>
                <div>
                  <p className="font-bold">{bank.name}</p>
                  <Badge variant="info">Por conectar</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold">Autorizas a CompraBTC para:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-success font-bold">✓</span>
                    <span>Realizar débitos por el monto configurado en tu plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success font-bold">✓</span>
                    <span>Debitar según la frecuencia que elegiste</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success font-bold">✓</span>
                    <span>Recibir notificaciones antes de cada débito</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t-2 border-border">
                <p className="text-xs text-muted-foreground">
                  Puedes cancelar la autorización en cualquier momento desde 
                  la configuración de tu cuenta o directamente con tu banco.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button 
            fullWidth 
            size="lg"
            onClick={handleContinue}
            isLoading={isLoading}
          >
            Autorizar y conectar
          </Button>

          <button
            onClick={handleBack}
            className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground underline"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
