'use client';

import type { ReactNode } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWalletProviders } from '../hooks/useWalletProviders';
import { useWalletState } from '../hooks/useWalletState';
import { WalletContext } from './WalletContext';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { providers } = useWalletProviders();
  const {
    selectedProvider,
    connecting,
    reconnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
  } = useWalletConnection(providers);
  const { account } = useWalletState(selectedProvider);

  return (
    <WalletContext.Provider
      value={{
        providers,
        selectedProvider,
        connecting,
        reconnecting,
        isConnected,
        error,
        connectWallet,
        disconnectWallet,
        account,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}; 