import React from 'react';
import { AudioManager } from '../../core/AudioManager';

interface CitadelGateProps {
  onEnter: () => void;
}

/**
 * Portão de entrada exibido assim que o jogador acessa a aba Cidadela — a
 * base só é aberta de fato (cobrindo a tela de combate) após confirmar aqui.
 * Evita que o jogador saia do combate sem querer só de passar pelo carrossel
 * de abas.
 */
export const CitadelGate: React.FC<CitadelGateProps> = ({ onEnter }) => (
  <div
    className="panel animate-tabFade"
    style={{
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      padding: '2.5rem 1.5rem',
      textAlign: 'center',
      minHeight: '320px',
      background:
        'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.10), transparent 55%), ' +
        'linear-gradient(160deg, rgba(88,28,135,0.16), rgba(15,10,25,0.5))',
    }}
  >
    {/* Runas decorativas de fundo, sutis, reforçando o tema arcano do site */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.5,
        background:
          'radial-gradient(circle at 15% 20%, rgba(245,158,11,0.06), transparent 25%), ' +
          'radial-gradient(circle at 85% 80%, rgba(168,85,247,0.08), transparent 30%)',
        pointerEvents: 'none',
      }}
    />

    <div
      style={{
        fontSize: '3rem',
        lineHeight: 1,
        filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.5))',
        animation: 'glow-pulse 2.6s ease-in-out infinite',
      }}
    >
      🌌
    </div>

    <div style={{ position: 'relative' }}>
      <h2
        className="font-heading"
        style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold-400)', margin: 0, letterSpacing: '0.02em' }}
      >
        Cidadela Astral
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', maxWidth: '380px', margin: '0.6rem auto 0', lineHeight: 1.5 }}>
        Além dos portões, sua base se ergue entre as estrelas — construções, expedições e relíquias aguardam.
        O combate continua em segundo plano enquanto você administra a Cidadela.
      </p>
    </div>

    <button
      onClick={() => {
        AudioManager.getInstance().playClick();
        onEnter();
      }}
      className="btn btn-gold"
      style={{
        position: 'relative',
        fontSize: '0.75rem',
        padding: '0.8rem 1.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      Entrar na Cidadela 🏰
    </button>
  </div>
);
