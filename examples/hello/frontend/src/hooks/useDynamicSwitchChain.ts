import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback } from 'react';

export const useDynamicSwitchChain = () => {
  const { primaryWallet } = useDynamicContext();

  const switchChain = useCallback(
    async (chainId: number) => {
      if (!primaryWallet) {
        console.error('No Dynamic wallet connected');
        return;
      }

      // Check if the wallet supports network switching
      if (!primaryWallet.connector.supportsNetworkSwitching()) {
        console.error('Wallet does not support network switching');
        return;
      }

      try {
        console.debug('Switching to chain:', chainId);
        await primaryWallet.switchNetwork(chainId);
        console.debug('Switch network call completed');
      } catch (error: unknown) {
        // If the chain hasn't been added to the wallet, try to add it
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 4902
        ) {
          console.log(
            'Chain not found, you might need to add it to the wallet'
          );
          // You could add logic here to add the chain if needed
        } else {
          console.error('Failed to switch chain:', error);
        }
      }
    },
    [primaryWallet]
  );

  return { switchChain };
};
