import type {
  EIP6963AnnounceProviderEvent,
  EIP6963ProviderDetail,
} from '../types/wallet';

/**
 * Request EIP-6963 providers from the browser environment
 */
export const requestEIP6963Providers = (): void => {
  window.dispatchEvent(new Event('eip6963:requestProvider'));
};

/**
 * Find a provider by UUID
 */
export const findProviderByUuid = (
  providers: EIP6963ProviderDetail[],
  uuid: string
): EIP6963ProviderDetail | undefined => {
  return providers.find((p) => p.info.uuid === uuid);
};

/**
 * Find a provider by RDNS
 */
export const findProviderByRdns = (
  providers: EIP6963ProviderDetail[],
  rdns: string
): EIP6963ProviderDetail | undefined => {
  return providers.find((p) => p.info.rdns === rdns);
};

/**
 * Find a provider by name
 */
export const findProviderByName = (
  providers: EIP6963ProviderDetail[],
  name: string
): EIP6963ProviderDetail | undefined => {
  return providers.find((p) => p.info.name === name);
};

/**
 * Find a provider by account
 * Checks if any provider has the given account
 */
export const findProviderByAccount = async (
  providers: EIP6963ProviderDetail[],
  account: string
): Promise<EIP6963ProviderDetail | undefined> => {
  for (const provider of providers) {
    try {
      const accounts = (await provider.provider.request({
        method: 'eth_accounts',
      })) as string[];

      if (
        accounts &&
        accounts.length > 0 &&
        accounts.some((a) => a.toLowerCase() === account?.toLowerCase())
      ) {
        return provider;
      }
    } catch {
      // Skip this provider if it throws an error
      continue;
    }
  }
  return undefined;
};

/**
 * Create a handler for EIP-6963 provider announcements
 */
export const createProviderAnnounceHandler = (
  onNewProvider: (provider: EIP6963ProviderDetail) => void
) => {
  return (event: EIP6963AnnounceProviderEvent) => {
    const { detail } = event;
    onNewProvider(detail);
  };
}; 