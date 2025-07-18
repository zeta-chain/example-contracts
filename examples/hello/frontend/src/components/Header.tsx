import './Header.css';

import { useWallet } from '../hooks/useWallet';
import { IconZetaChainLogo } from './IconZetaChainLogo';

export const Header = () => {
  const { isConnected, disconnectWallet } = useWallet();

  return (
    <div className="header-container">
      <IconZetaChainLogo className="header-logo" />
      {isConnected && (
        <button type="button" onClick={disconnectWallet}>
          Disconnect
        </button>
      )}
    </div>
  );
};
