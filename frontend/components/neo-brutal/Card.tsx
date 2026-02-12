/**
 * TARJETA NEO-BRUTALISTA
 * =======================
 * Contenedor con borde grueso y sombra dura desplazada.
 */

'use client';

import React from "react"

import { cn } from '@/lib/utils';

// ===== TIPOS =====

type CardVariant = 'default' | 'primary' | 'secondary' | 'warning' | 'success';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// ===== ESTILOS POR VARIANTE =====

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-card',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  warning: 'bg-warning',
  success: 'bg-success',
};

// ===== COMPONENTES =====

export function Card({
  variant = 'default',
  hoverable = false,
  className,
  children,
  style,
  ...props
}: CardProps & { style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        // Base
        'p-6 border-[3px] border-foreground',
        
        // Variante
        variantStyles[variant],
        variant !== 'default' && 'text-primary-foreground',
        
        // Hover
        hoverable && [
          'transition-all duration-150 ease-out cursor-pointer',
          'hover:-translate-x-0.5 hover:-translate-y-0.5',
          'active:translate-x-1 active:translate-y-1',
        ],
        
        className
      )}
      style={{
        boxShadow: '6px 6px 0px 0px #1A1A1A',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('text-xl font-bold text-balance', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-muted-foreground mt-1', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn('mt-6 flex items-center gap-4', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
