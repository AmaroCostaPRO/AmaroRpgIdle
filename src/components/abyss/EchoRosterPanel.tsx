import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { getTidePhase, calculateEchoEfficacies, getEchoRosterCap, DISTRICT_NAMES } from '../../core/sunkenCitadelFormulas';
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

  const sunken = character.sunkenCitadel;
  const districts = sunken?.districts || {};
  const echoes = sunken?.echoes || [];
  const tidePhase = getTidePhase();
  const salonLevel = districts.echoHall?.restorationLevel || 0;
  const efficacies = calculateEchoEfficacies(echoes, tidePhase, Date.now(), salonLevel);
  const rosterCap = getEchoRosterCap(salonLevel);

  const handleSelectEcho = (echoId: string) => {
    AudioManager.getInstance().playClick();
    setSelectedEchoId(selectedEchoId === echoId ? null : echoId);
  };

  const selectedEcho = selectedEchoId ? echoes.find((e) => e.id === selectedEchoId) : undefined;
  const isBrokenHeartRelocation = !!selectedEcho && selectedEcho.trait === 'brokenHeart' && !!selectedEcho.assignedDistrict;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem' }}>
      <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>🎭 Ecos Afogados ({echoes.length}/{rosterCap})</p>
      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Resgatados (vitalício): {sunken?.echoesRescuedLifetime || 0}</p>

      {selectedEcho && (
        <div style={{ background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.4)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.75rem' }}>
          🎭 <strong>{selectedEcho.name}</strong> selecionado — volte ao mapa e toque um distrito restaurado (contorno pulsante) para alocar.
          {isBrokenHeartRelocation && (
            <>
              <br />
              <strong style={{ color: '#fbbf24' }}>⚠️ Realocar reinicia os 7 dias do Coração Partido.</strong>
            </>
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
          />
        ))}
      </div>
    </div>
  );
};
