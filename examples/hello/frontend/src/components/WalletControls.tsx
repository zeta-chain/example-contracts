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
import { CircleArrowRight, Power, Settings, RefreshCw } from 'lucide-react';
import { evmNetworks } from '../constants/chains';

export const WalletControls = () => {
  const { account, disconnectWallet, decimalChainId } = useWallet();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { theme } = useTheme();
  const { setShowDynamicUserProfile } = useDynamicContext();

  const [isLoadingAllBalances, setIsLoadingAllBalances] = useState(false);
  const [balancesByChainId, setBalancesByChainId] = useState<
    Record<number, string | null>
  >({});

  const formatWeiToEther = (hexWei: string): string => {
    try {
      const wei = BigInt(hexWei);
      const divisor = 10n ** 18n;
      const whole = wei / divisor;
      const fraction = wei % divisor;
      let fractionStr = fraction.toString().padStart(18, '0').slice(0, 4);
      fractionStr = fractionStr.replace(/0+$/, '');
      return fractionStr
        ? `${whole.toString()}.${fractionStr}`
        : whole.toString();
    } catch {
      return '0';
    }
  };

  const fetchAllNativeBalances = async () => {
    if (!account) return;
    try {
      setIsLoadingAllBalances(true);
      const results = await Promise.all(
        evmNetworks.map(async (net) => {
          const rpcUrl = net.rpcUrls?.[0];
          if (!rpcUrl) return [net.chainId, null] as const;
          try {
            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [account, 'latest'],
                id: `${net.chainId}-${Date.now()}`,
              }),
            });
            if (!response.ok) throw new Error(`RPC ${net.chainId} failed`);
            const json = (await response.json()) as { result?: string };
            const hex = json.result ?? '0x0';
            return [net.chainId, formatWeiToEther(hex)] as const;
          } catch (e) {
            console.error('Failed to fetch balance for', net.chainId, e);
            return [net.chainId, null] as const;
          }
        })
      );
      const map: Record<number, string | null> = {};
      for (const [cid, bal] of results) map[cid] = bal;
      setBalancesByChainId(map);
    } finally {
      setIsLoadingAllBalances(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchAllNativeBalances();
    } else {
      setBalancesByChainId({});
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
                  {evmNetworks.map((net) => {
                    const balance = balancesByChainId[net.chainId] ?? null;
                    const isActive = decimalChainId === net.chainId;
                    return (
                      <div
                        key={net.chainId}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                          isActive
                            ? 'bg-black/10 dark:bg-white/10'
                            : 'bg-black/5 dark:bg-white/5'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm opacity-70">
                            {net.chainName}
                          </span>
                          <span className="text-lg font-medium">
                            {balance ?? '—'} {net.nativeCurrency.symbol}
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
