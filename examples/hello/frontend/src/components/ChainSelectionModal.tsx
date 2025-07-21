import { SUPPORTED_CHAINS, type SupportedChain } from '../constants/chains';
import { Modal } from './Modal';

interface ChainSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchChain: (chain: SupportedChain) => void;
}

export const ChainSelectionModal = ({
  isOpen,
  onClose,
  onSwitchChain,
}: ChainSelectionModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Switch network">
      <div className="item-list">
        {SUPPORTED_CHAINS.map((chain) => (
          <button
            key={chain.chainId}
            className="item-button"
            onClick={() => onSwitchChain(chain)}
          >
            <img src={chain.icon} alt={chain.name} className="item-icon" />
            <span>{chain.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};
