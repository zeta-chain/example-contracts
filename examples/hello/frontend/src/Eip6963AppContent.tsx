import { useEffect, useState } from 'react';

import { ConnectedContent } from './ConnectedContent';
import { SUPPORTED_CHAINS, type SupportedChain } from './constants/chains';
import { DisconnectedContent } from './DisconnectedContent';
import { useEip6963Wallet } from './hooks/useEip6963Wallet';

export function Eip6963AppContent() {
  const { selectedProvider, decimalChainId, account } = useEip6963Wallet();

  const walletChain = SUPPORTED_CHAINS.find(
    (chain) => chain.chainId === decimalChainId
  );

  const [selectedChain, setSelectedChain] = useState<SupportedChain | undefined>(
    walletChain
  );

  // Sync selected chain with wallet chain when wallet changes (for EVM chains)
  useEffect(() => {
    if (walletChain?.chainType === 'EVM') {
      setSelectedChain(walletChain);
    }
  }, [walletChain]);

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
