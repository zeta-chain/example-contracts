import { useCallback } from 'react';

import { useDynamicSwitchChain } from './useDynamicSwitchChain';
import { useDynamicWallet } from './useDynamicWallet';
import { useSwitchChain } from './useSwitchChain';

export const useUniversalSwitchChain = () => {
  // const { selectedProvider } = useWallet();
  const { selectedProvider } = useDynamicWallet();
  const eip6963SwitchChain = useSwitchChain();
  const dynamicSwitchChain = useDynamicSwitchChain();

  console.debug('selectedProvider', selectedProvider);

  // Detect if we're using Dynamic wallet by checking the provider info
  const isDynamicWallet =
    selectedProvider?.info?.rdns === 'com.zetachain.wallet';

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
