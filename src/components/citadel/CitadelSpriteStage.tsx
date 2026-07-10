import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { bridge } from '../../bridge/GameBridge';
import { GameEvent } from '../../core/types';
import { AudioManager } from '../../core/AudioManager';
import { CitadelSubTab } from './CitadelTabsBar';

/**
 * ============================================================================
 * PLACEHOLDER TEMPORÁRIO — trocar por sprites reais no futuro
 * ============================================================================
 * Tudo neste arquivo (chão de pátio, estradas de pedra, marcadores) é
 * decoração 100% CSS/SVG, sem nenhuma dependência de assets de imagem.
 * Quando os sprites definitivos de cada construção existirem, basta:
 *   1. Apagar o <CourtyardGround /> e o <ConnectorRoads /> (ou manter, se
 *      quiser preservar como fundo/estradas por trás dos sprites).
 *   2. Trocar o conteúdo de <BuildingMarker> pela tag <img>/sprite Phaser
 *      correspondente, mantendo as mesmas props (top/left em %, onClick).
 * Nenhuma outra parte do app depende da implementação interna deste
 * componente — App.tsx só importa <CitadelSpriteStage /> sem props.
 * ============================================================================
 */

interface BuildingData {
  id: CitadelSubTab;
  icon: string;
  label: string;
  level: number;
  built: boolean;
  top: number; // posição central em % (0-100), eixo vertical
  left: number; // posição central em % (0-100), eixo horizontal
}

/**
 * Chão de pátio interno da Cidadela: terreno de terra e grama (não pedra),
 * com clareiras de terra batida sob cada construção, pedras e flores
 * espalhadas, tochas nos cantos e uma leve poeira arcana — tema
 * medieval-mágico, como o gramado murado de um castelo.
 */
const CourtyardGround: React.FC<{ buildings: BuildingData[] }> = ({ buildings }) => (
  <>
    {/* Base de grama, com variação de tom para não ficar chapada */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at 30% 15%, rgba(190,201,90,0.16), transparent 45%), ' +
          'radial-gradient(ellipse at 80% 85%, rgba(20,40,15,0.35), transparent 55%), ' +
          'linear-gradient(160deg, #5e7d3c 0%, #46662c 45%, #33501f 100%)',
      }}
    />
    {/* Textura de grama — pontilhado em dois tons simulando tufos de relva */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'radial-gradient(rgba(120,150,60,0.5) 1px, transparent 1.4px), ' +
          'radial-gradient(rgba(30,55,20,0.5) 1px, transparent 1.4px)',
        backgroundSize: '9px 9px, 9px 9px',
        backgroundPosition: '0 0, 4.5px 4.5px',
        opacity: 0.5,
        pointerEvents: 'none',
      }}
    />
    {/* Clareiras de terra batida sob cada construção — reforça a ideia de "canteiro de obras" */}
    {buildings.map((b) => (
      <div
        key={b.id}
        style={{
          position: 'absolute',
          top: `${b.top}%`,
          left: `${b.left}%`,
          transform: 'translate(-50%, -50%)',
          width: '30%',
          paddingTop: '22%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(101,80,58,0.55), rgba(101,80,58,0.15) 65%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />
    ))}
    {/* Pedras e flores espalhadas pelo gramado */}
    {GROUND_PROPS.map((p, idx) => (
      <div
        key={idx}
        style={{
          position: 'absolute',
          top: `${p.top}%`,
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          borderRadius: p.kind === 'rock' ? '30%' : '50%',
          background: p.kind === 'rock' ? 'linear-gradient(155deg, #8a8378, #5c574e)' : p.color,
          boxShadow: p.kind === 'rock' ? 'inset -1px -1px 2px rgba(0,0,0,0.4)' : 'none',
          transform: p.kind === 'rock' ? `rotate(${p.rotate}deg)` : undefined,
          pointerEvents: 'none',
        }}
      />
    ))}
    {/* Poeira arcana flutuando no ar — leve referência mágica sem virar "espaço sideral" */}
    {DUST_MOTES.map((s, idx) => (
      <div
        key={idx}
        style={{
          position: 'absolute',
          top: `${s.top}%`,
          left: `${s.left}%`,
          width: s.size,
          height: s.size,
          borderRadius: '50%',
          background: s.color,
          boxShadow: `0 0 4px ${s.color}`,
          animation: `citadel-dust-float ${s.duration}s ease-in-out ${s.delay}s infinite`,
          pointerEvents: 'none',
        }}
      />
    ))}
    {/* Brilho de tochas nos cantos superiores, como em um pátio de castelo à noite */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 6% 8%, rgba(251,146,60,0.22), transparent 30%), ' +
          'radial-gradient(circle at 94% 8%, rgba(251,146,60,0.22), transparent 30%)',
        pointerEvents: 'none',
      }}
    />
    {/* Vinheta para dar profundidade e focar o olhar no centro do pátio */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        boxShadow: 'inset 0 0 90px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }}
    />
  </>
);

