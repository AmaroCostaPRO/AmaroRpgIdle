import React from 'react';

interface UpgradeInProgress {
  targetLevel: number;
}

interface CitadelBuildingPanelProps {
  icon: string;
  title: string;
  subtitle: string;
  isBuilt: boolean;
  level: number;
  maxLevel: number;
  nextLevel: number;
  notBuiltLabel: string;
  buildLabel: string;
  costDisplay: React.ReactNode;
  maxLevelLabel: React.ReactNode;
  upgrading?: UpgradeInProgress | null;
  countdown: string | null;
  canAffordUpgrade: boolean;
  lockedByCommandCenter: boolean;
  onUpgrade: () => void;
  children?: React.ReactNode;
}

// Wrapper compartilhado pelos painéis de construção da Cidadela (Torre de Vigia, Sifão Cósmico,
// Academia, Oficina da Forja, Altar de Sincronia, Laboratório de Relíquias, Quartel de
// Expedições). Cada painel só precisa fornecer seus dados/labels e o corpo específico (children)
// — o cabeçalho, botão de melhoria/construção e as mensagens de bloqueio/nível máximo são
// idênticos entre todos e ficam centralizados aqui.
export const CitadelBuildingPanel: React.FC<CitadelBuildingPanelProps> = ({
  icon,
  title,
  subtitle,
  isBuilt,
  level,
  maxLevel,
  nextLevel,
  notBuiltLabel,
  buildLabel,
  costDisplay,
  maxLevelLabel,
  upgrading,
  countdown,
  canAffordUpgrade,
  lockedByCommandCenter,
  onUpgrade,
  children,
}) => {
  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
            {icon} {title} {isBuilt ? `— Nível ${level}` : notBuiltLabel}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {level < maxLevel ? (
        <>
          {upgrading ? (
            <button disabled className="btn btn-disabled" style={{ alignSelf: 'flex-start' }}>
              🏗️ Melhorando para Nível {upgrading.targetLevel}... ({countdown})
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              disabled={!canAffordUpgrade || lockedByCommandCenter}
              className="btn btn-gold"
              style={{ alignSelf: 'flex-start' }}
            >
              {isBuilt ? `Melhorar para Nível ${nextLevel}` : buildLabel} — {costDisplay}
            </button>
          )}
          {lockedByCommandCenter && (
            <p style={{ fontSize: '0.68rem', color: '#f87171', margin: 0 }}>🏛️ Requer o Centro de Comando no Nível {nextLevel}.</p>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>{maxLevelLabel}</p>
      )}

      {isBuilt && children}
    </div>
  );
};
