import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { AudioManager } from '../core/AudioManager';

export const ShopPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buyConsumable = useGameStore((state) => state.buyConsumable);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmBuyId, setConfirmBuyId] = useState<'chest_legendary' | 'chest_ancestral' | 'boost_touch' | 'boost_touch_x3' | 'relic_chest' | null>(null);

  const shopItems = [
    {
      id: 'chest_legendary' as const,
      name: 'Baú de Equipamento Lendário',
      description: 'Contém de 1 a 3 equipamentos Lendários aleatórios adequados para a sua classe atual.',
      cost: 500,
      icon: '🎁',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      badge: 'Lendário'
    },
    {
      id: 'chest_ancestral' as const,
      name: 'Baú de Equipamento Ancestral',
      description: 'Contém de 1 a 3 equipamentos Ancestrais aleatórios de extremo poder para a sua classe atual.',
      cost: 3000, // Ajustado de 1000 para 3000
      icon: '✨🎁✨',
      color: '#a78bfa',
      bgColor: 'rgba(167, 139, 250, 0.08)',
      borderColor: 'rgba(167, 139, 250, 0.3)',
      badge: 'Ancestral'
    },
    {
      id: 'boost_touch' as const,
      name: 'Boost de Toque (Frenesi)',
      description: 'Consumível que ativa instantaneamente o Frenesi de Toques Críticos automáticos por 1 minuto.',
      cost: 1000, // Ajustado de 500 para 1000
      icon: '⚡',
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.08)',
      borderColor: 'rgba(6, 182, 212, 0.3)',
      badge: 'Boost'
    },
    {
      id: 'boost_touch_x3' as const,
      name: 'Boost de Toque x3 (Frenesi)',
      description: 'Consumível que ativa instantaneamente o Frenesi de Toques Críticos automáticos por 3 minutos.',
      cost: 5000,
      icon: '⚡⚡⚡',
      color: '#38bdf8',
      bgColor: 'rgba(56, 189, 248, 0.08)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
      badge: 'Boost x3'
    },
    {
      id: 'relic_chest' as const,
      name: 'Baú de Relíquias',
      description: 'Contém 3 Fragmentos de Alma Instável para uso no Altar de Relíquias. Forje e aprimore suas relíquias mais rapidamente.',
      cost: 50000,
      icon: '💜🏺💜',
      color: '#c084fc',
      bgColor: 'rgba(192, 132, 252, 0.08)',
      borderColor: 'rgba(192, 132, 252, 0.3)',
      badge: 'Relíquias'
    }
  ];

  const handleBuy = (itemId: 'chest_legendary' | 'chest_ancestral' | 'boost_touch' | 'boost_touch_x3' | 'relic_chest') => {
    AudioManager.getInstance().playCoin();
    const result = buyConsumable(itemId);
    
    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: result.message });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>Loja de Suprimentos</h2>
          <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>Compre baús de equipamentos e boosts temporários usando seu ouro.</p>
        </div>
        <div className="font-mono" style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(251,191,36,0.08)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.18)' }}>
          <span>🪙</span>
          <span>{(character.gold || 0).toLocaleString()} Ouro</span>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.65rem',
          textAlign: 'center',
          fontWeight: 600,
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: feedback.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: feedback.type === 'success' ? '#34d399' : '#f87171',
          animation: 'fadeIn 0.2s ease'
        }}>
          {feedback.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {shopItems.map((item) => {
          const canAfford = (character.gold || 0) >= item.cost;
          const isInvFull = character.inventory.length >= character.inventorySlots;
          
          return (
            <div 
              key={item.id}
              className="shop-card"
              style={{
                background: item.bgColor,
                border: `1px solid ${item.borderColor}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                fontSize: '0.5rem',
                fontWeight: 700,
                color: item.color,
                background: item.bgColor,
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {item.badge}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ 
                  fontSize: '2rem', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '60px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  {item.icon}
                </div>
                
                <h3 className="font-heading" style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: item.color, textAlign: 'center' }}>
                  {item.name}
                </h3>
                
                <p style={{ fontSize: '0.62rem', color: '#94a3b8', margin: 0, lineHeight: 1.4, textAlign: 'center' }}>
                  {item.description}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: '#fbbf24' }}>
                  <span>🪙</span>
                  <span>{item.cost} Ouro</span>
                </div>

                <button
                  onClick={() => {
                    if (confirmBuyId === item.id) {
                      handleBuy(item.id);
                      setConfirmBuyId(null);
                    } else {
                      AudioManager.getInstance().playClick();
                      setConfirmBuyId(item.id);
                      // Auto reseta a confirmação após 3 segundos
                      setTimeout(() => {
                        setConfirmBuyId(current => current === item.id ? null : current);
                      }, 3000);
                    }
                  }}
                  disabled={!canAfford || isInvFull}
                  className={`btn btn-sm ${canAfford && !isInvFull ? 'btn-gold' : 'btn-disabled'}`}
                  style={{ 
                    width: '100%',
                    opacity: (canAfford && !isInvFull) ? 1 : 0.5,
                    cursor: (canAfford && !isInvFull) ? 'pointer' : 'not-allowed',
                    background: confirmBuyId === item.id ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
                    borderColor: confirmBuyId === item.id ? '#10b981' : undefined,
                    color: confirmBuyId === item.id ? '#fff' : undefined,
                  }}
                >
                  {!canAfford 
                    ? 'Ouro Insuficiente' 
                    : isInvFull 
                      ? 'Inventário Cheio' 
                      : confirmBuyId === item.id 
                        ? 'Confirmar?' 
                        : 'Comprar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
