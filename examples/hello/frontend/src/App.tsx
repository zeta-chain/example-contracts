import { UniversalSignInContextProvider } from '@zetachain/wallet/react';

import { AppContent } from './AppContent';
import { Header } from './components/Header';
import { useTheme } from './hooks/useTheme';

function App() {
  const { theme } = useTheme();

  return (
    <UniversalSignInContextProvider environment="sandbox" theme={theme}>
      <Header />
      <AppContent />
    </UniversalSignInContextProvider>
  );
}

export default App;
