import './WalletControls.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from './ui/sheet';
import { Button } from './Button';
import {
  DynamicUserProfile,
  useDynamicContext,
} from '@dynamic-labs/sdk-react-core';
import { Power, Settings, X } from 'lucide-react';

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
            <div className="flex justify-end gap-2">
              <Button
                variant="thin"
                onClick={() => setShowDynamicUserProfile(true)}
                aria-label="Settings"
                icon={<Settings size={16} />}
              />
              <Button
                variant="thin"
                onClick={async () => {
                  await disconnectWallet();
                  setIsSheetOpen(false);
                }}
                aria-label="Disconnect"
                icon={<Power size={16} />}
              />
              <SheetClose asChild>
                <Button
                  variant="thin"
                  aria-label="Close"
                  icon={<X size={16} />}
                />
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <DynamicUserProfile />
    </>
  );
};
