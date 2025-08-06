import './index.css';
import './fonts.css';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { DynamicWalletProvider } from './context/DynamicWalletProvider.tsx';
import { WalletProvider } from './context/WalletProvider.tsx';

// Toggle this to switch between EIP-6963 and Dynamic wallet implementations
const USE_DYNAMIC_WALLET = true;

const WalletProviderComponent = USE_DYNAMIC_WALLET
  ? DynamicWalletProvider
  : WalletProvider;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DynamicContextProvider
      settings={{
        environmentId: 'eaec6949-d524-40e7-81d2-80113243499a',
      }}
    >
      <WalletProviderComponent>
        <App />
      </WalletProviderComponent>
    </DynamicContextProvider>
  </StrictMode>
);
