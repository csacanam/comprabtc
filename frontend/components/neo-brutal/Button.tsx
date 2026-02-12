/**
 * BOTÓN NEO-BRUTALISTA
 * =====================
 * Botón con estilo neo-brutal: bordes gruesos, sombra dura, hover desplazado.
 */

'use client';

import React from "react"

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ===== TIPOS =====

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// ===== ESTILOS POR VARIANTE =====

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'bg-transparent text-foreground',
  ghost: 'bg-transparent text-foreground border-transparent shadow-none hover:bg-secondary',
  destructive: 'bg-destructive text-destructive-foreground',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

// ===== COMPONENTE =====

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const isGhost = variant === 'ghost';

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'relative inline-flex items-center justify-center font-bold',
          'border-[3px] border-foreground',
          'transition-all duration-150 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          
          // Hover y active (excepto ghost)
          !isGhost && [
            'hover:-translate-x-0.5 hover:-translate-y-0.5',
            'active:translate-x-1 active:translate-y-1',
          ],
          
          // Variante y tamaño
          variantStyles[variant],
          sizeStyles[size],
          
          // Estados
          isDisabled && 'opacity-50 cursor-not-allowed hover:translate-x-0 hover:translate-y-0',
          
          // Ancho completo
          fullWidth && 'w-full',
          
          className
        )}
        style={{
          boxShadow: isGhost ? 'none' : (isDisabled ? '4px 4px 0px 0px #1A1A1A' : '4px 4px 0px 0px #1A1A1A'),
          ...style
        }}
        {...props}
      >
        {/* Spinner de carga */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        
        {/* Contenido (oculto si está cargando) */}
        <span className={cn(isLoading && 'invisible')}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
