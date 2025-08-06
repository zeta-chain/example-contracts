import { ConnectedContent } from './ConnectedContent';
import { SUPPORTED_CHAINS } from './constants/chains';
import { DisconnectedContent } from './DisconnectedContent';
import { useDynamicWallet } from './hooks/useDynamicWallet';

export function AppContent() {
  // const { account, selectedProvider, decimalChainId } = useWallet();
  const { account, selectedProvider, decimalChainId } = useDynamicWallet();

  const supportedChain = SUPPORTED_CHAINS.find(
    (chain) => chain.chainId === decimalChainId
  );

  if (!account || !selectedProvider) {
    return <DisconnectedContent />;
  }

  return (
    <ConnectedContent
      selectedProvider={selectedProvider}
      supportedChain={supportedChain}
    />
  );
}
