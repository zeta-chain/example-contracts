import './ConnectDynamicWallet.css';

import {
  DynamicWidget,
  useUniversalSignInContext,
  useWalletOptions,
} from '@zetachain/wallet/react';

import { Button } from './Button';
import { IconWallet } from './icons';

export const ConnectDynamicWallet = () => {
  const { primaryWallet } = useUniversalSignInContext();
  const { selectWalletOption } = useWalletOptions();

  if (!primaryWallet?.address) {
    return (
      <Button
        className="dynamic-connect-button"
        onClick={() => selectWalletOption('universalsigninevm')}
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
