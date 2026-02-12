/**
 * PÁGINA DE REGISTRO
 * ===================
 * Formulario de registro con código de invitación obligatorio.
 * Si el código no es válido, muestra opción de lista de espera.
 */

'use client';

import React from "react"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent } from '@/components/neo-brutal';
import { isValidEmail } from '@/domain/utils';
import { WAITLIST_URL } from '@/data/seed';
import { useAuthStore } from '@/stores/authStore';
import * as api from '@/services/mockApi';

// Estados del formulario
type FormState = 'idle' | 'loading' | 'success' | 'invalid_code';

export default function SignupPage() {
  const router = useRouter();
  const { initialize, isInitialized } = useAuthStore();
  
  // Estado del formulario
  const [email, setEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Inicializar datos
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Validaciones
  const emailError = email && !isValidEmail(email) 
    ? 'Ingresa un correo válido' 
    : '';
  
  const canSubmit = email && isValidEmail(email) && invitationCode && formState !== 'loading';

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setFormState('loading');
    setErrorMessage('');

    try {
      // Intentar crear usuario
      const result = await api.createUser(email, invitationCode);

      if (result.success) {
        setFormState('success');
        // Redirigir a login después de un momento
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 1500);
      } else {
        // Verificar si es error de código
        const codeValidation = await api.validateInvitationCode(invitationCode);
        if (!codeValidation.isValid) {
          setFormState('invalid_code');
          setErrorMessage(codeValidation.message);
        } else {
          setFormState('idle');
          setErrorMessage(result.message);
        }
      }
    } catch (error) {
      console.error('[Signup] Error:', error);
      setFormState('idle');
      setErrorMessage('Ocurrió un error. Intenta de nuevo.');
    }
  };

  // Vista de código inválido
  if (formState === 'invalid_code') {
    return (
      <main className="min-h-screen bg-background px-6 py-8 flex flex-col">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
          <Card className="text-center">
            <CardContent className="space-y-6 py-8">
              {/* Icono */}
              <div className="w-16 h-16 mx-auto bg-secondary border-[3px] border-foreground flex items-center justify-center">
                <span className="text-3xl" role="img" aria-label="Candado">
                  {/* Lock icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
              </div>

              {/* Mensaje */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Acceso limitado</h1>
                <p className="text-muted-foreground">
                  Por ahora estamos en una etapa piloto con acceso solo por invitación.
                </p>
                {errorMessage && (
                  <p className="text-sm text-destructive font-medium">
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="space-y-3 pt-4">
                <a href={WAITLIST_URL} target="_blank" rel="noopener noreferrer">
                  <Button fullWidth>
                    Únete a la lista de espera
                  </Button>
                </a>
                <button
                  onClick={() => {
                    setFormState('idle');
                    setErrorMessage('');
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground underline"
                >
                  Intentar con otro código
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Link a login */}
          <p className="text-center mt-8 text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-bold text-foreground hover:text-primary underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // Vista de éxito
  if (formState === 'success') {
    return (
      <main className="min-h-screen bg-background px-6 py-8 flex flex-col">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
          <Card variant="primary" className="text-center">
            <CardContent className="space-y-4 py-8">
              {/* Check icon */}
              <div className="w-16 h-16 mx-auto bg-background border-[3px] border-foreground flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold">¡Cuenta creada!</h1>
              <p>Te redirigimos para que inicies sesión...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Vista del formulario
  return (
    <main className="min-h-screen bg-background px-6 py-8 flex flex-col">
      {/* Header con back */}
      <header className="max-w-lg mx-auto w-full mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-bold hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Volver
        </Link>
      </header>

      {/* Formulario */}
      <div className="max-w-lg mx-auto w-full flex-1">
        <div className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Crear cuenta</h1>
            <p className="text-muted-foreground">
              Necesitas un código de invitación para registrarte.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              disabled={formState === 'loading'}
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Código de invitación"
              type="text"
              placeholder="Ej: SAKA001"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
              hint="¿Quién te invitó? Ingresa su código."
              disabled={formState === 'loading'}
              autoComplete="off"
            />

            {/* Error general */}
            {errorMessage && formState === 'idle' && (
              <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
                {errorMessage}
              </p>
            )}

            <Button 
              type="submit" 
              fullWidth 
              size="lg"
              disabled={!canSubmit}
              isLoading={formState === 'loading'}
            >
              Crear cuenta
            </Button>
          </form>
        </div>
      </div>

      {/* Link a login */}
      <footer className="max-w-lg mx-auto w-full mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold text-foreground hover:text-primary underline">
            Inicia sesión
          </Link>
        </p>
      </footer>
    </main>
  );
}
