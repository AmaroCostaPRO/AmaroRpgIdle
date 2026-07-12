import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CitadelSubTab } from './CitadelTabsBar';
import { EvolutionSprite } from './EvolutionSprite';
import { BUILDING_SPRITE_SRC, BUILDING_MAX_LEVEL } from './citadelBuildingSprites';

export const CitadelOverview: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const citadel = character.citadel;

  const buildings: { id: CitadelSubTab; icon: string; label: string; level: number }[] = [
    { id: 'overview', icon: '🏛️', label: 'Centro de Comando', level: citadel?.commandCenter.level || 1 },
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
                  fixedTier={b.id === 'overview' ? 2 : undefined}
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
