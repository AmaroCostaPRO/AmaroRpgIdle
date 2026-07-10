import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';

const WATCH_TOWER_MAX_LEVEL = 5;

export const WatchTowerPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeWatchTower = useGameStore((state) => state.buildOrUpgradeWatchTower);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const watchTower = citadel?.watchTower || { level: 0, lastTick: 0, storedKeys: 0 };
  const isBuilt = watchTower.level > 0;
  const nextLevel = watchTower.level + 1;
  const cost = {
    wood: Math.round(500 * Math.pow(1.6, nextLevel - 1)),
    stone: Math.round(500 * Math.pow(1.6, nextLevel - 1)),
    meat: Math.round(300 * Math.pow(1.6, nextLevel - 1)),
  };
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.meat >= cost.meat;
  const hoursPerKey = watchTower.level >= 5 ? 6 : watchTower.level >= 3 ? 12 : 24;
  const capacity = watchTower.level >= 5 ? 4 : watchTower.level >= 3 ? 2 : 1;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeWatchTower();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-300)' }}>
            🗼 Torre de Vigia Astral {isBuilt ? `— Nível ${watchTower.level}` : '(Não construída)'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
            Fabrica passivamente Chaves da Torre Infinita, mesmo offline.
          </p>
        </div>
      </div>

      {watchTower.level < WATCH_TOWER_MAX_LEVEL ? (
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
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Torre'} — 🪵 {cost.wood} / 🪨 {cost.stone} / 🥩 {cost.meat}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Torre no nível máximo.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.85rem' }}>Produção: 1 🔑 Chave a cada {hoursPerKey}h · Capacidade interna: {capacity} chave{capacity > 1 ? 's' : ''}</p>
          <p style={{ fontSize: '0.85rem' }}>Chaves aguardando coleta: {watchTower.storedKeys}/{capacity}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            As chaves são transferidas automaticamente para o inventário assim que houver espaço.
          </p>
        </div>
      )}
    </div>
  );
};
