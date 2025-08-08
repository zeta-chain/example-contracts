import { useCallback } from 'react';

import { USE_DYNAMIC_WALLET } from '../constants/wallets';
import { useDynamicSwitchChain } from './useDynamicSwitchChain';
import { useEip6963SwitchChain } from './useEip6963SwitchChain';

export const useSwitchChain = () => {
  const eip6963SwitchChain = useEip6963SwitchChain();
  const dynamicSwitchChain = useDynamicSwitchChain();

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
