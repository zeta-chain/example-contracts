import { useEffect, useState } from 'react';

import { ConnectedContent } from './ConnectedContent';
import { SUPPORTED_CHAINS, type SupportedChain } from './constants/chains';
import { DisconnectedContent } from './DisconnectedContent';
import { useEip6963Wallet } from './hooks/useEip6963Wallet';

export function Eip6963AppContent() {
  const { selectedProvider, decimalChainId, account } = useEip6963Wallet();

  // Find the EVM chain from wallet
  const evmChain = SUPPORTED_CHAINS.find(
    (chain) => chain.chainId === decimalChainId
  );

  // Track selected chain separately to support non-EVM chains (SOL, BTC)
  const [selectedChain, setSelectedChain] = useState<
    SupportedChain | undefined
  >(evmChain);

  // Sync with EVM wallet changes (when user switches chains in MetaMask, etc.)
  useEffect(() => {
    if (evmChain && evmChain.chainType === 'EVM') {
      setSelectedChain(evmChain);
    }
  }, [evmChain]);

  const isDisconnected = !selectedProvider;

  if (isDisconnected) {
    return <DisconnectedContent />;
  }

  return (
    <ConnectedContent
      selectedProvider={selectedProvider}
      supportedChain={selectedChain}
      onChainSelect={setSelectedChain}
      account={account}
    />
  );
}
