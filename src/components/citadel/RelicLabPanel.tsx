import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useRelicStore } from '../../store/useRelicStore';
import { AudioManager } from '../../core/AudioManager';
import { RELIC_LAB_MAX_LEVEL, RELIC_LAB_UPGRADE_COST, RELIC_LAB_OVERHEAT_SLOTS, RELIC_OVERHEAT_GOLD_COST, RELIC_OVERHEAT_SOUL_FRAGMENT_COST } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';

export const RelicLabPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeRelicLab = useGameStore((state) => state.buildOrUpgradeRelicLab);
  const overheatRelic = useGameStore((state) => state.overheatRelic);
  const relics = useRelicStore((state) => state.relics);
  const soulFragments = useRelicStore((state) => state.unstableSoulFragments);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const relicLab = citadel?.relicLab || { level: 0, lastTick: 0, overheatedRelicIds: [] };
  const isBuilt = relicLab.level > 0;
  const nextLevel = relicLab.level + 1;
  const cost = RELIC_LAB_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.stone >= cost.stone && materials.wood >= cost.wood && soulFragments >= cost.unstableSoulFragments;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const maxSlots = RELIC_LAB_OVERHEAT_SLOTS(relicLab.level);
  const upgrading = relicLab.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeRelicLab();
  };

  const [confirmOverheatId, setConfirmOverheatId] = useState<string | null>(null);
  const handleOverheat = (relicId: string) => {
    if (confirmOverheatId !== relicId) {
      setConfirmOverheatId(relicId);
      setTimeout(() => setConfirmOverheatId(current => current === relicId ? null : current), 3000);
      return;
    }
    setConfirmOverheatId(null);
    AudioManager.getInstance().playClick();
    overheatRelic(relicId);
  };

  return (
    <CitadelBuildingPanel
      icon="🧪"
      title="Laboratório de Relíquias Místicas"
      subtitle="Submete relíquias no Nível máximo (5) ao Superaquecimento de Alma, amplificando seus efeitos Capstone."
      isBuilt={isBuilt}
      level={relicLab.level}
      maxLevel={RELIC_LAB_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construído)"
      buildLabel="Construir Laboratório"
      costDisplay={<>🪨 {cost.stone} / 🪵 {cost.wood} / 💠 {cost.unstableSoulFragments}</>}
      maxLevelLabel="Laboratório no nível máximo."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: 0 }}>
            Superaquecimento ({relicLab.overheatedRelicIds.length}/{maxSlots} vagas usadas) — custo por relíquia: 🪙 {RELIC_OVERHEAT_GOLD_COST} / 💠 {RELIC_OVERHEAT_SOUL_FRAGMENT_COST}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.values(relics).map((relic) => {
              const isMaxed = relic.level >= relic.maxLevel;
              const isOverheated = relicLab.overheatedRelicIds.includes(relic.id);
              const slotsFull = relicLab.overheatedRelicIds.length >= maxSlots;
              const disabled = !isMaxed || isOverheated || slotsFull || character.gold < RELIC_OVERHEAT_GOLD_COST || soulFragments < RELIC_OVERHEAT_SOUL_FRAGMENT_COST;
              return (
                <div
                  key={relic.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isOverheated ? 'var(--gold-400)' : 'var(--border-subtle)'}`,
                    background: 'var(--surface-2)',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                      {relic.name} — Nível {relic.level}/{relic.maxLevel} {isOverheated && '🔥'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{relic.description}</div>
                  </div>
                  <button
                    onClick={() => handleOverheat(relic.id)}
                    disabled={disabled}
                    className="btn btn-sm btn-gold"
                    style={{
                      whiteSpace: 'nowrap',
                      background: confirmOverheatId === relic.id ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
                      borderColor: confirmOverheatId === relic.id ? '#10b981' : undefined,
                      color: confirmOverheatId === relic.id ? '#fff' : undefined,
                    }}
                  >
                    {isOverheated ? 'Superaquecida' : !isMaxed ? 'Requer Nível 5' : confirmOverheatId === relic.id ? 'Confirmar?' : 'Superaquecer 🔥'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
    </CitadelBuildingPanel>
  );
};
