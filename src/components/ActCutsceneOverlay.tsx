import React, { useState, useEffect } from 'react';
import { useQuestStore } from '../store/useQuestStore';
import { AudioManager } from '../core/AudioManager';

export const ActCutsceneOverlay: React.FC = () => {
  const activeActCutscene = useQuestStore((s) => s.activeActCutscene);
  const finishActCutscene = useQuestStore((s) => s.finishActCutscene);

  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imageError, setImageError] = useState(false);

  const currentLine = activeActCutscene?.lines[currentLineIdx];

  // Efeito Máquina de Escrever para a linha atual
  useEffect(() => {
    if (!currentLine) return;

    setDisplayedText('');
    setIsTyping(true);
    setImageError(false);

    let idx = 0;
    const fullText = currentLine.text;
    const timer = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 22);

    return () => clearInterval(timer);
  }, [currentLineIdx, currentLine]);

  // Reset do índice quando uma nova cutscene for carregada
  useEffect(() => {
    setCurrentLineIdx(0);
  }, [activeActCutscene?.act]);

  // Suporte a atalho por teclado (Barra de Espaço ou Enter para avançar)
  useEffect(() => {
    if (!activeActCutscene) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleNextOrSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeActCutscene, isTyping, currentLineIdx]);

  if (!activeActCutscene || !currentLine) return null;

  const handleNextOrSkip = () => {
    AudioManager.getInstance().playDialogAdvance();

    if (isTyping) {
      // Se ainda estiver digitando, revela o texto completo da linha
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      // Se já terminou a linha, avança para a próxima ou conclui
      if (currentLineIdx < activeActCutscene.lines.length - 1) {
        setCurrentLineIdx((prev) => prev + 1);
      } else {
        finishActCutscene();
      }
    }
  };

  const handleSkipEntireCutscene = () => {
    AudioManager.getInstance().playClick();
    finishActCutscene();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(6, 5, 12, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem',
        pointerEvents: 'auto',
        color: '#fff',
        animation: 'fadeIn 0.4s ease-out',
      }}
    >
      {/* Cabeçalho do Ato */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid var(--border-dim)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ fontSize: '0.68rem', color: currentLine.factionColor || '#a855f7', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {activeActCutscene.title}
          </span>
          <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontStyle: 'italic' }}>
            {activeActCutscene.subtitle}
          </span>
        </div>

        <button
          onClick={handleSkipEntireCutscene}
          className="btn btn-xs btn-secondary"
          style={{ fontSize: '0.65rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          ⏩ Pular Cena
        </button>
      </div>

      {/* Área Central: Retrato / Sprite do NPC em Destaque */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '1rem 0' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            transform: 'translateY(10px)',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
          }}
        >
          {/* Moldura do Sprite/Retrato com Brilho de Facção */}
          <div
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              border: `3px solid ${currentLine.factionColor || '#a855f7'}`,
              boxShadow: `0 0 30px ${currentLine.factionColor || '#a855f7'}80, inset 0 0 15px rgba(0,0,0,0.8)`,
              background: 'radial-gradient(circle, rgba(25,20,40,0.9) 0%, rgba(10,8,18,0.95) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Fallback de Avatar / Emoji Placeholder */}
            {imageError || !currentLine.speakerId ? (
              <span style={{ fontSize: '3.2rem', filter: `drop-shadow(0 0 10px ${currentLine.factionColor || '#a855f7'})` }}>
                {currentLine.avatarIcon || '🔮'}
              </span>
            ) : (
              <img
                src={`/assets/npc_${currentLine.speakerId}.png`}
                alt={currentLine.speakerName}
                onError={() => setImageError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
              />
            )}
          </div>

          {/* Nome e Título do Personagem */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: currentLine.factionColor || '#a855f7',
                textShadow: `0 0 12px ${currentLine.factionColor || '#a855f7'}60`,
                letterSpacing: '0.5px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {currentLine.speakerName}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {currentLine.speakerRole}
            </span>
          </div>
        </div>
      </div>

      {/* Caixa de Diálogo RPG (Parte Inferior) */}
      <div
        onClick={handleNextOrSkip}
        style={{
          width: '100%',
          maxWidth: '780px',
          margin: '0 auto',
          background: 'rgba(18, 16, 26, 0.95)',
          border: `2px solid ${currentLine.factionColor || '#a855f7'}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: `0 12px 36px rgba(0,0,0,0.8), 0 0 20px ${currentLine.factionColor || '#a855f7'}40`,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        {/* Marcador de Linha de Diálogo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: '#94a3b8' }}>
          <span>💬 Pressione [Espaço] ou clique para avançar</span>
          <span>
            Diálogo <strong>{currentLineIdx + 1}</strong> / <strong>{activeActCutscene.lines.length}</strong>
          </span>
        </div>

        {/* Texto do Diálogo */}
        <p
          style={{
            fontSize: '0.88rem',
            lineHeight: 1.65,
            color: '#f8fafc',
            margin: 0,
            fontStyle: 'italic',
            minHeight: '3.6em',
            fontFamily: 'var(--font-body)',
          }}
        >
          "{displayedText}"
          {isTyping && (
            <span style={{ opacity: 0.8, color: currentLine.factionColor || '#a855f7', animation: 'blink 0.8s infinite' }}> |</span>
          )}
        </p>

        {/* Botão de Avanço/Conclusão */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '0.25rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextOrSkip();
            }}
            className="btn btn-sm"
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.5rem 1.25rem',
              background: currentLineIdx === activeActCutscene.lines.length - 1
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : `linear-gradient(135deg, ${currentLine.factionColor || '#a855f7'}, #6b21a8)`,
              border: 'none',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            {isTyping
              ? '⚡ Revelar Texto'
              : currentLineIdx < activeActCutscene.lines.length - 1
              ? 'Avançar ➔'
              : '✦ Concluir & Iniciar Combate'}
          </button>
        </div>
      </div>
    </div>
  );
};
