import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { FORGE_WORKSHOP_MAX_LEVEL, FORGE_WORKSHOP_UPGRADE_COST, FORGE_ORDER_GOLD_COST, FORGE_ORDER_WOOD_COST, FORGE_ORDER_FRAGMENT_YIELD, FORGE_ORDER_HOURS } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { useForgeOrderProgress } from '../../hooks/useForgeOrderProgress';
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
  const { progressPct, remainingLabel } = useForgeOrderProgress(forgeWorkshop.lastTick, FORGE_ORDER_HOURS * 60 * 60 * 1000);
  const canAffordNextOrder = materials.wood >= FORGE_ORDER_WOOD_COST && character.gold >= FORGE_ORDER_GOLD_COST;

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
        {isBuilt && (
          canAffordNextOrder ? (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px' }}>
                <span>🏗️ Ordem de serviço em andamento</span>
                <span>Próxima em {remainingLabel}</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--gold-300, #f59e0b)', borderRadius: '3px', transition: 'width 1s linear' }} />
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.7rem', color: '#f87171', margin: 0 }}>
              ⏸️ Produção pausada: ouro ou madeira insuficientes para a próxima ordem de serviço.
            </p>
          )
        )}
        {isMasterForger && (
          <p style={{ fontSize: '0.85rem', color: 'var(--gold-300)' }}>
            ⚙️ Desmonte Automatizado ativo: equipamentos Comuns e Raros "puros" dropados em combate são convertidos direto em Fragmentos de Forja, sem passar pelo inventário.
          </p>
        )}
      </div>
    </CitadelBuildingPanel>
  );
};
