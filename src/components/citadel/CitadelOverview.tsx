import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { CitadelSubTab } from './CitadelTabsBar';
import { EvolutionSprite } from './EvolutionSprite';
import { BUILDING_SPRITE_SRC, BUILDING_MAX_LEVEL } from './citadelBuildingSprites';
import { COMMAND_CENTER_MAX_LEVEL, COMMAND_CENTER_UPGRADE_COST, COMMAND_CENTER_MATERIAL_DROP_BONUS } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';

export const CitadelOverview: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeCommandCenter = useGameStore((state) => state.buildOrUpgradeCommandCenter);
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const citadel = character.citadel;

  const commandCenter = citadel?.commandCenter || { level: 1, lastTick: 0 };
  const ccUpgrading = commandCenter.upgradeInProgress;
  const ccCountdown = useCountdown(ccUpgrading?.completesAt);
  const ccNextLevel = commandCenter.level + 1;
  const ccMaxed = commandCenter.level >= COMMAND_CENTER_MAX_LEVEL;
  const ccCost = COMMAND_CENTER_UPGRADE_COST(ccNextLevel);
  const ccCanAfford = materials.wood >= ccCost.wood && materials.stone >= ccCost.stone && materials.meat >= ccCost.meat;
  const ccBonusNow = Math.round(COMMAND_CENTER_MATERIAL_DROP_BONUS(commandCenter.level) * 100);
  const ccBonusNext = Math.round(COMMAND_CENTER_MATERIAL_DROP_BONUS(ccNextLevel) * 100);

  const handleUpgradeCommandCenter = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeCommandCenter();
  };

  const buildings: { id: CitadelSubTab; icon: string; label: string; level: number }[] = [
    { id: 'vault', icon: '📦', label: 'Depósito', level: citadel?.vault.level || 0 },
    { id: 'expeditions', icon: '🎖️', label: 'Quartel de Expedições', level: citadel?.expeditions.level || 0 },
    { id: 'academy', icon: '🎓', label: 'Academia Militar', level: citadel?.academy.level || 0 },
    { id: 'watchTower', icon: '🗼', label: 'Torre de Vigia Astral', level: citadel?.watchTower.level || 0 },
    { id: 'forgeWorkshop', icon: '🛠️', label: 'Oficina de Automação', level: citadel?.forgeWorkshop.level || 0 },
    { id: 'cosmicSiphon', icon: '🌫️', label: 'Sifão de Essência Cósmica', level: citadel?.cosmicSiphon.level || 0 },
    { id: 'synchronyAltar', icon: '🔯', label: 'Altar de Sincronia Elemental', level: citadel?.synchronyAltar.level || 0 },
    { id: 'relicLab', icon: '🧪', label: 'Laboratório de Relíquias', level: citadel?.relicLab.level || 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        className="panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          padding: '0.9rem 1.1rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
        }}
      >
        <span>🪵 Madeira: {materials.wood}</span>
        <span>🪨 Pedra: {materials.stone}</span>
        <span>🥩 Carne: {materials.meat}</span>
        <span>📜 Insígnias: {materials.studyInsignias}</span>
      </div>

      {/* Centro de Comando — construção central da Cidadela. Diferente das demais, nunca
          está "não construída" (começa no Nível 1) e seu nível define o teto que todas as
          outras construções podem alcançar, então ganha destaque próprio nesta tela. */}
      <div className="panel" style={{ padding: '1.1rem 1.2rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '2.6rem', height: '2.6rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            <EvolutionSprite
              src={BUILDING_SPRITE_SRC.overview}
              level={commandCenter.level}
              maxLevel={COMMAND_CENTER_MAX_LEVEL}
              fallbackIcon="🏛️"
            />
          </span>
          <div>
            <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
              🏛️ Centro de Comando — Nível {commandCenter.level}
            </h2>
            <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
              Construção central da Cidadela: aumenta a quantidade de Madeira, Pedra e Carne coletada em combate (atualmente +{ccBonusNow}%) e define o nível máximo que as demais construções podem alcançar.
            </p>
          </div>
        </div>

        {!ccMaxed ? (
          <>
            {ccUpgrading ? (
              <button disabled className="btn btn-disabled" style={{ alignSelf: 'flex-start' }}>
                🏗️ Melhorando para Nível {ccUpgrading.targetLevel}... ({ccCountdown})
              </button>
            ) : (
              <button
                onClick={handleUpgradeCommandCenter}
                disabled={!ccCanAfford}
                className="btn btn-gold"
                style={{ alignSelf: 'flex-start' }}
              >
                Melhorar para Nível {ccNextLevel} (+{ccBonusNext}% materiais) — 🪵 {ccCost.wood} / 🪨 {ccCost.stone} / 🥩 {ccCost.meat}
              </button>
            )}
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              As outras construções não podem ultrapassar o nível atual do Centro de Comando.
            </p>
          </>
        ) : (
          <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem', margin: 0 }}>Centro de Comando no nível máximo.</p>
        )}
      </div>

      <div className="panel" style={{ padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {buildings.map((b) => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.35rem 0.2rem',
              borderBottom: '1px solid var(--border-dim)',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '1.4rem', height: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <EvolutionSprite
                  src={BUILDING_SPRITE_SRC[b.id]}
                  level={b.level}
                  maxLevel={BUILDING_MAX_LEVEL[b.id]}
                  fallbackIcon={b.icon}
                />
              </span>
              {b.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: b.level > 0 ? 'var(--gold-300)' : 'rgba(255,255,255,0.4)' }}>
              {b.level > 0 ? `Nv.${b.level}` : 'Não construído'}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
        Use as abas acima para construir e aprimorar cada estrutura da Cidadela. Os visuais das construções são placeholders temporários — os sprites definitivos de cada nível serão adicionados futuramente.
      </p>
    </div>
  );
};
