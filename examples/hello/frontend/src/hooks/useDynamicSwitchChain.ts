import Wallet, { switchNetwork } from '@zetachain/wallet';
import { useCallback } from 'react';

import { useDynamicWalletHook } from './useDynamicWalletHook';
import { useRerender } from './useRerender';

export const useDynamicSwitchChain = () => {
  const { isConnected } = useDynamicWalletHook();
  const rerender = useRerender();

  const switchChain = useCallback(
    async (chainId: number) => {
      if (!isConnected || !Wallet.wallets.length) {
        console.error('No Dynamic wallet connected');
        return;
      }

      try {
        // Use the first connected wallet for switching networks
        const wallet = Wallet.wallets[0];
        console.debug('Switching to chain:', chainId);
        switchNetwork(wallet, { networkId: chainId });
        console.debug('Switch network call completed');

        // Force a rerender - the polling in useDynamicWallet should pick up the change
        rerender();
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
    [isConnected, rerender]
  );

  return { switchChain };
};
