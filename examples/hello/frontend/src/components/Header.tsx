import './Header.css';

import { SUPPORTED_CHAINS } from '../constants/chains';
import { useWallet } from '../hooks/useWallet';
import { truncateAddress } from '../utils/truncate';
import { Button } from './Button';
import { IconWallet } from './icons';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const { account, disconnectWallet, decimalChainId, selectedProvider } =
    useWallet();

  const supportedChain = SUPPORTED_CHAINS.find(
    (chain) => chain.chainId === decimalChainId
  );

  return (
    <div className="header-container">
      <div className="header-controls">
        {!account ? (
          <Button
            icon={<IconWallet />}
            className="header-connect-wallet-button"
          >
            Connect Wallet
          </Button>
        ) : (
          <div className="header-connected-container">
            <div>
              <div className="header-chain-icon-container">
                <img
                  src={
                    supportedChain?.icon ||
                    '/logos/network-placeholder-logo.svg'
                  }
                  alt={supportedChain?.name || 'Unsupported network'}
                  className="header-chain-icon"
                />
              </div>
              <div className="header-provider-container">
                <img
                  src={selectedProvider?.info.icon}
                  alt={selectedProvider?.info.name}
                  className="header-provider-icon"
                />
                <span className="lg-only">{truncateAddress(account)}</span>
              </div>
            </div>
            <button
              className="header-disconnect-button"
              type="button"
              onClick={disconnectWallet}
            >
              <span>X</span>
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};
