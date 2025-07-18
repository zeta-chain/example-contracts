import { useMemo } from 'react';

import { ConnectedContent } from './ConnectedContent';
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

  const shouldDisplayUnsupportedChainWarning = useMemo(() => {
    return isConnected && !isSupportedChain && decimalChainId !== null;
  }, [isConnected, isSupportedChain, decimalChainId]);

  if (!account || !selectedProvider) {
    return <DisconnectedContent />;
  }

  if (shouldDisplayUnsupportedChainWarning) {
    return (
      <div className="main-container">
        <p style={{ color: 'red' }}>Unsupported Chain Id: {decimalChainId}</p>
      </div>
    );
  }

  return (
    <ConnectedContent account={account} selectedProvider={selectedProvider} />
  );
}
