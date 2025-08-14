import './WalletControls.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { IconDisconnect } from './icons';
import {
  DynamicConnectButton,
  DynamicWidget,
  DynamicUserProfile,
  useDynamicContext,
} from '@dynamic-labs/sdk-react-core';

export const WalletControls = () => {
  const { account, disconnectWallet } = useWallet();
  const { setShowDynamicUserProfile } = useDynamicContext();

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
        onClick={() => setShowDynamicUserProfile(true)}
      >
        <DynamicUserProfile />

        <IconDisconnect />
      </button>
    </div>
  );
};
