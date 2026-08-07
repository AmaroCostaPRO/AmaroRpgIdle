import React, { useEffect, useState } from 'react';
import { useTransitionStore } from '../store/useTransitionStore';
import { getTransparentImageUrl, peekTransparentImageUrl } from '../core/imageBackgroundStrip';
import { AlmaMundoFlame, AvatarEchoPortrait } from './shared/SpecialNpcPortraits';

const SPECIAL_PORTRAIT_NPC_IDS = new Set(['alma_mundo', 'avatar_echo']);

export const TransitionBannerOverlay: React.FC = () => {
  const activeTransition = useTransitionStore((s) => s.activeTransition);
  const closeTransition = useTransitionStore((s) => s.closeTransition);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [portraitSrc, setPortraitSrc] = useState<string | null>(null);

  // Auto-close para o modo ágil (fast toast)
  useEffect(() => {
    if (!activeTransition || !activeTransition.isFast) return;

    const timer = setTimeout(() => {
      closeTransition();
    }, 2800);

    return () => clearTimeout(timer);
  }, [activeTransition, closeTransition]);

  // Efeito máquina de escrever para o modo Full Mode
  useEffect(() => {
    if (!activeTransition || activeTransition.isFast) return;

    const fullLore = activeTransition.loreText || '';
    setDisplayedText('');
    setIsTyping(true);

    if (!fullLore) {
      setIsTyping(false);
      return;
    }

    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setDisplayedText(fullLore.slice(0, idx));
      if (idx >= fullLore.length) {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [activeTransition]);

  // Resolução do retrato do speaker
  useEffect(() => {
    if (!activeTransition?.speakerId || SPECIAL_PORTRAIT_NPC_IDS.has(activeTransition.speakerId)) {
      setPortraitSrc(null);
      return;
    }
    const src = `/assets/npc_${activeTransition.speakerId}.png`;
    let cancelled = false;
    setPortraitSrc(peekTransparentImageUrl(src));
    getTransparentImageUrl(src)
      .then((dataUrl) => { if (!cancelled) setPortraitSrc(dataUrl); })
      .catch(() => { if (!cancelled) setPortraitSrc(null); });
    return () => { cancelled = true; };
  }, [activeTransition?.speakerId]);

  // Teclado (Enter / Espaço fecha ou pula a digitação)
  useEffect(() => {
    if (!activeTransition || activeTransition.isFast) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (isTyping) {
          setDisplayedText(activeTransition.loreText || '');
          setIsTyping(false);
        } else {
          closeTransition();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTransition, isTyping, closeTransition]);

  if (!activeTransition) return null;

  const factionColor = activeTransition.factionColor || '#38bdf8';

  // MODO ÁGIL / REPETIÇÃO (Fast Toast)
  if (activeTransition.isFast) {
    return (
      <div
        onClick={closeTransition}
        style={{
          position: 'fixed',
          top: '4.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9600,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          border: `1.5px solid ${factionColor}`,
          borderRadius: '12px',
          padding: '0.6rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          boxShadow: `0 0 20px ${factionColor}44, 0 10px 25px rgba(0,0,0,0.6)`,
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          animation: 'slideDownFade 0.4s ease-out',
          maxWidth: '90vw',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>{activeTransition.icon || '⚔️'}</span>
        <div>
          <div style={{ color: factionColor, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {activeTransition.subtitle}
          </div>
          <div style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>
            {activeTransition.title}
          </div>
        </div>
      </div>
    );
  }

  // MODO COMPLETO (Full Cutscene Overlay)
  return (
    <>
      <div
        onClick={() => {
          if (isTyping) {
            setDisplayedText(activeTransition.loreText || '');
            setIsTyping(false);
          } else {
            closeTransition();
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9500,
          background: 'rgba(5, 7, 15, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.4s ease-out',
        }}
      >
        <div
          style={{
            maxWidth: '650px',
            width: '100%',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
            border: `2px solid ${factionColor}`,
            borderRadius: '16px',
            padding: '2rem 1.8rem',
            boxShadow: `0 0 35px ${factionColor}55, 0 20px 40px rgba(0,0,0,0.8)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Tag de Tipo / Subtítulo */}
          <div
            style={{
              color: factionColor,
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            {activeTransition.subtitle}
          </div>

          {/* Título Principal */}
          <h2
            style={{
              color: '#f8fafc',
              fontSize: '1.8rem',
              fontWeight: 900,
              fontFamily: 'Cinzel, serif',
              margin: '0 0 1.2rem 0',
              textShadow: `0 0 15px ${factionColor}aa`,
            }}
          >
            {activeTransition.title}
          </h2>

          {/* Retrato do Speaker */}
          {activeTransition.speakerId === 'alma_mundo' ? (
            <div style={{ marginBottom: '1rem', width: '80px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <AlmaMundoFlame />
            </div>
          ) : activeTransition.speakerId === 'avatar_echo' ? (
            <div style={{ marginBottom: '1rem', width: '80px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <AvatarEchoPortrait />
            </div>
          ) : portraitSrc ? (
            <img
              src={portraitSrc}
              alt={activeTransition.speakerName || 'Speaker'}
              style={{
                width: '110px',
                height: '110px',
                objectFit: 'contain',
                marginBottom: '1rem',
                filter: `drop-shadow(0 0 12px ${factionColor})`,
              }}
            />
          ) : (
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{activeTransition.icon || '📜'}</div>
          )}

          {/* Nome do Speaker */}
          {activeTransition.speakerName && (
            <div style={{ color: factionColor, fontWeight: 700, fontSize: '1rem', marginBottom: '0.6rem' }}>
              {activeTransition.speakerName}
            </div>
          )}

          {/* Lore / Diálogo */}
          {activeTransition.loreText && (
            <p
              style={{
                color: '#cbd5e1',
                fontSize: '1.05rem',
                lineHeight: '1.6',
                fontStyle: 'italic',
                maxWidth: '520px',
                minHeight: '4.5rem',
                margin: '0 0 1.5rem 0',
              }}
            >
              "{displayedText}"
            </p>
          )}

          {/* Botão de Continuar */}
          <button
            onClick={closeTransition}
            style={{
              background: `linear-gradient(135deg, ${factionColor}, #1e293b)`,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 2.2rem',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 0 15px ${factionColor}66`,
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isTyping ? 'Exibir Texto' : 'Avançar ➔'}
          </button>
        </div>
      </div>
    </>
  );
};
