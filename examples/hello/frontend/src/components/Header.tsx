import './Header.css';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';

import { useDynamicWallet } from '../hooks/useDynamicWallet';
import { ConnectDynamicWallet } from './ConnectDynamicWallet';
import { ThemeToggle } from './ThemeToggle';
import { WalletControls } from './WalletControls';

export const Header = () => {
  const { account } = useDynamicWallet();

  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'eaec6949-d524-40e7-81d2-80113243499a',
      }}
    >
      <div className="header-container">
        <div className="header-controls">
          {!account ? (
            <div className="lg-only">
              <ConnectDynamicWallet />
            </div>
          ) : (
            <WalletControls />
          )}
          <ThemeToggle />
        </div>
      </div>
    </DynamicContextProvider>
  );
};
