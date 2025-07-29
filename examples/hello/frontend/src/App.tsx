import { AppContent } from './AppContent';
import { Header } from './components/Header';
import { ThemeProvider } from './context/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <Header />
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
