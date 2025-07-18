import './ConnectedContent.css';

import { evmCall } from '@zetachain/toolkit/chains/evm';
import { ethers, ZeroAddress } from 'ethers';
import { useState } from 'react';

import { ConfirmedContent } from './ConfirmedContent';
import type { SupportedChain } from './constants/chains';
import type { EIP6963ProviderDetail } from './types/wallet';

interface ConnectedContentProps {
  selectedProvider: EIP6963ProviderDetail;
  supportedChain: SupportedChain;
}

export function ConnectedContent({
  selectedProvider,
  supportedChain,
}: ConnectedContentProps) {
  const MAX_STRING_LENGTH = 20;
  const [stringValue, setStringValue] = useState('');
  const [connectedChainTxHash, setConnectedChainTxHash] = useState(
    '0xf708dd607e0a4663e1f2d0b13c97141de8c4e6ed698004c94f4851d5c2f19b5d'
  );
  const [connectedChainTxResult, setConnectedChainTxResult] = useState<
    number | null
  >(null);

  const handleEvmCall = async () => {
    const ethersProvider = new ethers.BrowserProvider(
      selectedProvider.provider
    );
    const signer = (await ethersProvider.getSigner()) as ethers.AbstractSigner;

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signer: signer as any,
      txOptions: {
        gasLimit: 1000000,
      },
    };

    const result = await evmCall(evmCallParams, evmCallOptions);
    const receipt = await result.wait();

    setConnectedChainTxHash(result.hash);
    setConnectedChainTxResult(receipt?.status ?? null);
  };

  if (connectedChainTxHash) {
    return (
      <ConfirmedContent
        selectedProvider={selectedProvider}
        supportedChain={supportedChain}
        connectedChainTxHash={connectedChainTxHash}
        connectedChainTxResult={connectedChainTxResult}
        handleSendAnotherMessage={() => {
          setConnectedChainTxHash('');
          setStringValue('');
          setConnectedChainTxResult(null);
        }}
      />
    );
  }

  return (
    <div className="main-container">
      <h1>Ready to say "Hello" on: {supportedChain.name}</h1>
      <p>
        This transaction will emit a cross-chain "HelloEvent" event on ZetaChain
        testnet's Universal Hello contract.
      </p>
      <div className="input-container">
        <div className="input-container-inner">
          <input
            name="message-input"
            className="call-input"
            type="text"
            placeholder="Enter your message"
            value={stringValue}
            onChange={(e) => {
              if (e.target.value.length <= MAX_STRING_LENGTH) {
                setStringValue(e.target.value);
              }
            }}
          />
          <button
            type="button"
            className="call-button"
            onClick={handleEvmCall}
            disabled={!stringValue.length}
          >
            Evm Call 🚀
          </button>
        </div>
        <span className="input-counter">
          {stringValue.length} / {MAX_STRING_LENGTH} characters
        </span>
      </div>
    </div>
  );
}
