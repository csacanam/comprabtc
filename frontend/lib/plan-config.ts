/**
 * PARÁMETROS DEL PLAN DCA
 * ========================
 * Límites y frecuencias compartidos entre el plan real (/app/plan)
 * y la calculadora pública (/calc) — ambas deben ofrecer las mismas opciones.
 */

// Frecuencias disponibles (segundos → minInterval del contrato).
export const FREQUENCIES = ['3600', '21600', '43200', '86400'] as const;

// Montos sugeridos por cuota (USDT)
export const SUGGESTED_AMOUNTS = [0.1, 1, 5, 20];

export const MIN_AMOUNT_USDT = 0.1;
export const MAX_AMOUNT_USDT = 50; // etapa hackathon: tickets chicos y frecuentes (liquidez WBTC: PLAN.md §2.5)
