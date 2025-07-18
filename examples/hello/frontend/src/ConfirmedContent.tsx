import './ConfirmedContent.css';

import { IconExternalLink } from './components/IconExternalLink';
import type { SupportedChain } from './constants/chains';
import type { EIP6963ProviderDetail } from './types/wallet';
import { truncateAddress } from './utils/truncate';

interface ConfirmedContentProps {
  selectedProvider: EIP6963ProviderDetail;
  supportedChain: SupportedChain;
  connectedChainTxHash: string;
  connectedChainTxResult: number | null;
  handleSendAnotherMessage: () => void;
}

export function ConfirmedContent({
  supportedChain,
  connectedChainTxHash,
  connectedChainTxResult,
  handleSendAnotherMessage,
}: ConfirmedContentProps) {
  const isConnectedChainTxSuccessful = connectedChainTxResult === 1;

  return (
    <div className="main-container">
      <h1>Hello in Transit</h1>
      <div className="transaction-hash-container">
        <span className="transaction-hash-status">
          {isConnectedChainTxSuccessful ? '✅' : '❌'}
        </span>
        <p>{supportedChain.name} Transaction Hash: </p>
        <a
          className="transaction-hash-link"
          href={`${supportedChain.explorerUrl}${connectedChainTxHash}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          {truncateAddress(connectedChainTxHash)}
          <IconExternalLink size={20} />
        </a>
      </div>
      <button type="button" onClick={handleSendAnotherMessage}>
        Send another message
      </button>
    </div>
  );
}
