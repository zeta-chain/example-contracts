import Wallet, { connect, disconnect, onEvent } from '@zetachain/wallet';
import { createEIP1193Provider } from '@zetachain/wallet/ethereum';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SUPPORTED_CHAIN_IDS } from '../constants/chains';
import type { EIP6963ProviderDetail } from '../types/wallet';

export const useDynamicWallet = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState(false);
  const [wallets, setWallets] = useState<
    Array<{ id: string; address?: string }>
  >([]);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to update chain ID
  const updateChainId = useCallback(async () => {
    if (Wallet.wallets.length > 0) {
      try {
        const provider = createEIP1193Provider(Wallet);
        const currentChainId = (await provider.request({
          method: 'eth_chainId',
        })) as string;
        setChainId(Number(currentChainId));
        console.debug('Chain ID updated to:', Number(currentChainId));
      } catch (error) {
        console.error('Error getting chain ID:', error);
      }
    }
  }, []);

  // Handle connection events and wallet updates
  useEffect(() => {
    const checkWallets = () => {
      const currentWallets = Wallet.wallets || [];
      setWallets(currentWallets);
      const connected = currentWallets.length > 0;
      setIsConnected(connected);

      if (connected && currentWallets[0]?.address) {
        setAccount(currentWallets[0].address);
        updateChainId();
      } else {
        setAccount(null);
        setChainId(null);
      }
    };

    checkWallets();

    const unsubscribeConnect = onEvent(Wallet, 'connect', () => {
      setConnecting(false);
      setError(null);
      checkWallets();
    });

    const unsubscribeDisconnect = onEvent(Wallet, 'disconnect', () => {
      setConnecting(false);
      checkWallets();
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, [updateChainId]);

  // Add chain change listener and polling
  useEffect(() => {
    if (!isConnected || !Wallet.wallets.length) return;

    let intervalId: NodeJS.Timeout;

    try {
      const provider = createEIP1193Provider(Wallet);

      const handleChainChanged = (newChainId: string) => {
        console.debug('Chain changed event received:', newChainId);
        setChainId(Number(newChainId));
      };

      // Try to listen for chain changes
      provider.on('chainChanged', handleChainChanged);
      console.debug('Chain change listener registered');

      // Also poll for chain changes as fallback since Dynamic might not emit events properly
      intervalId = setInterval(async () => {
        try {
          const currentChainId = (await provider.request({
            method: 'eth_chainId',
          })) as string;
          const newChainId = Number(currentChainId);

          // Only update if changed to avoid unnecessary re-renders
          setChainId((prevChainId) => {
            if (prevChainId !== newChainId) {
              console.debug(
                'Chain ID changed via polling:',
                prevChainId,
                '->',
                newChainId
              );
              return newChainId;
            }
            return prevChainId;
          });
        } catch (error) {
          console.error('Error polling chain ID:', error);
        }
      }, 1000); // Poll every second

      return () => {
        provider.removeListener('chainChanged', handleChainChanged);
        clearInterval(intervalId);
      };
    } catch (error) {
      console.error('Error setting up chain change monitoring:', error);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isConnected]);

  const connectWallet = useCallback(
    async (_provider?: EIP6963ProviderDetail) => {
      setConnecting(true);
      setError(null);

      try {
        await connect(Wallet);
        return { success: true, account: account };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to connect wallet';
        setError(errorMessage);
        setConnecting(false);
        return { success: false, error: errorMessage };
      }
    },
    [account]
  );

  const disconnectWallet = useCallback(() => {
    disconnect(Wallet);
    setError(null);
  }, []);

  // Create a mock provider that matches EIP6963ProviderDetail interface
  const mockProvider = useMemo((): EIP6963ProviderDetail | null => {
    if (!isConnected || !wallets[0]) return null;

    return {
      info: {
        uuid: 'dynamic-wallet',
        name: 'Dynamic Wallet',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjM1MjQgMy40MjIxM0M5LjkxMDQ3IDMuODM0MDEgOS40NzYxNCA0LjIzODI2IDkuMDQxODEgNC42NDA2MUM3LjAyNDQ3IDYuNTEzMTMgNS4wMDcxMyA4LjM4NzU2IDIuOTg3ODkgMTAuMjU2M0MyLjUyNDk4IDEwLjY4NTMgMi4wNDQ5NCAxMS4wOTcyIDEuNDYzOTMgMTEuMzQ4OUMwLjc3MjQzMSAxMS42NDgzIDAuMzc2MjAxIDExLjQ2MTQgMC4xNTMzMjIgMTAuNzE1OEMtMC4xNTcxODUgOS42NzI3NyAwLjAwODU0NTY3IDguNzAwMjggMC42MDg2MDQgNy44MDQwNkMxLjExOTEzIDcuMDQxMzIgMS43NjMgNi40MDYzNCAyLjQyNDAyIDUuNzg4NTNDMy40Nzc0NiA0LjgwNDU5IDQuNTM4NTEgMy44MzAyIDUuNjEyOTEgMi44NzI5NkM2LjA4MzQzIDIuNDUzNDUgNi41OTc3NiAyLjA3MDE4IDcuMjI2NCAxLjk0MjQyQzkuMTA4NDkgMS41NjI5NiAxMC4zMDg2IDMuMzY2ODMgMTAuMzU0MyAzLjQyMDIyTDEwLjM1MjQgMy40MjIxM1oiIGZpbGw9IiM0Nzc5RkYiLz4KPHBhdGggZD0iTTEuMjk2MyAxMi45NDg3QzIuNDQxMTcgMTIuNjE4OCAzLjMwMDMgMTEuODkyMyA0LjEzNjU3IDExLjEyNzdDNi44MDM1IDguNjk0NTUgOS40NjY2MiA2LjI1OTUxIDEyLjE0NSAzLjgzOTczQzEyLjczNTUgMy4zMDU4MSAxMy4zNTY1IDIuNzk0NzggMTQuMDEzNyAyLjM0ODU3QzE0Ljg1IDEuNzgwMzQgMTUuNzU4NyAxLjY5ODM0IDE2LjY1NCAyLjIzOTg4QzE2Ljk3NzggMi40MzQzOCAxNy4yOTYgMi42NjEzIDE3LjU1ODggMi45MzIwN0MxOC40NzEzIDMuODc1OTYgMTkuMzcyNCA0LjgzNTEgMjAuMjUwNSA1LjgxMTRDMjEuMTg0IDYuODQ4NzMgMjIuMTAyMSA3LjkwMTMxIDIyLjk5NTYgOC45NzI5NUMyMy4zMDIzIDkuMzQwOTcgMjMuNTUzNyA5Ljc3MDAxIDIzLjc2MTQgMTAuMjA0OEMyNC4xNDgxIDExLjAxMzMgMjQuMDQ5IDExLjgxMjIgMjMuNTc4NSAxMi41NjU0QzIzLjE1NzUgMTMuMjQwNSAyMi41OTM2IDEzLjc5MzUgMjIuMDEyNiAxNC4zMTc4QzE5LjczODEgMTYuMzczNCAxNy40NjM2IDE4LjQyOSAxNS4xNjI0IDIwLjQ1NkMxNC41NDUyIDIxLjAwMTMgMTMuODY1MSAyMS40ODk1IDEzLjE2NDEgMjEuOTIwNEMxMS44NDQgMjIuNzM0NiAxMC41MjAxIDIyLjYzMzYgOS4zMTYxMyAyMS42Njg3QzguNjE1MTEgMjEuMTA4MSA3Ljk1NiAyMC40ODA4IDcuMzU0MDMgMTkuODEzNEM1LjQxNDc5IDE3LjY2NDMgMy41MTE3NSAxNS40ODQ4IDEuNTk1MzcgMTMuMzE0OEMxLjQ5ODIyIDEzLjIwNjEgMS40MTA1OSAxMy4wODc5IDEuMjk2MyAxMi45NDY4VjEyLjk0ODdaIiBmaWxsPSIjNDc3OUZGIi8+Cjwvc3ZnPgo=',
        rdns: 'com.zetachain.wallet',
      },
      provider: wallets[0] ? createEIP1193Provider(Wallet) : null,
    } as EIP6963ProviderDetail;
  }, [isConnected, wallets]);

  const isSupportedChain = useMemo(() => {
    if (chainId === null) return false;
    return SUPPORTED_CHAIN_IDS.includes(chainId);
  }, [chainId]);

  return {
    // Mock providers array - Dynamic handles multiple auth methods internally
    providers: mockProvider ? [mockProvider] : [],
    selectedProvider: mockProvider,
    decimalChainId: chainId,
    connecting,
    reconnecting: false, // Dynamic doesn't have separate reconnecting state
    isConnected,
    isSupportedChain,
    error,
    connectWallet,
    disconnectWallet,
    account,
  };
};
