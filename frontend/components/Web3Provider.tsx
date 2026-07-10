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
    if (isConnected) return;

    // MiniPay puede inyectar window.ethereum después del primer render:
    // reintentar durante ~3s hasta encontrar el provider.
    let cancelled = false;
    let retriesLeft = 12;

    const tryConnect = () => {
      if (cancelled) return;
      if (isMiniPay()) {
        // MiniPay se presenta como MetaMask — patrón oficial de los docs
        connect({ connector: injected({ target: 'metaMask' }) });
      } else if (retriesLeft-- > 0) {
        setTimeout(tryConnect, 250);
      }
    };
    tryConnect();

    return () => {
      cancelled = true;
    };
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
