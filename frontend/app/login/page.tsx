/**
 * PÁGINA DE LOGIN
 * ================
 * Login por email + OTP de 6 dígitos (simulado).
 * Incluye un panel de desarrollo para ver el OTP.
 */

'use client';

import React from "react"

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, CardContent, Badge } from '@/components/neo-brutal';
import { isValidEmail } from '@/domain/utils';
import { useAuthStore } from '@/stores/authStore';

// Componente para input de OTP
function OtpInput({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string; 
  onChange: (otp: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Asegurar que siempre tengamos exactamente 6 dígitos
  const valueArray = (value || '').split('').slice(0, 6);
  const digits: string[] = [];
  for (let i = 0; i < 6; i++) {
    digits[i] = valueArray[i] || '';
  }

  const handleChange = (index: number, newValue: string) => {
    // Solo permitir dígitos
    const digit = newValue.replace(/\D/g, '').slice(-1);
    
    // Actualizar valor
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(''));

    // Mover al siguiente input si se ingresó un dígito
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Retroceder al borrar
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pastedData);
    
    // Enfocar el último input con contenido
    const nextEmptyIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  // Estilos base para los inputs
  const inputStyle: React.CSSProperties = {
    width: '48px',
    height: '56px',
    minWidth: '48px',
    minHeight: '56px',
    backgroundColor: '#FFFEF5',
    color: '#1A1A1A',
    border: '3px solid #1A1A1A',
    borderRadius: '2px',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'inline-block',
    boxSizing: 'border-box',
    margin: '0 4px',
    padding: '0',
    outline: 'none',
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        padding: '16px 0', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '8px', 
        flexWrap: 'wrap',
      }}
    >
      {digits.map((digit, index) => (
        <input
          key={`otp-${index}`}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            ...inputStyle,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          aria-label={`Dígito ${index + 1} del código`}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  // Auth store
  const { 
    session,
    isLoading, 
    otpSent, 
    otpEmail, 
    devOtp,
    sendOtp, 
    verifyOtp,
    clearOtpFlow,
    initialize,
    isInitialized,
  } = useAuthStore();

  // Estado local
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Inicializar datos
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Redirigir si ya tiene sesión
  useEffect(() => {
    if (session) {
      router.push('/app');
    }
  }, [session, router]);

  // Validaciones
  const emailError = email && !isValidEmail(email) 
    ? 'Ingresa un correo válido' 
    : '';
  
  const canSendOtp = email && isValidEmail(email) && !isLoading;
  const canVerifyOtp = otp.length === 6 && !isLoading;

  // Enviar código OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSendOtp) return;

    setErrorMessage('');
    const result = await sendOtp(email);
    
    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  // Verificar OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canVerifyOtp) return;

    setErrorMessage('');
    const result = await verifyOtp(otp);
    
    if (!result.success) {
      setErrorMessage(result.message);
      setOtp('');
    }
    // Si es exitoso, el useEffect de session redirigirá
  };

  // Volver al paso de email
  const handleBack = () => {
    clearOtpFlow();
    setOtp('');
    setErrorMessage('');
  };

  // Vista de verificar OTP
  if (otpSent) {
    return (
      <main className="min-h-screen bg-background px-6 py-8 flex flex-col">
        {/* Header con back */}
        <header className="max-w-lg mx-auto w-full mb-8">
          <button 
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-bold hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            Cambiar correo
          </button>
        </header>

        {/* Contenido */}
        <div className="max-w-lg mx-auto w-full flex-1">
          <div className="space-y-6">
            {/* Título */}
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">Verifica tu correo</h1>
              <p className="text-muted-foreground">
                Enviamos un código de 6 dígitos a
              </p>
              <p className="font-bold text-foreground">{otpEmail}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-center">
                  Código de verificación
                </label>
                <OtpInput 
                  value={otp} 
                  onChange={setOtp}
                  disabled={isLoading}
                />
              </div>

              {/* Error */}
              {errorMessage && (
                <p className="text-sm font-medium text-destructive text-center bg-destructive/10 px-4 py-3 border-2 border-destructive">
                  {errorMessage}
                </p>
              )}

              <Button 
                type="submit" 
                fullWidth 
                size="lg"
                disabled={!canVerifyOtp}
                isLoading={isLoading}
              >
                Verificar código
              </Button>
            </form>

            {/* Reenviar código */}
            <div className="text-center">
              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="text-sm font-medium text-muted-foreground hover:text-foreground underline disabled:opacity-50"
              >
                Reenviar código
              </button>
            </div>

            {/* Dev Panel */}
            <div className="pt-8">
              <button
                onClick={() => setShowDevPanel(!showDevPanel)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 mx-auto"
              >
                <Badge variant="warning">DEV</Badge>
                {showDevPanel ? 'Ocultar OTP' : 'Ver OTP (desarrollo)'}
              </button>

              {showDevPanel && devOtp && (
                <Card className="mt-4 bg-warning/20">
                  <CardContent className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Código OTP (solo desarrollo):
                    </p>
                    <p className="text-3xl font-mono font-bold tracking-widest">
                      {devOtp}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Vista de ingresar email
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

      {/* Contenido */}
      <div className="max-w-lg mx-auto w-full flex-1">
        <div className="space-y-6">
          {/* Mensaje de registro exitoso */}
          {justRegistered && (
            <Card variant="success" className="text-center">
              <CardContent className="py-4">
                <p className="font-bold text-foreground">
                  ¡Cuenta creada! Ahora inicia sesión.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Iniciar sesión</h1>
            <p className="text-muted-foreground">
              Te enviaremos un código a tu correo para verificar que eres tú.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSendOtp} className="space-y-6">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />

            {/* Error */}
            {errorMessage && (
              <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
                {errorMessage}
              </p>
            )}

            <Button 
              type="submit" 
              fullWidth 
              size="lg"
              disabled={!canSendOtp}
              isLoading={isLoading}
            >
              Enviar código
            </Button>
          </form>
        </div>
      </div>

      {/* Link a signup */}
      <footer className="max-w-lg mx-auto w-full mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="font-bold text-foreground hover:text-primary underline">
            Crear cuenta
          </Link>
        </p>
      </footer>
    </main>
  );
}
