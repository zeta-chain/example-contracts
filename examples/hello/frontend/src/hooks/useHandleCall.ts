import {
  bitcoinMemoCall,
  finalizeBitcoinMemoCall,
} from '@zetachain/toolkit/chains/bitcoin';
import { evmCall } from '@zetachain/toolkit/chains/evm';
import { solanaCall } from '@zetachain/toolkit/chains/solana';
import { type PrimaryWallet } from '@zetachain/wallet';
import {
  isBitcoinWallet,
  type PrimaryWalletWithBitcoinSigner,
} from '@zetachain/wallet/bitcoin';
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
  chainId: string,
  callbacks: {
    onSigningStart?: UseHandleCallParams['onSigningStart'];
    onTransactionSubmitted?: UseHandleCallParams['onTransactionSubmitted'];
    onTransactionConfirmed?: UseHandleCallParams['onTransactionConfirmed'];
  }
): Promise<void> {
  const walletAdapter = await getSolanaWalletAdapter(primaryWallet);

  const solanaCallOptions = {
    signer: walletAdapter,
    chainId,
  };

  callbacks.onSigningStart?.();

  const result = await solanaCall(callParams, solanaCallOptions);

  callbacks.onTransactionSubmitted?.();

  callbacks.onTransactionConfirmed?.(result);
}

/**
 * Handles Bitcoin-specific call logic using PSBT signing
 */
async function handleBitcoinCall(
  receiver: string,
  message: string,
  primaryWallet: PrimaryWallet,
  gatewayAddress: string,
  callbacks: {
    onSigningStart?: UseHandleCallParams['onSigningStart'];
    onTransactionSubmitted?: UseHandleCallParams['onTransactionSubmitted'];
    onTransactionConfirmed?: UseHandleCallParams['onTransactionConfirmed'];
  }
): Promise<void> {
  if (!primaryWallet || !isBitcoinWallet(primaryWallet)) {
    throw new Error('Wallet does not support Bitcoin');
  }

  const btcWallet = primaryWallet as PrimaryWalletWithBitcoinSigner;

  // Step 1: Build the unsigned PSBT
  // For depositAndCall operations:
  // - Send: depositAmount (2000 sats to mint as ZRC20) + depositFee buffer
  // - depositFee buffer (2x estimated) handles wallet fee rate increases
  // - ZetaChain deducts actual depositFee, remaining becomes ZRC20 deposit
  // - Reasonable network fees (~500-1000 sats at 2-3 sats/vB)

  const psbtInfo = await bitcoinMemoCall({
    userAddress: btcWallet.address,
    fromAddress: btcWallet.address,
    gatewayAddress,
    data: message,
    receiver,
  });

  callbacks.onSigningStart?.();

  // Step 2: Sign the PSBT with the wallet
  const signedPsbtResponse = await btcWallet.signPsbt({
    allowedSighash: [1], // SIGHASH_ALL
    unsignedPsbtBase64: psbtInfo.psbtBase64,
    signature: [
      {
        address: psbtInfo.signingAddress,
        signingIndexes: psbtInfo.signingIndexes,
      },
    ],
  });

  if (!signedPsbtResponse) {
    throw new Error('Failed to sign PSBT - wallet returned undefined');
  }

  console.log('Signed PSBT response:', signedPsbtResponse);

  // Handle different response formats from different wallets
  // - String directly: "cHNidP8B..."
  // - { psbt: string }
  // - { signedPsbt: string } (Phantom format)
  let signedPsbtBase64: string | undefined;

  if (typeof signedPsbtResponse === 'string') {
    signedPsbtBase64 = signedPsbtResponse;
  } else if (signedPsbtResponse && typeof signedPsbtResponse === 'object') {
    // Try different property names wallets might use
    const responseObj = signedPsbtResponse as {
      signedPsbt?: string;
      psbt?: string;
    };
    signedPsbtBase64 = responseObj.signedPsbt || responseObj.psbt;
  }

  if (!signedPsbtBase64) {
    console.error('Invalid signed PSBT response:', signedPsbtResponse);
    throw new Error(
      'Invalid signed PSBT response - expected string, { psbt: string }, or { signedPsbt: string }'
    );
  }

  callbacks.onTransactionSubmitted?.();

  // Step 3: Finalize and broadcast the signed PSBT
  const result = await finalizeBitcoinMemoCall(signedPsbtBase64);

  console.log('Bitcoin transaction broadcast:', {
    txid: result.txid,
  });

  callbacks.onTransactionConfirmed?.(result.txid);
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

    if (walletType !== supportedChain.chainType) {
      const error = new Error('Wallet type does not match network chainType');
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
        await handleSolanaCall(
          callParams,
          primaryWallet,
          String(supportedChain.chainId),
          callbacks
        );
      } else if (walletType === 'BTC') {
        if (!primaryWallet) {
          throw new Error('Bitcoin transactions require primaryWallet');
        }
        await handleBitcoinCall(
          receiver, // Universal Contract address (20 bytes)
          message,
          primaryWallet,
          'bc1qm24wp577nk8aacckv8np465z3dvmu7ry45el6y', // TODO: Get gateway from config
          callbacks
        );
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
