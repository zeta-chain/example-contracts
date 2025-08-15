import { AppContent } from './AppContent';
import { Header } from './components/Header';
import { ThemeProvider } from './context/ThemeProvider';
import '@zetachain/wallet/ethereum';
import {
  DynamicConnectButton,
  DynamicWidget,
  useDynamicContext,
  DynamicContextProvider,
} from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { evmNetworks } from './constants/chains';

function App() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'eaec6949-d524-40e7-81d2-80113243499a',
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks,
        },
      }}
    >
      <ThemeProvider>
        <Header />

        <AppContent />
      </ThemeProvider>
    </DynamicContextProvider>
  );
}

export default App;
