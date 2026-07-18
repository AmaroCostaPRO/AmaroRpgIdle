import React, { useEffect, useState } from 'react';
import { AudioManager } from '../../core/AudioManager';

export type CitadelSubTab = 'overview' | 'vault' | 'expeditions' | 'academy' | 'watchTower' | 'forgeWorkshop' | 'cosmicSiphon' | 'synchronyAltar' | 'relicLab' | 'alchemyLab' | 'huntSanctuary';

export const CITADEL_SUB_TABS: { id: CitadelSubTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: '🌌' },
  { id: 'vault', label: 'Depósito', icon: '📦' },
  { id: 'expeditions', label: 'Expedições', icon: '🎖️' },
  { id: 'academy', label: 'Academia', icon: '🎓' },
  { id: 'watchTower', label: 'Torre de Vigia', icon: '🗼' },
  { id: 'forgeWorkshop', label: 'Oficina', icon: '🛠️' },
  { id: 'cosmicSiphon', label: 'Sifão Cósmico', icon: '🌫️' },
  { id: 'synchronyAltar', label: 'Altar', icon: '🔯' },
  { id: 'relicLab', label: 'Laboratório', icon: '🧪' },
  { id: 'alchemyLab', label: 'Alquimia', icon: '⚗️' },
  { id: 'huntSanctuary', label: 'Santuário', icon: '📜' },
];

interface Props {
  subTab: CitadelSubTab;
  setSubTab: (t: CitadelSubTab) => void;
}

/**
 * Substitui inteiramente a barra de abas principal enquanto o jogador está na
 * Cidadela — mesma estrutura/classes visuais (setas no desktop, carrossel
 * giratório no mobile) só que navegando pelas sub-áreas da Cidadela.
 */
export const CitadelTabsBar: React.FC<Props> = ({ subTab, setSubTab }) => {
  const [desktopStartIndex, setDesktopStartIndex] = useState(0);

  useEffect(() => {
    const activeIdx = CITADEL_SUB_TABS.findIndex((t) => t.id === subTab);
    if (activeIdx !== -1) {
      if (activeIdx < desktopStartIndex) {
        setDesktopStartIndex(activeIdx);
      } else if (activeIdx >= desktopStartIndex + 5) {
        setDesktopStartIndex(activeIdx - 4);
      }
    }
  }, [subTab]);

  const activeIndex = CITADEL_SUB_TABS.findIndex((t) => t.id === subTab);
  const extendedTabs = [
    CITADEL_SUB_TABS[CITADEL_SUB_TABS.length - 1],
    ...CITADEL_SUB_TABS,
    CITADEL_SUB_TABS[0],
  ];

  return (
    <>
      {/* Desktop — setas */}
      <div className="tabs-container-desktop-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', pointerEvents: 'auto' }}>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            const currentIndex = CITADEL_SUB_TABS.findIndex((t) => t.id === subTab);
            const nextIndex = currentIndex <= 0 ? CITADEL_SUB_TABS.length - 1 : currentIndex - 1;
            setSubTab(CITADEL_SUB_TABS[nextIndex].id);
          }}
          className="tab-carousel-arrow-btn"
          style={{
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--gold-400)',
            borderRadius: 'var(--radius-md)',
            width: '2.2rem',
            height: '2.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-button)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          ◀
        </button>

        <div className="tabs-container tabs-container-desktop" style={{ flex: 1, display: 'flex', gap: '2px', overflow: 'hidden' }}>
          {CITADEL_SUB_TABS.slice(desktopStartIndex, desktopStartIndex + 5).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                AudioManager.getInstance().playClick();
                setSubTab(tab.id);
              }}
              className={`tab-btn ${subTab === tab.id ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', whiteSpace: 'nowrap', flex: 1 }}
            >
              <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            const currentIndex = CITADEL_SUB_TABS.findIndex((t) => t.id === subTab);
            const nextIndex = currentIndex === -1 || currentIndex >= CITADEL_SUB_TABS.length - 1 ? 0 : currentIndex + 1;
            setSubTab(CITADEL_SUB_TABS[nextIndex].id);
          }}
          className="tab-carousel-arrow-btn"
          style={{
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--gold-400)',
            borderRadius: 'var(--radius-md)',
            width: '2.2rem',
            height: '2.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-button)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          ▶
        </button>
      </div>

      {/* Mobile — carrossel giratório */}
      <div className="tabs-container-mobile">
        <div
          className="tabs-carousel-inner"
          style={{
            transform: `translateX(calc(33.333% - ${(activeIndex + 1) * 33.333}%))`,
          }}
        >
          {extendedTabs.map((tab, idx) => {
            const isCurrentActive = tab.id === subTab;
            return (
              <button
                key={`${tab.id}-${idx}`}
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  setSubTab(tab.id);
                }}
                className={`carousel-tab-btn ${isCurrentActive ? 'active' : ''}`}
                style={{ flex: '0 0 33.333%', width: '33.333%' }}
              >
                <span className="carousel-icon">{tab.icon}</span>
                <span className="carousel-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
