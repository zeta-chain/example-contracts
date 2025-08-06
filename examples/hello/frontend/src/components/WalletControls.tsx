import './WalletControls.css';

import {
  DynamicUserProfile,
  useDynamicContext,
} from '@dynamic-labs/sdk-react-core';

import { useDynamicWallet } from '../hooks/useDynamicWallet';
import { truncateAddress } from '../utils/truncate';
import { IconDisconnect } from './icons';

export const WalletControls = () => {
  const { account, disconnectWallet } = useDynamicWallet();
  const { setShowDynamicUserProfile } = useDynamicContext();

  if (!account) {
    return null;
  }

  return (
    <div className="wallet-controls-container">
      <button
        type="button"
        onClick={() => {
          setShowDynamicUserProfile(true);
        }}
      >
        <div className="wallet-controls-icon" />

        <span className="wallet-controls-address">
          {truncateAddress(account)}
        </span>
      </button>

      <button
        className="wallet-controls-disconnect-button"
        type="button"
        onClick={disconnectWallet}
      >
        <IconDisconnect />
      </button>
      <DynamicUserProfile />
    </div>
  );
};
