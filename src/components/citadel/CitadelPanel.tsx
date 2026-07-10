import React, { useState } from 'react';
import { AudioManager } from '../../core/AudioManager';
import { CitadelOverview } from './CitadelOverview';
import { VaultPanel } from './VaultPanel';
import { ExpeditionPanel } from './ExpeditionPanel';
import { AcademyPanel } from './AcademyPanel';
import { WatchTowerPanel } from './WatchTowerPanel';
import { ForgeWorkshopPanel } from './ForgeWorkshopPanel';
import { CosmicSiphonPanel } from './CosmicSiphonPanel';
import { SynchronyAltarPanel } from './SynchronyAltarPanel';
import { RelicLabPanel } from './RelicLabPanel';

interface CitadelPanelProps {
  onBackToCombat: () => void;
}

export const CitadelPanel: React.FC<CitadelPanelProps> = ({ onBackToCombat }) => {
  const [subTab, setSubTab] = useState<'overview' | 'vault' | 'expeditions' | 'academy' | 'watchTower' | 'forgeWorkshop' | 'cosmicSiphon' | 'synchronyAltar' | 'relicLab'>('overview');

  const handleBack = () => {
    AudioManager.getInstance().playClick();
    onBackToCombat();
  };

  return (
    <div
      className="animate-tabFade"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        width: '100%',
        height: '100%',
        background: 'var(--surface-0)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          height: '4rem',
          borderBottom: '1px solid var(--border-dim)',
          background: 'var(--surface-1)',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--gold-300)' }}>
          🌌 Cidadela Astral
        </h1>
        <button
          onClick={handleBack}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239,68,68,0.4)',
            background: 'rgba(127,29,29,0.3)',
            color: '#f87171',
            cursor: 'pointer',
          }}
        >
          Voltar ao Combate ⚔
        </button>
      </header>

      <nav
        style={{
          display: 'flex',
          background: 'var(--surface-1)',
          borderBottom: '1px solid var(--border-dim)',
          flexShrink: 0,
        }}
      >
        {[
          { id: 'overview' as const, label: 'Visão Geral' },
          { id: 'vault' as const, label: 'Depósito' },
          { id: 'expeditions' as const, label: 'Expedições' },
          { id: 'academy' as const, label: 'Academia' },
          { id: 'watchTower' as const, label: 'Torre de Vigia' },
          { id: 'forgeWorkshop' as const, label: 'Oficina da Forja' },
          { id: 'cosmicSiphon' as const, label: 'Sifão Cósmico' },
          { id: 'synchronyAltar' as const, label: 'Altar de Sincronia' },
          { id: 'relicLab' as const, label: 'Laboratório' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${subTab === tab.id ? 'var(--gold-400)' : 'transparent'}`,
              color: subTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {subTab === 'overview' && <CitadelOverview />}
        {subTab === 'vault' && <VaultPanel />}
        {subTab === 'expeditions' && <ExpeditionPanel />}
        {subTab === 'academy' && <AcademyPanel />}
        {subTab === 'watchTower' && <WatchTowerPanel />}
        {subTab === 'forgeWorkshop' && <ForgeWorkshopPanel />}
        {subTab === 'cosmicSiphon' && <CosmicSiphonPanel />}
        {subTab === 'synchronyAltar' && <SynchronyAltarPanel />}
        {subTab === 'relicLab' && <RelicLabPanel />}
      </div>
    </div>
  );
};
