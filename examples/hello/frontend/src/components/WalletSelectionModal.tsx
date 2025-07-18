import './WalletSelectionModal.css';

import type { EIP6963ProviderDetail } from '../types/wallet';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: EIP6963ProviderDetail[];
  onConnect: (provider: EIP6963ProviderDetail) => void;
}

export const WalletSelectionModal = ({
  isOpen,
  onClose,
  providers,
  onConnect,
}: WalletSelectionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="subheading modal-title">Select a Wallet</h2>
        <div className="provider-list">
          {providers.map((provider) => (
            <button
              key={provider.info.uuid}
              className="provider-button"
              onClick={() => onConnect(provider)}
            >
              <img
                src={provider.info.icon}
                alt={provider.info.name}
                className="provider-icon"
              />
              <span>{provider.info.name}</span>
            </button>
          ))}
        </div>
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
