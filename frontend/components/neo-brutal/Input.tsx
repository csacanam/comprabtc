/**
 * INPUT NEO-BRUTALISTA
 * =====================
 * Campo de texto con estilo neo-brutal: bordes gruesos, estados claros.
 */

'use client';

import React from "react"

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ===== TIPOS =====

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

// ===== COMPONENTE =====

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    // Generar ID único si no se proporciona
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;

    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-foreground"
          >
            {label}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Base
            'w-full px-4 py-3',
            'bg-background text-foreground',
            'border-[3px] border-foreground',
            'placeholder:text-muted-foreground',
            
            // Focus
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            
            // Transición
            'transition-all duration-150',
            
            // Error
            error && 'border-destructive focus:ring-destructive',
            
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
            
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />

        {/* Hint */}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}

        {/* Error */}
        {error && (
          <p id={`${inputId}-error`} className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
