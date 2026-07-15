import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { FORGE_WORKSHOP_MAX_LEVEL, FORGE_WORKSHOP_UPGRADE_COST, FORGE_ORDER_GOLD_COST, FORGE_ORDER_WOOD_COST, FORGE_ORDER_FRAGMENT_YIELD } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';

export const ForgeWorkshopPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeForgeWorkshop = useGameStore((state) => state.buildOrUpgradeForgeWorkshop);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const forgeWorkshop = citadel?.forgeWorkshop || { level: 0, lastTick: 0 };
  const isBuilt = forgeWorkshop.level > 0;
  const isMasterForger = forgeWorkshop.level >= 5;
  const nextLevel = forgeWorkshop.level + 1;
  const cost = FORGE_WORKSHOP_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.studyInsignias >= cost.studyInsignias;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const upgrading = forgeWorkshop.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeForgeWorkshop();
  };

  return (
    <CitadelBuildingPanel
      icon="🛠️"
      title="Oficina de Automação da Forja"
      subtitle="Converte Ouro e Madeira excedentes em Fragmentos de Forja através de ordens de serviço automáticas."
      isBuilt={isBuilt}
      level={forgeWorkshop.level}
      maxLevel={FORGE_WORKSHOP_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construída)"
      buildLabel="Construir Oficina"
      costDisplay={<>🪵 {cost.wood} / 🪨 {cost.stone} / 📜 {cost.studyInsignias}</>}
      maxLevelLabel="Oficina no nível máximo — Mestre Forjador."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.85rem' }}>
          Cada ordem de serviço (1h): consome 🪙 {FORGE_ORDER_GOLD_COST} + 🪵 {FORGE_ORDER_WOOD_COST}, produz +{FORGE_ORDER_FRAGMENT_YIELD} Fragmentos de Forja.
        </p>
        <p style={{ fontSize: '0.85rem' }}>Ordens paralelas por hora no nível atual: {forgeWorkshop.level}</p>
        {isMasterForger && (
          <p style={{ fontSize: '0.85rem', color: 'var(--gold-300)' }}>
            ⚙️ Desmonte Automatizado ativo: equipamentos Comuns e Raros "puros" dropados em combate são convertidos direto em Fragmentos de Forja, sem passar pelo inventário.
          </p>
        )}
      </div>
    </CitadelBuildingPanel>
  );
};
