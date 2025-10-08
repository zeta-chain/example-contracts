import { evmCall } from '@zetachain/toolkit/chains/evm';
import { solanaCall } from '@zetachain/toolkit/chains/solana';
import { type PrimaryWallet } from '@zetachain/wallet';
import { getSolanaWalletAdapter } from '@zetachain/wallet/solana';
import { ZeroAddress } from 'ethers';
import { useCallback } from 'react';

import type { SupportedChain } from '../constants/chains';
import type { EIP6963ProviderDetail } from '../types/wallet';
import { getSignerAndProvider } from '../utils/ethersHelpers';

interface CallParams {
  receiver: string;
  types: string[];
  values: (string | bigint | boolean)[];
  revertOptions: {
    callOnRevert: boolean;
    revertAddress?: string;
    revertMessage: string;
    abortAddress?: string;
    onRevertGasLimit?: string | number | bigint;
  };
}

interface UseHandleCallParams {
  primaryWallet?: PrimaryWallet | null;
  selectedProvider: EIP6963ProviderDetail | null;
  supportedChain: SupportedChain | undefined;
  receiver: string;
  message: string;
  account?: string | null;
  // Handler callbacks for state management
  onSigningStart?: () => void;
  onTransactionSubmitted?: () => void;
  onTransactionConfirmed?: (txHash: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

interface UseHandleCallReturn {
  handleCall: () => Promise<void>;
}

/**
 * Handles EVM-specific call logic
 */
async function handleEvmCall(
  callParams: CallParams,
  primaryWallet: PrimaryWallet | null,
  selectedProvider: EIP6963ProviderDetail | null,
  callbacks: {
    onSigningStart?: UseHandleCallParams['onSigningStart'];
    onTransactionSubmitted?: UseHandleCallParams['onTransactionSubmitted'];
    onTransactionConfirmed?: UseHandleCallParams['onTransactionConfirmed'];
  }
): Promise<void> {
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

  callbacks.onSigningStart?.();

  const result = await evmCall(callParams, evmCallOptions);

  callbacks.onTransactionSubmitted?.();

  await result.wait();

  callbacks.onTransactionConfirmed?.(result.hash);
}

/**
 * Handles Solana-specific call logic
 */
async function handleSolanaCall(
  callParams: CallParams,
  primaryWallet: PrimaryWallet,
  callbacks: {
    onTransactionSubmitted?: UseHandleCallParams['onTransactionSubmitted'];
    onTransactionConfirmed?: UseHandleCallParams['onTransactionConfirmed'];
  }
): Promise<void> {
  const walletAdapter = await getSolanaWalletAdapter(primaryWallet);

  const solanaCallOptions = {
    signer: walletAdapter,
    chainId: '901',
  };

  const result = await solanaCall(callParams, solanaCallOptions);

  callbacks.onTransactionSubmitted?.();

  callbacks.onTransactionConfirmed?.(result);
}

/**
 * Custom hook for handling cross-chain calls with proper type safety
 * and separation of concerns between chain-specific logic and UI state management.
 */
export function useHandleCall({
  primaryWallet,
  selectedProvider,
  supportedChain,
  receiver,
  message,
  account,
  onSigningStart,
  onTransactionSubmitted,
  onTransactionConfirmed,
  onError,
  onComplete,
}: UseHandleCallParams): UseHandleCallReturn {
  const handleCall = useCallback(async () => {
    const walletType = primaryWallet?.chain || 'EVM'; // Default to 'EVM' for EIP6963 route
    const walletAddress = primaryWallet?.address || account;

    if (!walletAddress) {
      const error = new Error('No wallet address available');
      onError?.(error);
      return;
    }

    if (!supportedChain) {
      const error = new Error('Unsupported chain');
      onError?.(error);
      return;
    }

    const callParams: CallParams = {
      receiver,
      types: ['string'],
      values: [message],
      revertOptions: {
        callOnRevert: false,
        revertAddress: walletAddress,
        revertMessage: '',
        abortAddress: ZeroAddress,
        onRevertGasLimit: 1000000,
      },
    };

    try {
      const callbacks = {
        onSigningStart,
        onTransactionSubmitted,
        onTransactionConfirmed,
      };

      if (walletType === 'EVM') {
        await handleEvmCall(
          callParams,
          primaryWallet || null,
          selectedProvider,
          callbacks
        );
      } else if (walletType === 'SOL') {
        if (!primaryWallet) {
          throw new Error('Solana transactions require primaryWallet');
        }
        await handleSolanaCall(callParams, primaryWallet, callbacks);
      } else {
        throw new Error(`Unsupported chain: ${walletType}`);
      }
    } catch (error) {
      console.error('Transaction error:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      onComplete?.();
    }
  }, [
    primaryWallet,
    selectedProvider,
    supportedChain,
    receiver,
    message,
    account,
    onSigningStart,
    onTransactionSubmitted,
    onTransactionConfirmed,
    onError,
    onComplete,
  ]);

  return {
    handleCall,
  };
}
