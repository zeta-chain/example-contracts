import { useCallback } from 'react';

import { useEip6963SwitchChain } from './useEip6963SwitchChain';

// Hook for EIP6963 wallets
export const useSwitchChain = () => {
  const eip6963SwitchChain = useEip6963SwitchChain();

  const switchChain = useCallback(
    async (chainId: number) => {
      return eip6963SwitchChain.switchChain(chainId);
    },
    [eip6963SwitchChain]
  );

  return { switchChain };
};
