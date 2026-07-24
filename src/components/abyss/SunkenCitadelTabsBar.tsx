import React, { useEffect, useState } from 'react';
import { AudioManager } from '../../core/AudioManager';
import type { DistrictId } from '../../core/types';
import { DISTRICT_NAMES, DISTRICT_ICONS } from '../../core/sunkenCitadelFormulas';

export type SunkenSubTab = DistrictId | 'echoes';

export const SUNKEN_SUB_TABS: { id: SunkenSubTab; label: string; icon: string }[] = [
  { id: 'dock', label: DISTRICT_NAMES.dock, icon: DISTRICT_ICONS.dock },
  { id: 'echoHall', label: DISTRICT_NAMES.echoHall, icon: DISTRICT_ICONS.echoHall },
  { id: 'forge', label: DISTRICT_NAMES.forge, icon: DISTRICT_ICONS.forge },
  { id: 'temple', label: DISTRICT_NAMES.temple, icon: DISTRICT_ICONS.temple },
  { id: 'archive', label: DISTRICT_NAMES.archive, icon: DISTRICT_ICONS.archive },
  { id: 'throne', label: DISTRICT_NAMES.throne, icon: DISTRICT_ICONS.throne },
  { id: 'echoes', label: 'Ecos', icon: '🎭' },
];

interface Props {
  subTab: SunkenSubTab;
  setSubTab: (t: SunkenSubTab) => void;
}

/**
 * Substitui inteiramente a barra de abas principal enquanto o jogador está na Cidadela Submersa —
 * mesma estrutura/classes visuais de `CitadelTabsBar.tsx` (setas no desktop, carrossel giratório no
 * mobile), navegando pelos distritos + aba de Ecos.
 */
export const SunkenCitadelTabsBar: React.FC<Props> = ({ subTab, setSubTab }) => {
  const [desktopStartIndex, setDesktopStartIndex] = useState(0);

  useEffect(() => {
    const activeIdx = SUNKEN_SUB_TABS.findIndex((t) => t.id === subTab);
    if (activeIdx !== -1) {
      if (activeIdx < desktopStartIndex) {
        setDesktopStartIndex(activeIdx);
      } else if (activeIdx >= desktopStartIndex + 3) {
        setDesktopStartIndex(activeIdx - 2);
      }
    }
  }, [subTab]);

  const activeIndex = SUNKEN_SUB_TABS.findIndex((t) => t.id === subTab);
  const extendedTabs = [
    SUNKEN_SUB_TABS[SUNKEN_SUB_TABS.length - 1],
    ...SUNKEN_SUB_TABS,
    SUNKEN_SUB_TABS[0],
  ];

  return (
    <>
      {/* Desktop — setas */}
      <div className="tabs-container-desktop-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', pointerEvents: 'auto' }}>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            const currentIndex = SUNKEN_SUB_TABS.findIndex((t) => t.id === subTab);
            const nextIndex = currentIndex <= 0 ? SUNKEN_SUB_TABS.length - 1 : currentIndex - 1;
            setSubTab(SUNKEN_SUB_TABS[nextIndex].id);
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
          {SUNKEN_SUB_TABS.slice(desktopStartIndex, desktopStartIndex + 3).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                AudioManager.getInstance().playClick();
                setSubTab(tab.id);
              }}
              className={`tab-btn ${subTab === tab.id ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', whiteSpace: 'nowrap', flex: 1, minWidth: 0, overflow: 'hidden' }}
            >
              <span style={{ fontSize: '0.7rem', lineHeight: 1, flexShrink: 0 }}>{tab.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            const currentIndex = SUNKEN_SUB_TABS.findIndex((t) => t.id === subTab);
            const nextIndex = currentIndex === -1 || currentIndex >= SUNKEN_SUB_TABS.length - 1 ? 0 : currentIndex + 1;
            setSubTab(SUNKEN_SUB_TABS[nextIndex].id);
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
