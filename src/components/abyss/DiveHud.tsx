import React from 'react';
import { useDiveStore } from '../../store/useDiveStore';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import {
  AirPocketChoice, SHALLOW_DIVE_MAX_DEPTH, getZoneForDepth, ZONE_INFO, isGuardianDepth,
  isFullDepthsUnlocked, getPressureMultiplier,
} from '../../core/abyssFormulas';

/**
 * v10.0.0 — HUD dos Mergulhos Rasos: barra de Fôlego, profundidade, recompensas não-bancadas e o
 * modal do Bolsão de Ar (padrão do modal do Mercador Ambulante: FSM pausado em AIR_POCKET até a
 * escolha). "Subir à Superfície" só é possível FORA de combate — na prática, nos Bolsões de Ar
 * (o único momento sem inimigo na frente), que é exatamente a decisão push-your-luck do modo.
 *
 * Nota de performance: `breath` no useDiveStore é sincronizado pelo FSM a cada ~250ms (nunca por
 * frame), então este componente re-renderiza no máximo 4x/s durante a descida.
 */
export const DiveHud: React.FC = () => {
  const diveActive = useDiveStore((s) => s.diveActive);
  const currentDepth = useDiveStore((s) => s.currentDepth);
  const breath = useDiveStore((s) => s.breath);
  const drowning = useDiveStore((s) => s.drowning);
  const airPocketOpen = useDiveStore((s) => s.airPocketOpen);
  const bankedPearls = useDiveStore((s) => s.bankedPearls);
  const bankedCoral = useDiveStore((s) => s.bankedCoral);
  const bankedRunes = useDiveStore((s) => s.bankedRunes);
  const airPocketPearlBonus = useDiveStore((s) => s.airPocketPearlBonus);
  const resolveAirPocket = useDiveStore((s) => s.resolveAirPocket);
  const surface = useDiveStore((s) => s.surface);
  const highestStageReached = useGameStore((s) => s.character.highestStageReached || 1);
  const suitLevel = useGameStore((s) => s.character.abyss?.divingSuitLevel || 0);

  if (!diveActive) return null;

  const runeCount = Object.values(bankedRunes).reduce((sum, q) => sum + (q || 0), 0);
  const breathColor = breath > 50 ? '#22d3ee' : breath > 25 ? '#f59e0b' : '#ef4444';
  const zone = getZoneForDepth(currentDepth);
  const zoneInfo = ZONE_INFO[zone];
  const fullDepths = isFullDepthsUnlocked(highestStageReached);
  const pressureMult = fullDepths ? getPressureMultiplier(currentDepth, suitLevel) : 1;

  const handleChoice = (choice: AirPocketChoice) => {
    AudioManager.getInstance().playClick();
    resolveAirPocket(choice);
  };

  const handleSurface = () => {
    AudioManager.getInstance().playClick();
    surface('voluntary');
  };

  const choiceCard = (choice: AirPocketChoice, icon: string, title: string, desc: string) => (
    <button
      key={choice}
      onClick={() => handleChoice(choice)}
      className="btn"
      style={{
        flex: 1, minWidth: '110px', padding: '0.7rem 0.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
        background: 'rgba(8, 47, 73, 0.85)', border: '1px solid rgba(34, 211, 238, 0.5)',
        borderRadius: '8px', color: '#fff',
      }}
    >
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)' }}>{desc}</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'auto' }}>
      {/* Barra de Fôlego + profundidade */}
      <div style={{
        background: 'rgba(2, 20, 34, 0.9)', border: `1px solid ${drowning ? '#ef4444' : zoneInfo.color}66`,
        borderRadius: '8px', padding: '0.55rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
          <span style={{ fontWeight: 800, letterSpacing: '1px' }}>
            🤿 PROFUNDIDADE {currentDepth} · {zoneInfo.name.toUpperCase()}{isGuardianDepth(currentDepth) ? ' · 👑 GUARDIÃO' : ''}
          </span>
          <span style={{ color: breathColor, fontWeight: 700 }}>
            {drowning ? '🫧 AFOGANDO! (dano ×2)' : `Fôlego ${Math.ceil(breath)}%`}
          </span>
        </div>
        <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.max(0, Math.min(100, breath))}%`,
            background: breathColor, transition: 'width 0.25s linear',
            animation: breath <= 25 && !drowning ? 'pulse 1s infinite' : undefined,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)' }}>
          <span>
            Acumulado: 🦪 {bankedPearls}{airPocketPearlBonus > 0 ? ` (+${Math.round(airPocketPearlBonus * 100)}%)` : ''} · 🪸 {bankedCoral} · 📜 {runeCount}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
            {fullDepths ? `⚠️ Pressão ×${pressureMult.toFixed(2)} · ` : ''}morte afogada: −50% · morte: −25%
          </span>
        </div>
      </div>

      {/* Bolsão de Ar — escolha única (padrão do painel do Mercador) */}
      {airPocketOpen && (
        <div style={{
          background: 'rgba(2, 20, 34, 0.95)', border: '1px solid rgba(125, 211, 252, 0.6)',
          borderRadius: '10px', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem',
        }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>🫧 BOLSÃO DE AR — Profundidade {currentDepth}</p>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>
            Uma bolsa de ar presa sob um arco de coral. Recupere o fôlego, vasculhe... ou suba com tudo o que acumulou.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {choiceCard('breath', '💨', 'Respirar fundo', '+60% de Fôlego')}
            {choiceCard('rune', '📜', 'Vasculhar a fenda', '+1 Runa da zona')}
            {choiceCard('pearls', '🦪', 'Colher ostras', '+25% de Pérolas na descida')}
          </div>
          <button onClick={handleSurface} className="btn btn-gold" style={{ alignSelf: 'center', marginTop: '0.2rem' }}>
            ⬆ SUBIR À SUPERFÍCIE (banca 100%)
          </button>
          {(fullDepths || currentDepth < SHALLOW_DIVE_MAX_DEPTH) && (
            <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              Subir encerra a descida. Descer é por sua conta e risco.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
