import type { EIP6963ProviderDetail } from '../types/wallet';
import { Modal } from './Modal';

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect a Wallet">
      <div className="item-list">
        {providers.map((provider) => (
          <button
            key={provider.info.uuid}
            className="item-button"
            onClick={() => onConnect(provider)}
            aria-label={`Connect ${provider.info.name} wallet`}
          >
            <img
              src={provider.info.icon}
              alt={`${provider.info.name} wallet icon`}
              className="item-icon"
              loading="lazy"
            />
            <span>{provider.info.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};
