import React from 'react';
import { AudioManager } from '../../core/AudioManager';

interface ModalCloseButtonProps {
  onClick: () => void;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  playSound?: boolean;
}

export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({
  onClick,
  size = 28,
  className = '',
  style,
  playSound = true,
}) => {
  const handleClick = () => {
    if (playSound) AudioManager.getInstance().playClick();
    onClick();
  };

  return (
    <button
      type="button"
      aria-label="Fechar"
      onClick={handleClick}
      className={`modal-close-btn ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="5" y1="5" x2="19" y2="19" />
        <line x1="19" y1="5" x2="5" y2="19" />
      </svg>
    </button>
  );
};
