import './DisconnectedContent.css';

import { ConnectWallet } from './components/ConnectWallet';
import { IconAnimation } from './components/icons/IconAnimation';
import { IconZetaChainLogo } from './components/icons/IconZetaChainLogo';
import { Footer } from './Footer';

export function DisconnectedContent() {
  return (
    <div className="main-container">
      <div className="hero-content-container">
        <div className="hero-content">
          <div className="hero-content-header">
            <h1 className="hero-content-header-title">Call a Universal App</h1>
            <div className="hero-content-header-logo">
              <span className="hero-content-header-logo-text">from </span>
              <IconZetaChainLogo />
            </div>
          </div>
          <p className="hero-content-description">
            Connect your EVM wallet and trigger the Universal Hello contract on
            ZetaChain testnet from any currently supported EVM chain.
          </p>
          <ConnectWallet />
        </div>
        <div className="hero-content-animation">
          <IconAnimation />
        </div>
      </div>
      <Footer />
    </div>
  );
}
