import React, { useEffect, useState } from 'react';
import { bridge } from '../bridge/GameBridge';
import { GameEvent } from '../core/types';
import { ActiveBuffInfo } from '../core/CombatFSM';

// v9.0.0 "O Que Espera no Pandemônio": bandeja de buffs temporários ativos (Elixires do Mercador,
// Poções de Alquimia, buffs da Relíquia Ativa) no canto superior esquerdo da tela de combate.
// Recebe um snapshot novo a cada frame via `GameEvent.ACTIVE_BUFFS_CHANGED` (emitido por
// `CombatFSM.emitActiveBuffs()`) — não há timer próprio aqui, a contagem regressiva vem direto do
// `remainingMs` mais recente do motor de combate. Tamanho/posição reduzidos no mobile via CSS
// (`.active-buffs-tray`/`.active-buffs-icon` em index.css) para não colidir com o texto "Fase X"
// desenhado pelo Phaser no topo-centro do canvas.
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
    <div className="active-buffs-tray" style={{ position: 'absolute', zIndex: 100, pointerEvents: 'none' }}>
      {buffs.map((buff) => {
        const remainingSec = Math.max(0, Math.ceil(buff.remainingMs / 1000));
        const elapsedFrac = buff.totalMs > 0 ? Math.min(1, Math.max(0, 1 - buff.remainingMs / buff.totalMs)) : 0;
        const wipeDeg = elapsedFrac * 360;

        return (
          <div key={buff.id} className="active-buffs-icon" title={`${buff.label} — ${remainingSec}s restantes`}>
            {/* Ícone da habilidade/buff */}
            <span className="active-buffs-icon-emoji" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}>
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
            <span className="active-buffs-icon-timer">
              {remainingSec}s
            </span>
          </div>
        );
      })}
    </div>
  );
};
