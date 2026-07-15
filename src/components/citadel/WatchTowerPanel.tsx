import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { WATCH_TOWER_MAX_LEVEL, WATCH_TOWER_UPGRADE_COST, WATCH_TOWER_HOURS_PER_KEY, WATCH_TOWER_KEY_CAPACITY } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';

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
        <p style={{ fontSize: '0.85rem' }}>Produção: 1 🗝️ Chave Evoluída a cada {hoursPerKey}h · Capacidade interna: {capacity} chave{capacity > 1 ? 's' : ''}</p>
        <p style={{ fontSize: '0.85rem' }}>Chaves aguardando coleta: {watchTower.storedKeys}/{capacity}</p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
          As chaves são transferidas automaticamente para o inventário assim que houver espaço.
        </p>
      </div>
    </CitadelBuildingPanel>
  );
};
