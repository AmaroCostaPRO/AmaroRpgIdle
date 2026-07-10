import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { bridge } from '../../bridge/GameBridge';
import { GameEvent } from '../../core/types';
import { AudioManager } from '../../core/AudioManager';
import { CitadelSubTab } from './CitadelTabsBar';

interface BuildingSlotProps {
  icon: string;
  label: string;
  level: number;
  built: boolean;
  top: string;
  left: string;
  subTab: CitadelSubTab;
}

const BuildingSlot: React.FC<BuildingSlotProps> = ({ icon, label, level, built, top, left, subTab }) => (
  <div
    onClick={() => {
      AudioManager.getInstance().playClick();
      bridge.emit(GameEvent.CITADEL_SUBTAB_REQUESTED, { subTab });
    }}
    title={`Ir para ${label}`}
    style={{ position: 'absolute', top, left, width: '110px', textAlign: 'center', cursor: 'pointer' }}
  >
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
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = '0 0 14px var(--gold-glow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
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

/**
 * Sobreposição que substitui visualmente a tela de simulação de combate
 * (canvas do Phaser) enquanto o jogador está na aba da Cidadela. Preenche
 * totalmente o container do Phaser (absolute inset:0). Cada construção é
 * clicável e leva à sub-aba correspondente.
 */
export const CitadelSpriteStage: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const citadel = character.citadel;

  return (
    <div
      className="citadel-sprite-stage"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 25,
        background: 'var(--surface-1)',
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

      <BuildingSlot icon="🏛️" label="Centro de Comando" level={citadel?.commandCenter.level || 1} built={true} top="28%" left="42%" subTab="overview" />
      <BuildingSlot icon="📦" label="Depósito" level={citadel?.vault.level || 0} built={(citadel?.vault.level || 0) > 0} top="55%" left="12%" subTab="vault" />
      <BuildingSlot icon="🎖️" label="Quartel" level={citadel?.expeditions.level || 0} built={(citadel?.expeditions.level || 0) > 0} top="55%" left="72%" subTab="expeditions" />
      <BuildingSlot icon="🎓" label="Academia" level={citadel?.academy.level || 0} built={(citadel?.academy.level || 0) > 0} top="4%" left="72%" subTab="academy" />
      <BuildingSlot icon="🗼" label="Torre de Vigia" level={citadel?.watchTower.level || 0} built={(citadel?.watchTower.level || 0) > 0} top="4%" left="12%" subTab="watchTower" />
      <BuildingSlot icon="🛠️" label="Oficina" level={citadel?.forgeWorkshop.level || 0} built={(citadel?.forgeWorkshop.level || 0) > 0} top="55%" left="42%" subTab="forgeWorkshop" />
      <BuildingSlot icon="🌫️" label="Sifão Cósmico" level={citadel?.cosmicSiphon.level || 0} built={(citadel?.cosmicSiphon.level || 0) > 0} top="4%" left="42%" subTab="cosmicSiphon" />
      <BuildingSlot icon="🔯" label="Altar de Sincronia" level={citadel?.synchronyAltar.level || 0} built={(citadel?.synchronyAltar.level || 0) > 0} top="28%" left="85%" subTab="synchronyAltar" />
      <BuildingSlot icon="🧪" label="Laboratório" level={citadel?.relicLab.level || 0} built={(citadel?.relicLab.level || 0) > 0} top="78%" left="72%" subTab="relicLab" />
    </div>
  );
};
