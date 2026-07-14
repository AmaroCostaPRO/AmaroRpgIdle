import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { WATCH_TOWER_MAX_LEVEL, WATCH_TOWER_UPGRADE_COST, WATCH_TOWER_HOURS_PER_KEY, WATCH_TOWER_KEY_CAPACITY } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';

export const WatchTowerPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeWatchTower = useGameStore((state) => state.buildOrUpgradeWatchTower);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const watchTower = citadel?.watchTower || { level: 0, lastTick: 0, storedKeys: 0 };
  const isBuilt = watchTower.level > 0;
  const nextLevel = watchTower.level + 1;
  const cost = WATCH_TOWER_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.meat >= cost.meat;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const hoursPerKey = WATCH_TOWER_HOURS_PER_KEY(watchTower.level);
  const capacity = WATCH_TOWER_KEY_CAPACITY(watchTower.level);
  const upgrading = watchTower.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeWatchTower();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
            🗼 Torre de Vigia Astral {isBuilt ? `— Nível ${watchTower.level}` : '(Não construída)'}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Fabrica passivamente Chaves da Torre Evoluída (3x Ouro, XP e Fragmentos de Forja na subida), mesmo offline.
          </p>
        </div>
      </div>

      {watchTower.level < WATCH_TOWER_MAX_LEVEL ? (
        <>
          {upgrading ? (
            <button disabled className="btn btn-disabled" style={{ alignSelf: 'flex-start' }}>
              🏗️ Melhorando para Nível {upgrading.targetLevel}... ({countdown})
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={!canAffordUpgrade || lockedByCommandCenter}
              className="btn btn-gold"
              style={{ alignSelf: 'flex-start' }}
            >
              {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Torre'} — 🪵 {cost.wood} / 🪨 {cost.stone} / 🥩 {cost.meat}
            </button>
          )}
          {lockedByCommandCenter && (
            <p style={{ fontSize: '0.68rem', color: '#f87171', margin: 0 }}>🏛️ Requer o Centro de Comando no Nível {nextLevel}.</p>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Torre no nível máximo.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.85rem' }}>Produção: 1 🗝️ Chave Evoluída a cada {hoursPerKey}h · Capacidade interna: {capacity} chave{capacity > 1 ? 's' : ''}</p>
          <p style={{ fontSize: '0.85rem' }}>Chaves aguardando coleta: {watchTower.storedKeys}/{capacity}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            As chaves são transferidas automaticamente para o inventário assim que houver espaço.
          </p>
        </div>
      )}
    </div>
  );
};
