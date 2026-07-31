import React from 'react';

interface TabBadgeDotProps {
  color?: string;
  pulse?: boolean;
}

// Pequeno indicador de "novidade disponível" para ícones de aba — ver src/hooks/useTabNotifications.ts
// para as condições que acendem cada aba.
export const TabBadgeDot: React.FC<TabBadgeDotProps> = ({ color = '#f59e0b', pulse = true }) => (
  <span className={`tab-badge-dot${pulse ? ' tab-badge-dot-pulse' : ''}`} style={{ background: color }} />
);
