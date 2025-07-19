import { useState } from 'react';

import { ChainSelectionModal } from './components/ChainSelectionModal';
import type { SupportedChain } from './constants/chains';
import { useSwitchChain } from './hooks/useSwitchChain';

interface UnsupportedNetworkContentProps {
  decimalChainId: number;
}

export function UnsupportedNetworkContent({
  decimalChainId,
}: UnsupportedNetworkContentProps) {
  const [isChainSelectionModalOpen, setIsChainSelectionModalOpen] =
    useState(false);

  const { switchChain } = useSwitchChain();

  const handleSwitchChain = (chain: SupportedChain) => {
    switchChain(chain.chainId);
    setIsChainSelectionModalOpen(false);
  };

  return (
    <div className="main-container">
      <h1>Unsupported Network</h1>
      <p>
        You are connected to an unsupported network with Chain Id{' '}
        {decimalChainId}.
      </p>
      <p>Please switch to a supported network to continue.</p>
      <button
        onClick={() => {
          setIsChainSelectionModalOpen(true);
        }}
      >
        Switch to a supported network
      </button>
      <ChainSelectionModal
        isOpen={isChainSelectionModalOpen}
        onClose={() => setIsChainSelectionModalOpen(false)}
        onSwitchChain={handleSwitchChain}
      />
    </div>
  );
}
