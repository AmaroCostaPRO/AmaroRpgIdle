import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { SYNCHRONY_ALTAR_MAX_LEVEL, SYNCHRONY_ALTAR_UPGRADE_COST } from '../../core/citadelFormulas';

export const SynchronyAltarPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeSynchronyAltar = useGameStore((state) => state.buildOrUpgradeSynchronyAltar);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const essence = character.transcendenceEssence || 0;
  const altar = citadel?.synchronyAltar || { level: 0, lastTick: 0 };
  const isBuilt = altar.level > 0;
  const nextLevel = altar.level + 1;
  const cost = SYNCHRONY_ALTAR_UPGRADE_COST(nextLevel);
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
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
            🔯 Altar de Sincronia Elemental {isBuilt ? `— Nível ${altar.level}` : '(Não construído)'}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Maximiza o teto de dano da classe Avatar, injetando parte dos atributos secundários no Maior Atributo Ativo.
          </p>
        </div>
      </div>

      {altar.level < SYNCHRONY_ALTAR_MAX_LEVEL ? (
        <button
          onClick={handleUpgrade}
          disabled={!canAffordUpgrade}
          className="btn btn-gold"
          style={{ alignSelf: 'flex-start' }}
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
