/**
 * SELECT NEO-BRUTALISTA
 * ======================
 * Selector desplegable con estilo neo-brutal.
 */

'use client';

import React from "react"

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ===== TIPOS =====

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

// ===== COMPONENTE =====

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    // Generar ID único si no se proporciona
    const selectId = id || `select-${Math.random().toString(36).substring(7)}`;

    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-bold text-foreground"
          >
            {label}
          </label>
        )}

        {/* Select */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              // Base
              'w-full px-4 py-3 appearance-none',
              'bg-background text-foreground',
              'border-[3px] border-foreground',
              'cursor-pointer',
              
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
              error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
            }
            {...props}
          >
            {/* Placeholder */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            
            {/* Options */}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Arrow icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg
              className="h-5 w-5 text-foreground"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Hint */}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}

        {/* Error */}
        {error && (
          <p id={`${selectId}-error`} className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
