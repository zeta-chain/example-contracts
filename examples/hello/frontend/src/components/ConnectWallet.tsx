import './ConnectWallet.css';

import { useState } from 'react';

import { useWallet } from '../hooks/useWallet';
import type { EIP6963ProviderDetail } from '../types/wallet';
import { Button } from './Button';
import { IconWallet } from './icons';
import { WalletSelectionModal } from './WalletSelectionModal';

export const ConnectWallet = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { providers, connectWallet, connecting } = useWallet();

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
    <>
      <Button
        icon={<IconWallet />}
        className="header-connect-wallet-button"
        onClick={handleConnectClick}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      <WalletSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        providers={providers}
        onConnect={handleSelectProvider}
      />
    </>
  );
};
