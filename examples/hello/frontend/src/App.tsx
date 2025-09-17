import { UniversalSignInContextProvider } from '@zetachain/wallet/react';

import { AppContent } from './AppContent';
import { Header } from './components/Header';
import { USE_DYNAMIC_WALLET } from './constants/wallets';
import { useTheme } from './hooks/useTheme';

function App() {
  const { theme } = useTheme();

  return USE_DYNAMIC_WALLET ? (
    <UniversalSignInContextProvider environment="sandbox" theme={theme}>
      <Header />
      <AppContent />
    </UniversalSignInContextProvider>
  ) : (
    <>
      <Header />
      <AppContent />
    </>
  );
}

export default App;
