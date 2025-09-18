import './ConnectedContent.css';

import { type PrimaryWallet } from '@zetachain/wallet';

import { NetworkSelector } from './components/NetworkSelector';
import type { SupportedChain } from './constants/chains';
import { USE_DYNAMIC_WALLET } from './constants/wallets';
import { Footer } from './Footer';
import { useDynamicSwitchChainHook } from './hooks/useDynamicSwitchChainHook';
import { useSwitchChain } from './hooks/useSwitchChain';
import { MessageFlowCard } from './MessageFlowCard';
import type { EIP6963ProviderDetail } from './types/wallet';

interface ConnectedContentProps {
  selectedProvider: EIP6963ProviderDetail | null;
  supportedChain: SupportedChain | undefined;
  primaryWallet?: PrimaryWallet | null; // Dynamic wallet from context
}

const DynamicConnectedContent = ({
  selectedProvider,
  supportedChain,
  primaryWallet,
}: ConnectedContentProps) => {
  const { switchChain } = useDynamicSwitchChainHook();

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
          primaryWallet={primaryWallet}
        />
      </div>
      <Footer />
    </div>
  );
};

const Eip6963ConnectedContent = ({
  selectedProvider,
  supportedChain,
  primaryWallet,
}: ConnectedContentProps) => {
  const { switchChain } = useSwitchChain();

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
          primaryWallet={primaryWallet}
        />
      </div>
      <Footer />
    </div>
  );
};

export function ConnectedContent({
  selectedProvider,
  supportedChain,
  primaryWallet,
}: ConnectedContentProps) {
  return USE_DYNAMIC_WALLET ? (
    <DynamicConnectedContent
      selectedProvider={selectedProvider}
      supportedChain={supportedChain}
      primaryWallet={primaryWallet}
    />
  ) : (
    <Eip6963ConnectedContent
      selectedProvider={selectedProvider}
      supportedChain={supportedChain}
      primaryWallet={primaryWallet}
    />
  );
}
