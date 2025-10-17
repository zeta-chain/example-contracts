import { getBytes, hexlify } from 'ethers';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { USE_DYNAMIC_WALLET } from '../constants/wallets';

interface UnisatBitcoinAccount {
  address: string;
  publicKey: string;
  type: 'payment' | 'ordinals';
}

type UnisatChain =
  | 'BITCOIN_MAINNET'
  | 'BITCOIN_TESTNET'
  | 'BITCOIN_TESTNET4'
  | 'BITCOIN_SIGNET'
  | 'FRACTAL_BITCOIN_MAINNET'
  | 'FRACTAL_BITCOIN_TESTNET';

export interface UnisatChainDetail {
  enum: UnisatChain;
  name: string;
  network: string;
}

export interface UnisatWalletContextType {
  connected: boolean;
  connecting: boolean;
  accounts: UnisatBitcoinAccount[];
  rdns: string;
  paymentAccount: UnisatBitcoinAccount | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signPSBT: (
    psbt: string,
    inputsToSign: { address: string; signingIndexes: number[] }[]
  ) => Promise<string>;
  getChain: () => Promise<UnisatChainDetail>;
  switchChain: (chain: UnisatChain) => Promise<void>;
}

const UnisatWalletContext = createContext<UnisatWalletContextType | undefined>(
  undefined
);

interface UnisatProvider {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getPublicKey: () => Promise<string>;
  signPsbt: (
    psbtHex: string,
    options?: {
      autoFinalized?: boolean;
      toSignInputs?: { index: number; address?: string }[];
    }
  ) => Promise<string>;
  switchChain: (chain: UnisatChain) => Promise<void>;
  getChain: () => Promise<UnisatChainDetail>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
}

const getUnisat = () =>
  (window as unknown as { unisat?: UnisatProvider }).unisat;

// Stub provider for when USE_DYNAMIC_WALLET is true
const StubUnisatWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const stubValue: UnisatWalletContextType = {
    connected: false,
    connecting: false,
    accounts: [],
    rdns: '',
    paymentAccount: null,
    connect: async () => {
      throw new Error('Unisat wallet not available with Dynamic wallet');
    },
    disconnect: () => {},
    signPSBT: async () => {
      throw new Error('Unisat wallet not available with Dynamic wallet');
    },
    getChain: async () => {
      throw new Error('Unisat wallet not available with Dynamic wallet');
    },
    switchChain: async () => {
      throw new Error('Unisat wallet not available with Dynamic wallet');
    },
  };

  return (
    <UnisatWalletContext.Provider value={stubValue}>
      {children}
    </UnisatWalletContext.Provider>
  );
};

const ActualUnisatWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [accounts, setAccounts] = useState<UnisatBitcoinAccount[]>([]);

  const handleAccountUpdate = async (address: string) => {
    const unisat = getUnisat();
    if (!unisat) return;

    try {
      const publicKey = await unisat.getPublicKey();
      const formattedAccounts: UnisatBitcoinAccount[] = [
        {
          address,
          publicKey,
          type: 'payment',
        },
      ];
      setAccounts(formattedAccounts);
      setConnected(true);
    } catch (error) {
      console.error('Failed to get account details:', error);
    }
  };

  const connect = async () => {
    const unisat = getUnisat();
    if (!unisat) {
      alert(
        'Unisat wallet not found! Please install Unisat: https://unisat.io/'
      );
      window.open('https://unisat.io/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      const accounts = await unisat.requestAccounts();

      if (accounts.length === 0) {
        throw new Error('No accounts returned from Unisat');
      }

      await handleAccountUpdate(accounts[0]);
    } catch (error) {
      console.error('Failed to connect to Unisat:', error);
      alert('Failed to connect to Unisat wallet');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = useCallback(() => {
    setAccounts([]);
    setConnected(false);
  }, []);

  useEffect(() => {
    const unisat = getUnisat();
    if (!unisat) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        disconnect();
      } else {
        handleAccountUpdate(accountsArray[0]);
      }
    };

    unisat.on('accountsChanged', handleAccountsChanged);

    return () => {
      unisat.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [disconnect]);

  const signPSBT = async (
    psbtBase64: string,
    inputsToSign: { address: string; signingIndexes: number[] }[]
  ): Promise<string> => {
    const unisat = getUnisat();
    if (!unisat) {
      throw new Error('Unisat wallet not connected');
    }

    try {
      // Convert base64 PSBT to hex for Unisat
      const psbtHex = hexlify(
        Uint8Array.from(atob(psbtBase64), (c) => c.charCodeAt(0))
      ).slice(2);

      // Convert inputsToSign to Unisat's format
      const toSignInputs = inputsToSign.flatMap(({ address, signingIndexes }) =>
        signingIndexes.map((index) => ({ index, address }))
      );

      // Unisat returns hex-encoded signed PSBT
      const signedPsbtHex = await unisat.signPsbt(psbtHex, {
        autoFinalized: false,
        toSignInputs,
      });

      // Convert hex back to base64 for our functions
      const signedPsbtBase64 = btoa(
        String.fromCharCode(...getBytes('0x' + signedPsbtHex))
      );

      return signedPsbtBase64;
    } catch (error) {
      console.error('Failed to sign PSBT:', error);
      throw error;
    }
  };

  const getChain = async (): Promise<UnisatChainDetail> => {
    const unisat = getUnisat();
    if (!unisat) {
      throw new Error('Unisat wallet not connected');
    }

    try {
      return await unisat.getChain();
    } catch (error) {
      console.error('Failed to get network:', error);
      throw error;
    }
  };

  const switchChain = async (chain: UnisatChain): Promise<void> => {
    const unisat = getUnisat();
    if (!unisat) {
      throw new Error('Unisat wallet not connected');
    }

    try {
      await unisat.switchChain(chain);
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  };

  const paymentAccount = accounts.find((acc) => acc.type === 'payment') || null;

  const rdns = 'io.unisat';

  return (
    <UnisatWalletContext.Provider
      value={{
        accounts,
        connect,
        connected,
        connecting,
        disconnect,
        paymentAccount,
        rdns,
        signPSBT,
        getChain,
        switchChain,
      }}
    >
      {children}
    </UnisatWalletContext.Provider>
  );
};

export const UnisatWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return USE_DYNAMIC_WALLET ? (
    <StubUnisatWalletProvider>{children}</StubUnisatWalletProvider>
  ) : (
    <ActualUnisatWalletProvider>{children}</ActualUnisatWalletProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUnisatWallet = () => {
  const context = useContext(UnisatWalletContext);
  if (context === undefined) {
    throw new Error(
      'useUnisatWallet must be used within a UnisatWalletProvider'
    );
  }
  return context;
};
