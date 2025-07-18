import './ConnectedContent.css';

import { evmCall } from '@zetachain/toolkit/chains/evm';
import { ethers, ZeroAddress } from 'ethers';
import { useState } from 'react';

import type { SupportedChain } from './constants/chains';
import type { EIP6963ProviderDetail } from './types/wallet';
import { truncateAddress } from './utils/truncate';

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
  const [connectedChainHash, setConnectedChainHash] = useState(
    '0xf0f0a35525298018c10a84f9af8003647881ead90e9e336f05ee2aca1f17b9a8'
  );

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

    setConnectedChainHash(result.hash);
  };

  if (connectedChainHash) {
    return (
      <div className="main-container">
        <h1>
          Transaction Hash: {truncateAddress(connectedChainHash)}
          <a
            href={`${supportedChain.explorerUrl}${connectedChainHash}`}
            target="_blank"
          >
            {supportedChain.name} explorer.
          </a>
        </h1>
      </div>
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
