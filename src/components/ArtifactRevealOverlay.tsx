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
    <div
      style={{
        position: 'fixed',
        top: '14%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 8900,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.6rem',
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,70,239,0.18) 0%, rgba(245,158,11,0.08) 55%, transparent 75%)',
          animation: 'artifact-reveal-glow 2.2s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!spriteFailed && spriteSrc ? (
          <img
            src={spriteSrc}
            alt={item.name}
            onError={() => setSpriteFailed(true)}
            style={{
              width: '140px',
              height: '140px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
            }}
          />
        ) : (
          <span style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>{item.icon}</span>
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
  );
};
