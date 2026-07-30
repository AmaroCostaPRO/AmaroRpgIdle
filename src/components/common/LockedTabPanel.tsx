import React from 'react';

interface LockedTabPanelProps {
  icon: string;
  title: string;
  reason: string;
  theme: 'ocean' | 'amber';
}

const THEME_COLORS = {
  ocean: {
    accent: '#22d3ee',
    accentSoft: 'rgba(34, 211, 238, 0.5)',
    border: 'rgba(34, 211, 238, 0.3)',
    radial: 'rgba(34, 211, 238, 0.10)',
    gradient: 'rgba(8, 47, 73, 0.45)',
    runeA: 'rgba(34, 211, 238, 0.07)',
    runeB: 'rgba(59, 130, 246, 0.09)',
  },
  amber: {
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.5)',
    border: 'rgba(251, 191, 36, 0.3)',
    radial: 'rgba(251, 191, 36, 0.10)',
    gradient: 'rgba(120, 53, 15, 0.3)',
    runeA: 'rgba(251, 191, 36, 0.08)',
    runeB: 'rgba(245, 158, 11, 0.08)',
  },
} as const;

/**
 * Conteúdo exibido no lugar do painel real de uma aba de topo ainda bloqueada
 * (a própria aba continua visível e clicável, com ícone de cadeado — só o
 * conteúdo interno fica indisponível até o requisito ser cumprido). Segue a
 * mesma estrutura visual do CitadelGate, mas parametrizada por tema de cor.
 */
export const LockedTabPanel: React.FC<LockedTabPanelProps> = ({ icon, title, reason, theme }) => {
  const c = THEME_COLORS[theme];
  return (
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
        height: '100%',
        boxSizing: 'border-box',
        background:
          `radial-gradient(ellipse at 50% 0%, ${c.radial}, transparent 55%), ` +
          `linear-gradient(160deg, ${c.gradient}, rgba(15,10,25,0.5))`,
      }}
    >
      {/* Runas decorativas de fundo, sutis, no tom do tema */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          background:
            `radial-gradient(circle at 15% 20%, ${c.runeA}, transparent 25%), ` +
            `radial-gradient(circle at 85% 80%, ${c.runeB}, transparent 30%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          fontSize: '3rem',
          lineHeight: 1,
          filter: `drop-shadow(0 0 12px ${c.accentSoft})`,
          animation: 'glow-pulse 2.6s ease-in-out infinite',
        }}
      >
        {icon}
      </div>

      <div style={{ position: 'relative' }}>
        <h2
          className="font-heading"
          style={{ fontSize: '1.15rem', fontWeight: 800, color: c.accent, margin: 0, letterSpacing: '0.02em' }}
        >
          {title}
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', maxWidth: '380px', margin: '0.6rem auto 0', lineHeight: 1.5 }}>
          {reason}
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          padding: '0.8rem 1.8rem',
          borderRadius: 'var(--radius-md, 8px)',
          border: `1px solid ${c.border}`,
          color: c.accent,
          background: `linear-gradient(135deg, ${c.radial}, transparent)`,
        }}
      >
        BLOQUEADO 🔒
      </div>
    </div>
  );
};
