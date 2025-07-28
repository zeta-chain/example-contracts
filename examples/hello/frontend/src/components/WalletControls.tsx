import './WalletControls.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { IconDisconnect } from './icons';

export const WalletControls = () => {
  const { account, disconnectWallet } = useWallet();

  if (!account) {
    return null;
  }

  return (
    <div className="wallet-controls-container">
      <div className="wallet-controls-icon" />

      <span className="wallet-controls-address">
        {truncateAddress(account)}
      </span>

      <button
        className="wallet-controls-disconnect-button"
        type="button"
        onClick={disconnectWallet}
      >
        <IconDisconnect />
      </button>
    </div>
  );
};
