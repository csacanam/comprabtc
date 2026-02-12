/**
 * STORAGE (Almacenamiento Local)
 * ===============================
 * Este archivo es un "wrapper" para localStorage.
 * Permite guardar y leer datos de forma persistente en el navegador.
 * 
 * ¿Por qué un wrapper?
 * - Maneja errores automáticamente
 * - Convierte objetos a/desde JSON
 * - Centraliza la lógica de almacenamiento
 * - Facilita cambiar a otra solución en el futuro
 */

// Prefijo para todas las claves (evita colisiones con otras apps)
const STORAGE_PREFIX = 'saka_dca_';

// Claves de almacenamiento
export const STORAGE_KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  INVITATION_CODES: `${STORAGE_PREFIX}invitation_codes`,
  SESSION: `${STORAGE_PREFIX}session`,
  OTP_CHALLENGE: `${STORAGE_PREFIX}otp_challenge`,
  DCA_PLANS: `${STORAGE_PREFIX}dca_plans`,
  BANK_LINKS: `${STORAGE_PREFIX}bank_links`,
  PURCHASES: `${STORAGE_PREFIX}purchases`,
  MARKET_PRICES: `${STORAGE_PREFIX}market_prices`,
  IS_SEEDED: `${STORAGE_PREFIX}is_seeded`,
  /** Solo desarrollo: override del estado del plan para probar UI (no_plan | active | paused | payment_failed) */
  MOCK_PLAN_STATE: `${STORAGE_PREFIX}mock_plan_state`,
  /** Dirección Bitcoin de destino de las compras (userId -> address) */
  BTC_DESTINATION_ADDRESSES: `${STORAGE_PREFIX}btc_destination_addresses`,
} as const;

/**
 * Guarda un valor en localStorage
 * @param key - Clave donde guardar
 * @param value - Valor a guardar (se convierte a JSON)
 */
export function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`[Storage] Error guardando ${key}:`, error);
  }
}

/**
 * Lee un valor de localStorage
 * @param key - Clave a leer
 * @param defaultValue - Valor por defecto si no existe
 * @returns El valor guardado o el default
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`[Storage] Error leyendo ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Elimina un valor de localStorage
 * @param key - Clave a eliminar
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Error eliminando ${key}:`, error);
  }
}

/**
 * Verifica si localStorage está disponible
 * (Puede no estarlo en navegación privada en algunos navegadores)
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = `${STORAGE_PREFIX}test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Limpia todos los datos de la app (útil para desarrollo)
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeItem(key);
  });
}
