import './index.css';
import './fonts.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { USE_DYNAMIC_WALLET } from './constants/wallets.ts';
import { Eip6963WalletProvider } from './context/Eip6963WalletProvider.tsx';
import { ThemeProvider } from './context/ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {USE_DYNAMIC_WALLET ? (
        <App />
      ) : (
        <Eip6963WalletProvider>
          <App />
        </Eip6963WalletProvider>
      )}
    </ThemeProvider>
  </StrictMode>
);
