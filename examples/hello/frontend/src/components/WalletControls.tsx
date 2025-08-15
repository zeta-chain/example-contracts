import './WalletControls.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import {
  DynamicUserProfile,
  useDynamicContext,
} from '@dynamic-labs/sdk-react-core';
import {
  CircleArrowRight,
  Power,
  Settings,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { useZetaChainClient } from '../providers/UniversalKitProvider';

type ZetaTokenBalance = {
  id: string;
  chain_id: number | string | null;
  chain_name?: string;
  symbol: string;
  balance: string;
};

export const WalletControls = () => {
  const { account, disconnectWallet, decimalChainId } = useWallet();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { theme } = useTheme();
  const { setShowDynamicUserProfile } = useDynamicContext();

  const [isLoadingAllBalances, setIsLoadingAllBalances] = useState(false);
  const [allBalances, setAllBalances] = useState<ZetaTokenBalance[]>([]);
  const [copied, setCopied] = useState(false);
  const client = useZetaChainClient();

  const fetchAllNativeBalances = async () => {
    if (!account || !client) return;
    try {
      setIsLoadingAllBalances(true);
      const balances = await client.getBalances({ evmAddress: account });
      setAllBalances(balances);
    } catch (e) {
      console.error('Failed to fetch balances via ZetaChain client', e);
    } finally {
      setIsLoadingAllBalances(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchAllNativeBalances();
    } else {
      setAllBalances([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

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
            className={`rounded-3xl p-4 h-full w-full overflow-y-auto ${
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

            {/* Address with copy */}
            <div className="mt-6 text-left">
              <div className="flex items-center justify-between rounded-2xl px-4 py-3 bg-black/5 dark:bg-white/5">
                <span className="text-base font-medium select-all">
                  {truncateAddress(account)}
                </span>
                <Button
                  aria-label={copied ? 'Copied' : 'Copy address'}
                  size="icon"
                  variant="ghost"
                  className="shadow-none"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(account);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch {}
                  }}
                >
                  {copied ? (
                    <Check className="size-5" />
                  ) : (
                    <Copy className="size-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Balances */}
            {account && (
              <div className="mt-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold">Balances</div>
                  <Button
                    aria-label="Refresh balances"
                    size="icon"
                    variant="ghost"
                    className="shadow-none"
                    onClick={fetchAllNativeBalances}
                    disabled={isLoadingAllBalances}
                  >
                    <RefreshCw
                      className={`size-5 ${
                        isLoadingAllBalances ? 'animate-spin' : ''
                      }`}
                    />
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {allBalances.map((bal) => {
                    const cidRaw = bal.chain_id;
                    const cidNum =
                      typeof cidRaw === 'string' ? Number(cidRaw) : cidRaw;
                    const isActive =
                      cidNum != null && decimalChainId === cidNum;
                    return (
                      <div
                        key={bal.id}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                          isActive
                            ? 'bg-black/10 dark:bg-white/10'
                            : 'bg-black/5 dark:bg-white/5'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm opacity-70">
                            {bal.chain_name}
                          </span>
                          <span className="text-lg font-medium">
                            {bal.balance} {bal.symbol}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <DynamicUserProfile />
    </>
  );
};
