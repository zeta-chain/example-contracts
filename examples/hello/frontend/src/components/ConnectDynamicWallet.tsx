import './ConnectDynamicWallet.css';

import {
  DynamicConnectButton,
  DynamicWidget,
  useDynamicContext,
} from '@dynamic-labs/sdk-react-core';

import { IconWallet } from './icons';

export const ConnectDynamicWallet = () => {
  const { primaryWallet } = useDynamicContext();

  if (!primaryWallet?.address) {
    return (
      <DynamicConnectButton buttonClassName="dynamic-connect-button">
        <div className="dynamic-connect-button-content">
          <IconWallet />
          Connect Wallet
        </div>
      </DynamicConnectButton>
    );
  }

  return <DynamicWidget />;
};
