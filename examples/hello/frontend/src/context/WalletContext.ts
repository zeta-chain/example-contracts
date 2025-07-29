import { createContext } from 'react';

import type { EIP6963ProviderDetail } from '../types/wallet';

interface WalletContextType {
  providers: EIP6963ProviderDetail[];
  selectedProvider: EIP6963ProviderDetail | null;
  decimalChainId: number | null;
  connecting: boolean;
  reconnecting: boolean;
  isConnected: boolean;
  isSupportedChain: boolean;
  error: string | null;
  connectWallet: (provider: EIP6963ProviderDetail) => Promise<{
    success: boolean;
    account?: string | null;
    error?: string;
  }>;
  disconnectWallet: () => void;
  account: string | null;
}

export const WalletContext = createContext<WalletContextType>({
  providers: [],
  selectedProvider: null,
  decimalChainId: null,
  connecting: false,
  reconnecting: false,
  isConnected: false,
  isSupportedChain: false,
  error: null,
  connectWallet: async () => ({ success: false }),
  disconnectWallet: () => {},
  account: null,
});
