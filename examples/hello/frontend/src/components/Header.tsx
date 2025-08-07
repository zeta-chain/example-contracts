import './Header.css';

import { useDynamicWallet } from '../hooks/useDynamicWallet';
import { ConnectDynamicWallet } from './ConnectDynamicWallet';
import { ThemeToggle } from './ThemeToggle';
import { WalletControls } from './WalletControls';

export const Header = () => {
  const { account } = useDynamicWallet();

  return (
    <div className="header-container">
      <div className="header-controls">
        {!account ? (
          <div className="lg-only">
            <ConnectDynamicWallet />
          </div>
        ) : (
          <WalletControls />
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};
