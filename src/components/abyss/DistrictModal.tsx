import React from 'react';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import type { DistrictId, DrownedEcho } from '../../core/types';
import {
  DISTRICT_NAMES, DISTRICT_ICONS, DISTRICT_DRAIN_COST, getRestorationCost, getDistrictSlotCount,
  ECHO_VOCATION_NAMES, ECHO_VOCATION_ICONS, TIDE_BLESSINGS,
} from '../../core/sunkenCitadelFormulas';
import { LeviathanPanel } from './LeviathanPanel';

interface DistrictModalProps {
  id: DistrictId;
  flooded: boolean;
  draining: boolean;
  drainCompletesAt?: number;
  restorationLevel: 0 | 1 | 2 | 3;
  assignedEchoes: DrownedEcho[];
  districtEfficacy: number;
  activeBlessing?: { id: string; expiresAt: number };
  secondActiveBlessing?: { id: string; expiresAt: number };
  tidePhase: 'low' | 'high';
  ownsNereh: boolean;
  onDrain: (id: DistrictId) => void;
  onRestore: (id: DistrictId) => void;
  onBlessing: (id: string) => void;
  onSecondBlessing: (id: string) => void;
  onPurchaseNereh: () => void;
  onClose: () => void;
}

/**
 * v10.2.0 "Os Ecos Afogados" (revisão de fidelidade ao Anexo 3 §2.4) — modal local absoluto
 * (padrão Seção 3.D: nunca fixo global), aberto ao tocar um marcador de distrito no
 * `SubmersaSpriteStage`. Reúne o que antes vivia espalhado no `DistrictCard` de lista: estado/
 * timer/custo, slots de Eco como soquetes circulares, e os painéis especiais (Bênçãos do Templo,
 * Trono/Leviatã) que antes ficavam dentro do card.
 */
export const DistrictModal: React.FC<DistrictModalProps> = ({
  id, flooded, draining, drainCompletesAt, restorationLevel, assignedEchoes, districtEfficacy,
  activeBlessing, secondActiveBlessing, tidePhase, ownsNereh,
  onDrain, onRestore, onBlessing, onSecondBlessing, onPurchaseNereh, onClose,
}) => {
  const drainCountdown = useCountdown(drainCompletesAt);
  const slots = getDistrictSlotCount(restorationLevel);
  const drainCost = DISTRICT_DRAIN_COST[id];
  const restoreCost = !flooded && restorationLevel < 3 ? getRestorationCost(id, (restorationLevel + 1) as 2 | 3) : null;

  const handleDrain = () => { AudioManager.getInstance().playClick(); onDrain(id); };
  const handleRestore = () => { AudioManager.getInstance().playClick(); onRestore(id); };
  const handleClose = () => { AudioManager.getInstance().playClick(); onClose(); };

  const sockets = Array.from({ length: slots }, (_, i) => assignedEchoes[i]);

  return (
    <div
      onClick={handleClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(8, 30, 47, 0.97)', border: '1px solid rgba(34, 211, 238, 0.4)',
          borderRadius: 'var(--radius-md, 10px)', padding: '1rem', maxWidth: '480px', width: '100%',
          maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.7rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem' }}>{DISTRICT_ICONS[id]} {DISTRICT_NAMES[id]}</p>
          <button onClick={handleClose} className="btn btn-xs">✕</button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
          {flooded && !draining && 'Alagado — a função principal ainda não opera.'}
          {draining && `Drenando... conclusão em ${drainCountdown}`}
          {!flooded && `Restaurado ${restorationLevel === 1 ? 'I' : restorationLevel === 2 ? 'II' : 'III'}`}
        </p>
        {!flooded && districtEfficacy > 0 && (
          <p style={{ fontSize: '0.7rem', color: '#a5f3fc' }}>Eficácia acumulada: +{(districtEfficacy * 100).toFixed(1)}%</p>
        )}

        {flooded && !draining && (
          <button onClick={handleDrain} className="btn" style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>
            Drenar — 🦪 {drainCost.pearls} + 🪸 {drainCost.coral} ({drainCost.durationHours}h)
          </button>
        )}
        {restoreCost && (
          <button onClick={handleRestore} className="btn btn-gold" style={{ fontSize: '0.75rem', alignSelf: 'flex-start' }}>
            Restaurar {restorationLevel === 1 ? 'II' : 'III'} — 🦪 {restoreCost.pearls} + 🪸 {restoreCost.coral}
          </button>
        )}
        {!flooded && restorationLevel >= 3 && (
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Restauração máxima.</span>
        )}

        {/* Slots de Eco como soquetes circulares — vazio = tracejado, ocupado = retrato/glifo. */}
        {!flooded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Slots de Eco ({assignedEchoes.length}/{slots}) — aloque pela gaveta de Ecos:</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sockets.map((echo, i) => (
                <div
                  key={i}
                  title={echo ? `${echo.name} (${ECHO_VOCATION_NAMES[echo.vocation]})` : 'Slot vazio'}
                  style={{
                    width: '48px', height: '48px', borderRadius: '999px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                    border: echo ? '2px solid #22d3ee' : '2px dashed rgba(255,255,255,0.25)',
                    background: echo ? 'rgba(14, 116, 144, 0.35)' : 'transparent',
                  }}
                >
                  {echo ? ECHO_VOCATION_ICONS[echo.vocation] : '·'}
                </div>
              ))}
            </div>
            {assignedEchoes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {assignedEchoes.map((e) => (
                  <span key={e.id} style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.6)' }}>
                    {ECHO_VOCATION_ICONS[e.vocation]} {e.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {id === 'throne' && restorationLevel >= 1 && <LeviathanPanel />}

        {id === 'temple' && restorationLevel >= 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
            {!ownsNereh && (
              <button onClick={onPurchaseNereh} className="btn btn-xs" style={{ fontSize: '0.68rem', alignSelf: 'flex-start' }}>
                🜄 Comprar Nereh, a Maré Primeira — 200 🦪
              </button>
            )}
            {activeBlessing ? (
              <span style={{ fontSize: '0.7rem', color: '#fde047' }}>
                🕍 Bênção ativa: {TIDE_BLESSINGS.find(b => b.id === activeBlessing.id)?.name}
              </span>
            ) : tidePhase === 'high' ? (
              <>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>Escolha a Bênção da Maré Alta:</span>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {TIDE_BLESSINGS.map(b => (
                    <button key={b.id} onClick={() => onBlessing(b.id)} className="btn btn-xs" title={b.desc} style={{ fontSize: '0.65rem' }}>
                      {b.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Bênçãos só podem ser escolhidas na Maré Alta.</span>
            )}
            {restorationLevel >= 3 && tidePhase === 'high' && (
              secondActiveBlessing ? (
                <span style={{ fontSize: '0.68rem', color: '#fde047' }}>
                  🕍 2ª Bênção (50%): {TIDE_BLESSINGS.find(b => b.id === secondActiveBlessing.id)?.name}
                </span>
              ) : (
                <>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Restauração III: escolha uma 2ª Bênção (50% de força):</span>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {TIDE_BLESSINGS.map(b => (
                      <button key={b.id} onClick={() => onSecondBlessing(b.id)} className="btn btn-xs" title={b.desc} style={{ fontSize: '0.65rem' }}>
                        {b.name}
                      </button>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
