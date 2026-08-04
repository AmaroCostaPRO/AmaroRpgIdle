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
  const siphon = citadel?.cosmicSiphon || { level: 0, lastTick: 0, cosmicCharge: 0 };
  const isBuilt = siphon.level > 0;
  const nextLevel = siphon.level + 1;
  const cost = COSMIC_SIPHON_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.stone >= cost.stone && materials.wood >= cost.wood && essence >= cost.transcendenceEssence;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const manaDrainPct = Math.max(0, 2.5 - siphon.level * 0.5);
  const cooldownErosionPct = Math.max(0, 25 - siphon.level * 5);
  const atkSpeedBoostPct = Math.max(0, 35 - siphon.level * 7);
  const damageTakenPct = Math.max(0, 25 - siphon.level * 5);
  const offensiveBonusPct = siphon.level * 3;
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
      subtitle="Mitiga as penalidades da Ecoterra, concede um bônus ofensivo durante ela e acumula Carga Cósmica para a habilidade ativa Pulso Cósmico."
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
        <p style={{ fontSize: '0.85rem' }}>Drenagem de mana ambiental na Ecoterra: {manaDrainPct.toFixed(1)}%/s (base 2.5%/s)</p>
        <p style={{ fontSize: '0.85rem' }}>Erosão de recarga de habilidades na Ecoterra: +{cooldownErosionPct.toFixed(0)}% (base +25%)</p>
        <p style={{ fontSize: '0.85rem' }}>Velocidade de ataque dos inimigos na Ecoterra: +{atkSpeedBoostPct.toFixed(0)}% (base +35%)</p>
        <p style={{ fontSize: '0.85rem' }}>Dano recebido extra na Ecoterra: +{damageTakenPct.toFixed(0)}% (base +25%)</p>
        <p style={{ fontSize: '0.85rem', color: '#4ade80' }}>Bônus ofensivo próprio na Ecoterra: +{offensiveBonusPct}% de Dano</p>
        <p style={{ fontSize: '0.85rem', color: '#22d3ee' }}>
          🌌 Carga Cósmica atual: {Math.floor(siphon.cosmicCharge || 0)}/100 — acumula {2 + siphon.level}/s em combate na Ecoterra. Ao encher, ative o Pulso Cósmico em combate para +{Math.round((0.5 + siphon.level * 0.05) * 100)}% de Dano e Invulnerabilidade Total por {10 + siphon.level * 2}s.
        </p>
        {siphon.level >= COSMIC_SIPHON_MAX_LEVEL && (
          <p style={{ fontSize: '0.85rem', color: 'var(--gold-300)' }}>🌌 Sincronia Perfeita! Penalidades da Ecoterra neutralizadas.</p>
        )}
      </div>
    </CitadelBuildingPanel>
  );
};
