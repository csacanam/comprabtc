/**
 * CONTRATOS Y CONSTANTES ON-CHAIN (Celo mainnet)
 * ===============================================
 * Direcciones verificadas — ver PLAN.md §2.
 */

import { toDataSuffix } from '@celo/attribution-tags';
import type { Hex } from 'viem';

export const USDT = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e' as const; // 6 dec
export const WBTC = '0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D' as const; // bridge nativo, 8 dec
export const POOL_FEE = 3000; // pool USDT/WBTC 0.3%

export const EXECUTOR = (process.env.NEXT_PUBLIC_EXECUTOR_ADDRESS ?? '0x') as `0x${string}`;

export const USDT_DECIMALS = 6;
export const SATS_PER_BTC = 100_000_000;

// ===== ATTRIBUTION TAG (ERC-8021) =====
// Se anexa como dataSuffix a las txs del usuario (approve + createPlan).
// SSR-safe: solo se calcula en el browser.
// Soporta varios códigos separados por coma (ej. "comprabtc,celo_asignado") —
// los programas solo acreditan SU código asignado; el nuestro mantiene analytics.
let cachedSuffix: Hex | null = null;
export function attributionSuffix(): Hex | undefined {
  if (typeof window === 'undefined') return undefined;
  if (cachedSuffix) return cachedSuffix;
  try {
    const codes = (process.env.NEXT_PUBLIC_ATTRIBUTION_CODE ?? 'comprabtc')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    cachedSuffix = toDataSuffix(codes.length === 1 ? codes[0] : codes) as Hex;
    return cachedSuffix;
  } catch {
    return undefined;
  }
}

// ===== ABIs mínimos =====
export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export const dcaExecutorAbi = [
  {
    type: 'function',
    name: 'createPlan',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountPerRun', type: 'uint128' },
      { name: 'minInterval', type: 'uint64' },
      { name: 'tokenOut', type: 'address' },
      { name: 'poolFee', type: 'uint24' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'cancelPlan',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'feeBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function',
    name: 'feeFlat',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'plans',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'amountPerRun', type: 'uint128' },
      { name: 'minInterval', type: 'uint64' },
      { name: 'lastRun', type: 'uint64' },
      { name: 'active', type: 'bool' },
      { name: 'tokenOut', type: 'address' },
      { name: 'poolFee', type: 'uint24' },
    ],
  },
] as const;
