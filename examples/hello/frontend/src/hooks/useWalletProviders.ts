import { useCallback, useEffect, useState } from 'react';

import type { EIP6963ProviderDetail } from '../types/wallet';
import {
  createProviderAnnounceHandler,
  requestEIP6963Providers,
} from '../utils/eip6963';

/**
 * Hook to discover and manage EIP-6963 wallet providers
 */
export const useWalletProviders = () => {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  // Handler for provider announcements
  const handleAnnounceProvider = useCallback(
    (provider: EIP6963ProviderDetail) => {
      setProviders((prev) => {
        // Check if provider already exists
        if (!prev.some((p) => p.info.uuid === provider.info.uuid)) {
          return [...prev, provider];
        }
        return prev;
      });
    },
    []
  );

  // Initialize EIP-6963 provider discovery
  useEffect(() => {
    // Create handler for provider announcements
    const announceHandler = createProviderAnnounceHandler(
      handleAnnounceProvider
    );

    // Add event listener for provider announcements
    window.addEventListener(
      'eip6963:announceProvider',
      announceHandler as EventListener
    );

    // Request providers
    requestEIP6963Providers();

    // Cleanup
    return () => {
      window.removeEventListener(
        'eip6963:announceProvider',
        announceHandler as EventListener
      );
    };
  }, [handleAnnounceProvider]);

  return { providers };
}; 