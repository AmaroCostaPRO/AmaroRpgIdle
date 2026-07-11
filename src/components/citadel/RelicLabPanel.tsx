import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useRelicStore } from '../../store/useRelicStore';
import { AudioManager } from '../../core/AudioManager';

const RELIC_LAB_MAX_LEVEL = 5;
const RELIC_OVERHEAT_GOLD_COST = 50000;
const RELIC_OVERHEAT_SOUL_FRAGMENT_COST = 20;

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
  const cost = {
    stone: Math.round(3000 * Math.pow(1.6, nextLevel - 1)),
    wood: Math.round(2000 * Math.pow(1.6, nextLevel - 1)),
    unstableSoulFragments: Math.round(100 * Math.pow(1.6, nextLevel - 1)),
  };
  const canAffordUpgrade = materials.stone >= cost.stone && materials.wood >= cost.wood && soulFragments >= cost.unstableSoulFragments;
  const maxSlots = relicLab.level * 2;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeRelicLab();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
            🧪 Laboratório de Relíquias Místicas {isBuilt ? `— Nível ${relicLab.level}` : '(Não construído)'}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Submete relíquias no Nível máximo (5) ao Superaquecimento de Alma, amplificando seus efeitos Capstone.
          </p>
        </div>
      </div>

      {relicLab.level < RELIC_LAB_MAX_LEVEL ? (
        <button
          onClick={handleUpgrade}
          disabled={!canAffordUpgrade}
          className="btn btn-gold"
          style={{ alignSelf: 'flex-start' }}
        >
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Laboratório'} — 🪨 {cost.stone} / 🪵 {cost.wood} / 💠 {cost.unstableSoulFragments}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Laboratório no nível máximo.</p>
      )}

      {isBuilt && (
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
                    onClick={() => { AudioManager.getInstance().playClick(); overheatRelic(relic.id); }}
                    disabled={disabled}
                    className="btn btn-sm btn-gold"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isOverheated ? 'Superaquecida' : !isMaxed ? 'Requer Nível 5' : 'Superaquecer 🔥'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
