/**
 * WEB3 PROVIDER
 * ==============
 * WagmiProvider + React Query + auto-connect en MiniPay
 * (dentro de MiniPay no se muestra botón de conectar — patrón oficial).
 */

'use client';

import { useEffect, type ReactNode } from 'react';
import { WagmiProvider, useConnect, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import { wagmiConfig, isMiniPay } from '@/lib/web3/config';
import { PrefsProvider } from '@/lib/prefs';

const queryClient = new QueryClient();

function MiniPayAutoConnect() {
  const { connect } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected && isMiniPay()) {
      connect({ connector: injected({ target: 'metaMask' }) });
    }
  }, [isConnected, connect]);

  return null;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PrefsProvider>
          <MiniPayAutoConnect />
          {children}
        </PrefsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
