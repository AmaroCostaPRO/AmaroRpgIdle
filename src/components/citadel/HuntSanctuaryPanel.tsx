import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { HUNT_SANCTUARY_MAX_LEVEL, HUNT_SANCTUARY_UPGRADE_COST, HUNT_CONTRACT_ROTATION_INTERVAL_MS, getHuntContractRotationId } from '../../core/citadelFormulas';
import { ENEMY_TYPES } from '../../core/CombatFSM';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';
import { CitadelListCard, CitadelProgressBar } from './shared/CitadelUI';

const REWARD_MATERIAL_ICON: Record<string, string> = { wood: '🪵', stone: '🪨', meat: '🥩', studyInsignias: '📜' };

export const HuntSanctuaryPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeHuntSanctuary = useGameStore((state) => state.buildOrUpgradeHuntSanctuary);
  const refreshHuntContractsIfNeeded = useGameStore((state) => state.refreshHuntContractsIfNeeded);
  const claimHuntContract = useGameStore((state) => state.claimHuntContract);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const huntSanctuary = citadel?.huntSanctuary || { level: 0, lastTick: 0, activeContracts: [], rotationId: 0, bonusClaimedForRotation: false };
  const isBuilt = huntSanctuary.level > 0;
  const nextLevel = huntSanctuary.level + 1;
  const cost = HUNT_SANCTUARY_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.meat >= cost.meat && materials.studyInsignias >= cost.studyInsignias;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const upgrading = huntSanctuary.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const nextRotationAt = (getHuntContractRotationId() + 1) * HUNT_CONTRACT_ROTATION_INTERVAL_MS;
  const rotationCountdown = useCountdown(nextRotationAt);

  useEffect(() => {
    if (isBuilt) refreshHuntContractsIfNeeded();
  }, [isBuilt, refreshHuntContractsIfNeeded]);

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeHuntSanctuary();
  };

  const handleClaim = (contractId: string) => {
    AudioManager.getInstance().playClick();
    claimHuntContract(contractId);
  };

  const allClaimed = huntSanctuary.activeContracts.length > 0 && huntSanctuary.activeContracts.every((c) => c.claimed);

  return (
    <CitadelBuildingPanel
      icon="📜"
      title="Santuário de Contratos de Caça"
      subtitle="Contratos rotativos de caça a inimigos específicos — evolução ativa do Bestiário, cujo bônus passivo por marco de mortes continua funcionando normalmente."
      isBuilt={isBuilt}
      level={huntSanctuary.level}
      maxLevel={HUNT_SANCTUARY_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construído)"
      buildLabel="Construir Santuário"
      costDisplay={<>🪵 {cost.wood} / 🥩 {cost.meat} / 📜 {cost.studyInsignias}</>}
      maxLevelLabel="Santuário no nível máximo — 3 contratos ativos por rotação."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
          Nova rotação de contratos em: {rotationCountdown || '—'}
        </p>
        {huntSanctuary.activeContracts.length === 0 && (
          <p style={{ fontSize: '0.85rem' }}>Nenhum contrato ativo no momento.</p>
        )}
        {huntSanctuary.activeContracts.map((contract) => {
          const enemy = ENEMY_TYPES.find((e) => e.id === contract.enemyId);
          const isComplete = contract.currentKills >= contract.requiredKills;
          const progressPct = Math.min(100, Math.round((contract.currentKills / contract.requiredKills) * 100));
          return (
            <CitadelListCard
              key={contract.id}
              icon="🐾"
              title={`Derrote ${contract.requiredKills}x ${enemy?.name || contract.enemyId}`}
              dimmed={contract.claimed}
              highlighted={isComplete && !contract.claimed}
              badge={
                <span style={{ fontSize: '0.75rem' }}>
                  Recompensa: {REWARD_MATERIAL_ICON[contract.rewardMaterial]} {contract.rewardAmount}
                </span>
              }
              action={
                <button
                  onClick={() => handleClaim(contract.id)}
                  disabled={!isComplete || contract.claimed}
                  className="btn btn-gold"
                >
                  {contract.claimed ? 'Resgatado' : isComplete ? 'Resgatar' : 'Em andamento'}
                </button>
              }
            >
              <CitadelProgressBar pct={progressPct} color={isComplete ? 'var(--gold-400)' : '#38bdf8'} />
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {Math.min(contract.currentKills, contract.requiredKills)} / {contract.requiredKills}
              </span>
            </CitadelListCard>
          );
        })}
        {allClaimed && (
          <p style={{ fontSize: '0.75rem', color: 'var(--gold-300)', margin: 0 }}>
            ✨ Rotação completa! Fragmentos de Alma Instável concedidos.
          </p>
        )}
      </div>
    </CitadelBuildingPanel>
  );
};
