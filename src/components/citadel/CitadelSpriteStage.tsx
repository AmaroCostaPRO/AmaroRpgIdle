import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { bridge } from '../../bridge/GameBridge';
import { GameEvent } from '../../core/types';
import { AudioManager } from '../../core/AudioManager';
import { CitadelSubTab } from './CitadelTabsBar';
import { EvolutionSprite } from './EvolutionSprite';
import { BUILDING_SPRITE_SRC } from './citadelBuildingSprites';

/**
 * Background definitivo do pátio da Cidadela (grid 3x3: 8 clareiras ao
 * redor + Centro de Comando no meio, onde os caminhos convergem). As
 * posições dos marcadores abaixo (`top`/`left`) foram calibradas para
 * bater com as clareiras desta imagem — se ela for regerada com um
 * layout diferente, ajuste os valores em `buildings` (CitadelSpriteStage)
 * para acompanhar.
 *
 * A imagem é quadrada (1024x1024), mas o container do jogo não é (4:3 no
 * desktop, quase quadrado no mobile). Usamos `object-fit: fill` (esticando
 * a imagem, sem cortar nem sobrar barras) em vez de `cover` (que cortava e
 * desalinhava os marcadores) ou de confinar a um quadrado centralizado
 * (que sobrava barra preta nas laterais). Como o esticamento é uniforme em
 * porcentagem — a mesma transformação aplicada tanto à imagem quanto aos
 * marcadores posicionados em `top`/`left` % — o alinhamento continua
 * perfeito em qualquer proporção de tela, só a arte fica levemente
 * espichada/achatada dependendo do formato do container (igual ao
 * comportamento dos backgrounds da tela de combate).
 */
const BACKGROUND_SRC = '/assets/citadel_background.png';

interface BuildingData {
  id: CitadelSubTab;
  icon: string;
  label: string;
  level: number;
  maxLevel: number;
  built: boolean;
  top: number; // posição central em % (0-100), eixo vertical
  left: number; // posição central em % (0-100), eixo horizontal
}

