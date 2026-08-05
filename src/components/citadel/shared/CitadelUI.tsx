import React from 'react';

// Kit visual compartilhado pelos painéis de construção da Cidadela Astral — badge de ícone,
// linha de estatística, card de progresso e card de item de lista. Unifica o acabamento visual
// (gradientes, glow dourado, bordas) que antes cada painel reinventava com estilos inline
// inconsistentes, usando as mesmas variáveis de tema de src/index.css.

export const CitadelIconBadge: React.FC<{ icon: string; size?: number }> = ({ icon, size = 42 }) => (
  <span
    style={{
      width: `${size}px`,
      height: `${size}px`,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.52}px`,
      borderRadius: '999px',
      background: 'radial-gradient(circle at 35% 30%, rgba(245, 158, 11, 0.28), var(--surface-2) 70%)',
      border: '1px solid var(--border-subtle)',
      boxShadow: '0 0 14px var(--gold-glow), inset 0 1px 0 rgba(255,255,255,0.06)',
    }}
  >
    {icon}
  </span>
);

interface CitadelStatRowProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'positive' | 'negative' | 'accent';
  detail?: string;
}

const TONE_COLOR: Record<NonNullable<CitadelStatRowProps['tone']>, string> = {
  default: 'var(--gold-400)',
  positive: '#4ade80',
  negative: '#f87171',
  accent: '#38bdf8',
};

export const CitadelStatRow: React.FC<CitadelStatRowProps> = ({ icon, label, value, tone = 'default', detail }) => {
  const color = TONE_COLOR[tone];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.55rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)',
        borderLeft: `3px solid ${color}`,
        border: '1px solid var(--border-subtle)',
        borderLeftWidth: '3px',
        borderLeftColor: color,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        {label}
        {detail && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>({detail})</span>}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
};

interface CitadelProgressCardProps {
  icon: string;
  title: React.ReactNode;
  countdown?: React.ReactNode;
  progressPct: number;
  footer?: React.ReactNode;
}

export const CitadelProgressCard: React.FC<CitadelProgressCardProps> = ({ icon, title, countdown, progressPct, footer }) => (
  <div
    style={{
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--gold-500)',
      background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15), var(--surface-2))',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-300)' }}>
        {icon} {title}
      </div>
      {countdown && (
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-400)' }}>
          ⏳ {countdown}
        </div>
      )}
    </div>
    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, progressPct))}%`,
          background: 'linear-gradient(to right, #f59e0b, #eab308)',
          boxShadow: '0 0 8px var(--gold-glow)',
          transition: 'width 1s linear',
        }}
      />
    </div>
    {footer && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{footer}</div>}
  </div>
);

interface CitadelListCardProps {
  icon: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  highlighted?: boolean;
  dimmed?: boolean;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const CitadelListCard: React.FC<CitadelListCardProps> = ({ icon, title, description, badge, highlighted, dimmed, action, children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      padding: '0.75rem 0.9rem',
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${highlighted ? 'var(--gold-400)' : 'var(--border-subtle)'}`,
      background: highlighted ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--surface-2))' : 'var(--surface-2)',
      boxShadow: highlighted ? '0 0 12px var(--gold-glow)' : 'none',
      opacity: dimmed ? 0.55 : 1,
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>{icon}</span>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{title}</div>
          {description && <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.15rem' }}>{description}</div>}
        </div>
      </div>
      {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
    </div>
    {children}
    {action && <div style={{ alignSelf: 'flex-start' }}>{action}</div>}
  </div>
);

export const CitadelProgressBar: React.FC<{ pct: number; color?: string }> = ({ pct, color = 'var(--gold-400)' }) => (
  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, boxShadow: `0 0 6px ${color}`, transition: 'width 0.4s ease' }} />
  </div>
);
