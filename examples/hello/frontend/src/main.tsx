import './index.css';
import './fonts.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { USE_DYNAMIC_WALLET } from './constants/wallets.ts';
import { DynamicWalletProvider } from './context/DynamicWalletProvider.tsx';
import { ThemeProvider } from './context/ThemeProvider.tsx';
import { WalletProvider } from './context/WalletProvider.tsx';

const WalletProviderComponent = USE_DYNAMIC_WALLET
  ? DynamicWalletProvider
  : WalletProvider;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WalletProviderComponent>
        <App />
      </WalletProviderComponent>
    </ThemeProvider>
  </StrictMode>
);
