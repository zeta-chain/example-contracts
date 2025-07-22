import { useEffect } from 'react';
import type { EIP6963ProviderDetail } from '../types/wallet';

interface WalletEventHandlers {
  onAccountsChanged: (accounts: string[]) => void;
  onChainChanged: (chainId: string) => void;
}

export const useWalletEvents = (
  provider: EIP6963ProviderDetail | null,
  { onAccountsChanged, onChainChanged }: WalletEventHandlers
) => {
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts: unknown) => {
      onAccountsChanged(accounts as string[]);
    };

    const handleChainChanged = (chainId: unknown) => {
      onChainChanged(chainId as string);
    };

    provider.provider.on('accountsChanged', handleAccountsChanged);
    provider.provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.provider.removeListener(
        'accountsChanged',
        handleAccountsChanged
      );
      provider.provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider, onAccountsChanged, onChainChanged]);
}; 