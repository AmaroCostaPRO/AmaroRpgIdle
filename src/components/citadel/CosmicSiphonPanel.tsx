import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';

const COSMIC_SIPHON_MAX_LEVEL = 5;

export const CosmicSiphonPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeCosmicSiphon = useGameStore((state) => state.buildOrUpgradeCosmicSiphon);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const essence = character.transcendenceEssence || 0;
  const siphon = citadel?.cosmicSiphon || { level: 0, lastTick: 0 };
  const isBuilt = siphon.level > 0;
  const nextLevel = siphon.level + 1;
  const cost = {
    stone: Math.round(1500 * Math.pow(1.6, nextLevel - 1)),
    wood: Math.round(1000 * Math.pow(1.6, nextLevel - 1)),
    transcendenceEssence: Math.round(50 * Math.pow(1.6, nextLevel - 1)),
  };
  const canAffordUpgrade = materials.stone >= cost.stone && materials.wood >= cost.wood && essence >= cost.transcendenceEssence;
  const manaDrainPct = Math.max(0, 1.5 - siphon.level * 0.3);
  const cooldownErosionPct = Math.max(0, 15 - siphon.level * 3);

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeCosmicSiphon();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-300)' }}>
            🌫️ Sifão de Essência Cósmica {isBuilt ? `— Nível ${siphon.level}` : '(Não construído)'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
            Neutraliza as penalidades ambientais sofridas na zona espelho da Ecoterra.
          </p>
        </div>
      </div>

      {siphon.level < COSMIC_SIPHON_MAX_LEVEL ? (
        <button
          onClick={handleUpgrade}
          disabled={!canAffordUpgrade}
          style={{
            alignSelf: 'flex-start',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-accent)',
            background: 'var(--surface-3)',
            color: 'var(--gold-300)',
            cursor: canAffordUpgrade ? 'pointer' : 'not-allowed',
            opacity: canAffordUpgrade ? 1 : 0.5,
          }}
        >
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Sifão'} — 🪨 {cost.stone} / 🪵 {cost.wood} / 🌌 {cost.transcendenceEssence}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Sifão no nível máximo — Sincronia Perfeita.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.85rem' }}>Drenagem de mana ambiental na Ecoterra: {manaDrainPct.toFixed(1)}%/s (base 1.5%/s)</p>
          <p style={{ fontSize: '0.85rem' }}>Erosão de recarga de habilidades na Ecoterra: +{cooldownErosionPct.toFixed(0)}% (base +15%)</p>
        </div>
      )}
    </div>
  );
};
