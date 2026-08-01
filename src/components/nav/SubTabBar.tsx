import React, { useEffect, useState } from 'react';
import { AudioManager } from '../../core/AudioManager';
import { TabBadgeDot } from '../TabBadgeDot';

export interface SubTabBarItem<T extends string> {
  id: T;
  label: string;
  icon: string;
  disabled?: boolean;
}

interface SubTabBarProps<T extends string> {
  tabs: SubTabBarItem<T>[];
  activeTab: T;
  setActiveTab: (t: T) => void;
  getNotification?: (id: T) => boolean;
  /** Quantos itens ficam visíveis por vez na janela deslizante do desktop (default 5). */
  desktopWindowSize?: number;
  /** Trunca o label com reticências ao invés de quebra de linha — usado quando a janela é estreita. */
  ellipsisLabels?: boolean;
  /** Retorna um sufixo de acento visual por item (ex.: 'citadel' → classes `tab-btn-citadel`/`carousel-tab-btn-citadel`, glow roxo). */
  getAccentClassName?: (id: T) => string | undefined;
  disabledTitle?: string;
}

/**
 * Barra de sub-abas genérica: setas + janela deslizante no desktop, carrossel giratório no
 * mobile. Extraída do padrão original de `CitadelTabsBar`/`SunkenCitadelTabsBar` para ser
 * reutilizável por qualquer conjunto de sub-abas (categorias de navegação, distritos, etc.).
 */
export function SubTabBar<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
  getNotification,
  desktopWindowSize = 5,
  ellipsisLabels = false,
  getAccentClassName,
  disabledTitle,
}: SubTabBarProps<T>) {
  const [desktopStartIndex, setDesktopStartIndex] = useState(0);

  useEffect(() => {
    const activeIdx = tabs.findIndex((t) => t.id === activeTab);
    if (activeIdx !== -1) {
      if (activeIdx < desktopStartIndex) {
        setDesktopStartIndex(activeIdx);
      } else if (activeIdx >= desktopStartIndex + desktopWindowSize) {
        setDesktopStartIndex(activeIdx - (desktopWindowSize - 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabs]);

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);
  const extendedTabs = [
    tabs[tabs.length - 1],
    ...tabs,
    tabs[0],
  ];

  const hasNotification = (id: T): boolean => !!getNotification?.(id);

  return (
    <>
      {/* Desktop — setas */}
      <div className="tabs-container-desktop-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', pointerEvents: 'auto' }}>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
            let nextIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
            while (tabs[nextIndex]?.disabled && nextIndex !== currentIndex) {
              nextIndex = nextIndex === 0 ? tabs.length - 1 : nextIndex - 1;
            }
            setActiveTab(tabs[nextIndex].id);
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
          {tabs.slice(desktopStartIndex, desktopStartIndex + desktopWindowSize).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.disabled) return;
                AudioManager.getInstance().playClick();
                setActiveTab(tab.id);
              }}
              disabled={tab.disabled}
              title={tab.disabled ? disabledTitle : tab.label}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'tab-btn-disabled' : ''} ${!tab.disabled && getAccentClassName?.(tab.id) ? `tab-btn-${getAccentClassName(tab.id)}` : ''}`}
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', whiteSpace: 'nowrap', flex: 1, opacity: tab.disabled ? 0.45 : 1, cursor: tab.disabled ? 'not-allowed' : 'pointer', ...(ellipsisLabels ? { minWidth: 0, overflow: 'hidden' } : {}) }}
            >
              <span style={{ fontSize: '0.7rem', lineHeight: 1, flexShrink: 0 }}>{tab.icon}</span>
              <span style={ellipsisLabels ? { overflow: 'hidden', textOverflow: 'ellipsis' } : undefined}>{tab.label}</span>
              {hasNotification(tab.id) && <TabBadgeDot />}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
            let nextIndex = currentIndex === -1 || currentIndex >= tabs.length - 1 ? 0 : currentIndex + 1;
            while (tabs[nextIndex]?.disabled && nextIndex !== currentIndex) {
              nextIndex = nextIndex >= tabs.length - 1 ? 0 : nextIndex + 1;
            }
            setActiveTab(tabs[nextIndex].id);
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
            const isCurrentActive = tab.id === activeTab;
            return (
              <button
                key={`${tab.id}-${idx}`}
                onClick={() => {
                  if (tab.disabled) return;
                  AudioManager.getInstance().playClick();
                  setActiveTab(tab.id);
                }}
                title={tab.disabled ? disabledTitle : tab.label}
                className={`carousel-tab-btn ${isCurrentActive ? 'active' : ''} ${tab.disabled ? 'carousel-tab-btn-disabled' : ''} ${!tab.disabled && getAccentClassName?.(tab.id) ? `carousel-tab-btn-${getAccentClassName(tab.id)}` : ''}`}
                style={{ flex: '0 0 33.333%', width: '33.333%', opacity: tab.disabled ? 0.45 : 1 }}
              >
                <span style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="carousel-icon">{tab.icon}</span>
                  <span className="carousel-label">{tab.label}</span>
                  {hasNotification(tab.id) && <TabBadgeDot />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
