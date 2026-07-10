import React from 'react';
import { useGameStore } from '../../store/useGameStore';

interface BuildingSlotProps {
  icon: string;
  label: string;
  level: number;
  built: boolean;
  top: string;
  left: string;
}

const BuildingSlot: React.FC<BuildingSlotProps> = ({ icon, label, level, built, top, left }) => (
  <div style={{ position: 'absolute', top, left, width: '110px', textAlign: 'center' }}>
    <div
      style={{
        width: '90px',
        height: '90px',
        margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        background: built ? 'var(--surface-3)' : 'var(--surface-1)',
        border: `2px solid ${built ? 'var(--border-active)' : 'var(--border-dim)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
        opacity: built ? 1 : 0.4,
      }}
    >
      {icon}
    </div>
    <span
      style={{
        display: 'inline-block',
        marginTop: '0.4rem',
        padding: '0.15rem 0.5rem',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {label} {built ? `Nv.${level}` : '(vazio)'}
    </span>
  </div>
);

export const CitadelOverview: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const citadel = character.citadel;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
        <span>🪵 Madeira: {materials.wood}</span>
        <span>🪨 Pedra: {materials.stone}</span>
        <span>🥩 Carne: {materials.meat}</span>
        <span>📜 Insígnias: {materials.studyInsignias}</span>
      </div>

      <div
        className="panel"
        style={{
          position: 'relative',
          width: '100%',
          height: '340px',
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Placeholder genérico de terreno — substituir por sprite real da Cidadela futuramente */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 40%, rgba(245,158,11,0.08), transparent 70%)',
          }}
        />

        <BuildingSlot
          icon="🏛️"
          label="Centro de Comando"
          level={citadel?.commandCenter.level || 1}
          built={true}
          top="30%"
          left="42%"
        />
        <BuildingSlot
          icon="📦"
          label="Depósito"
          level={citadel?.vault.level || 0}
          built={(citadel?.vault.level || 0) > 0}
          top="55%"
          left="15%"
        />
        <BuildingSlot
          icon="🎖️"
          label="Quartel"
          level={citadel?.expeditions.level || 0}
          built={(citadel?.expeditions.level || 0) > 0}
          top="55%"
          left="70%"
        />
        <BuildingSlot
          icon="🎓"
          label="Academia"
          level={citadel?.academy.level || 0}
          built={(citadel?.academy.level || 0) > 0}
          top="10%"
          left="70%"
        />
        <BuildingSlot
          icon="🗼"
          label="Torre de Vigia"
          level={citadel?.watchTower.level || 0}
          built={(citadel?.watchTower.level || 0) > 0}
          top="10%"
          left="15%"
        />
        <BuildingSlot
          icon="🛠️"
          label="Oficina"
          level={citadel?.forgeWorkshop.level || 0}
          built={(citadel?.forgeWorkshop.level || 0) > 0}
          top="55%"
          left="42%"
        />
        <BuildingSlot
          icon="🌫️"
          label="Sifão Cósmico"
          level={citadel?.cosmicSiphon.level || 0}
          built={(citadel?.cosmicSiphon.level || 0) > 0}
          top="10%"
          left="42%"
        />
        <BuildingSlot
          icon="🔯"
          label="Altar de Sincronia"
          level={citadel?.synchronyAltar.level || 0}
          built={(citadel?.synchronyAltar.level || 0) > 0}
          top="30%"
          left="85%"
        />
        <BuildingSlot
          icon="🧪"
          label="Laboratório"
          level={citadel?.relicLab.level || 0}
          built={(citadel?.relicLab.level || 0) > 0}
          top="75%"
          left="70%"
        />
      </div>

      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
        Os visuais das construções são placeholders temporários — os sprites definitivos de cada nível serão adicionados futuramente.
      </p>
    </div>
  );
};
