'use client';

import { type ReactNode, useMemo } from 'react';

import { useEip6963WalletConnection } from '../hooks/useEip6963WalletConnection';
import { useEip6963WalletProviders } from '../hooks/useEip6963WalletProviders';
import { useEip6963WalletState } from '../hooks/useEip6963WalletState';
import { Eip6963WalletContext } from './Eip6963WalletContext';

export const Eip6963WalletProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { providers } = useEip6963WalletProviders();
  const {
    selectedProvider,
    connecting,
    reconnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
  } = useEip6963WalletConnection(providers);
  const { account, isSupportedChain, decimalChainId } =
    useEip6963WalletState(selectedProvider);

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
    <Eip6963WalletContext.Provider value={contextValue}>
      {children}
    </Eip6963WalletContext.Provider>
  );
};
