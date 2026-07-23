import React, { useEffect, useState } from 'react';
import { getTransparentImageUrl, peekTransparentImageUrl } from '../../core/imageBackgroundStrip';

/**
 * Renderiza um ícone recortado por índice de uma spritesheet 1024x1024 em
 * grid 3x3 (ordem de leitura em linha) — primo do `EvolutionSprite.tsx`
 * (citadel), que recorta por tier num grid 2x2. Mesma técnica de remoção de
 * fundo via chroma key (`imageBackgroundStrip.ts`) e mesmo fallback para
 * ícone emoji se a imagem não existir/falhar ao carregar.
 */

const CELL_INSET_PCT = 2.7;

interface IconSpriteProps {
  /** Caminho da spritesheet 1024x1024 (grid 3x3), ex: '/assets/runes_base.png'. */
  src: string;
  /** Índice da célula (0-8), leitura em linha (linha = index/3, coluna = index%3). */
  index: number;
  fallbackIcon: string;
  fallbackClassName?: string;
  stripBackground?: boolean;
}

const Fallback: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => (
  <span className={className} style={{ lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {icon}
  </span>
);

export const IconSprite: React.FC<IconSpriteProps> = ({
  src,
  index,
  fallbackIcon,
  fallbackClassName,
  stripBackground = true,
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() =>
    stripBackground ? peekTransparentImageUrl(src) : src
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!stripBackground) {
      setResolvedSrc(src);
      setFailed(false);
      return;
    }

    const cached = peekTransparentImageUrl(src);
    setResolvedSrc(cached);
    setFailed(false);

    getTransparentImageUrl(src)
      .then((dataUrl) => {
        if (!cancelled) setResolvedSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, stripBackground]);

  if (failed || !resolvedSrc) {
    return <Fallback icon={fallbackIcon} className={fallbackClassName} />;
  }

  const row = Math.floor(index / 3);
  const col = index % 3;
  const cellPct = 100 / 3;
  const visibleSlicePct = cellPct - CELL_INSET_PCT * 2;
  const scale = 100 / visibleSlicePct;
  const imgSizePct = scale * 100;
  const offsetLeftPct = -(col * cellPct + CELL_INSET_PCT) * scale;
  const offsetTopPct = -(row * cellPct + CELL_INSET_PCT) * scale;

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
