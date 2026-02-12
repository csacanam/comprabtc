/**
 * LANDING PAGE
 * =============
 * Página de inicio con acceso a login y registro.
 * Diseño neo-brutalista mobile-first.
 */

'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/neo-brutal';
import { useAuthStore } from '@/stores/authStore';

export default function LandingPage() {
  const router = useRouter();
  const { session, isInitialized, initialize } = useAuthStore();

  // Inicializar la app
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirigir si ya tiene sesión
  useEffect(() => {
    if (isInitialized && session) {
      router.push('/app');
    }
  }, [isInitialized, session, router]);

  // Mostrar loading mientras inicializa
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b-3 border-foreground bg-card">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-xl font-bold">CompraBTC</span>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 px-6 py-12 flex flex-col justify-center">
        <div className="max-w-lg mx-auto w-full space-y-8">
          {/* Título principal */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              Ahorra en Bitcoin
              <span className="block text-primary">sin complicaciones</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Compras automáticas, pequeñas y constantes.
              Sin necesidad de entender de cripto ni estar pendiente del precio.
            </p>
          </div>

          {/* Beneficios */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center border-2 border-foreground font-bold text-sm">
                1
              </span>
              <span className="text-foreground">
                Elige cuánto quieres ahorrar cada semana o mes
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center border-2 border-foreground font-bold text-sm">
                2
              </span>
              <span className="text-foreground">
                Conecta tu banco y automatiza tus compras
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center border-2 border-foreground font-bold text-sm">
                3
              </span>
              <span className="text-foreground">
                Ve crecer tu ahorro sin estrés ni complicaciones
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-4 pt-4">
            <Link href="/signup" className="block">
              <Button fullWidth size="lg">
                Crear cuenta
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="outline" fullWidth size="lg">
                Iniciar sesión
              </Button>
            </Link>
          </div>

          {/* Nota de acceso limitado */}
          <p className="text-center text-sm text-muted-foreground">
            Acceso solo por invitación durante la etapa piloto
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t-3 border-foreground bg-secondary">
        <div className="max-w-lg mx-auto text-center text-sm text-muted-foreground">
          <p>Hecho con cuidado para quienes quieren ahorrar diferente</p>
        </div>
      </footer>
    </main>
  );
}
