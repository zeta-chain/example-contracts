import { useCallback, useEffect, useMemo, useState } from 'react';

import { useWalletEvents } from './useWalletEvents';
import type { EIP6963ProviderDetail } from '../types/wallet';
import { SUPPORTED_CHAIN_IDS } from '../constants/chains';

export const useWalletState = (provider: EIP6963ProviderDetail | null) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  const decimalChainId = useMemo(() => {
    if (!chainId) return null;
    return Number(chainId);
  }, [chainId]);

  const isSupportedChain = useMemo(() => {
    if (decimalChainId === null) return false;
    return SUPPORTED_CHAIN_IDS.includes(decimalChainId);
  }, [decimalChainId]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
    } else {
      setAccount(accounts[0]);
    }
  }, []);

  const handleChainChanged = useCallback((newChainId: string) => {
    setChainId(newChainId);
  }, []);

  useWalletEvents(provider, {
    onAccountsChanged: handleAccountsChanged,
    onChainChanged: handleChainChanged,
  });

  useEffect(() => {
    if (!provider) {
      setAccount(null);
      setChainId(null);
      return;
    }

    const initializeWalletState = async () => {
      try {
        const accounts = (await provider.provider.request({
          method: 'eth_accounts',
        })) as string[];

        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
        }

        const currentChainId = (await provider.provider.request({
          method: 'eth_chainId',
        })) as string;

        setChainId(currentChainId);
      } catch (error) {
        console.error('Error initializing wallet state:', error);
      }
    };

    initializeWalletState();
  }, [provider]);

  return {
    account,
    chainId,
    decimalChainId,
    isSupportedChain,
  };
}; 