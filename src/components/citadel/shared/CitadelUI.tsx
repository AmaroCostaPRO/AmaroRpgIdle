import React from 'react';

// Kit visual compartilhado pelos painéis de construção da Cidadela Astral — badge de ícone,
// linha de estatística, card de progresso e card de item de lista. Unifica o acabamento visual
// (gradientes, glow dourado, bordas) que antes cada painel reinventava com estilos inline
// inconsistentes, usando as mesmas variáveis de tema de src/index.css.

// Estilos de "tom" do jogo: dourado (padrão), místico/arcano (roxo prestígio — usado nos temas
// astrais/cósmicos, o mesmo tom de --prestige-from/Sets Ancestrais) e cobre (penalidades/avisos,
// um bronze escurecido em vez do vermelho genérico de dashboard). Mantém tudo dentro da paleta
// já estabelecida em index.css, sem introduzir cores novas alheias ao tema do jogo.
type CitadelTone = 'gold' | 'mystic' | 'copper';

const TONE_CHIP_BG: Record<CitadelTone, string> = {
  gold: 'radial-gradient(circle at 35% 30%, rgba(245, 158, 11, 0.28), var(--surface-2) 70%)',
  mystic: 'radial-gradient(circle at 35% 30%, rgba(124, 58, 237, 0.35), var(--surface-2) 70%)',
  copper: 'radial-gradient(circle at 35% 30%, rgba(180, 83, 9, 0.35), var(--surface-2) 70%)',
};
const TONE_BORDER: Record<CitadelTone, string> = {
  gold: 'var(--border-accent)',
  mystic: 'rgba(139, 92, 246, 0.45)',
  copper: 'rgba(180, 83, 9, 0.5)',
};
const TONE_GLOW: Record<CitadelTone, string> = {
  gold: '0 0 14px var(--gold-glow)',
  mystic: '0 0 14px var(--prestige-glow)',
  copper: '0 0 12px rgba(180, 83, 9, 0.4)',
};
const TONE_TEXT: Record<CitadelTone, string> = {
  gold: 'var(--gold-300)',
  mystic: '#c4b5fd',
  copper: '#d8a56b',
};

export const CitadelIconBadge: React.FC<{ icon: string; size?: number; tone?: CitadelTone }> = ({ icon, size = 42, tone = 'gold' }) => (
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
      background: TONE_CHIP_BG[tone],
      border: `1px solid ${TONE_BORDER[tone]}`,
      boxShadow: `${TONE_GLOW[tone]}, inset 0 1px 0 rgba(255,255,255,0.06)`,
    }}
  >
    {icon}
  </span>
);

interface CitadelStatRowProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  tone?: CitadelTone;
  detail?: string;
}

// Linha de estatística no padrão de "chip de runa" já usado em itemVisuals.tsx (ícone circular
// com fundo/borda/glow por tom) em vez da barra colorida lateral — evita a estética genérica de
// dashboard e reaproveita uma linguagem visual que já existe no jogo.
export const CitadelStatRow: React.FC<CitadelStatRowProps> = ({ icon, label, value, tone = 'gold', detail }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      padding: '0.5rem 0.75rem',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-subtle)',
      flexWrap: 'wrap',
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
      <CitadelIconBadge icon={icon} size={26} tone={tone} />
      {label}
      {detail && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>({detail})</span>}
    </span>
    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: TONE_TEXT[tone], whiteSpace: 'nowrap' }}>{value}</span>
  </div>
);

interface CitadelProgressCardProps {
  icon: string;
  title: React.ReactNode;
  countdown?: React.ReactNode;
  progressPct: number;
  footer?: React.ReactNode;
  tone?: CitadelTone;
}

const PROGRESS_BORDER: Record<CitadelTone, string> = {
  gold: 'var(--gold-500)',
  mystic: 'var(--prestige-from)',
  copper: '#b45309',
};
const PROGRESS_BG: Record<CitadelTone, string> = {
  gold: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15), var(--surface-2))',
  mystic: 'linear-gradient(135deg, rgba(124, 58, 237, 0.18), var(--surface-2))',
  copper: 'linear-gradient(135deg, rgba(180, 83, 9, 0.15), var(--surface-2))',
};
const PROGRESS_BAR: Record<CitadelTone, string> = {
  gold: 'linear-gradient(to right, #f59e0b, #eab308)',
  mystic: 'linear-gradient(to right, #7c3aed, #a78bfa)',
  copper: 'linear-gradient(to right, #92400e, #b45309)',
};

export const CitadelProgressCard: React.FC<CitadelProgressCardProps> = ({ icon, title, countdown, progressPct, footer, tone = 'gold' }) => (
  <div
    style={{
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${PROGRESS_BORDER[tone]}`,
      background: PROGRESS_BG[tone],
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: TONE_TEXT[tone] }}>
        {icon} {title}
      </div>
      {countdown && (
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TONE_TEXT[tone] }}>
          ⏳ {countdown}
        </div>
      )}
    </div>
    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, progressPct))}%`,
          background: PROGRESS_BAR[tone],
          boxShadow: TONE_GLOW[tone],
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

const PROGRESS_BAR_SOLID: Record<CitadelTone, string> = {
  gold: 'var(--gold-400)',
  mystic: 'var(--prestige-from)',
  copper: '#b45309',
};

export const CitadelProgressBar: React.FC<{ pct: number; tone?: CitadelTone }> = ({ pct, tone = 'gold' }) => {
  const color = PROGRESS_BAR_SOLID[tone];
  return (
    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, boxShadow: `0 0 6px ${color}`, transition: 'width 0.4s ease' }} />
    </div>
  );
};

export type { CitadelTone };
