import React, { useEffect, useState } from 'react';
import { useQuestStore } from '../store/useQuestStore';
import { STORY_ITEMS_CATALOG } from '../core/quests/storyItemsData';
import { getTransparentImageUrl, peekTransparentImageUrl } from '../core/imageBackgroundStrip';

export const ArtifactRevealOverlay: React.FC = () => {
  const activeArtifactReveal = useQuestStore((s) => s.activeArtifactReveal);
  const [spriteSrc, setSpriteSrc] = useState<string | null>(null);
  const [spriteFailed, setSpriteFailed] = useState(false);

  const storyItemId = activeArtifactReveal?.storyItemId;
  const item = storyItemId ? STORY_ITEMS_CATALOG[storyItemId] : null;

  useEffect(() => {
    if (!storyItemId) {
      setSpriteSrc(null);
      setSpriteFailed(false);
      return;
    }
    const src = `/assets/${storyItemId}.png`;
    let cancelled = false;
    setSpriteSrc(peekTransparentImageUrl(src));
    setSpriteFailed(false);
    getTransparentImageUrl(src)
      .then((dataUrl) => { if (!cancelled) setSpriteSrc(dataUrl); })
      .catch(() => { if (!cancelled) setSpriteFailed(true); });
    return () => { cancelled = true; };
  }, [storyItemId]);

  if (!item) return null;

  return (
    // Envoltório externo ocupa a largura toda e centraliza via flex (não via `transform:
    // translateX`) — assim a animação `fadeIn` (que anima `transform: translateY`) não sobrescreve
    // a centralização por um instante, o que antes causava o artefato "nascer" encostado à direita
    // e só ir para o centro quando a animação terminava.
    <div
      style={{
        position: 'fixed',
        top: '14%',
        left: 0,
        right: 0,
        zIndex: 8900,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Halo de luz num elemento próprio, maior que o sprite. A animação anima `opacity`/
              `transform` (não `box-shadow`) de propósito: `box-shadow` é desenhado a partir da
              borda do elemento pra fora, então num círculo isso pinta um anel de luz forte só
              fora do círculo — deixando a região atrás do sprite (bem dentro do raio) sem brilho.
              O `transform` do keyframe precisa incluir o mesmo `translate(-50%, -50%)` da
              centralização abaixo, senão a animação sobrescreve e o halo pula pro canto. */}
          <div
            style={{
              position: 'absolute',
              width: '260px',
              height: '260px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(217,70,239,0.35) 0%, rgba(245,158,11,0.18) 40%, transparent 85%)',
              filter: 'blur(8px)',
              mixBlendMode: 'screen',
              animation: 'artifact-reveal-glow 2.2s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          {!spriteFailed && spriteSrc ? (
            <img
              src={spriteSrc}
              alt={item.name}
              onError={() => setSpriteFailed(true)}
              style={{
                position: 'relative',
                width: '140px',
                height: '140px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
              }}
            />
          ) : (
            <span style={{ position: 'relative', fontSize: '4.5rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>{item.icon}</span>
          )}
        </div>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fbbf24',
            textShadow: '0 0 10px rgba(245,158,11,0.6), 0 2px 4px rgba(0,0,0,0.8)',
            textAlign: 'center',
          }}
        >
          {item.name}
        </span>
      </div>
    </div>
  );
};
