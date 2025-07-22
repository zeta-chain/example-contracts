/**
 * The structure of wallet data stored in localStorage
 */
export interface StoredWalletData {
  account: string | null;
  providerUuid: string | null;
  providerName: string | null;
  providerRdns: string | null;
}

/**
 * Get empty wallet data structure
 */
export const getEmptyWalletData = (): StoredWalletData => {
  return {
    account: null,
    providerUuid: null,
    providerName: null,
    providerRdns: null,
  };
}; 