/**
 * UTILIDADES DE DOMINIO
 * ======================
 * Funciones de cálculo y formateo para la app.
 * Separadas de la UI para mantener el código limpio.
 */

import type { Purchase, DcaFrequency, DcaPlan } from './models';
import { FREQUENCY_DAYS } from './models';

// ===== FORMATEO DE MONEDA =====

/**
 * Formatea un número como pesos colombianos
 * @example formatCOP(100000) → "$100.000 COP"
 */
export function formatCOP(amount: number): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  // Agregar "COP" al final para mayor claridad
  return formatted.replace(/\s*COP$/, '') + ' COP';
}

/**
 * Formatea un número de Bitcoin con hasta 8 decimales
 * @example formatBTC(0.00045678) → "0.00045678 BTC"
 */
export function formatBTC(amount: number): string {
  // Mostrar solo los decimales necesarios (hasta 8)
  const formatted = amount.toFixed(8).replace(/\.?0+$/, '');
  return `${formatted} BTC`;
}

/**
 * Formatea BTC de forma compacta
 * @example formatBTCCompact(0.00045678) → "456.78 sats" o "0.00045 BTC"
 */
export function formatBTCCompact(amount: number): string {
  // Si es menos de 0.001 BTC, mostrar en satoshis
  if (amount < 0.001) {
    const sats = Math.round(amount * 100_000_000);
    return `${sats.toLocaleString('es-CO')} sats`;
  }
  return formatBTC(amount);
}

// ===== CÁLCULOS DE PORTAFOLIO =====

/**
 * Calcula el precio promedio de compra
 * (Total gastado en COP / Total BTC acumulado)
 */
export function calculateAveragePrice(purchases: Purchase[]): number {
  if (purchases.length === 0) return 0;
  
  const totalCop = purchases.reduce((sum, p) => sum + p.amountCop, 0);
  const totalBtc = purchases.reduce((sum, p) => sum + p.btcAmount, 0);
  
  if (totalBtc === 0) return 0;
  return totalCop / totalBtc;
}

/**
 * Calcula el total de BTC acumulado
 */
export function calculateTotalBTC(purchases: Purchase[]): number {
  return purchases.reduce((sum, p) => sum + p.btcAmount, 0);
}

/**
 * Calcula el total invertido en COP
 */
export function calculateTotalInvested(purchases: Purchase[]): number {
  return purchases.reduce((sum, p) => sum + p.amountCop, 0);
}

/**
 * Calcula el valor actual del portafolio
 * (Total BTC × Precio actual de mercado)
 */
export function calculatePortfolioValue(
  purchases: Purchase[],
  currentPriceCopPerBtc: number
): number {
  const totalBtc = calculateTotalBTC(purchases);
  return totalBtc * currentPriceCopPerBtc;
}

/**
 * Calcula la ganancia/pérdida (PnL)
 * Retorna el monto y el porcentaje
 */
export function calculatePnL(
  purchases: Purchase[],
  currentPriceCopPerBtc: number
): { amount: number; percentage: number } {
  const totalInvested = calculateTotalInvested(purchases);
  const currentValue = calculatePortfolioValue(purchases, currentPriceCopPerBtc);
  
  const amount = currentValue - totalInvested;
  const percentage = totalInvested > 0 
    ? (amount / totalInvested) * 100 
    : 0;
  
  return { amount, percentage };
}

// ===== FECHAS =====

/**
 * Calcula la fecha de la próxima compra
 * @param frequency - Frecuencia del plan
 * @param lastPurchaseDate - Fecha de la última compra (o null si no hay)
 */
export function nextPurchaseDate(
  frequency: DcaFrequency,
  lastPurchaseDate?: Date | null
): Date {
  const days = FREQUENCY_DAYS[frequency];
  const baseDate = lastPurchaseDate || new Date();
  
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  
  return nextDate;
}

/**
 * Formatea una fecha de forma amigable
 * @example formatDate(new Date()) → "15 de enero"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Formatea una fecha completa
 * @example formatDateFull(new Date()) → "15 de enero de 2024"
 */
export function formatDateFull(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatea una fecha relativa
 * @example formatRelativeDate(new Date()) → "Hoy" o "Hace 3 días"
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return formatDate(date);
}

/**
 * Trunca una dirección Bitcoin para mostrar (ej: bc1q...xyz)
 */
export function truncateBtcAddress(address: string, start = 8, end = 8): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

// ===== VALIDACIONES =====

/**
 * Valida un email (formato básico)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Genera un ID único simple
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Genera un OTP de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===== RACHA DE COMPRAS =====

/**
 * Calcula la racha de compras consecutivas
 * (compras que se hicieron según la frecuencia programada)
 */
export function calculateStreak(purchases: Purchase[], plan: DcaPlan | null): number {
  if (!plan || purchases.length === 0) return 0;
  
  // Ordenar por fecha descendente
  const sorted = [...purchases]
    .filter(p => p.planId === plan.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  if (sorted.length === 0) return 0;
  
  // Contar compras consecutivas
  let streak = 1;
  const expectedGap = FREQUENCY_DAYS[plan.frequency] * 24 * 60 * 60 * 1000;
  const tolerance = 2 * 24 * 60 * 60 * 1000; // 2 días de tolerancia
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i].createdAt).getTime();
    const previous = new Date(sorted[i + 1].createdAt).getTime();
    const actualGap = current - previous;
    
    if (Math.abs(actualGap - expectedGap) <= tolerance) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
