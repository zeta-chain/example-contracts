import { useMemo } from 'react';

import { ConnectedContent } from './ConnectedContent';
import { SUPPORTED_CHAINS } from './constants/chains';
import { DisconnectedContent } from './DisconnectedContent';
import { useWallet } from './hooks/useWallet';

export function AppContent() {
  const {
    isConnected,
    account,
    selectedProvider,
    isSupportedChain,
    decimalChainId,
  } = useWallet();

  const supportedChain = SUPPORTED_CHAINS.find(
    (chain) => chain.chainId === decimalChainId
  );

  const shouldDisplayUnsupportedChainWarning = useMemo(() => {
    return isConnected && !isSupportedChain && decimalChainId !== null;
  }, [isConnected, isSupportedChain, decimalChainId]);

  if (!account || !selectedProvider) {
    return <DisconnectedContent />;
  }

  if (shouldDisplayUnsupportedChainWarning || !supportedChain) {
    return (
      <div className="main-container">
        <p style={{ color: 'red' }}>Unsupported Chain Id: {decimalChainId}</p>
      </div>
    );
  }

  return (
    <ConnectedContent
      selectedProvider={selectedProvider}
      supportedChain={supportedChain}
    />
  );
}
