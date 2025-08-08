import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

import { ConnectedContent } from './ConnectedContent';
import { SUPPORTED_CHAINS } from './constants/chains';
import { USE_DYNAMIC_WALLET } from './constants/wallets';
import { DisconnectedContent } from './DisconnectedContent';
import { useEip6963Wallet } from './hooks/useEip6963Wallet';

export function AppContent() {
  // Using Dynamic's official hooks instead of custom context
  const { primaryWallet, network } = useDynamicContext();

  const { selectedProvider, decimalChainId: eip6963ChainId } =
    useEip6963Wallet();

  // Extract values from Dynamic's official hooks
  const account = primaryWallet?.address || null;
  const decimalChainId = USE_DYNAMIC_WALLET ? network : eip6963ChainId || null;

  const supportedChain = SUPPORTED_CHAINS.find(
    (chain) => chain.chainId === decimalChainId
  );

  const isDisconnected = USE_DYNAMIC_WALLET ? !account : !selectedProvider;

  if (isDisconnected) {
    return <DisconnectedContent />;
  }

  return (
    <ConnectedContent
      selectedProvider={selectedProvider}
      supportedChain={supportedChain}
    />
  );
}
