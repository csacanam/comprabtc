/**
 * SIMULACIÓN DE MERCADO
 * ======================
 * Genera precios simulados de Bitcoin para probar la app.
 * 
 * En una app real, estos precios vendrían de una API externa.
 * Aquí simulamos diferentes escenarios: alcista, bajista, lateral.
 */

import type { MarketPricePoint } from '@/domain/models';

// Tipo de tendencia del mercado
export type MarketTrend = 'bullish' | 'bearish' | 'sideways';

// Precio base de BTC en COP (aproximado a enero 2024)
const BASE_PRICE_COP = 180_000_000; // 180 millones COP

// Variación máxima diaria (porcentaje)
const MAX_DAILY_CHANGE = 0.05; // 5%

/**
 * Genera un precio aleatorio con tendencia
 * @param previousPrice - Precio anterior
 * @param trend - Tendencia del mercado
 * @returns Nuevo precio
 */
function generateNextPrice(previousPrice: number, trend: MarketTrend): number {
  // Factor de tendencia
  let trendFactor = 0;
  switch (trend) {
    case 'bullish':
      trendFactor = 0.002; // +0.2% promedio
      break;
    case 'bearish':
      trendFactor = -0.003; // -0.3% promedio
      break;
    case 'sideways':
      trendFactor = 0; // Sin tendencia
      break;
  }

  // Cambio aleatorio entre -5% y +5%
  const randomChange = (Math.random() - 0.5) * 2 * MAX_DAILY_CHANGE;
  
  // Combinar tendencia + aleatorio
  const totalChange = trendFactor + randomChange;
  
  // Calcular nuevo precio
  const newPrice = previousPrice * (1 + totalChange);
  
  // Asegurar que no baje de un mínimo razonable
  return Math.max(newPrice, BASE_PRICE_COP * 0.5);
}

/**
 * Genera una serie temporal de precios
 * @param days - Cantidad de días a generar
 * @param trend - Tendencia del mercado
 * @param startDate - Fecha de inicio (default: hace X días)
 * @returns Array de puntos de precio
 */
export function generatePriceSeries(
  days: number = 90,
  trend: MarketTrend = 'sideways',
  startDate?: Date
): MarketPricePoint[] {
  const prices: MarketPricePoint[] = [];
  const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  let currentPrice = BASE_PRICE_COP;

  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    
    prices.push({
      dateISO: date.toISOString().split('T')[0],
      priceCopPerBtc: Math.round(currentPrice),
    });
    
    currentPrice = generateNextPrice(currentPrice, trend);
  }

  return prices;
}

/**
 * Obtiene el precio actual simulado
 * @param prices - Serie de precios
 * @returns Último precio de la serie
 */
export function getCurrentPrice(prices: MarketPricePoint[]): number {
  if (prices.length === 0) {
    return BASE_PRICE_COP;
  }
  return prices[prices.length - 1].priceCopPerBtc;
}

/**
 * Obtiene el precio de hace X días
 * @param prices - Serie de precios
 * @param daysAgo - Cuántos días atrás
 * @returns Precio de ese día o undefined
 */
export function getPriceFromDaysAgo(
  prices: MarketPricePoint[],
  daysAgo: number
): number | undefined {
  const index = prices.length - 1 - daysAgo;
  if (index >= 0 && index < prices.length) {
    return prices[index].priceCopPerBtc;
  }
  return undefined;
}

/**
 * Calcula el cambio porcentual entre dos precios
 */
export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
): number {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Genera un precio "actual" con pequeña variación
 * (simula actualización en tiempo real)
 */
export function generateCurrentMarketPrice(basePrice?: number): number {
  const base = basePrice || BASE_PRICE_COP;
  const variation = (Math.random() - 0.5) * 0.02; // ±1%
  return Math.round(base * (1 + variation));
}
