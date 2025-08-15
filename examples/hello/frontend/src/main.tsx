import './index.css';
import './fonts.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { WalletProvider } from './context/WalletProvider.tsx';
import { UniversalKitProvider } from './providers/UniversalKitProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <UniversalKitProvider>
        <App />
      </UniversalKitProvider>
    </WalletProvider>
  </StrictMode>
);
