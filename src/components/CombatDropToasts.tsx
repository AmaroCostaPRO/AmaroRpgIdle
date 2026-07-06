import React, { useState, useEffect } from 'react';
import { bridge } from '../bridge/GameBridge';
import { GameEvent, EquipmentItem } from '../core/types';
import { AudioManager } from '../core/AudioManager';

interface DropToastItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  glowColor: string;
}

export const CombatDropToasts: React.FC = () => {
  const [toasts, setToasts] = useState<DropToastItem[]>([]);

  useEffect(() => {
    const unsub = bridge.subscribe(GameEvent.ITEM_DROPPED, (payload) => {
      const item = payload.item as EquipmentItem;
      if (!item) return;

      // Interceptar apenas Chaves da Torre e Fragmentos de Alma Instável (Fragmentos de Relíquia)
      const isKey = item.consumableType === 'tower_key';
      const isFragment = item.consumableType === 'unstable_soul_fragment';

      if (isKey || isFragment) {
        const toastId = item.id || `drop-${Date.now()}-${Math.random()}`;
        const newToast: DropToastItem = {
          id: toastId,
          name: isKey ? 'Chave da Torre' : 'Fragmento de Relíquia',
          icon: isKey ? '🔑' : '✨',
          color: isKey ? '#fbbf24' : '#c084fc', // Amarelo/Gold para chave, Roxo/Claro para Fragmento
          glowColor: isKey ? 'rgba(251, 191, 36, 0.3)' : 'rgba(192, 132, 252, 0.3)'
        };

        setToasts((prev) => [...prev, newToast]);
        AudioManager.getInstance().playCoin();

        // Auto dispensar após 4 segundos
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 4000);
      }
    });

    return () => unsub();
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '0.75rem',
        right: '0.75rem',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleDismiss(toast.id)}
          style={{
            background: 'rgba(15, 11, 25, 0.9)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: `1px solid ${toast.color}40`,
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px ${toast.glowColor}`,
            animation: 'fadeInRight 0.25s ease-out',
            pointerEvents: 'auto',
            cursor: 'pointer',
            maxWidth: '180px',
            transition: 'transform 0.15s ease, opacity 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.border = `1px solid ${toast.color}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.border = `1px solid ${toast.color}40`;
          }}
        >
          {/* Ícone */}
          <div
            style={{
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${toast.color}20`,
              boxShadow: `0 0 6px ${toast.glowColor}`,
              flexShrink: 0
            }}
          >
            {toast.icon}
          </div>
          
          {/* Textos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.52rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Novo Drop!
            </span>
            <span style={{ fontSize: '0.62rem', color: '#fff', fontWeight: 800 }}>
              {toast.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
