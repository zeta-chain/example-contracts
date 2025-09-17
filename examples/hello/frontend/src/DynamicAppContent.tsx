import { useUniversalSignInContext } from '@zetachain/wallet/react';

import { ConnectedContent } from './ConnectedContent';
import { SUPPORTED_CHAINS } from './constants/chains';
import { DisconnectedContent } from './DisconnectedContent';

export function DynamicAppContent() {
  const { primaryWallet, network } = useUniversalSignInContext();

  const account = primaryWallet?.address || null;
  const decimalChainId = network || null;

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
    />
  );
}