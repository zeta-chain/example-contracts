import './ConfirmedContent.css';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import { Button } from './components/Button';
import { IconReceived, IconSpinner } from './components/icons';
import {
  type SupportedChain,
  ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL,
} from './constants/chains';
import { type CrossChainTxResponse } from './types/cctx';

const CCTX_POLLING_URL =
  'https://zetachain-athens.blockpi.network/lcd/v1/public/zeta-chain/crosschain/inboundHashToCctxData';

interface ConfirmedContentProps {
  supportedChain: SupportedChain | undefined;
  connectedChainTxHash: string;
  handleSendAnotherMessage: () => void;
  stringValue: string;
}

const MAX_STRING_LENGTH = 20;

export function ConfirmedContent({
  supportedChain,
  connectedChainTxHash,
  handleSendAnotherMessage,
  stringValue,
}: ConfirmedContentProps) {
  const [zetachainTxHash, setZetachainTxHash] = useState<string | null>(null);
  const renderString = useMemo(() => {
    if (stringValue.length > MAX_STRING_LENGTH) {
      return stringValue.slice(0, MAX_STRING_LENGTH) + '...';
    }
    return stringValue;
  }, [stringValue]);

  // Poll for the ZetaChain transaction status every 15 seconds
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
          const txHash = data.CrossChainTxs?.[0]?.outbound_params?.[0]?.hash;
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
      <h2 className="confirmed-content-title">
        "{renderString}" {!zetachainTxHash ? 'in Transit' : 'Received'}
      </h2>
      <div className="confirmed-content-links-container">
        {supportedChain && (
          <div className="confirmed-content-link-chain">
            {!connectedChainTxHash && <IconSpinner />}
            <a
              href={`${supportedChain.explorerUrl}${connectedChainTxHash}`}
              target="_blank"
              rel="noreferrer noopener"
              className={clsx('confirmed-content-link', {
                'confirmed-content-link-enabled': connectedChainTxHash,
                'confirmed-content-link-disabled': !connectedChainTxHash,
              })}
            >
              View on {supportedChain.name}
            </a>
          </div>
        )}
        {connectedChainTxHash && (
          <div className="confirmed-content-link-chain">
            {!zetachainTxHash && <IconSpinner />}
            <a
              href={`${ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL}${zetachainTxHash}`}
              target="_blank"
              rel="noreferrer noopener"
              className={clsx('confirmed-content-link', {
                'confirmed-content-link-enabled': zetachainTxHash,
                'confirmed-content-link-disabled': !zetachainTxHash,
              })}
            >
              View on ZetaChain
            </a>
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="thin"
        disabled={!connectedChainTxHash || !zetachainTxHash}
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
