import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { SYNCHRONY_ALTAR_MAX_LEVEL, SYNCHRONY_ALTAR_UPGRADE_COST } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';

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
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const injectionPct = altar.level * 3;
  const upgrading = altar.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeSynchronyAltar();
  };

  return (
    <CitadelBuildingPanel
      icon="🔯"
      title="Altar de Sincronia Elemental"
      subtitle="Maximiza o teto de dano da classe Avatar, injetando parte dos atributos secundários no Maior Atributo Ativo."
      isBuilt={isBuilt}
      level={altar.level}
      maxLevel={SYNCHRONY_ALTAR_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construído)"
      buildLabel="Construir Altar"
      costDisplay={<>🪨 {cost.stone} / 🌌 {cost.transcendenceEssence} / 📜 {cost.studyInsignias}</>}
      maxLevelLabel="Altar no nível máximo."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <p style={{ fontSize: '0.85rem' }}>
        Injeção atual: +{injectionPct}% da soma dos atributos secundários somada ao Maior Atributo Ativo do Avatar.
      </p>
    </CitadelBuildingPanel>
  );
};
