import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const CitadelOverview: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const citadel = character.citadel;

  const buildings = [
    { icon: '🏛️', label: 'Centro de Comando', level: citadel?.commandCenter.level || 1 },
    { icon: '📦', label: 'Depósito', level: citadel?.vault.level || 0 },
    { icon: '🎖️', label: 'Quartel de Expedições', level: citadel?.expeditions.level || 0 },
    { icon: '🎓', label: 'Academia Militar', level: citadel?.academy.level || 0 },
    { icon: '🗼', label: 'Torre de Vigia Astral', level: citadel?.watchTower.level || 0 },
    { icon: '🛠️', label: 'Oficina de Automação', level: citadel?.forgeWorkshop.level || 0 },
    { icon: '🌫️', label: 'Sifão de Essência Cósmica', level: citadel?.cosmicSiphon.level || 0 },
    { icon: '🔯', label: 'Altar de Sincronia Elemental', level: citadel?.synchronyAltar.level || 0 },
    { icon: '🧪', label: 'Laboratório de Relíquias', level: citadel?.relicLab.level || 0 },
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
            key={b.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.35rem 0.2rem',
              borderBottom: '1px solid var(--border-dim)',
              fontSize: '0.85rem',
            }}
          >
            <span>{b.icon} {b.label}</span>
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
