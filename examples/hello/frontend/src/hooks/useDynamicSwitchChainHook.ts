import { useCallback } from 'react';

import { useDynamicSwitchChain } from './useDynamicSwitchChain';

// Hook for Dynamic wallets - separate file to avoid context issues
export const useDynamicSwitchChainHook = () => {
  const dynamicSwitchChain = useDynamicSwitchChain();

  const switchChain = useCallback(
    async (chainId: number) => {
      return dynamicSwitchChain.switchChain(chainId);
    },
    [dynamicSwitchChain]
  );

  return { switchChain };
};