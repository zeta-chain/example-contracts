import '@zetachain/wallet/ethereum';

import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { SdkViewSectionType, SdkViewType } from '@dynamic-labs/sdk-api';
import {
  DynamicContextProvider,
  DynamicUserProfile,
} from '@dynamic-labs/sdk-react-core';

import { AppContent } from './AppContent';
import { Header } from './components/Header';
import { evmNetworks } from './constants/chains';
import { useTheme } from './hooks/useTheme';

function App() {
  const { theme } = useTheme();

  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'eaec6949-d524-40e7-81d2-80113243499a',
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks,
          views: [
            {
              type: SdkViewType.Login,
              sections: [{ type: SdkViewSectionType.Wallet }],
            },
          ],
        },
        walletsFilter: (wallets) =>
          wallets.filter((w) => w.key === 'universalsigninevm'),
      }}
      theme={theme}
    >
      <Header />
      <AppContent />
      <DynamicUserProfile />
    </DynamicContextProvider>
  );
}

export default App;
