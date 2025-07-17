import './App.css';

import { evmCall } from '@zetachain/toolkit/chains/evm';
import { ethers } from 'ethers';
import { useMemo, useState } from 'react';

import { WalletSelectionModal } from './components/WalletSelectionModal';
import { useWallet } from './hooks/useWallet';
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
    selectedProvider,
    isSupportedChain,
    decimalChainId,
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

  const shouldDisplayUnsupportedChainWarning = useMemo(() => {
    return isConnected && !isSupportedChain && decimalChainId !== null;
  }, [isConnected, isSupportedChain, decimalChainId]);

  return (
    <>
      <h1>EVM Wallet Connection</h1>
      <div className="card">
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {shouldDisplayUnsupportedChainWarning && (
          <p style={{ color: 'red' }}>Unsupported Chain Id: {decimalChainId}</p>
        )}
        {isConnected && account && selectedProvider ? (
          <div>
            <p>Connected Account: {account}</p>
            {!shouldDisplayUnsupportedChainWarning && (
              <button
                onClick={async () => {
                  const ethersProvider = new ethers.BrowserProvider(
                    selectedProvider.provider
                  );
                  const signer =
                    (await ethersProvider.getSigner()) as ethers.AbstractSigner;

                  const result = await evmCall(
                    {
                      receiver: '0xc15725fD586489A23E1D52d43301918420Fb964c',
                      types: ['string'],
                      values: ['hello'],
                      revertOptions: {
                        callOnRevert: false,
                        revertAddress: account,
                        revertMessage: 'Reverted :(',
                        abortAddress: account,
                        onRevertGasLimit: 10000,
                      },
                    },
                    {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      signer: signer as any,
                    }
                  );

                  console.debug('result', result);
                }}
              >
                Call
              </button>
            )}
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
