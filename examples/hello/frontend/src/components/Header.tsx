import './Header.css';

import { useWallet } from '../hooks/useWallet';
import { IconZetaChainLogo } from './IconZetaChainLogo';

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const Header = () => {
  const { account, disconnectWallet, selectedProvider } = useWallet();

  return (
    <div className="header-container">
      <IconZetaChainLogo className="header-logo" />
      {!!account && (
        <div className="header-connected-container">
          <div>
            <img
              src={selectedProvider?.info.icon}
              alt={selectedProvider?.info.name}
              className="header-provider-icon"
            />
            <span className="lg-only">{truncateAddress(account)}</span>
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
    </div>
  );
};
