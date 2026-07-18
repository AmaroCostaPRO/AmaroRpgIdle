import React, { useEffect, useState } from 'react';
import { bridge } from '../bridge/GameBridge';
import { GameEvent } from '../core/types';
import { ActiveBuffInfo } from '../core/CombatFSM';

// v9.0.0 "O Que Espera no Pandemônio": bandeja de buffs temporários ativos (Elixires do Mercador,
// Poções de Alquimia, buffs da Relíquia Ativa) no canto superior esquerdo da tela de combate.
// Recebe um snapshot novo a cada frame via `GameEvent.ACTIVE_BUFFS_CHANGED` (emitido por
// `CombatFSM.emitActiveBuffs()`) — não há timer próprio aqui, a contagem regressiva vem direto do
// `remainingMs` mais recente do motor de combate.
export const ActiveBuffsTray: React.FC = () => {
  const [buffs, setBuffs] = useState<ActiveBuffInfo[]>([]);

  useEffect(() => {
    const unsubscribe = bridge.subscribe(GameEvent.ACTIVE_BUFFS_CHANGED, (payload: any) => {
      setBuffs(payload?.buffs || []);
    });
    return () => unsubscribe();
  }, []);

  if (buffs.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '0.75rem',
        left: '0.75rem',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '0.4rem',
        maxWidth: 'calc(100% - 1.5rem)',
        pointerEvents: 'none'
      }}
    >
      {buffs.map((buff) => {
        const remainingSec = Math.max(0, Math.ceil(buff.remainingMs / 1000));
        const elapsedFrac = buff.totalMs > 0 ? Math.min(1, Math.max(0, 1 - buff.remainingMs / buff.totalMs)) : 0;
        const wipeDeg = elapsedFrac * 360;

        return (
          <div
            key={buff.id}
            title={`${buff.label} — ${remainingSec}s restantes`}
            style={{
              position: 'relative',
              width: '2.3rem',
              height: '2.3rem',
              borderRadius: '0.5rem',
              background: 'rgba(15, 11, 25, 0.85)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {/* Ícone da habilidade/buff */}
            <span style={{ fontSize: '1.1rem', lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}>
              {buff.icon}
            </span>

            {/* "Relógio" de progresso: fatia escura crescente (0deg no início do buff, 360deg quando acaba) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `conic-gradient(rgba(8, 6, 12, 0.72) ${wipeDeg}deg, transparent ${wipeDeg}deg 360deg)`,
                pointerEvents: 'none'
              }}
            />

            {/* Contagem regressiva numérica */}
            <span
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '2px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5rem',
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)',
                lineHeight: 1
              }}
            >
              {remainingSec}s
            </span>
          </div>
        );
      })}
    </div>
  );
};
