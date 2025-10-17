import {
  broadcastCommitAndBuildRevealPsbt,
  buildBitcoinInscriptionCallCommitPsbt,
  finalizeBitcoinInscriptionCallReveal,
} from '@zetachain/toolkit/chains/bitcoin';
import { evmCall } from '@zetachain/toolkit/chains/evm';
import { solanaCall } from '@zetachain/toolkit/chains/solana';
import { type PrimaryWallet } from '@zetachain/wallet';
import { getSolanaWalletAdapter } from '@zetachain/wallet/solana';
import { ZeroAddress } from 'ethers';
import { useCallback } from 'react';

import {
  BITCOIN_GATEWAY_ADDRESS_SIGNET,
  type SupportedChain,
} from '../constants/chains';
import { USE_DYNAMIC_WALLET } from '../constants/wallets';
import { useUnisatWallet } from '../context/UnisatWalletProvider';
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
 * Handles Bitcoin-specific call logic using Unisat + Signet
 */
async function handleBitcoinCall(
  receiver: string,
  message: string,
  unisatWallet: ReturnType<typeof useUnisatWallet>,
  gatewayAddress: string,
  callbacks: {
    onSigningStart?: UseHandleCallParams['onSigningStart'];
    onTransactionSubmitted?: UseHandleCallParams['onTransactionSubmitted'];
    onTransactionConfirmed?: UseHandleCallParams['onTransactionConfirmed'];
  }
): Promise<void> {
  const { paymentAccount, signPSBT, getChain } = unisatWallet;

  if (!paymentAccount) {
    throw new Error('No payment account found. Please connect Unisat wallet.');
  }

  const chain = await getChain();

  if (chain.enum !== 'BITCOIN_SIGNET') {
    throw new Error('Unisat wallet is not connected to Signet');
  }

  // Use Signet testnet
  const bitcoinApi = 'https://mempool.space/signet/api';
  const network = 'signet';

  const commitResult = await buildBitcoinInscriptionCallCommitPsbt({
    bitcoinApi,
    fromAddress: paymentAccount.address,
    gatewayAddress,
    network,
    publicKey: paymentAccount.publicKey,
    receiver,
    types: ['string'],
    values: [message],
  });

  callbacks.onSigningStart?.();

  // Sign commit PSBT with Unisat
  const signedCommitPsbt = await signPSBT(commitResult.commitPsbtBase64, [
    {
      address: paymentAccount.address,
      signingIndexes: commitResult.signingIndexes,
    },
  ]);

  // Broadcast commit and build reveal
  const revealResult = await broadcastCommitAndBuildRevealPsbt({
    bitcoinApi,
    commitData: commitResult.commitData,
    depositFee: commitResult.depositFee,
    fromAddress: paymentAccount.address,
    gatewayAddress,
    network,
    revealFee: commitResult.revealFee,
    signedCommitPsbtBase64: signedCommitPsbt,
  });

  // Sign reveal PSBT with Unisat
  const signedRevealPsbt = await signPSBT(revealResult.revealPsbtBase64, [
    {
      address: paymentAccount.address,
      signingIndexes: revealResult.signingIndexes,
    },
  ]);

  callbacks.onTransactionSubmitted?.();

  // Finalize and broadcast reveal
  const finalResult = await finalizeBitcoinInscriptionCallReveal(
    signedRevealPsbt,
    bitcoinApi
  );

  callbacks.onTransactionConfirmed?.(finalResult.revealTxid);
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
  // Always call the hook - will only be used when USE_DYNAMIC_WALLET is false
  const unisatWallet = useUnisatWallet();

  const handleCall = useCallback(async () => {
    const walletType =
      primaryWallet?.chain || supportedChain?.chainType || 'EVM';
    const walletAddress =
      primaryWallet?.address ||
      account ||
      unisatWallet?.paymentAccount?.address;

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
        if (USE_DYNAMIC_WALLET) {
          throw new Error('Bitcoin not supported with Dynamic wallet yet');
        }
        if (!unisatWallet?.paymentAccount) {
          throw new Error('Bitcoin transactions require Unisat wallet');
        }
        await handleBitcoinCall(
          receiver, // Universal Contract address (20 bytes)
          message,
          unisatWallet,
          BITCOIN_GATEWAY_ADDRESS_SIGNET,
          callbacks
        );
      } else {
        throw new Error(`Unsupported chain: ${walletType}`);
      }
    } catch (error) {
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
    unisatWallet,
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
