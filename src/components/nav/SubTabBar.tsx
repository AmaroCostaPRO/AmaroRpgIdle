import React, { useEffect, useRef, useState } from 'react';
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
  // 2 clones de cada lado (não só 1) — necessário pra que, ao centralizar o carrossel EM CIMA
  // de um clone (durante o loop), os vizinhos dos dois lados desse clone também existam no
  // array. Com só 1 clone de cada lado, centralizar no clone do fim da fita deixava o vizinho
  // da direita fora do array (posição inexistente) — a janela de 3 abas ficava com um buraco
  // vazio durante o deslizar, e só ao "teleportar" pra aba real é que o vizinho aparecia,
  // dando a impressão de que o ícone/nome "aparecia" de repente em vez de já estar visível
  // durante o giro.
  const extendedTabs = [
    tabs[tabs.length - 2],
    tabs[tabs.length - 1],
    ...tabs,
    tabs[0],
    tabs[1],
  ];
  // Deslocamento entre o índice real (0..tabs.length-1) e a posição em `extendedTabs`.
  const PAD = 2;

  // Posição visual do carrossel mobile dentro de `extendedTabs` (PAD..PAD+tabs.length-1 = abas
  // reais; posições fora desse intervalo são clones, usados só de passagem durante o loop).
  // Guardado à parte de `activeIndex` porque, ao dar a volta (última → primeira ou vice-versa),
  // precisamos animar CONTINUANDO na mesma direção até o clone no final/início da fita, e só
  // depois "teleportar" sem transição para a aba real equivalente — em vez de simplesmente
  // pular `activeIndex` direto (o que faria o carrossel rebobinar pra trás visualmente).
  // Precisa bater com a duração de `.tabs-carousel-inner` (`transition: transform 0.4s ...`,
  // index.css) — usado pra saber quando o "teleporte" pós-loop deve acontecer.
  const WRAP_TRANSITION_MS = 400;

  const [renderIndex, setRenderIndex] = useState(() => activeIndex + PAD);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const prevActiveIndexRef = useRef(activeIndex);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Assinatura estável da lista de sub-abas (por id, não por referência do array) — `tabs`
  // chega de `activeCategoryItems` em GameUI.tsx, recriado a cada re-render do jogo (que
  // acontece o tempo todo durante o combate), então comparar por referência disparava a
  // detecção de "categoria mudou" a cada tick e suprimia a transição quase sempre.
  const tabsSignature = tabs.map((t) => t.id).join('|');
  const prevTabsSignatureRef = useRef(tabsSignature);

  useEffect(() => {
    // Qualquer novo movimento cancela um "teleporte" pendente de um loop anterior — evita
    // que um snap atrasado sobreponha a posição de um movimento mais recente.
    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }

    if (prevTabsSignatureRef.current !== tabsSignature) {
      // A lista de sub-abas trocou de verdade (ex.: mudou de categoria) — reposiciona
      // direto, sem tentar detectar volta/loop entre abas de listas diferentes.
      prevTabsSignatureRef.current = tabsSignature;
      prevActiveIndexRef.current = activeIndex;
      setSuppressTransition(true);
      setRenderIndex(activeIndex + PAD);
      return;
    }

    const prev = prevActiveIndexRef.current;
    const curr = activeIndex;
    if (curr === prev) return;

    const wrappedForward = prev === tabs.length - 1 && curr === 0;
    const wrappedBackward = prev === 0 && curr === tabs.length - 1;

    setSuppressTransition(false);
    if (wrappedForward) {
      // Desliza pro clone do 1º, no fim da fita — continuando na mesma direção do gesto —
      // e agenda o "teleporte" sem transição pra aba real equivalente assim que a animação
      // termina (as duas posições são visualmente idênticas, o salto é imperceptível).
      setRenderIndex(tabs.length + PAD);
      snapTimerRef.current = setTimeout(() => {
        setSuppressTransition(true);
        setRenderIndex(PAD);
      }, WRAP_TRANSITION_MS);
    } else if (wrappedBackward) {
      setRenderIndex(PAD - 1); // desliza pro clone do último, no início da fita
      snapTimerRef.current = setTimeout(() => {
        setSuppressTransition(true);
        setRenderIndex(tabs.length + PAD - 1);
      }, WRAP_TRANSITION_MS);
    } else {
      setRenderIndex(curr + PAD);
    }
    prevActiveIndexRef.current = curr;
  }, [activeIndex, tabsSignature]);

  useEffect(() => () => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
  }, []);

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
            transform: `translateX(calc(33.333% - ${renderIndex * 33.333}%))`,
            transition: suppressTransition ? 'none' : undefined,
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
