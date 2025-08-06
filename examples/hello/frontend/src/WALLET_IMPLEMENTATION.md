# Wallet Implementation Switch

This app supports two wallet implementations:

## 1. EIP-6963 Wallet (Original)

- **File**: `context/WalletProvider.tsx`
- **Features**: Native browser extension wallet detection (MetaMask, Rabby, etc.)
- **Components**: `ConnectEip6963Wallet.tsx`

## 2. Dynamic Wallet (New)

- **File**: `context/DynamicWalletProvider.tsx`
- **Features**: Email, social login, and external wallet support through Dynamic
- **Components**: `ConnectDynamicWallet.tsx`

## How to Switch

Edit `src/main.tsx` and change the `USE_DYNAMIC_WALLET` flag:

```typescript
// Use Dynamic Wallet (email, social, external wallets)
const USE_DYNAMIC_WALLET = true;

// Use EIP-6963 Wallet (browser extensions only)
const USE_DYNAMIC_WALLET = false;
```

## Key Architecture

Both implementations provide the **same interface** through `useWallet()`:

```typescript
const {
  account,
  selectedProvider,
  decimalChainId,
  isConnected,
  connectWallet,
  disconnectWallet,
} = useWallet();
```

This means:

- ✅ **AppContent.tsx** works with both implementations
- ✅ **All existing components** work unchanged
- ✅ **State management** is identical
- ✅ **Easy switching** between implementations

## Dynamic Implementation Details

The `DynamicWalletProvider`:

1. **Wraps** `@zetachain/wallet` (Dynamic Global Wallet)
2. **Maps** Dynamic events to the EIP-6963 interface
3. **Creates mock** `EIP6963ProviderDetail` objects for compatibility
4. **Handles** multiple auth methods through Dynamic's popup

This maintains full backward compatibility while adding Dynamic's features!

## Chain Switching

### Universal Chain Switching Hook

The app uses `useUniversalSwitchChain()` which automatically detects the wallet implementation and routes to the correct chain switching method:

```typescript
// In ConnectedContent.tsx
const { switchChain } = useUniversalSwitchChain();

const handleNetworkSelect = (chain: SupportedChain) => {
  switchChain(chain.chainId);
};
```

### Implementation Details

1. **EIP-6963 Chain Switching**: `useSwitchChain.ts` (original)
2. **Dynamic Chain Switching**: `useDynamicSwitchChain.ts` (new)
3. **Universal Hook**: `useUniversalSwitchChain.ts` (auto-detects)

The universal hook:

- **Detects** which wallet system is active by checking `selectedProvider.info.rdns`
- **Routes** to the appropriate chain switching implementation
- **Maintains** the same interface for both systems

This ensures chain switching works seamlessly regardless of which wallet implementation is active!
