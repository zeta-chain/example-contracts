import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback } from 'react';

import { useDynamicSwitchChain } from './useDynamicSwitchChain';
import { useSwitchChain } from './useSwitchChain';

export const useUniversalSwitchChain = () => {
  // Use Dynamic's official context
  const { primaryWallet } = useDynamicContext();
  const eip6963SwitchChain = useSwitchChain();
  const dynamicSwitchChain = useDynamicSwitchChain();

  // Detect if we're using Dynamic wallet - check if primaryWallet exists (means we're using Dynamic SDK)
  const isDynamicWallet = !!primaryWallet;

  console.debug('useUniversalSwitchChain:', {
    isDynamicWallet,
    primaryWallet: primaryWallet?.key,
  });

  const switchChain = useCallback(
    async (chainId: number) => {
      if (isDynamicWallet) {
        return dynamicSwitchChain.switchChain(chainId);
      } else {
        return eip6963SwitchChain.switchChain(chainId);
      }
    },
    [isDynamicWallet, dynamicSwitchChain, eip6963SwitchChain]
  );

  return { switchChain };
};
