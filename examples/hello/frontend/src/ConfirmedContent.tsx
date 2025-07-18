import './ConfirmedContent.css';

import { useEffect, useMemo, useState } from 'react';

import { IconExternalLink } from './components/IconExternalLink';
import {
  type SupportedChain,
  ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL,
} from './constants/chains';
import {
  type CrosschainCctxStatus,
  crosschainCctxStatus,
  type CrossChainTxResponse,
} from './types/cctx';
import type { EIP6963ProviderDetail } from './types/wallet';
import { truncateAddress } from './utils/truncate';

const CCTX_POLLING_URL =
  'https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/inboundHashToCctxData';

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
  const [zetachainTxHash, setZetachainTxHash] = useState<string | null>(null);
  const [zetachainTxStatus, setZetachainTxStatus] =
    useState<CrosschainCctxStatus | null>(null);

  const zetachainTxIcon = useMemo(() => {
    switch (zetachainTxStatus) {
      case crosschainCctxStatus.OutboundMined:
        return '✅';
      case crosschainCctxStatus.Aborted:
      case crosschainCctxStatus.Reverted:
        return '❌';
      default:
        return '⏳';
    }
  }, [zetachainTxStatus]);

  // Poll for the ZetaChain transaction status every 10 seconds
  useEffect(() => {
    if (!connectedChainTxHash || zetachainTxHash) {
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch(
          `${CCTX_POLLING_URL}/${connectedChainTxHash}`
        );
        if (response.ok) {
          const data = (await response.json()) as CrossChainTxResponse;
          const txHash = data.CrossChainTxs[0].outbound_params[0].hash;
          if (txHash) {
            setZetachainTxHash(txHash);
            setZetachainTxStatus(
              data.CrossChainTxs[0].cctx_status.status as CrosschainCctxStatus
            );
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
    const intervalId = setInterval(poll, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [connectedChainTxHash, zetachainTxHash]);

  return (
    <div className="main-container">
      <h1>{zetachainTxHash ? 'Hello tx arrived!' : 'Hello in transit...'}</h1>
      <div className="transaction-hash-container">
        <div>
          <span className="transaction-hash-status">
            {isConnectedChainTxSuccessful ? '✅' : '❌'}
          </span>
          <p>{supportedChain.name} Transaction: </p>
        </div>
        <div>
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
      </div>
      <div className="transaction-hash-container">
        {zetachainTxHash ? (
          <>
            <div>
              <span className="transaction-hash-status">{zetachainTxIcon}</span>
              <p>ZetaChain Transaction: </p>
            </div>
            <div>
              <a
                className="transaction-hash-link"
                href={`${ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL}/${zetachainTxHash}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {truncateAddress(zetachainTxHash)}
                <IconExternalLink size={20} />
              </a>
            </div>
          </>
        ) : (
          <p>Waiting for ZetaChain transaction...</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          handleSendAnotherMessage();
          setZetachainTxHash(null);
          setZetachainTxStatus(null);
        }}
      >
        Send another message
      </button>
    </div>
  );
}
