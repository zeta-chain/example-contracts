import './index.css';
import './fonts.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { USE_DYNAMIC_WALLET } from './constants/wallets';
import { Eip6963WalletProvider } from './context/Eip6963WalletProvider';
import { ThemeProvider } from './context/ThemeProvider';

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
