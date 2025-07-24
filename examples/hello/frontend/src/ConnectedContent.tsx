import './ConnectedContent.css';

import { NetworkSelector } from './components/NetworkSelector';
import type { SupportedChain } from './constants/chains';
import { Footer } from './Footer';
import { useSwitchChain } from './hooks/useSwitchChain';
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
  const { switchChain } = useSwitchChain();

  const handleNetworkSelect = (chain: SupportedChain) => {
    switchChain(chain.chainId);
  };

  return (
    <div className="main-container">
      <div className="content-container">
        <div className="content-container-inner">
          <div className="content-container-inner-header">
            <h1>Say Hello on</h1>
            <NetworkSelector
              selectedChain={supportedChain}
              onNetworkSelect={handleNetworkSelect}
            />
          </div>
          <p className="content-container-inner-description">
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
