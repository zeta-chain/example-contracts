import './ConnectDynamicWallet.css';

import {
  DynamicWidget,
  useConnectUniversalSignIn,
  useUniversalSignInContext,
} from '@zetachain/wallet/react';

import { Button } from './Button';
import { IconWallet } from './icons';

export const ConnectDynamicWallet = () => {
  const { primaryWallet } = useUniversalSignInContext();
  const { connectUniversalSignIn } = useConnectUniversalSignIn();

  if (!primaryWallet?.address) {
    return (
      <Button
        className="dynamic-connect-button"
        onClick={connectUniversalSignIn}
      >
        <div className="dynamic-connect-button-content">
          <IconWallet />
          Connect Wallet
        </div>
      </Button>
    );
  }

  return <DynamicWidget />;
};
