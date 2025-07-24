import './Header.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { ConnectWallet } from './ConnectWallet';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const { account, disconnectWallet, selectedProvider } = useWallet();

  return (
    <div className="header-container">
      <div className="header-controls">
        {!account ? (
          <div className="lg-only">
            <ConnectWallet />
          </div>
        ) : (
          <div className="header-connected-container">
            <div>
              <div className="header-provider-container">
                <img
                  src={selectedProvider?.info.icon}
                  alt={selectedProvider?.info.name}
                  className="header-provider-icon"
                />
                <span className="lg-only">{truncateAddress(account)}</span>
              </div>
            </div>
            <button
              className="header-disconnect-button"
              type="button"
              onClick={disconnectWallet}
            >
              <span>X</span>
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};
