import './ConnectedContent.css';

import { NetworkSelector } from './components/NetworkSelector';
import type { SupportedChain } from './constants/chains';
import { Footer } from './Footer';
import { useUniversalSwitchChain } from './hooks/useUniversalSwitchChain';
import { MessageFlowCard } from './MessageFlowCard';
import type { EIP6963ProviderDetail } from './types/wallet';

interface ConnectedContentProps {
  selectedProvider: EIP6963ProviderDetail | null;
  supportedChain: SupportedChain | undefined;
}

export function ConnectedContent({
  selectedProvider,
  supportedChain,
}: ConnectedContentProps) {
  const { switchChain } = useUniversalSwitchChain();

  const handleNetworkSelect = (chain: SupportedChain) => {
    switchChain(chain.chainId);
  };

  return (
    <div className="main-container">
      <div className="content-container">
        <div className="content-container-inner">
          <div className="content-container-inner-header">
            <h1>Say Hello from</h1>
            <NetworkSelector
              selectedChain={supportedChain}
              onNetworkSelect={handleNetworkSelect}
            />
          </div>
          <p className="content-container-inner-description">
            Make a cross-chain call with a message from{' '}
            {supportedChain?.name || 'a supported network'} to a universal
            contract on ZetaChain that emits a{' '}
            <span className="highlight">HelloEvent</span>.
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
