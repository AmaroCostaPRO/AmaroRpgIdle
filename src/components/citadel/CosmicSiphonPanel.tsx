import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { COSMIC_SIPHON_MAX_LEVEL, COSMIC_SIPHON_UPGRADE_COST } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';

export const CosmicSiphonPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeCosmicSiphon = useGameStore((state) => state.buildOrUpgradeCosmicSiphon);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const essence = character.transcendenceEssence || 0;
  const siphon = citadel?.cosmicSiphon || { level: 0, lastTick: 0 };
  const isBuilt = siphon.level > 0;
  const nextLevel = siphon.level + 1;
  const cost = COSMIC_SIPHON_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.stone >= cost.stone && materials.wood >= cost.wood && essence >= cost.transcendenceEssence;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const manaDrainPct = Math.max(0, 1.5 - siphon.level * 0.3);
  const cooldownErosionPct = Math.max(0, 15 - siphon.level * 3);
  const upgrading = siphon.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeCosmicSiphon();
  };

  return (
    <CitadelBuildingPanel
      icon="🌫️"
      title="Sifão de Essência Cósmica"
      subtitle="Neutraliza as penalidades ambientais sofridas na zona espelho da Ecoterra."
      isBuilt={isBuilt}
      level={siphon.level}
      maxLevel={COSMIC_SIPHON_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construído)"
      buildLabel="Construir Sifão"
      costDisplay={<>🪨 {cost.stone} / 🪵 {cost.wood} / 🌌 {cost.transcendenceEssence}</>}
      maxLevelLabel="Sifão no nível máximo — Sincronia Perfeita."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.85rem' }}>Drenagem de mana ambiental na Ecoterra: {manaDrainPct.toFixed(1)}%/s (base 1.5%/s)</p>
        <p style={{ fontSize: '0.85rem' }}>Erosão de recarga de habilidades na Ecoterra: +{cooldownErosionPct.toFixed(0)}% (base +15%)</p>
      </div>
    </CitadelBuildingPanel>
  );
};
