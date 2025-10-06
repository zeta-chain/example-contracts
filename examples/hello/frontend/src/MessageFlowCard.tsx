import './MessageFlowCard.css';

import { evmCall } from '@zetachain/toolkit/chains/evm';
import { solanaCall } from '@zetachain/toolkit/chains/solana';
import { isSolanaWallet, type PrimaryWallet } from '@zetachain/wallet';
import { ZeroAddress } from 'ethers';
import { useEffect, useRef, useState } from 'react';

import { Button } from './components/Button';
import { IconApprove, IconEnvelope, IconSendTitle } from './components/icons';
import { ConfirmedContent } from './ConfirmedContent';
import type { SupportedChain } from './constants/chains';
import { HELLO_UNIVERSAL_CONTRACT_ADDRESS } from './constants/contracts';
import type { EIP6963ProviderDetail } from './types/wallet';
import { getSignerAndProvider } from './utils/ethersHelpers';
import { formatNumberWithLocale } from './utils/formatNumber';

interface MessageFlowCardProps {
  selectedProvider: EIP6963ProviderDetail | null;
  supportedChain: SupportedChain | undefined;
  primaryWallet?: PrimaryWallet | null; // Dynamic wallet from context
}

export function MessageFlowCard({
  selectedProvider,
  supportedChain,
  primaryWallet = null,
}: MessageFlowCardProps) {
  const MAX_STRING_LENGTH = 2000;
  const [isUserSigningTx, setIsUserSigningTx] = useState(false);
  const [isTxReceiptLoading, setIsTxReceiptLoading] = useState(false);
  const [stringValue, setStringValue] = useState('');
  const [connectedChainTxHash, setConnectedChainTxHash] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getStringByteLength = (string: string) => {
    return new TextEncoder().encode(string).length;
  };

  const handleCall = async () => {
    try {
      if (!primaryWallet) {
        throw new Error('No primary wallet');
      }

      const callParams = {
        receiver: HELLO_UNIVERSAL_CONTRACT_ADDRESS,
        types: ['string'],
        values: [stringValue],
        revertOptions: {
          callOnRevert: false,
          revertAddress: primaryWallet.address,
          revertMessage: '',
          abortAddress: ZeroAddress,
          onRevertGasLimit: 1000000,
        },
      };

      if (primaryWallet?.chain === 'EVM') {
        const signerAndProvider = await getSignerAndProvider({
          selectedProvider,
          primaryWallet,
        });

        if (!signerAndProvider) {
          throw new Error('Failed to get signer');
        }

        const { signer } = signerAndProvider;

        const evmCallOptions = {
          signer,
          txOptions: {
            gasLimit: 1000000,
          },
        };

        setIsUserSigningTx(true);

        const result = await evmCall(callParams, evmCallOptions);

        setIsTxReceiptLoading(true);

        await result.wait();

        setConnectedChainTxHash(result.hash);
      } else if (
        primaryWallet?.chain === 'SOL' &&
        isSolanaWallet(primaryWallet)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signer = await (primaryWallet as any).getSigner();

        console.debug('SOL_SIGNER', {
          signer,
          publicKey: signer.publicKey,
        });

        const solanaCallOptions = {
          signer,
          chainId: '901',
        };

        const result = await solanaCall(callParams, solanaCallOptions);

        setIsTxReceiptLoading(true);

        setConnectedChainTxHash(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUserSigningTx(false);
      setIsTxReceiptLoading(false);
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [stringValue]);

  if (connectedChainTxHash || isTxReceiptLoading) {
    return (
      <ConfirmedContent
        supportedChain={supportedChain}
        connectedChainTxHash={connectedChainTxHash}
        stringValue={stringValue}
        handleSendAnotherMessage={() => {
          setConnectedChainTxHash('');
          setStringValue('');
        }}
      />
    );
  }

  if (isUserSigningTx) {
    return (
      <div className="approve-container">
        <IconApprove />
        <div className="approve-content">
          <h1 className="approve-title">Approve from Wallet</h1>
          <p className="approve-description">
            Awaiting approval via your wallet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-flow-container">
      <div className="message-flow-title">
        <IconSendTitle />
        <span className="message-flow-title-text">Message to Send</span>
      </div>
      <div className="message-input-container">
        <textarea
          ref={textareaRef}
          name="message-input"
          className="message-input"
          placeholder="Enter your message"
          value={stringValue}
          rows={1}
          onChange={(e) => {
            if (getStringByteLength(e.target.value) <= MAX_STRING_LENGTH) {
              setStringValue(e.target.value);
            }
          }}
        />
      </div>
      <div className="message-separator" />
      {!supportedChain && (
        <span className="message-unsupported-network">
          Select a network to send a message
        </span>
      )}
      <div className="message-input-footer">
        <div className="message-input-length-container">
          <div className="message-input-length-container-inner">
            <span className="message-input-length">
              {formatNumberWithLocale(getStringByteLength(stringValue))}{' '}
            </span>
            <span className="message-input-length-max">
              / {formatNumberWithLocale(MAX_STRING_LENGTH)}
            </span>
          </div>
          <span className="message-input-length-characters">Characters</span>
        </div>
        <div>
          <Button
            type="button"
            onClick={handleCall}
            disabled={
              !stringValue.length ||
              !supportedChain ||
              getStringByteLength(stringValue) > MAX_STRING_LENGTH
            }
            icon={<IconEnvelope />}
          >
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
}