const BuildingMarker: React.FC<{ data: BuildingData }> = ({ data }) => {
  const { icon, label, level, maxLevel, built, top, left, id } = data;
  const [hasArt, setHasArt] = useState(false);

  const restingBoxShadow = hasArt ? 'none' : built ? '0 0 16px rgba(245,158,11,0.18), inset 0 0 12px rgba(0,0,0,0.35)' : 'none';

  return (
    <div
      onClick={() => {
        AudioManager.getInstance().playClick();
        bridge.emit(GameEvent.CITADEL_SUBTAB_REQUESTED, { subTab: id });
      }}
      title={`Ir para ${label}`}
      className="citadel-marker-wrap"
      style={{
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        className={`citadel-building-marker citadel-marker-icon-box${id === 'overview' ? ' citadel-marker-icon-box--command' : ''}`}
        style={{
          position: 'relative',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Anel de destaque pulsante — só nas construções já erguidas, convidando ao clique */}
        {built && (
          <span
            className="citadel-marker-ring"
            style={{
              position: 'absolute',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(245,158,11,0.45)',
              animation: 'citadel-marker-pulse 2.4s ease-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          className="citadel-marker-icon"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 'var(--radius-lg)',
            // Fundo decorativo (cartão) só aparece enquanto mostra o emoji de fallback —
            // some assim que a arte real da construção carrega, para o sprite "pousar"
            // direto sobre o pátio em vez de ficar dentro de uma caixa escura.
            background: hasArt
              ? 'transparent'
              : built
                ? 'linear-gradient(155deg, var(--surface-3), var(--surface-2))'
                : 'repeating-linear-gradient(135deg, var(--surface-1), var(--surface-1) 6px, rgba(255,255,255,0.02) 6px, rgba(255,255,255,0.02) 12px)',
            border: hasArt ? 'none' : `2px ${built ? 'solid' : 'dashed'} ${built ? 'var(--border-active)' : 'var(--border-dim)'}`,
            boxShadow: restingBoxShadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: built ? 1 : 0.5,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 0 18px var(--gold-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = restingBoxShadow;
          }}
        >
          <EvolutionSprite
            src={BUILDING_SPRITE_SRC[id]}
            level={level}
            maxLevel={maxLevel}
            fallbackIcon={icon}
            fixedTier={id === 'overview' ? 2 : undefined}
            onResolvedChange={setHasArt}
          />
        </div>
        {built && (
          <span
            className="citadel-marker-badge"
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              padding: '0 4px',
              borderRadius: '999px',
              background: 'var(--gold-500, #d97706)',
              color: '#1a1206',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0,0,0,0.4)',
            }}
          >
            {level}
          </span>
        )}
      </div>
      <span
        className="citadel-marker-label"
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '0.45rem',
          borderRadius: 'var(--radius-pill)',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          color: built ? '#fff' : 'rgba(255,255,255,0.55)',
          whiteSpace: 'nowrap',
        }}
      >
        {label} {built ? '' : '(vazio)'}
      </span>
    </div>
  );
};

/**
 * Sobreposição que substitui visualmente a tela de simulação de combate
 * (canvas do Phaser) enquanto o jogador está na aba da Cidadela. Preenche
 * totalmente o container do Phaser (absolute inset:0), tanto no retângulo
 * do desktop quanto no formato mais quadrado do mobile — o background é
 * esticado (`object-fit: fill`) para preencher a área inteira sem barras,
 * e os marcadores acompanham em porcentagem. Cada construção é clicável e
 * leva à sub-aba correspondente.
 */
export const CitadelSpriteStage: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const citadel = character.citadel;

  // Grid 3x3 (20% / 50% / 80% em cada eixo), calibrado para as 8 clareiras +
  // 1 espaço central de citadel_background.png. Ver comentário de BACKGROUND_SRC.
  const buildings: BuildingData[] = [
    { id: 'overview', icon: '🏛️', label: 'Centro de Comando', level: citadel?.commandCenter.level || 1, maxLevel: 1, built: true, top: 50, left: 50 },
    { id: 'watchTower', icon: '🗼', label: 'Torre de Vigia', level: citadel?.watchTower.level || 0, maxLevel: 5, built: (citadel?.watchTower.level || 0) > 0, top: 20, left: 20 },
    { id: 'cosmicSiphon', icon: '🌫️', label: 'Sifão Cósmico', level: citadel?.cosmicSiphon.level || 0, maxLevel: 5, built: (citadel?.cosmicSiphon.level || 0) > 0, top: 20, left: 50 },
    { id: 'academy', icon: '🎓', label: 'Academia', level: citadel?.academy.level || 0, maxLevel: 5, built: (citadel?.academy.level || 0) > 0, top: 20, left: 80 },
    { id: 'vault', icon: '📦', label: 'Depósito', level: citadel?.vault.level || 0, maxLevel: 5, built: (citadel?.vault.level || 0) > 0, top: 50, left: 20 },
    { id: 'expeditions', icon: '🎖️', label: 'Quartel', level: citadel?.expeditions.level || 0, maxLevel: 5, built: (citadel?.expeditions.level || 0) > 0, top: 50, left: 80 },
    { id: 'forgeWorkshop', icon: '🛠️', label: 'Oficina', level: citadel?.forgeWorkshop.level || 0, maxLevel: 5, built: (citadel?.forgeWorkshop.level || 0) > 0, top: 80, left: 20 },
    { id: 'relicLab', icon: '🧪', label: 'Laboratório', level: citadel?.relicLab.level || 0, maxLevel: 5, built: (citadel?.relicLab.level || 0) > 0, top: 80, left: 50 },
    { id: 'synchronyAltar', icon: '🔯', label: 'Altar de Sincronia', level: citadel?.synchronyAltar.level || 0, maxLevel: 5, built: (citadel?.synchronyAltar.level || 0) > 0, top: 80, left: 80 },
  ];

  return (
    <div
      className="citadel-sprite-stage"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 25,
        overflow: 'hidden',
        background: '#0b0e14',
      }}
    >
      <style>{`
        @keyframes citadel-marker-pulse {
          0% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.18); }
        }
        /* Tamanhos responsivos dos marcadores — o container do Phaser é um
           retângulo 4:3 no desktop mas fica proporcionalmente mais "quadrado"
           (menor em altura absoluta) no mobile, então os marcadores precisam
           encolher para não se sobrepor. */
        .citadel-marker-icon-box { width: 84px; height: 84px; }
        .citadel-marker-icon { font-size: 2.35rem; }
        .citadel-marker-label { font-size: 0.68rem; padding: 0.15rem 0.5rem; }
        .citadel-marker-ring { inset: -6px; }
        .citadel-marker-badge { min-width: 20px; height: 20px; font-size: 0.62rem; }
        /* Centro de Comando é a construção principal (hub) — 60% maior que as demais para reforçar sua importância visual. */
        .citadel-marker-icon-box--command { width: 134px; height: 134px; }
        @media (max-width: 840px) {
          .citadel-marker-icon-box { width: 44px; height: 44px; }
          .citadel-marker-icon { font-size: 1.3rem; }
          .citadel-marker-label { font-size: 0.5rem; padding: 0.08rem 0.3rem; margin-top: 0.25rem !important; }
          .citadel-marker-ring { inset: -3px; }
          .citadel-marker-badge { min-width: 13px; height: 13px; font-size: 0.46rem; }
          .citadel-marker-icon-box--command { width: 70px; height: 70px; }
        }
      `}</style>

      <img
        src={BACKGROUND_SRC}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
      />

      {buildings.map((b) => (
        <BuildingMarker key={b.id} data={b} />
      ))}
    </div>
  );
};
