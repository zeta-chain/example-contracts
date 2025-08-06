import './ConnectDynamicWallet.css';

import Wallet, { connect, disconnect, onEvent } from '@zetachain/wallet';
import { useEffect, useState } from 'react';

import { Button } from './Button';
import { IconWallet } from './icons';

export const ConnectDynamicWallet = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState(false);
  const [wallets, setWallets] = useState<
    Array<{ id: string; address?: string }>
  >([]);

  // Handle connection events and wallet updates
  useEffect(() => {
    // Initial wallet check
    const checkWallets = () => {
      const currentWallets = Wallet.wallets || [];
      setWallets(currentWallets);
      setIsConnected(currentWallets.length > 0);
    };

    checkWallets();

    const unsubscribeConnect = onEvent(Wallet, 'connect', () => {
      setConnecting(false);
      checkWallets();
    });

    const unsubscribeDisconnect = onEvent(Wallet, 'disconnect', () => {
      setConnecting(false);
      checkWallets();
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect(Wallet);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect(Wallet);
  };

  // Display connect button when disconnected
  if (!isConnected) {
    return (
      <Button
        icon={<IconWallet />}
        className="header-connect-wallet-button"
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : 'Connect Dynamic Wallet'}
      </Button>
    );
  }

  // Display connected wallet interface
  return (
    <div className="connected-wallet-container">
      {wallets.map((wallet) => (
        <div key={wallet.id} className="wallet-item">
          <div className="wallet-info">
            <span className="wallet-address">
              {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
            </span>
          </div>
          <Button onClick={handleDisconnect} className="disconnect-button">
            Disconnect
          </Button>
        </div>
      ))}
    </div>
  );
};
