import React, { useEffect, useState } from 'react';
import { getTransparentImageUrl, peekTransparentImageUrl } from '../../core/imageBackgroundStrip';

/**
 * Renderiza o sprite de evolução de uma construção da Cidadela, recortando
 * o quadrante correto (tier) de uma sprite sheet 1024x1024 em grid 2x2.
 * Ordem confirmada visualmente nas artes geradas (não é leitura em linha):
 *   [0,1] Bloqueado (inferior-esquerdo, o mais simples) | [0,0] Básico (superior-esquerdo)
 *   [1,1] Avançado (inferior-direito)                    | [1,0] Supremo (superior-direito, o mais elaborado)
 *
 * O fundo sólido da imagem (branco ou qualquer cor uniforme nas bordas) é
 * removido automaticamente via canvas (`imageBackgroundStrip.ts`) antes de
 * exibir — mesma técnica já usada para os sprites de personagens/inimigos
 * no Phaser (`CombatScene.makeTextureTransparent`), só que do lado do DOM.
 *
 * Enquanto o arquivo em `src` não existir (ou falhar ao carregar), cai
 * automaticamente no ícone emoji de fallback — nenhuma outra parte do app
 * precisa saber se a arte definitiva já foi adicionada ou não.
 */

export type EvolutionTier = 0 | 1 | 2 | 3;

/**
 * Deriva o tier visual (0-3) a partir do nível atual e do nível máximo da
 * construção. Usa os mesmos cortes em terços já adotados pela Torre de
 * Vigia Astral (níveis 1-2 / 3-4 / 5) para manter a linguagem visual
 * consistente entre construções com tetos de nível diferentes.
 */
export function getEvolutionTier(level: number, maxLevel: number): EvolutionTier {
  if (level <= 0) return 0;
  if (maxLevel <= 1 || level >= maxLevel) return 3;
  const thirds = Math.ceil(maxLevel / 3);
  if (level > thirds * 2) return 3;
  if (level > thirds) return 2;
  return 1;
}

const TIER_COL: Record<EvolutionTier, number> = { 0: 0, 1: 0, 2: 1, 3: 1 };
const TIER_ROW: Record<EvolutionTier, number> = { 0: 1, 1: 0, 2: 1, 3: 0 };

/**
 * Margem cortada de cada borda do quadrante (em % da imagem inteira, não do
 * quadrante), para remover a linha divisória preta do grid 2x2 — essa linha
 * é preta, então fica bem longe da cor-chave vermelha e `imageBackgroundStrip`
 * nunca a remove (é um problema de posição/grid, não de chroma key). Medido
 * diretamente num sprite sheet real (`citadel_watch_tower.png`, canvas +
 * varredura de pixels): a linha + a faixa de anti-aliasing ao redor dela têm
 * uns 10px de largura num canvas de 1024px (~1%). O valor antigo (4%, 41px)
 * cortava bem mais que o necessário — em construções cujo desenho usa quase
 * toda a largura do quadrante (ex: o feixe/galáxia da Torre de Vigia), esse
 * excesso de corte, ainda ampliado pelo `scale` abaixo, aparecia como um
 * "zoom" cortando a arte. Cada quadrante ocupa 50% da imagem, então esse
 * valor é sempre bem menor que 25 (ou o corte "come" o quadrante inteiro).
 */
const QUADRANT_INSET_PCT = 1.5;

interface EvolutionSpriteProps {
  /** Caminho da spritesheet 1024x1024 (grid 2x2), ex: '/assets/citadel_vault.png'. */
  src: string;
  level: number;
  maxLevel: number;
  /** Emoji/ícone mostrado enquanto a arte definitiva não existe, ainda está processando, ou falha ao carregar. */
  fallbackIcon: string;
  /**
   * className aplicada ao ícone de fallback — reuse a mesma classe usada para
   * dimensionar o emoji hoje (ex: `citadel-marker-icon`), para herdar o
   * font-size responsivo já definido em CSS sem precisar de um prop de size.
   */
  fallbackClassName?: string;
  /** Imagem realmente única (sem grid 2x2) — raro; a maioria das artes geradas vem em grid mesmo para construções sem evolução. */
  singleFrame?: boolean;
  /** Desliga a remoção de fundo (ex: se a imagem já vier com alpha real). Padrão: liga. */
  stripBackground?: boolean;
  /**
   * Notifica o chamador se está exibindo a arte real (true) ou o ícone de
   * fallback (false) — usado por `BuildingMarker` para esconder o fundo
   * decorativo (cartão) assim que a arte real carrega, em vez de deixá-la
   * flutuando dentro de uma caixa escura.
   */
  onResolvedChange?: (hasArt: boolean) => void;
}

const Fallback: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => (
  <span className={className} style={{ lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {icon}
  </span>
);

/**
 * Preenche 100% da largura/altura do elemento pai (que já controla o
 * tamanho via CSS/classe responsiva) — não recebe tamanho em pixels.
 */
export const EvolutionSprite: React.FC<EvolutionSpriteProps> = ({
  src,
  level,
  maxLevel,
  fallbackIcon,
  fallbackClassName,
  singleFrame = false,
  stripBackground = true,
  onResolvedChange,
}) => {
  // Se a arte já foi processada antes (ex: preload no início do jogo, ou reabrir a mesma
  // aba), começa direto com o resultado em cache — evita o "flash" do ícone de fallback
  // enquanto a Promise de `getTransparentImageUrl` resolveria de novo à toa.
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() =>
    stripBackground ? peekTransparentImageUrl(src) : src
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!stripBackground) {
      setResolvedSrc(src);
      setFailed(false);
      onResolvedChange?.(true);
      return;
    }

    const cached = peekTransparentImageUrl(src);
    setResolvedSrc(cached);
    setFailed(false);
    onResolvedChange?.(!!cached);

    getTransparentImageUrl(src)
      .then((dataUrl) => {
        if (!cancelled) {
          setResolvedSrc(dataUrl);
          onResolvedChange?.(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          onResolvedChange?.(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, stripBackground]);

  if (failed || !resolvedSrc) {
    return <Fallback icon={fallbackIcon} className={fallbackClassName} />;
  }

  if (singleFrame) {
    return (
      <img
        src={resolvedSrc}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
      />
    );
  }

  const tier = getEvolutionTier(level, maxLevel);
  const col = TIER_COL[tier];
  const row = TIER_ROW[tier];

  // Visible slice per axis = 50% (quadrante) menos a margem de cada lado; escala para
  // preencher 100% da caixa, então desloca para trazer o canto do quadrante (já com a
  // margem) para a origem.
  const visibleSlicePct = 50 - QUADRANT_INSET_PCT * 2;
  const scale = 100 / visibleSlicePct;
  const imgSizePct = scale * 100;
  const offsetLeftPct = -(col * 50 + QUADRANT_INSET_PCT) * scale;
  const offsetTopPct = -(row * 50 + QUADRANT_INSET_PCT) * scale;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', pointerEvents: 'none' }}>
      <img
        src={resolvedSrc}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
        style={{
          position: 'absolute',
          width: `${imgSizePct}%`,
          height: `${imgSizePct}%`,
          left: `${offsetLeftPct}%`,
          top: `${offsetTopPct}%`,
          maxWidth: 'none',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};
