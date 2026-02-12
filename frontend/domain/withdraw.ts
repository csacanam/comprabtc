/**
 * RETIRO DE BITCOIN
 * ==================
 * Redes disponibles y validación de direcciones por red.
 */

export type WithdrawNetworkId = 'bitcoin';

export interface WithdrawNetwork {
  id: WithdrawNetworkId;
  name: string;
  description: string;
  /** Prefijos válidos para la red (ej: '1', '3', 'bc1') */
  addressPrefixes: string[];
}

export const WITHDRAW_NETWORKS: WithdrawNetwork[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    description: 'Red principal (mainnet). Direcciones que empiezan en 1, 3 o bc1.',
    addressPrefixes: ['1', '3', 'bc1'],
  },
];

/** Base58 (sin 0, O, I, l) para P2PKH y P2SH */
const BASE58_LEGACY = /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/;
/** Bech32 SegWit y Taproot (bc1 + datos) */
const BECH32_MAINNET = /^bc1[a-z0-9]{39,89}$/;

/**
 * Valida una dirección Bitcoin según la red seleccionada.
 * Comprueba formato; no verifica checksum (para eso haría falta una lib).
 */
export function validateBitcoinAddress(
  networkId: WithdrawNetworkId,
  address: string
): { valid: boolean; error?: string } {
  const trimmed = address.trim();
  if (!trimmed) {
    return { valid: false, error: 'Ingresa una dirección' };
  }

  if (networkId === 'bitcoin') {
    if (BASE58_LEGACY.test(trimmed)) return { valid: true };
    if (BECH32_MAINNET.test(trimmed.toLowerCase())) return { valid: true };
    if (trimmed.startsWith('1') || trimmed.startsWith('3')) {
      return { valid: false, error: 'Dirección legacy inválida. Revisa longitud y caracteres (sin 0, O, I, l).' };
    }
    if (trimmed.toLowerCase().startsWith('bc1')) {
      return { valid: false, error: 'Dirección Bech32 inválida. Debe ser bc1 seguido de 39-89 caracteres.' };
    }
    return {
      valid: false,
      error: 'Dirección no válida para Bitcoin. Usa direcciones que empiecen en 1, 3 o bc1.',
    };
  }

  return { valid: false, error: 'Red no soportada' };
}
