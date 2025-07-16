import { useState } from 'react';
import { useWallet } from './hooks/useWallet';
import { WalletSelectionModal } from './components/WalletSelectionModal';
import './App.css';
import type { EIP6963ProviderDetail } from './types/wallet';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    providers,
    isConnected,
    account,
    connectWallet,
    disconnectWallet,
    error,
    connecting,
  } = useWallet();

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
      <h1>EVM Wallet Connection</h1>
      <div className="card">
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {isConnected && account ? (
          <div>
            <p>Connected Account: {account}</p>
            <button onClick={disconnectWallet}>Disconnect</button>
          </div>
        ) : (
          <button onClick={handleConnectClick} disabled={connecting}>
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
      <WalletSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        providers={providers}
        onConnect={handleSelectProvider}
      />
    </>
  );
}

export default App;
