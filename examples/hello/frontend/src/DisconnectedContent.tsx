import { useState } from 'react';

import { WalletSelectionModal } from './components/WalletSelectionModal';
import { useWallet } from './hooks/useWallet';
import type { EIP6963ProviderDetail } from './types/wallet';

export function DisconnectedContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { providers, connectWallet, error, connecting } = useWallet();

  const handleConnectClick = () => {
    if (providers.length > 0) {
      setIsModalOpen(true);
    } else {
      alert('No wallet providers found. Please install a wallet extension.');
    }
  };

  const handleSelectProvider = (provider: EIP6963ProviderDetail) => {
    connectWallet(provider);
    setIsModalOpen(false);
  };

  return (
    <div className="main-container">
      <h1>Say "Hello" cross-chain!</h1>
      <p>
        Connect your EVM wallet and trigger the Universal Hello contract already
        live on ZetaChain testnet from any of our supported EVM chains.
      </p>
      <div>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        <button onClick={handleConnectClick} disabled={connecting}>
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
      <WalletSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        providers={providers}
        onConnect={handleSelectProvider}
      />
    </div>
  );
}
