import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import type { DrownedEcho } from '../../core/types';
import { ECHO_VOCATION_NAMES, ECHO_VOCATION_ICONS, ECHO_TRAIT_NAMES, BROKEN_HEART_HEAL_MS, EchoEfficacyBreakdown, DISTRICT_NAMES } from '../../core/sunkenCitadelFormulas';

interface EchoCardProps {
  echo: DrownedEcho;
  efficacy?: EchoEfficacyBreakdown;
  selected: boolean;
  onSelect: (echoId: string) => void;
}

/**
 * v10.2.0 "Os Ecos Afogados" (revisão de fidelidade ao Anexo 3 §1.9/§2.4) — substitui o
 * `<select>` do antigo `EchoRow`: mostra a decomposição COMPLETA da fórmula de eficácia
 * (`Base × Afinidade × Traço × Vizinhos × Salão = Final`), não só o percentual final. Tocar o
 * card seleciona o Eco para o fluxo de alocação por toque (ver `SubmersaPanel`).
 */
export const EchoCard: React.FC<EchoCardProps> = ({ echo, efficacy, selected, onSelect }) => {
  const healCountdown = useCountdown(echo.trait === 'brokenHeart' ? echo.brokenHeartHealsAt : undefined);
  const healed = echo.trait === 'brokenHeart' && !!echo.brokenHeartHealsAt && Date.now() >= echo.brokenHeartHealsAt;

  return (
    <div
      onClick={() => onSelect(echo.id)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.3rem', cursor: 'pointer',
        border: selected ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', padding: '0.5rem 0.65rem', fontSize: '0.72rem',
        background: selected ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700 }}>{ECHO_VOCATION_ICONS[echo.vocation]} {echo.name}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.66rem' }}>{ECHO_VOCATION_NAMES[echo.vocation]} · {ECHO_TRAIT_NAMES[echo.trait]}</span>
      </div>

      {echo.trait === 'brokenHeart' && (
        <span style={{ fontSize: '0.66rem', color: healed ? '#4ade80' : '#f87171' }}>
          {healed ? 'Coração Curado (+30%)' : `cura em ${healCountdown || `${Math.ceil(BROKEN_HEART_HEAL_MS / 86400000)}d`}`}
        </span>
      )}

      {echo.assignedDistrict ? (
        <span style={{ color: '#a5f3fc', fontSize: '0.66rem' }}>
          {DISTRICT_NAMES[echo.assignedDistrict]}
          {efficacy && (
            <> — Base {(efficacy.base * 100).toFixed(0)}% × Afin. {efficacy.affinity.toFixed(2)} × Traço {efficacy.selfMult.toFixed(2)} × Viz. {efficacy.neighborMult.toFixed(2)} × Salão {efficacy.salonMult.toFixed(2)} = <strong>{(efficacy.finalEfficacy * 100).toFixed(1)}%</strong></>
          )}
        </span>
      ) : (
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.66rem' }}>Descansando</span>
      )}

      {selected && (
        <span style={{ color: '#4ade80', fontSize: '0.64rem', fontWeight: 700 }}>
          ✓ Selecionado — toque um distrito restaurado para alocar (ou toque aqui de novo para cancelar)
        </span>
      )}
    </div>
  );
};
