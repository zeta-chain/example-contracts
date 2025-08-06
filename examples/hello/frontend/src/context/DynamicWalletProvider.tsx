'use client';

import { type ReactNode, useMemo } from 'react';

import { useDynamicWallet } from '../hooks/useDynamicWallet';
import { DynamicWalletContext } from './DynamicWalletContext';

export const DynamicWalletProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const walletState = useDynamicWallet();

  const contextValue = useMemo(() => walletState, [walletState]);

  console.debug('contextValue', contextValue);

  return (
    <DynamicWalletContext.Provider value={contextValue}>
      {children}
    </DynamicWalletContext.Provider>
  );
};
