import './ConfirmedContent.css';

import { useEffect, useState } from 'react';

import { Button } from './components/Button';
import { IconReceived } from './components/icons';
import {
  type SupportedChain,
  ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL,
} from './constants/chains';
import { type CrossChainTxResponse } from './types/cctx';
import type { EIP6963ProviderDetail } from './types/wallet';

const CCTX_POLLING_URL =
  'https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/inboundHashToCctxData';

interface ConfirmedContentProps {
  selectedProvider: EIP6963ProviderDetail;
  supportedChain: SupportedChain | undefined;
  connectedChainTxHash: string;
  handleSendAnotherMessage: () => void;
  stringValue: string;
}

export function ConfirmedContent({
  supportedChain,
  connectedChainTxHash,
  handleSendAnotherMessage,
  stringValue,
}: ConfirmedContentProps) {
  const [zetachainTxHash, setZetachainTxHash] = useState<string | null>(null);
  const renderString = stringValue.slice(0, 24);

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
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
    const intervalId = setInterval(poll, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [connectedChainTxHash, zetachainTxHash]);

  return (
    <div className="confirmed-content">
      <IconReceived />
      <h2 className="confirmed-content-title">"{renderString}" Received</h2>
      <div className="confirmed-content-links-container">
        <a
          href={`${ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL}/${zetachainTxHash}`}
          target="_blank"
          rel="noreferrer noopener"
          className="confirmed-content-link"
        >
          View on ZetaChain
        </a>
        {supportedChain && (
          <a
            href={`${supportedChain.explorerUrl}${connectedChainTxHash}`}
            target="_blank"
            rel="noreferrer noopener"
            className="confirmed-content-link"
          >
            View on {supportedChain.name}
          </a>
        )}
      </div>
      <Button
        type="button"
        variant="thin"
        onClick={() => {
          handleSendAnotherMessage();
          setZetachainTxHash(null);
        }}
      >
        Send Another
      </Button>
    </div>
  );
}
