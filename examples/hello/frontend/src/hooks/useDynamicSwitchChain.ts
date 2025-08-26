import { useUniversalSignInContext } from '@zetachain/wallet/react';
import { useCallback } from 'react';

export const useDynamicSwitchChain = () => {
  const { primaryWallet } = useUniversalSignInContext();

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
        await primaryWallet.switchNetwork(chainId);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 4902
        ) {
          console.warn(
            'Chain not found, you might need to add it to the wallet'
          );
        } else {
          console.error('Failed to switch chain:', error);
        }
      }
    },
    [primaryWallet]
  );

  return { switchChain };
};
