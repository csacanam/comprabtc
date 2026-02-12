/**
 * BADGE NEO-BRUTALISTA
 * =====================
 * Etiqueta pequeña con borde y sombra para estados, tags, etc.
 */

'use client';

import React from "react"

import { cn } from '@/lib/utils';

// ===== TIPOS =====

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

// ===== ESTILOS POR VARIANTE =====

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  info: 'bg-info text-info-foreground',
};

// ===== COMPONENTE =====

export function Badge({
  variant = 'default',
  className,
  children,
  style,
  ...props
}: BadgeProps & { style?: React.CSSProperties }) {
  return (
    <span
      className={cn(
        // Base
        'inline-flex items-center px-3 py-1',
        'text-xs font-bold uppercase tracking-wide',
        'border-2 border-foreground',
        
        // Variante
        variantStyles[variant],
        
        className
      )}
      style={{
        boxShadow: '2px 2px 0px 0px #1A1A1A',
        ...style
      }}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
