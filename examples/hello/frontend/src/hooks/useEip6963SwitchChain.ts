import { useCallback } from 'react';

import { useEip6963Wallet } from './useEip6963Wallet';

export const useEip6963SwitchChain = () => {
  const { selectedProvider } = useEip6963Wallet();

  const switchChain = useCallback(
    async (chainId: number) => {
      if (!selectedProvider) {
        console.error('No provider selected');
        return;
      }

      try {
        await selectedProvider.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (error) {
        console.error('Failed to switch chain:', error);
      }
    },
    [selectedProvider]
  );

  return { switchChain };
};
