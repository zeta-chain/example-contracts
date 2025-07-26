import './Header.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { ConnectWallet } from './ConnectWallet';
import { IconDisconnect } from './icons';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const { account, disconnectWallet } = useWallet();

  return (
    <div className="header-container">
      <div className="header-controls">
        {!account ? (
          <div className="lg-only">
            <ConnectWallet />
          </div>
        ) : (
          <div className="header-connected-container">
            <div className="header-wallet-icon" />

            <span className="header-wallet-address lg-only">
              {truncateAddress(account)}
            </span>

            <button
              className="header-disconnect-button"
              type="button"
              onClick={disconnectWallet}
            >
              <IconDisconnect />
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};
