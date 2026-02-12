/**
 * MODELOS DE DOMINIO
 * ===================
 * Estos tipos definen la estructura de todos los datos de la aplicación.
 * Piensa en ellos como "plantillas" para la información que guardamos.
 */

// ===== USUARIO =====
// Representa a una persona registrada en la app
export interface User {
  id: string;                    // Identificador único del usuario
  email: string;                 // Correo electrónico
  invitedByCode: string;         // Código de invitación que usó para registrarse
  createdAt: string;             // Fecha de registro (formato ISO)
}

// ===== CÓDIGO DE INVITACIÓN =====
// Controla quién puede acceder a la app (acceso limitado)
export interface InvitationCode {
  code: string;                  // El código en sí (ej: "SAKA001")
  isActive: boolean;             // ¿Está activo? Si no, no se puede usar
  createdAt: string;             // Cuándo se creó
  usageCount: number;            // Cuántas veces se ha usado
  maxUsage: number;              // Máximo de usos permitidos
}

// ===== SESIÓN =====
// Indica que un usuario está "conectado" a la app
export interface Session {
  userId: string;                // ID del usuario conectado
  email: string;                 // Email del usuario
  createdAt: string;             // Cuándo inició sesión
}

// ===== DESAFÍO OTP =====
// Guarda el código de verificación enviado por email (simulado)
export interface OtpChallenge {
  email: string;                 // Email al que se envió
  otp: string;                   // Código de 6 dígitos
  expiresAt: string;             // Cuándo expira
}

// ===== PLAN DCA =====
// La configuración de compra automática del usuario
export type DcaFrequency = 'weekly' | 'biweekly' | 'monthly';

/** Estado del plan para UI y lógica (pausado, fallo de pago, etc.) */
export type PlanStatus = 'active' | 'paused' | 'payment_failed';

export interface DcaPlan {
  id: string;                    // ID único del plan
  userId: string;                // A quién pertenece
  amountCop: number;             // Monto en pesos colombianos
  frequency: DcaFrequency;       // Con qué frecuencia comprar
  isActive: boolean;             // ¿Está activo el plan? (false cuando paused)
  /** Estado explícito; si no existe, se deriva de isActive (active/paused) */
  status?: PlanStatus;
  createdAt: string;             // Cuándo se creó
}

/** Devuelve el status del plan; si no está definido, se infiere de isActive */
export function getPlanStatus(plan: DcaPlan): PlanStatus {
  if (plan.status) return plan.status;
  return plan.isActive ? 'active' : 'paused';
}

// ===== CONEXIÓN BANCARIA =====
// Simula la conexión con un banco para débitos automáticos
export type BankLinkStatus = 'connected' | 'disconnected';

export interface BankLink {
  id: string;                    // ID único
  userId: string;                // A quién pertenece
  bankName: string;              // Nombre del banco
  status: BankLinkStatus;        // Estado de la conexión
  createdAt: string;             // Cuándo se conectó
}

// ===== COMPRA =====
/** Estado de una compra en el flujo */
export type PurchaseStatus = 'programada' | 'procesando' | 'enviado';

// Cada compra de Bitcoin realizada
export interface Purchase {
  id: string;                    // ID único de la compra
  userId: string;                // Quién compró
  planId: string;                // De qué plan viene
  amountCop: number;             // Cuántos pesos se gastaron
  btcAmount: number;             // Cuántos BTC se compraron
  marketPriceCopPerBtc: number;  // Precio de mercado en ese momento
  createdAt: string;             // Cuándo se realizó
  status?: PurchaseStatus;      // Estado en el flujo (default: enviado para compatibilidad)
}

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  programada: 'Programada',
  procesando: 'Procesando',
  enviado: 'Enviado',
};

// ===== PUNTO DE PRECIO DE MERCADO =====
// Un precio histórico de BTC
export interface MarketPricePoint {
  dateISO: string;               // Fecha del precio
  priceCopPerBtc: number;        // Precio en pesos por 1 BTC
}

// ===== LABELS EN ESPAÑOL =====
// Traducción de las frecuencias para mostrar en la UI
export const FREQUENCY_LABELS: Record<DcaFrequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
};

// Días entre compras según frecuencia
export const FREQUENCY_DAYS: Record<DcaFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};
