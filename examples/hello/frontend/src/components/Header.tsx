import './Header.css';

import { useWallet } from '../hooks/useWallet';
import { ConnectWallet } from './ConnectWallet';
import { ThemeToggle } from './ThemeToggle';
import { WalletControls } from './WalletControls';

export const Header = () => {
  const { account } = useWallet();

  return (
    <div className="header-container">
      <div className="header-controls">
        {!account ? (
          <div className="lg-only">
            <ConnectWallet />
          </div>
        ) : (
          <WalletControls />
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};
