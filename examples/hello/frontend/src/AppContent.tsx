import './AppContent.css';

import { evmCall } from '@zetachain/toolkit/chains/evm';
import { ethers, ZeroAddress } from 'ethers';
import { useMemo } from 'react';

import { DisconnectedContent } from './DisconnectedContent';
import { useWallet } from './hooks/useWallet';

export function AppContent() {
  const {
    isConnected,
    account,
    disconnectWallet,
    error,
    selectedProvider,
    isSupportedChain,
    decimalChainId,
  } = useWallet();

  const shouldDisplayUnsupportedChainWarning = useMemo(() => {
    return isConnected && !isSupportedChain && decimalChainId !== null;
  }, [isConnected, isSupportedChain, decimalChainId]);

  if (!isConnected) {
    return <DisconnectedContent />;
  }

  return (
    <div>
      <h1>EVM Wallet Connection</h1>
      <div>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {shouldDisplayUnsupportedChainWarning && (
          <p style={{ color: 'red' }}>Unsupported Chain Id: {decimalChainId}</p>
        )}
        {isConnected && account && selectedProvider ? (
          <div>
            <p>Connected Account: {account}</p>
            {!shouldDisplayUnsupportedChainWarning && (
              <button
                onClick={async () => {
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
                    values: ['hello'],
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

                  console.debug('result', result);
                }}
              >
                Call
              </button>
            )}
            <button onClick={disconnectWallet}>Disconnect</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// yarn zetachain evm call \
//   --receiver 0x61a184EB30D29eD0395d1ADF38CC7d2F966c4A82 \
//   --chain-id 84532 \
//   --types "string" \
//   --values "hello" \
//   --call-on-revert \
//   --on-revert-gas-limit 1000000 \
//   --revert-address 0x0000000000000000000000000000000000000000 \
//   --revert-message "" \
//   --abort-address 0x0000000000000000000000000000000000000000 \
//   --gas-limit 1000000 \
//   --name "alice"
// npx zetachain evm call \
//   --receiver 0x61a184EB30D29eD0395d1ADF38CC7d2F966c4A82 \
//   --chain-id 84532 \
//   --types "string" \
//   --values "hello" \
//   --on-revert-gas-limit 1000000 \
//   --revert-address 0x0000000000000000000000000000000000000000 \
//   --revert-message "" \
//   --abort-address 0x0000000000000000000000000000000000000000 \
//   --gas-limit 1000000 \
//   --name "alice"