const GROUND_PROPS = Array.from({ length: 16 }).map((_, i) => {
  const seed = (i * 83.7) % 100;
  const kind = i % 3 === 0 ? 'rock' : 'flower';
  const flowerColors = ['#f4d35e', '#f2f2f2', '#e8998d'];
  return {
    top: (seed * 2.9) % 90 + 4,
    left: (seed * 6.1) % 94 + 3,
    size: kind === 'rock' ? 5 + (i % 3) * 2 : 3 + (i % 2),
    kind: kind as 'rock' | 'flower',
    rotate: (i * 47) % 360,
    color: flowerColors[i % flowerColors.length],
  };
});

const DUST_MOTES = Array.from({ length: 14 }).map((_, i) => {
  // Distribuição pseudo-aleatória determinística (mesma seed sempre) para não gerar Math.random() a cada render
  const seed = (i * 137.5) % 100;
  return {
    top: (seed * 3.1) % 85 + 5,
    left: (seed * 5.3) % 96 + 2,
    size: 2 + (i % 2),
    duration: 4 + (i % 4),
    delay: (i % 5) * 0.5,
    color: i % 3 === 0 ? 'rgba(245,158,11,0.55)' : 'rgba(168,124,247,0.5)',
  };
});

/** Ponto sobre uma curva quadrática de Bézier em t ∈ [0,1]. */
function quadPoint(t: number, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
  };
}

/**
 * Estradas de terra ligando o Centro de Comando às demais construções —
 * curva suave (bézier quadrática) + leito duplo (base escura + trilho claro
 * desgastado) + pedrinhas espalhadas ao longo do caminho, lembrando uma
 * trilha batida de terra em vez de uma linha reta abstrata.
 */
const ConnectorRoads: React.FC<{ buildings: BuildingData[]; hub: BuildingData }> = ({ buildings, hub }) => (
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
  >
    {buildings.filter((b) => b.id !== hub.id).map((b, idx) => {
      const x1 = hub.left, y1 = hub.top, x2 = b.left, y2 = b.top;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      // Normal unitária ao segmento, para deslocar o ponto de controle e curvar a estrada
      const nx = -dy / len;
      const ny = dx / len;
      const bend = (idx % 2 === 0 ? 1 : -1) * (6 + (idx % 3) * 2);
      const cx = mx + nx * bend;
      const cy = my + ny * bend;
      const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

      const stoneTs = [0.22, 0.38, 0.5, 0.62, 0.78];

      return (
        <g key={b.id} opacity={b.built ? 1 : 0.4}>
          {/* Leito da estrada (base escura de terra) */}
          <path
            d={d}
            fill="none"
            stroke={b.built ? '#5a4630' : '#4a4438'}
            strokeWidth={3.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Trilho central desgastado, mais claro */}
          <path
            d={d}
            fill="none"
            stroke={b.built ? '#a9855c' : '#6b6558'}
            strokeWidth={1.9}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Pedrinhas ao longo do caminho */}
          {stoneTs.map((t, sIdx) => {
            const p = quadPoint(t, x1, y1, cx, cy, x2, y2);
            const r = 0.35 + ((sIdx + idx) % 2) * 0.15;
            return (
              <ellipse
                key={sIdx}
                cx={p.x + (sIdx % 2 === 0 ? 0.5 : -0.5)}
                cy={p.y + (sIdx % 2 === 0 ? -0.3 : 0.4)}
                rx={r}
                ry={r * 0.7}
                fill={b.built ? 'rgba(90,90,80,0.7)' : 'rgba(90,90,80,0.3)'}
              />
            );
          })}
        </g>
      );
    })}
  </svg>
);

