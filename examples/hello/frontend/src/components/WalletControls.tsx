import './WalletControls.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { IconDisconnect } from './icons';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export const WalletControls = () => {
  const { account } = useWallet();
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
        <SheetContent className="border-none z-[9999] bg-transparent shadow-none p-4 [&>button]:top-10 [&>button]:right-10">
          <div
            className={`rounded-3xl p-4 h-full w-full ${
              theme === 'dark' ? 'bg-[#171f29]' : 'bg-white'
            }`}
          >
            {/* Blank sheet content - you can add whatever you want here */}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
