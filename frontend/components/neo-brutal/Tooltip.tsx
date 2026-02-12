/**
 * TOOLTIP NEO-BRUTALISTA
 * =======================
 * Tooltip simple con estilo neo-brutal.
 */

'use client';

import React from "react"

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ===== TIPOS =====

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// ===== COMPONENTE =====

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Ajustar posición si no cabe en pantalla
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      if (position === 'top' && tooltip.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltip.bottom > viewportHeight) {
        newPosition = 'top';
      } else if (position === 'left' && tooltip.left < 0) {
        newPosition = 'right';
      } else if (position === 'right' && tooltip.right > viewportWidth) {
        newPosition = 'left';
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            // Base
            'absolute z-50',
            'px-3 py-2',
            'bg-foreground text-background',
            'text-sm font-medium',
            'border-2 border-foreground',
            'whitespace-nowrap',
            
            // Animación
            'animate-in fade-in-0 zoom-in-95 duration-150',
            
            // Posición
            positionStyles[actualPosition],
            
            className
          )}
          style={{ boxShadow: '2px 2px 0px 0px #1A1A1A' }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// ===== ICON DE AYUDA =====

interface HelpIconProps {
  tooltip: React.ReactNode;
  className?: string;
}

export function HelpIcon({ tooltip, className }: HelpIconProps) {
  return (
    <Tooltip content={tooltip}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center',
          'w-5 h-5 rounded-full',
          'bg-muted text-muted-foreground',
          'border-2 border-foreground',
          'text-xs font-bold',
          'hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary',
          className
        )}
        aria-label="Ayuda"
      >
        ?
      </button>
    </Tooltip>
  );
}

export default Tooltip;
