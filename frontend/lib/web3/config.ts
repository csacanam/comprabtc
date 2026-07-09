/**
 * CONFIGURACIÓN WEB3
 * ===================
 * wagmi + viem sobre Celo mainnet. Un solo connector (injected) cubre
 * MiniPay (auto-connect) y browsers con billetera (MetaMask, etc.).
 */

import { http, createConfig } from 'wagmi';
import { celo } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [injected()],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? 'https://forno.celo.org'),
  },
});

/** Formato corto de dirección: 0x1234…abcd */
export function shortAddress(address?: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isMiniPay(): boolean {
  if (typeof window === 'undefined') return false;
  const ethereum = (window as { ethereum?: { isMiniPay?: boolean } }).ethereum;
  return ethereum?.isMiniPay === true;
}
