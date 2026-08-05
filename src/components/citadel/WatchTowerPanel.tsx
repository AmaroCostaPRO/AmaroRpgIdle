import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { WATCH_TOWER_MAX_LEVEL, WATCH_TOWER_UPGRADE_COST, WATCH_TOWER_HOURS_PER_KEY, WATCH_TOWER_KEY_CAPACITY } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';
import { CitadelStatRow, CitadelProgressBar } from './shared/CitadelUI';

export const WatchTowerPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeWatchTower = useGameStore((state) => state.buildOrUpgradeWatchTower);
  const collectWatchTowerKeys = useGameStore((state) => state.collectWatchTowerKeys);

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

  const handleCollect = () => {
    AudioManager.getInstance().playClick();
    collectWatchTowerKeys();
  };

  return (
    <CitadelBuildingPanel
      icon="🗼"
      title="Torre de Vigia Astral"
      subtitle="Fabrica passivamente Chaves da Torre Evoluída (3x Ouro, XP e Fragmentos de Forja na subida), mesmo offline."
      isBuilt={isBuilt}
      level={watchTower.level}
      maxLevel={WATCH_TOWER_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construída)"
      buildLabel="Construir Torre"
      costDisplay={<>🪵 {cost.wood} / 🪨 {cost.stone} / 🥩 {cost.meat}</>}
      maxLevelLabel="Torre no nível máximo."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <CitadelStatRow icon="🗝️" label="Produção" value={`1 chave / ${hoursPerKey}h`} tone="accent" />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            padding: '0.75rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${watchTower.storedKeys > 0 ? 'var(--gold-400)' : 'var(--border-subtle)'}`,
            background: watchTower.storedKeys > 0 ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--surface-2))' : 'var(--surface-2)',
            boxShadow: watchTower.storedKeys > 0 ? '0 0 12px var(--gold-glow)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
            <span>🔑 Chaves aguardando coleta</span>
            <span style={{ color: 'var(--gold-300)' }}>{watchTower.storedKeys}/{capacity}</span>
          </div>
          <CitadelProgressBar pct={(watchTower.storedKeys / Math.max(1, capacity)) * 100} />
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
            A produção pausa quando a capacidade interna está cheia — colete para liberar espaço e retomar.
          </span>
          <button
            onClick={handleCollect}
            disabled={watchTower.storedKeys <= 0}
            className="btn btn-gold"
            style={{ alignSelf: 'flex-start' }}
          >
            Coletar Chaves
          </button>
        </div>
      </div>
    </CitadelBuildingPanel>
  );
};
