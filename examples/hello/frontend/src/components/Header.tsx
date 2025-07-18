import './Header.css';

import { useWallet } from '../hooks/useWallet';
import { IconZetaChainLogo } from './IconZetaChainLogo';

export const Header = () => {
  const { isConnected, disconnectWallet } = useWallet();

  return (
    <div className="header-container">
      <IconZetaChainLogo className="header-logo" />
      {isConnected && (
        <button
          className="header-disconnect-button"
          type="button"
          onClick={disconnectWallet}
        >
          <span className="sm-only">X</span>
          <span className="lg-only">Disconnect</span>
        </button>
      )}
    </div>
  );
};
