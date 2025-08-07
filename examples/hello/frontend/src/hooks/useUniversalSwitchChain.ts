import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useCallback } from 'react';

import { USE_DYNAMIC_WALLET } from '../constants/wallets';
import { useDynamicSwitchChain } from './useDynamicSwitchChain';
import { useSwitchChain } from './useSwitchChain';

export const useUniversalSwitchChain = () => {
  // Use Dynamic's official context
  const { primaryWallet } = useDynamicContext();
  const eip6963SwitchChain = useSwitchChain();
  const dynamicSwitchChain = useDynamicSwitchChain();

  console.debug('useUniversalSwitchChain:', {
    primaryWallet: primaryWallet?.key,
  });

  const switchChain = useCallback(
    async (chainId: number) => {
      if (USE_DYNAMIC_WALLET) {
        return dynamicSwitchChain.switchChain(chainId);
      } else {
        return eip6963SwitchChain.switchChain(chainId);
      }
    },
    [dynamicSwitchChain, eip6963SwitchChain]
  );

  return { switchChain };
};
