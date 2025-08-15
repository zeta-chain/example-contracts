import './WalletControls.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { IconDisconnect } from './icons';
import {
  DynamicConnectButton,
  DynamicWidget,
  useDynamicContext,
} from '@dynamic-labs/sdk-react-core';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

export const WalletControls = () => {
  const { account, disconnectWallet } = useWallet();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { theme } = useTheme();

  if (!account) {
    return null;
  }

  return (
    <div className="wallet-controls-container">
      <div className="wallet-controls-icon" />

      <span className="wallet-controls-address">
        {truncateAddress(account)}
      </span>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <button
            className="wallet-controls-disconnect-button"
            type="button"
            onClick={() => setIsSheetOpen(true)}
          >
            <IconDisconnect />
          </button>
        </SheetTrigger>
        <SheetContent
          className={`border-l shadow-xl z-[9999] ${
            theme === 'dark' ? 'bg-[#171f29]' : 'bg-white'
          }`}
        >
          <div className="p-4">
            {/* Blank sheet content - you can add whatever you want here */}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
