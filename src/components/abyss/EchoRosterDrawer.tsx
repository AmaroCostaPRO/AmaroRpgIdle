import React from 'react';
import type { DrownedEcho } from '../../core/types';
import { EchoEfficacyBreakdown } from '../../core/sunkenCitadelFormulas';
import { EchoCard } from './EchoCard';

interface EchoRosterDrawerProps {
  open: boolean;
  echoes: DrownedEcho[];
  efficacies: EchoEfficacyBreakdown[];
  echoesRescuedLifetime: number;
  rosterCap: number;
  selectedEchoId: string | null;
  onSelectEcho: (echoId: string) => void;
  onClose: () => void;
}

/**
 * v10.2.0 "Os Ecos Afogados" (revisão de fidelidade ao Anexo 3 §2.4) — gaveta lateral no desktop /
 * bottom-sheet no mobile (mesmo `@media (max-width: 840px)` já usado nas outras dietas responsivas
 * do projeto), substituindo a lista inline de `EchoRow`.
 */
export const EchoRosterDrawer: React.FC<EchoRosterDrawerProps> = ({
  open, echoes, efficacies, echoesRescuedLifetime, rosterCap, selectedEchoId, onSelectEcho, onClose,
}) => {
  if (!open) return null;

  return (
    <>
      <style>{`
        .echo-drawer {
          position: fixed; top: 0; right: 0; bottom: 0; width: 340px; z-index: 400;
          background: rgba(4, 16, 26, 0.98); border-left: 1px solid rgba(34, 211, 238, 0.3);
          display: flex; flex-direction: column; gap: 0.6rem; padding: 0.85rem; overflow-y: auto;
        }
        @media (max-width: 840px) {
          .echo-drawer {
            top: auto; left: 0; right: 0; width: auto; height: 60vh;
            border-left: none; border-top: 1px solid rgba(34, 211, 238, 0.3);
            border-radius: 12px 12px 0 0;
          }
        }
      `}</style>
      <div className="echo-drawer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>🎭 Ecos Afogados ({echoes.length}/{rosterCap})</p>
          <button onClick={onClose} className="btn btn-xs">✕</button>
        </div>
        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Resgatados (vitalício): {echoesRescuedLifetime}</p>

        {echoes.length === 0 && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
            Nenhum Eco resgatado ainda — mergulhe até a Zona 3 das Profundezas (prof. 51+) ou conclua uma drenagem de distrito na Cidadela Submersa (Fase 50+).
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {echoes.map((e) => (
            <EchoCard
              key={e.id}
              echo={e}
              efficacy={efficacies.find(b => b.echoId === e.id)}
              selected={selectedEchoId === e.id}
              onSelect={onSelectEcho}
            />
          ))}
        </div>
      </div>
    </>
  );
};
