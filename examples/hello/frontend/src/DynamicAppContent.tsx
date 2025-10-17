import { useUniversalSignInContext } from '@zetachain/wallet/react';
import { useMemo } from 'react';

import { ConnectedContent } from './ConnectedContent';
import { SUPPORTED_CHAINS } from './constants/chains';
import { DisconnectedContent } from './DisconnectedContent';

export function DynamicAppContent() {
  const { primaryWallet, network } = useUniversalSignInContext();

  const account = primaryWallet?.address || null;
  const decimalChainId = useMemo(() => {
    if (typeof network === 'number') {
      return network;
    }

    // Solana Devnet id from `network` property
    if (network === '103') {
      return 901;
    }

    return null;
  }, [network]);

  const supportedChain = SUPPORTED_CHAINS.find(
    (chain) => chain.chainId === decimalChainId
  );

  const isDisconnected = !account;

  if (isDisconnected) {
    return <DisconnectedContent />;
  }

  return (
    <ConnectedContent
      selectedProvider={null}
      supportedChain={supportedChain}
      primaryWallet={primaryWallet}
    />
  );
}
