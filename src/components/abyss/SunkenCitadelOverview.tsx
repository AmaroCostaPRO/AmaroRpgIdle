import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useCountdown } from '../../hooks/useCountdown';
import type { DistrictId, EchoVocation } from '../../core/types';
import {
  DISTRICT_IDS, DISTRICT_NAMES, DISTRICT_ICONS, getDistrictSlotCount,
  calculateEchoEfficacies, sumDistrictEfficacy, getTidePhase, getTidePhaseEndsAt,
  TIDE_LOW_FISHING_MULT, TIDE_HIGH_FISHING_MULT, ECHO_VOCATION_NAMES, ECHO_VOCATION_ICONS,
  getVocationPerkTotal, VOCATION_PERK_CAP,
} from '../../core/sunkenCitadelFormulas';
import { getPassiveCatchesPerHour } from '../../core/abyssFormulas';

/**
 * Aba "Visão Geral" da Cidadela Submersa — mesmo papel que `CitadelOverview.tsx` cumpre para a
 * Cidadela normal: um resumo de todos os distritos (nível, Eficácia acumulada, Ecos alocados) e do
 * farm de materiais do modo Abismo, num só lugar, sem precisar entrar em cada aba de distrito.
 */
export const SunkenCitadelOverview: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const sunken = character.sunkenCitadel;
  const districts = sunken?.districts || {};
  const echoes = sunken?.echoes || [];
  const coastal = character.coastal;

  const tidePhase = getTidePhase();
  const tideCountdown = useCountdown(getTidePhaseEndsAt());
  const salonLevel = districts.echoHall?.restorationLevel || 0;
  const efficacies = calculateEchoEfficacies(echoes, tidePhase, Date.now(), salonLevel);

  const fishingRatePerHour = coastal
    ? getPassiveCatchesPerHour(character.highestStageReached || 1, coastal.dockLevel)
      * (1 + getVocationPerkTotal(echoes, 'fisher') + sumDistrictEfficacy(efficacies, 'dock'))
      * (tidePhase === 'low' ? TIDE_LOW_FISHING_MULT : TIDE_HIGH_FISHING_MULT)
    : 0;

  const vocations: EchoVocation[] = ['fisher', 'diver', 'scribe', 'warden'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        className="panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          padding: '0.9rem 1.1rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
        }}
      >
        <span>🦪 Pérolas: {character.pearls || 0}</span>
        <span>🪸 Coral: {materials.coral || 0}</span>
        <span>🗝️ Fragmentos de Batisfera: {character.batisphereFragments || 0}</span>
        <span>🎭 Ecos: {echoes.length}</span>
      </div>

      <div className="panel" style={{ padding: '1.1rem 1.2rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
          {tidePhase === 'low' ? '🌊⬇ MARÉ BAIXA' : '🌊⬆ MARÉ ALTA'}
        </h2>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          vira em {tideCountdown} · {tidePhase === 'low' ? '+50% Pesca · −20% custo de drenagem · −10% Pressão' : '−25% Pesca · +50% Coral · Bênçãos do Templo ativas'}
        </p>
        {coastal && (
          <p style={{ fontSize: '0.72rem', color: '#a5f3fc', margin: '0.2rem 0 0 0' }}>
            🎣 Pesca passiva atual: ~{fishingRatePerHour.toFixed(1)} capturas/hora (Doca de Pesca Nv.{coastal.dockLevel}, Eficácia da Doca Batial +{(sumDistrictEfficacy(efficacies, 'dock') * 100).toFixed(1)}%)
          </p>
        )}
      </div>

      <div className="panel" style={{ padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {DISTRICT_IDS.map((id: DistrictId) => {
          const state = districts[id];
          const flooded = !state || state.flooded;
          const restorationLevel = state?.restorationLevel || 0;
          const slots = getDistrictSlotCount(restorationLevel);
          const assignedCount = echoes.filter((e) => e.assignedDistrict === id).length;
          const districtEfficacy = sumDistrictEfficacy(efficacies, id);
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                padding: '0.4rem 0.2rem',
                borderBottom: '1px solid var(--border-dim)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {DISTRICT_ICONS[id]} {DISTRICT_NAMES[id]}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: !flooded ? 'var(--gold-300)' : 'rgba(255,255,255,0.4)' }}>
                  {flooded ? 'Alagado' : `Restaurado ${restorationLevel === 1 ? 'I' : restorationLevel === 2 ? 'II' : 'III'}`}
                </span>
              </div>
              {!flooded && (
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>
                  Ecos: {assignedCount}/{slots} · Eficácia acumulada: +{(districtEfficacy * 100).toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0, fontSize: '0.9rem' }}>
          Perks Globais de Vocação
        </h2>
        <p style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Somam por Eco alocado em QUALQUER distrito (diferente da Eficácia, que é por distrito) e valem em todo o jogo.
        </p>
        {vocations.map((v) => {
          const total = getVocationPerkTotal(echoes, v);
          return (
            <div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span>{ECHO_VOCATION_ICONS[v]} {ECHO_VOCATION_NAMES[v]}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: total > 0 ? '#a5f3fc' : 'rgba(255,255,255,0.4)' }}>
                +{(total * 100).toFixed(1)}% (cap {(VOCATION_PERK_CAP[v] * 100).toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
        Use as abas acima para drenar/restaurar cada distrito e alocar Ecos. A aba 🎭 Ecos mostra o detalhe completo de cada Eco resgatado.
      </p>
    </div>
  );
};
