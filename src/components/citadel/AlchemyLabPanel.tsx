import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { ALCHEMY_LAB_MAX_LEVEL, ALCHEMY_LAB_UPGRADE_COST, ALCHEMY_POTION_RECIPE, ALCHEMY_POTION_YIELD, AlchemyPotionType } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';

const POTION_LABELS: Record<AlchemyPotionType, { name: string; effect: string; icon: string }> = {
  damage: { name: 'Poção de Fúria Alquímica', effect: '+25% de Dano por 3 minutos', icon: '🔥' },
  regen: { name: 'Poção de Regeneração Alquímica', effect: 'Regeneração de HP acelerada por 2 minutos', icon: '💧' },
};

export const AlchemyLabPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeAlchemyLab = useGameStore((state) => state.buildOrUpgradeAlchemyLab);
  const brewAlchemyPotion = useGameStore((state) => state.brewAlchemyPotion);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const alchemyLab = citadel?.alchemyLab || { level: 0, lastTick: 0 };
  const isBuilt = alchemyLab.level > 0;
  const nextLevel = alchemyLab.level + 1;
  const cost = ALCHEMY_LAB_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.meat >= cost.meat && materials.studyInsignias >= cost.studyInsignias;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const upgrading = alchemyLab.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);
  const yieldCount = ALCHEMY_POTION_YIELD(alchemyLab.level);

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeAlchemyLab();
  };

  const handleBrew = (potionType: AlchemyPotionType) => {
    AudioManager.getInstance().playClick();
    brewAlchemyPotion(potionType);
  };

  return (
    <CitadelBuildingPanel
      icon="⚗️"
      title="Laboratório de Alquimia"
      subtitle="Destila Madeira, Pedra e Carne das Expedições em poções de efeito temporário."
      isBuilt={isBuilt}
      level={alchemyLab.level}
      maxLevel={ALCHEMY_LAB_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construído)"
      buildLabel="Construir Laboratório"
      costDisplay={<>🪵 {cost.wood} / 🥩 {cost.meat} / 📜 {cost.studyInsignias}</>}
      maxLevelLabel="Laboratório no nível máximo — rendimento de 3 poções por preparo."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.85rem' }}>Rendimento por preparo no nível atual: {yieldCount}x</p>
        {(Object.keys(POTION_LABELS) as AlchemyPotionType[]).map((potionType) => {
          const recipe = ALCHEMY_POTION_RECIPE[potionType];
          const label = POTION_LABELS[potionType];
          const canAffordBrew = materials.wood >= recipe.wood && materials.stone >= recipe.stone && materials.meat >= recipe.meat;
          return (
            <div key={potionType} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{label.icon} {label.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{label.effect}</span>
              <button
                onClick={() => handleBrew(potionType)}
                disabled={!canAffordBrew}
                className="btn btn-gold"
                style={{ alignSelf: 'flex-start' }}
              >
                Preparar — 🪵 {recipe.wood} / 🪨 {recipe.stone} / 🥩 {recipe.meat}
              </button>
            </div>
          );
        })}
      </div>
    </CitadelBuildingPanel>
  );
};
