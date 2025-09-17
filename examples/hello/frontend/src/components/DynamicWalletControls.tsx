import './WalletControls.css';

import {
  DynamicUserProfile,
  useUniversalSignInContext,
} from '@zetachain/wallet/react';

import { truncateAddress } from '../utils/truncate';

export const DynamicWalletControls = () => {
  const { primaryWallet, setShowDynamicUserProfile } =
    useUniversalSignInContext();

  const account = primaryWallet?.address;

  if (!account) {
    return null;
  }

  const handleClick = () => {
    setShowDynamicUserProfile(true);
  };

  return (
    <>
      <button
        className="wallet-controls-container wallet-controls-clickable"
        type="button"
        onClick={handleClick}
      >
        <div className="wallet-controls-icon" />

        <span className="wallet-controls-address">
          {truncateAddress(account)}
        </span>
      </button>
      <DynamicUserProfile />
    </>
  );
};