const BuildingMarker: React.FC<{ data: BuildingData }> = ({ data }) => {
  const { icon, label, level, built, top, left, id } = data;

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
        className="citadel-building-marker citadel-marker-icon-box"
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
            background: built
              ? 'linear-gradient(155deg, var(--surface-3), var(--surface-2))'
              : 'repeating-linear-gradient(135deg, var(--surface-1), var(--surface-1) 6px, rgba(255,255,255,0.02) 6px, rgba(255,255,255,0.02) 12px)',
            border: `2px ${built ? 'solid' : 'dashed'} ${built ? 'var(--border-active)' : 'var(--border-dim)'}`,
            boxShadow: built ? '0 0 16px rgba(245,158,11,0.18), inset 0 0 12px rgba(0,0,0,0.35)' : 'none',
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
            e.currentTarget.style.boxShadow = built ? '0 0 16px rgba(245,158,11,0.18), inset 0 0 12px rgba(0,0,0,0.35)' : 'none';
          }}
        >
          {icon}
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
 * do desktop quanto no formato mais quadrado do mobile — todo o
 * posicionamento é relativo (%), então se adapta a qualquer proporção.
 * Cada construção é clicável e leva à sub-aba correspondente.
 */
export const CitadelSpriteStage: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const citadel = character.citadel;

  const buildings: BuildingData[] = [
    { id: 'overview', icon: '🏛️', label: 'Centro de Comando', level: citadel?.commandCenter.level || 1, built: true, top: 30, left: 42 },
    { id: 'vault', icon: '📦', label: 'Depósito', level: citadel?.vault.level || 0, built: (citadel?.vault.level || 0) > 0, top: 58, left: 12 },
    { id: 'expeditions', icon: '🎖️', label: 'Quartel', level: citadel?.expeditions.level || 0, built: (citadel?.expeditions.level || 0) > 0, top: 58, left: 72 },
    { id: 'academy', icon: '🎓', label: 'Academia', level: citadel?.academy.level || 0, built: (citadel?.academy.level || 0) > 0, top: 10, left: 72 },
    { id: 'watchTower', icon: '🗼', label: 'Torre de Vigia', level: citadel?.watchTower.level || 0, built: (citadel?.watchTower.level || 0) > 0, top: 10, left: 12 },
    { id: 'forgeWorkshop', icon: '🛠️', label: 'Oficina', level: citadel?.forgeWorkshop.level || 0, built: (citadel?.forgeWorkshop.level || 0) > 0, top: 58, left: 42 },
    { id: 'cosmicSiphon', icon: '🌫️', label: 'Sifão Cósmico', level: citadel?.cosmicSiphon.level || 0, built: (citadel?.cosmicSiphon.level || 0) > 0, top: 10, left: 42 },
    { id: 'synchronyAltar', icon: '🔯', label: 'Altar de Sincronia', level: citadel?.synchronyAltar.level || 0, built: (citadel?.synchronyAltar.level || 0) > 0, top: 30, left: 88 },
    { id: 'relicLab', icon: '🧪', label: 'Laboratório', level: citadel?.relicLab.level || 0, built: (citadel?.relicLab.level || 0) > 0, top: 82, left: 72 },
  ];

  const hub = buildings[0];

  return (
    <div
      className="citadel-sprite-stage"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 25,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes citadel-dust-float {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 0.8; }
          80% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-18px); }
        }
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
        @media (max-width: 840px) {
          .citadel-marker-icon-box { width: 44px; height: 44px; }
          .citadel-marker-icon { font-size: 1.3rem; }
          .citadel-marker-label { font-size: 0.5rem; padding: 0.08rem 0.3rem; margin-top: 0.25rem !important; }
          .citadel-marker-ring { inset: -3px; }
          .citadel-marker-badge { min-width: 13px; height: 13px; font-size: 0.46rem; }
        }
      `}</style>

      <CourtyardGround buildings={buildings} />
      <ConnectorRoads buildings={buildings} hub={hub} />

      {buildings.map((b) => (
        <BuildingMarker key={b.id} data={b} />
      ))}
    </div>
  );
};
