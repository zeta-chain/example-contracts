import '@zetachain/wallet/ethereum';

import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
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

  const cssOverrides = `
    .login-with-email-form,
    .divider, 
    .social-sign-in {
      display: none;
    }
    
    /* Hide all wallet buttons by default */
    .login-with-email-wallet-list__container .wallet-list-item__tile {
      display: none;
    }
    
    /* Show only the Universal Sign In wallet */
    .login-with-email-wallet-list__container .wallet-list-item__tile:has(img[alt="universalsigninevm"]) {
      display: flex;
    }
    
    /* Hide the "View all wallets" button */
    .login-with-email-wallet-list__container .list-item-button {
      display: none;
    }
  `;

  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'eaec6949-d524-40e7-81d2-80113243499a',
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks,
        },
        cssOverrides,
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
