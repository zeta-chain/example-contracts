import './Header.css';

import { USE_DYNAMIC_WALLET } from '../constants/wallets';
import { useWallet } from '../hooks/useWallet';
import { ConnectDynamicWallet } from './ConnectDynamicWallet';
import { ConnectEip6963Wallet } from './ConnectEip6963Wallet';
import { ThemeToggle } from './ThemeToggle';
import { WalletControls } from './WalletControls';

export const Header = () => {
  const { isConnected } = useWallet();

  console.debug('isConnected', { isConnected, USE_DYNAMIC_WALLET });

  if (!USE_DYNAMIC_WALLET) {
    return (
      <div className="header-container">
        <div className="header-controls">
          {!isConnected ? (
            <div className="lg-only">
              <ConnectEip6963Wallet />
            </div>
          ) : (
            <WalletControls />
          )}
          <ThemeToggle />
        </div>
      </div>
    );
  }

  return (
    <div className="header-container">
      <div className="header-controls">
        <div>
          <ConnectDynamicWallet />
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
};
