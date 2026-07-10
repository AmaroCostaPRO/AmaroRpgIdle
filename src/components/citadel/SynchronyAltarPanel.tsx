import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';

const SYNCHRONY_ALTAR_MAX_LEVEL = 5;

export const SynchronyAltarPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeSynchronyAltar = useGameStore((state) => state.buildOrUpgradeSynchronyAltar);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const essence = character.transcendenceEssence || 0;
  const altar = citadel?.synchronyAltar || { level: 0, lastTick: 0 };
  const isBuilt = altar.level > 0;
  const nextLevel = altar.level + 1;
  const cost = {
    stone: Math.round(2000 * Math.pow(1.6, nextLevel - 1)),
    transcendenceEssence: Math.round(200 * Math.pow(1.6, nextLevel - 1)),
    studyInsignias: Math.round(500 * Math.pow(1.6, nextLevel - 1)),
  };
  const canAffordUpgrade = materials.stone >= cost.stone && essence >= cost.transcendenceEssence && materials.studyInsignias >= cost.studyInsignias;
  const injectionPct = altar.level * 3;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeSynchronyAltar();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-300)' }}>
            🔯 Altar de Sincronia Elemental {isBuilt ? `— Nível ${altar.level}` : '(Não construído)'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
            Maximiza o teto de dano da classe Avatar, injetando parte dos atributos secundários no Maior Atributo Ativo.
          </p>
        </div>
      </div>

      {altar.level < SYNCHRONY_ALTAR_MAX_LEVEL ? (
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
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Altar'} — 🪨 {cost.stone} / 🌌 {cost.transcendenceEssence} / 📜 {cost.studyInsignias}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Altar no nível máximo.</p>
      )}

      {isBuilt && (
        <p style={{ fontSize: '0.85rem' }}>
          Injeção atual: +{injectionPct}% da soma dos atributos secundários somada ao Maior Atributo Ativo do Avatar.
        </p>
      )}
    </div>
  );
};
