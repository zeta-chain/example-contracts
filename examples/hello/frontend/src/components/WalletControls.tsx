import './WalletControls.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import {
  DynamicUserProfile,
  useDynamicContext,
} from '@dynamic-labs/sdk-react-core';
import { CircleArrowRight, Power, Settings, X } from 'lucide-react';

export const WalletControls = () => {
  const { account, disconnectWallet } = useWallet();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { theme } = useTheme();
  const { setShowDynamicUserProfile } = useDynamicContext();

  if (!account) {
    return null;
  }

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <div className="wallet-controls-container">
            <div className="wallet-controls-icon" />

            <span className="wallet-controls-address">
              {truncateAddress(account)}
            </span>
          </div>
        </SheetTrigger>
        <SheetContent className="border-none z-[9999] bg-transparent shadow-none p-4 [&>button]:top-10 [&>button]:right-10">
          <div
            className={`rounded-3xl p-4 h-full w-full ${
              theme === 'dark' ? 'bg-[#171f29]' : 'bg-white'
            }`}
          >
            <div className="flex justify-end gap-1">
              <Button
                onClick={() => setShowDynamicUserProfile(true)}
                aria-label="Settings"
                size="icon"
                className="shadow-none"
              >
                <Settings strokeWidth={2.2} className="size-5" />
              </Button>
              <Button
                onClick={async () => {
                  await disconnectWallet();
                  setIsSheetOpen(false);
                }}
                aria-label="Disconnect"
                size="icon"
                className="shadow-none"
              >
                <Power strokeWidth={2.2} className="size-5" />
              </Button>
              <SheetClose asChild>
                <Button aria-label="Close" size="icon" className="shadow-none">
                  <CircleArrowRight strokeWidth={2.2} className="size-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <DynamicUserProfile />
    </>
  );
};
