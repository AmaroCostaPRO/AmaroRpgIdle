import React, { useEffect } from 'react';

interface ItemUseToastProps {
  message: string | null;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export const ItemUseToast: React.FC<ItemUseToastProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  const color = type === 'success' ? '#34d399' : '#f87171';
  const glow = type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(248,113,113,0.35)';

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'absolute',
        top: '0.75rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        maxWidth: '90%',
        background: 'rgba(15, 11, 25, 0.95)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: `1px solid ${color}66`,
        borderRadius: 'var(--radius-md)',
        padding: '0.5rem 0.9rem',
        boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 10px ${glow}`,
        color,
        fontSize: '0.68rem',
        fontWeight: 700,
        textAlign: 'center',
        cursor: 'pointer',
        animation: 'fadeInRight 0.25s ease-out',
        pointerEvents: 'auto'
      }}
    >
      {message}
    </div>
  );
};
