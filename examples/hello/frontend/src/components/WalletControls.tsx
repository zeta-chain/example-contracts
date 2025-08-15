import './WalletControls.css';

import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { useEffect, useMemo, useState } from 'react';
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
  ArrowUpRight,
  Download,
  ArrowLeftRight,
} from 'lucide-react';
import { useZetaChainClient } from '../providers/UniversalKitProvider';
import { formatNumberSignificant } from '../utils/formatNumber';
import { Button as MainButton } from './Button';
import { IconSpinner } from './icons';

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

  const sortedBalances = allBalances.slice().sort((a, b) => {
    const aVal = Number(a.balance) || 0;
    const bVal = Number(b.balance) || 0;
    if ((aVal === 0) !== (bVal === 0)) return aVal === 0 ? 1 : -1;
    return bVal - aVal;
  });

  // --- Simple compact swap mockup state ---
  const formatChainName = (raw?: string) => {
    if (!raw) return '';
    return raw
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
  };

  const tokenOptions = useMemo(() => {
    return sortedBalances.map((t) => ({
      id: t.id,
      label: `${t.symbol}${
        t.chain_name ? ` (${formatChainName(t.chain_name)})` : ''
      }`,
    }));
  }, [sortedBalances]);

  const [sourceTokenId, setSourceTokenId] = useState<string | undefined>();
  const [targetTokenId, setTargetTokenId] = useState<string | undefined>();
  const [amountIn, setAmountIn] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  useEffect(() => {
    if (tokenOptions.length > 0) {
      setSourceTokenId((prev) => prev ?? tokenOptions[0]?.id);
      setTargetTokenId(
        (prev) => prev ?? tokenOptions[1]?.id ?? tokenOptions[0]?.id
      );
    } else {
      setSourceTokenId(undefined);
      setTargetTokenId(undefined);
    }
  }, [tokenOptions]);

  const amountOut = amountIn; // mock: 1:1 just to show output field populated
  const canSwap = amountIn.trim() !== '' && !isSwapping;

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
        <SheetContent
          className="border-none z-[9999] bg-transparent shadow-none p-4 [&>button]:top-10 [&>button]:right-10"
          onInteractOutside={(e) => {
            // Allow overlay clicks to close the sheet by default, but if the
            // interaction originates from Dynamic's user profile (which renders
            // inside a ShadowDOM host with class "dynamic-shadow-dom"), prevent
            // the close and stop propagation.
            const originalEvent: any = (e as any)?.detail?.originalEvent ?? e;
            const composedPath: any[] = originalEvent?.composedPath?.() ?? [];

            const isWithinDynamicUserProfile = composedPath.some(
              (node: any) => {
                if (!node) return false;
                // If the path includes a ShadowRoot, check its host
                if (node instanceof ShadowRoot) {
                  const host: any = (node as any).host;
                  return Boolean(
                    host?.classList?.contains?.('dynamic-shadow-dom')
                  );
                }
                return Boolean(
                  node?.classList?.contains?.('dynamic-shadow-dom')
                );
              }
            );

            if (isWithinDynamicUserProfile) {
              originalEvent?.stopPropagation?.();
              e.preventDefault();
            }
          }}
        >
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

            {/* Actions: Send / Receive */}
            {account && (
              <div className="mt-4 text-left">
                <div className="flex items-center gap-2">
                  <MainButton variant="thin" className="w-1/2 rounded-xl">
                    <ArrowUpRight className="size-4" />
                    Send
                  </MainButton>
                  <MainButton variant="thin" className="w-1/2 rounded-xl">
                    <Download className="size-4" />
                    Receive
                  </MainButton>
                </div>
              </div>
            )}

            {/* Compact Swap (mockup) */}
            {account && tokenOptions.length > 0 && (
              <div className="mt-4 text-left">
                <div className="rounded-2xl px-3 py-3 bg-black/5 dark:bg-white/5">
                  <div className="text-sm text-left font-semibold mb-2 opacity-80 mb-4">
                    Swap
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        inputMode="decimal"
                        pattern="^[0-9]*[.]?[0-9]*$"
                        className="w-1/2 rounded-lg px-3 py-2 text-sm bg-transparent border border-black/10 dark:border-white/10 focus:outline-none"
                        placeholder="0.0"
                        value={amountIn}
                        onChange={(e) => setAmountIn(e.target.value)}
                      />
                      <select
                        className="w-1/2 rounded-lg px-3 py-2 text-sm bg-transparent border border-black/10 dark:border-white/10 focus:outline-none"
                        value={sourceTokenId}
                        onChange={(e) => setSourceTokenId(e.target.value)}
                      >
                        {tokenOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        className="w-1/2 rounded-lg px-3 py-2 text-sm bg-transparent dark:border-white/10 focus:outline-none opacity-70"
                        placeholder="0.0"
                        value={amountOut}
                      />
                      <select
                        className="w-1/2 rounded-lg px-3 py-2 text-sm bg-transparent border border-black/10 dark:border-white/10 focus:outline-none"
                        value={targetTokenId}
                        onChange={(e) => setTargetTokenId(e.target.value)}
                      >
                        {tokenOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end mt-1">
                      <MainButton
                        variant="thin"
                        disabled={!canSwap}
                        onClick={() => {
                          if (!canSwap) return;
                          setIsSwapping(true);
                          setTimeout(() => {
                            setIsSwapping(false);
                            setAmountIn('');
                          }, 3000);
                        }}
                        icon={
                          isSwapping ? (
                            <IconSpinner size={16} />
                          ) : (
                            <ArrowLeftRight className="size-4" />
                          )
                        }
                      >
                        Swap
                      </MainButton>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                <div className="flex flex-col gap-0.5">
                  {sortedBalances.map((bal, idx) => {
                    const cidRaw = bal.chain_id;
                    const cidNum =
                      typeof cidRaw === 'string' ? Number(cidRaw) : cidRaw;
                    const isActive =
                      cidNum != null && decimalChainId === cidNum;
                    const isFirst = idx === 0;
                    const isLast = idx === sortedBalances.length - 1;
                    return (
                      <div
                        key={bal.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          isFirst && isLast
                            ? 'rounded-2xl'
                            : isFirst
                            ? 'rounded-t-2xl'
                            : isLast
                            ? 'rounded-b-2xl'
                            : ''
                        } ${'bg-black/10 dark:bg-white/5'}`}
                      >
                        <div className="flex flex-col items-start flex-1 min-w-0 text-left overflow-hidden">
                          <span className="text-sm opacity-70">
                            {formatChainName(bal.chain_name)}
                          </span>
                          <span className="text-lg font-medium truncate block">
                            {bal.symbol}
                          </span>
                        </div>
                        <div className="text-lg font-medium text-right shrink-0 pl-4">
                          {formatNumberSignificant(Number(bal.balance), 4)}
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
