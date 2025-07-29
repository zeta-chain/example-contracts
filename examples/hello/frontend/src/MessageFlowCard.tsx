import './MessageFlowCard.css';

import { evmCall } from '@zetachain/toolkit/chains/evm';
import { ethers, ZeroAddress } from 'ethers';
import { useEffect, useRef, useState } from 'react';

import { Button } from './components/Button';
import { IconApprove, IconEnvelope, IconSendTitle } from './components/icons';
import { ConfirmedContent } from './ConfirmedContent';
import type { SupportedChain } from './constants/chains';
import type { EIP6963ProviderDetail } from './types/wallet';
import { formatNumberWithLocale } from './utils/formatNumber';

interface MessageFlowCardProps {
  selectedProvider: EIP6963ProviderDetail;
  supportedChain: SupportedChain | undefined;
}

export function MessageFlowCard({
  selectedProvider,
  supportedChain,
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

  const handleEvmCall = async () => {
    try {
      const ethersProvider = new ethers.BrowserProvider(
        selectedProvider.provider
      );
      const signer =
        (await ethersProvider.getSigner()) as ethers.AbstractSigner;

      const helloUniversalContractAddress =
        '0x61a184EB30D29eD0395d1ADF38CC7d2F966c4A82';

      const evmCallParams = {
        receiver: helloUniversalContractAddress,
        types: ['string'],
        values: [stringValue],
        revertOptions: {
          callOnRevert: false,
          revertAddress: ZeroAddress,
          revertMessage: '',
          abortAddress: ZeroAddress,
          onRevertGasLimit: 1000000,
        },
      };

      const evmCallOptions = {
        signer,
        txOptions: {
          gasLimit: 1000000,
        },
      };

      setIsUserSigningTx(true);

      const result = await evmCall(evmCallParams, evmCallOptions);

      setIsTxReceiptLoading(true);

      await result.wait();

      setConnectedChainTxHash(result.hash);
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
            onClick={handleEvmCall}
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
