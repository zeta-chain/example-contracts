'use client';

import { type ReactNode, useMemo } from 'react';

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
  const { account, isSupportedChain, decimalChainId } =
    useWalletState(selectedProvider);

  const contextValue = useMemo(
    () => ({
      providers,
      selectedProvider,
      connecting,
      reconnecting,
      isConnected,
      isSupportedChain,
      decimalChainId,
      error,
      connectWallet,
      disconnectWallet,
      account,
    }),
    [
      providers,
      selectedProvider,
      connecting,
      reconnecting,
      isConnected,
      isSupportedChain,
      decimalChainId,
      error,
      connectWallet,
      disconnectWallet,
      account,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
