import { ConnectWallet } from './components/ConnectWallet';

export function DisconnectedContent() {
  return (
    <div className="main-container">
      <h1>Call a Universal App</h1>
      <p>
        Connect your EVM wallet and trigger the Universal Hello contract already
        live on ZetaChain testnet from any of our supported EVM chains.
      </p>
      <ConnectWallet />
    </div>
  );
}
