import './Header.css';

import { useUniversalSignInContext } from '@zetachain/wallet/react';

import { USE_DYNAMIC_WALLET } from '../constants/wallets';
import { useEip6963Wallet } from '../hooks/useEip6963Wallet';
import { ConnectDynamicWallet } from './ConnectDynamicWallet';
import { ConnectEip6963Wallet } from './ConnectEip6963Wallet';
import { DynamicWalletControls } from './DynamicWalletControls';
import { ThemeToggle } from './ThemeToggle';
import { WalletControls } from './WalletControls';

const Eip6963Header = () => {
  const { isConnected } = useEip6963Wallet();

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
};

const DynamicHeader = () => {
  const { primaryWallet } = useUniversalSignInContext();
  const isDynamicConnected = !!primaryWallet?.address;

  return (
    <div className="header-container">
      <div className="header-controls">
        {!isDynamicConnected ? (
          <div className="lg-only">
            <ConnectDynamicWallet />
          </div>
        ) : (
          <DynamicWalletControls />
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};

export const Header = () => {
  return USE_DYNAMIC_WALLET ? <DynamicHeader /> : <Eip6963Header />;
};
