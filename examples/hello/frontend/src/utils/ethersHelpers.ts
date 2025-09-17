import { getSigner, getWeb3Provider } from '@zetachain/wallet/ethers';
import { useUniversalSignInContext } from '@zetachain/wallet/react';
import { ethers } from 'ethers';

import type { EIP6963ProviderDetail } from '../types/wallet';

interface GetSignerAndProviderArgs {
  selectedProvider: EIP6963ProviderDetail | null;
  primaryWallet: ReturnType<typeof useUniversalSignInContext>['primaryWallet'];
}

interface GetSignerAndProviderResult {
  signer: ethers.AbstractSigner<ethers.Provider | null>;
  provider: ethers.BrowserProvider;
}

export const getSignerAndProvider = async ({
  selectedProvider,
  primaryWallet,
}: GetSignerAndProviderArgs): Promise<GetSignerAndProviderResult | null> => {
  // If we have a Dynamic wallet, use Dynamic's ethers integration
  if (primaryWallet) {
    try {
      const provider = await getWeb3Provider(primaryWallet);
      const signer = await getSigner(primaryWallet);

      return {
        signer: signer as ethers.AbstractSigner,
        provider: provider as ethers.BrowserProvider,
      };
    } catch (error) {
      console.error('Failed to get Dynamic signer/provider:', error);
    }
  }

  // Fallback to EIP-6963 provider if available
  if (selectedProvider) {
    const provider = new ethers.BrowserProvider(selectedProvider.provider);
    const signer = (await provider.getSigner()) as ethers.AbstractSigner;

    return {
      signer,
      provider,
    };
  }

  return null;
};
