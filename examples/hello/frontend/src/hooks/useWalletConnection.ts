import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'react-use';

import type { EIP6963ProviderDetail } from '../types/wallet';
import {
  findProviderByAccount,
  findProviderByName,
  findProviderByRdns,
  findProviderByUuid,
} from '../utils/eip6963';
import { getEmptyWalletData } from '../utils/walletStorage';
import type { StoredWalletData } from '../utils/walletStorage';

/**
 * Hook to manage wallet connections
 */
export const useWalletConnection = (providers: EIP6963ProviderDetail[]) => {
  const [selectedProvider, setSelectedProvider] =
    useState<EIP6963ProviderDetail | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use localStorage to persist wallet connection data
  const [savedWalletData, setSavedWalletData] =
    useLocalStorage<StoredWalletData>(
      'wallet-connection',
      getEmptyWalletData()
    );

  // Check if wallet is connected
  const isConnected = Boolean(selectedProvider);

  // Connect wallet function
  const connectWallet = useCallback(
    async (provider: EIP6963ProviderDetail) => {
      try {
        setConnecting(true);
        setError(null);

        // Request accounts
        const accounts = (await provider.provider.request({
          method: 'eth_requestAccounts',
        })) as string[];

        if (accounts && accounts.length > 0) {
          setSelectedProvider(provider);

          // Save to localStorage with provider identifiers
          setSavedWalletData({
            account: accounts[0],
            providerUuid: provider.info.uuid,
            providerName: provider.info.name,
            providerRdns: provider.info.rdns,
          });

          return { success: true, account: accounts[0] };
        }

        return { success: false, account: null };
      } catch (err) {
        // Provide a more user-friendly error message for common errors
        const errorMsg = err instanceof Error ? err.message : String(err);
        let userErrorMsg = 'Failed to connect wallet';

        if (
          errorMsg.includes('429') ||
          errorMsg.includes('too many requests')
        ) {
          userErrorMsg =
            'Connection temporarily unavailable due to too many requests. Please try again in a moment.';
        } else if (errorMsg.includes('user rejected')) {
          userErrorMsg = 'Connection rejected by user.';
        } else if (errorMsg.includes('already pending')) {
          userErrorMsg =
            'Connection request already pending. Please check your wallet.';
        }

        setError(userErrorMsg);
        return { success: false, error: userErrorMsg };
      } finally {
        setConnecting(false);
      }
    },
    [setSavedWalletData]
  );

  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    if (selectedProvider) {
      // Clear localStorage when disconnecting
      setSavedWalletData(getEmptyWalletData());
      setSelectedProvider(null);
    }
  }, [selectedProvider, setSavedWalletData]);

  // Auto-reconnect logic
  useEffect(() => {
    // Skip if already connected or no saved data
    if (isConnected || !savedWalletData?.account || providers.length === 0) {
      return;
    }

    const reconnectWallet = async () => {
      try {
        setReconnecting(true);

        // Try to find the saved provider using multiple methods
        let savedProvider = null;

        // Method 1: Try to find by UUID (most specific)
        if (savedWalletData.providerUuid) {
          savedProvider = findProviderByUuid(
            providers,
            savedWalletData.providerUuid
          );
        }

        // Method 2: If not found by UUID, try to find by rdns
        if (!savedProvider && savedWalletData.providerRdns) {
          savedProvider = findProviderByRdns(
            providers,
            savedWalletData.providerRdns
          );
        }

        // Method 3: If still not found, try to find by name
        if (!savedProvider && savedWalletData.providerName) {
          savedProvider = findProviderByName(
            providers,
            savedWalletData.providerName
          );
        }

        // Method 4: Last resort - try to find by account
        if (!savedProvider && savedWalletData.account) {
          savedProvider = await findProviderByAccount(
            providers,
            savedWalletData.account
          );
        }

        if (savedProvider) {
          // Check if we can get accounts without requesting permission
          const accounts = (await savedProvider.provider.request({
            method: 'eth_accounts',
          })) as string[];

          // If we have accounts and they include our saved account, we can reconnect
          if (
            accounts &&
            accounts.length > 0 &&
            accounts.some(
              (a) => a.toLowerCase() === savedWalletData.account?.toLowerCase()
            )
          ) {
            setSelectedProvider(savedProvider);
          } else {
            // Clear saved data if we can't reconnect
            setSavedWalletData(getEmptyWalletData());
          }
        }
      } catch (error) {
        // Don't clear saved data on transient errors
        console.error('Error reconnecting wallet:', error);
      } finally {
        setReconnecting(false);
      }
    };

    // Only try to reconnect if we have providers
    if (providers.length > 0) {
      // Add a small delay to allow providers to load
      const timeout = setTimeout(() => {
        reconnectWallet();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [providers, savedWalletData, isConnected, setSavedWalletData]);

  return {
    selectedProvider,
    connecting,
    reconnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
  };
}; 