import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import type { DistrictId } from '../../core/types';
import { getTidePhase, calculateEchoEfficacies, getEchoRosterCap, getDistrictSlotCount, DISTRICT_NAMES, DISTRICT_ICONS } from '../../core/sunkenCitadelFormulas';
import { EchoCard } from './EchoCard';

/**
 * Conteúdo da aba "🎭 Ecos" da Cidadela Submersa — mesmo papel que os outros painéis de distrito
 * cumprem para as demais abas. Adaptado de `EchoRosterDrawer.tsx` (removido o chrome de gaveta
 * lateral/bottom-sheet, já que agora é conteúdo normal de aba). Selecionar um Eco grava
 * `selectedEchoId` na store — lido por `SunkenCitadelSpriteStage` (App.tsx) para armar o fluxo de
 * alocação por toque no mapa.
 */
export const EchoRosterPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const selectedEchoId = useGameStore((state) => state.selectedEchoId);
  const setSelectedEchoId = useGameStore((state) => state.setSelectedEchoId);
  const assignEcho = useGameStore((state) => state.assignEcho);

  const sunken = character.sunkenCitadel;
  const districts = sunken?.districts || {};
  const echoes = sunken?.echoes || [];
  const tidePhase = getTidePhase();
  const salonLevel = districts.echoHall?.restorationLevel || 0;
  const efficacies = calculateEchoEfficacies(echoes, tidePhase, Date.now(), salonLevel);
  const rosterCap = getEchoRosterCap(salonLevel);

  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<number | undefined>(undefined);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const handleSelectEcho = (echoId: string) => {
    AudioManager.getInstance().playClick();
    setSelectedEchoId(selectedEchoId === echoId ? null : echoId);
  };

  const handleUnassignEcho = (echoId: string) => {
    AudioManager.getInstance().playClick();
    showToast(assignEcho(echoId, null).message);
  };

  const selectedEcho = selectedEchoId ? echoes.find((e) => e.id === selectedEchoId) : undefined;
  const isBrokenHeartRelocation = !!selectedEcho && selectedEcho.trait === 'brokenHeart' && !!selectedEcho.assignedDistrict;

  // Prévia de eficácia do Eco selecionado em cada distrito restaurado — simula a alocação
  // hipotética reaproveitando `calculateEchoEfficacies` (mesma fórmula usada após confirmar).
  const districtPreviews: { id: DistrictId; finalEfficacy: number; isCurrent: boolean }[] = [];
  if (selectedEcho) {
    for (const districtId of Object.keys(districts) as DistrictId[]) {
      const d = districts[districtId];
      if (!d || d.flooded || d.restorationLevel < 1) continue;
      const slots = getDistrictSlotCount(d.restorationLevel);
      const occupied = echoes.filter((e) => e.id !== selectedEcho.id && e.assignedDistrict === districtId).length;
      const isCurrent = selectedEcho.assignedDistrict === districtId;
      if (!isCurrent && occupied >= slots) continue;
      const hypotheticalEchoes = echoes.map((e) => (e.id === selectedEcho.id ? { ...e, assignedDistrict: districtId } : e));
      const hypotheticalEfficacies = calculateEchoEfficacies(hypotheticalEchoes, tidePhase, Date.now(), salonLevel);
      const eff = hypotheticalEfficacies.find((b) => b.echoId === selectedEcho.id);
      if (eff) districtPreviews.push({ id: districtId, finalEfficacy: eff.finalEfficacy, isCurrent });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', padding: '0.85rem' }}>
      <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
              🎭 Ecos Afogados — {echoes.length}/{rosterCap}
            </h2>
            <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
              Resgatados (vitalício): {sunken?.echoesRescuedLifetime || 0}
            </p>
          </div>
        </div>

        {toast && (
          <div style={{ background: 'rgba(14, 116, 144, 0.5)', border: '1px solid rgba(34, 211, 238, 0.5)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.78rem' }}>
            {toast}
          </div>
        )}

        {selectedEcho && (
          <div style={{ background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.4)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span>
              🎭 <strong>{selectedEcho.name}</strong> selecionado — volte ao mapa e toque um distrito restaurado (contorno pulsante) para alocar.
              {isBrokenHeartRelocation && (
                <>
                  <br />
                  <strong style={{ color: '#fbbf24' }}>⚠️ Realocar reinicia os 7 dias do Coração Partido.</strong>
                </>
              )}
            </span>
            {districtPreviews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.55)' }}>Prévia de eficácia por distrito:</span>
                {districtPreviews.map((p) => (
                  <span key={p.id} style={{ fontSize: '0.68rem', color: p.isCurrent ? '#4ade80' : '#a5f3fc' }}>
                    {DISTRICT_ICONS[p.id]} {DISTRICT_NAMES[p.id]} — <strong>{(p.finalEfficacy * 100).toFixed(1)}%</strong>{p.isCurrent && ' (atual)'}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

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
              onSelect={handleSelectEcho}
              onUnassign={handleUnassignEcho}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
