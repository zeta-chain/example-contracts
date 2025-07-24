import './ConnectedContent.css';

import { useState } from 'react';

import { NetworkSelector } from './components/NetworkSelector';
import type { SupportedChain } from './constants/chains';
import { Footer } from './Footer';
import { MessageFlowCard } from './MessageFlowCard';
import type { EIP6963ProviderDetail } from './types/wallet';

interface ConnectedContentProps {
  selectedProvider: EIP6963ProviderDetail;
  supportedChain: SupportedChain | undefined;
}

export function ConnectedContent({
  selectedProvider,
  supportedChain,
}: ConnectedContentProps) {
  const [selectedTargetChain, setSelectedTargetChain] = useState<
    SupportedChain | undefined
  >(supportedChain);

  if (!supportedChain) {
    return <div>Unsupported network</div>;
  }

  const handleNetworkSelect = (chain: SupportedChain) => {
    setSelectedTargetChain(chain);
  };

  return (
    <div className="main-container">
      <div className="content-container">
        <div className="content-container-inner">
          <h1>Say Hello on</h1>
          <NetworkSelector
            selectedChain={selectedTargetChain}
            onNetworkSelect={handleNetworkSelect}
          />
          <p>
            Emit a cross-chain <span className="highlight">HelloEvent</span>{' '}
            event on ZetaChain testnet through the Universal Hello Contract.
          </p>
        </div>
        <MessageFlowCard
          selectedProvider={selectedProvider}
          supportedChain={supportedChain}
        />
      </div>
      <Footer />
    </div>
  );
}
