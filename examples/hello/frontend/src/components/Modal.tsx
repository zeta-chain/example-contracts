import './Modal.css';

import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="subheading modal-title">{title}</h2>
        {children}
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
