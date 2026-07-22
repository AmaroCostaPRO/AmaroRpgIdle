import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import type { DistrictId } from '../../core/types';
import {
  DISTRICT_IDS, getDistrictSlotCount, getTidePhase, getTidePhaseEndsAt,
  calculateEchoEfficacies, sumDistrictEfficacy, getEchoRosterCap, DISTRICT_NAMES,
} from '../../core/sunkenCitadelFormulas';
import { SubmersaSpriteStage } from './SubmersaSpriteStage';
import { DistrictModal } from './DistrictModal';
import { EchoRosterDrawer } from './EchoRosterDrawer';

/**
 * v10.2.0 "Os Ecos Afogados" (revisão de fidelidade ao Anexo 3, §2.4) — 🔱 Cidadela Submersa.
 * Container fino: monta o pátio 2×3 (`SubmersaSpriteStage`), a gaveta de Ecos
 * (`EchoRosterDrawer`) e o modal do distrito ativo (`DistrictModal`) — toda a lógica de ações
 * permanece nos mesmos hooks de `useGameStore`, só a camada visual mudou da lista de cards
 * original para o grid com fluxo de toque-para-alocar do Anexo.
 */
export const SubmersaPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const startDistrictDrain = useGameStore((state) => state.startDistrictDrain);
  const upgradeDistrictRestoration = useGameStore((state) => state.upgradeDistrictRestoration);
  const assignEcho = useGameStore((state) => state.assignEcho);
  const chooseTideBlessing = useGameStore((state) => state.chooseTideBlessing);
  const chooseSecondTideBlessing = useGameStore((state) => state.chooseSecondTideBlessing);
  const purchaseNerehRune = useGameStore((state) => state.purchaseNerehRune);

  const sunken = character.sunkenCitadel;
  const districts = sunken?.districts || {};
  const echoes = sunken?.echoes || [];
  const tidePhase = getTidePhase();
  const tideCountdown = useCountdown(getTidePhaseEndsAt());
  const salonLevel = districts.echoHall?.restorationLevel || 0;
  const efficacies = calculateEchoEfficacies(echoes, tidePhase, Date.now(), salonLevel);
  const activeBlessing = sunken?.tideBlessing && sunken.tideBlessing.expiresAt > Date.now() ? sunken.tideBlessing : undefined;
  const secondActiveBlessing = sunken?.secondTideBlessing && sunken.secondTideBlessing.expiresAt > Date.now() ? sunken.secondTideBlessing : undefined;
  const restoredDistrictIds = DISTRICT_IDS.filter(id => (districts[id]?.restorationLevel || 0) >= 1);
  const rosterCap = getEchoRosterCap(salonLevel);

  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<number | undefined>(undefined);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeDistrictId, setActiveDistrictId] = React.useState<DistrictId | null>(null);
  const [selectedEchoId, setSelectedEchoId] = React.useState<string | null>(null);
  // Fluxo de alocação por toque: 1º toque num distrito elegível arma a confirmação; 2º toque no
  // MESMO distrito (em ~4s) efetiva. Tocar outro distrito elegível apenas move a confirmação para lá.
  const [pendingAssignment, setPendingAssignment] = React.useState<DistrictId | null>(null);
  const pendingTimer = React.useRef<number | undefined>(undefined);

  const selectedEcho = selectedEchoId ? echoes.find(e => e.id === selectedEchoId) : undefined;

  const handleSelectEcho = (echoId: string) => {
    AudioManager.getInstance().playClick();
    setPendingAssignment(null);
    setSelectedEchoId((prev) => (prev === echoId ? null : echoId));
  };

  const handleDistrictClick = (id: DistrictId) => {
    AudioManager.getInstance().playClick();
    const isEligible = selectedEcho && restoredDistrictIds.includes(id);
    if (!isEligible) {
      setActiveDistrictId(id);
      return;
    }
    if (pendingAssignment === id) {
      // 2º toque no mesmo distrito — confirma a alocação.
      if (pendingTimer.current) window.clearTimeout(pendingTimer.current);
      setPendingAssignment(null);
      const res = assignEcho(selectedEcho!.id, id);
      showToast(res.message);
      if (res.success) {
        AudioManager.getInstance().playUpgrade();
        setSelectedEchoId(null);
      }
    } else {
      // 1º toque — arma a confirmação (some sozinha em 4s se não for confirmada).
      setPendingAssignment(id);
      if (pendingTimer.current) window.clearTimeout(pendingTimer.current);
      pendingTimer.current = window.setTimeout(() => setPendingAssignment(null), 4000);
    }
  };

  const handleDrain = (id: DistrictId) => {
    AudioManager.getInstance().playClick();
    showToast(startDistrictDrain(id).message);
  };
  const handleRestore = (id: DistrictId) => {
    AudioManager.getInstance().playClick();
    const res = upgradeDistrictRestoration(id);
    if (res.success) AudioManager.getInstance().playUpgrade();
    showToast(res.message);
  };
  const handleBlessing = (blessingId: string) => {
    AudioManager.getInstance().playClick();
    showToast(chooseTideBlessing(blessingId).message);
  };
  const handleSecondBlessing = (blessingId: string) => {
    AudioManager.getInstance().playClick();
    showToast(chooseSecondTideBlessing(blessingId).message);
  };
  const handlePurchaseNereh = () => {
    AudioManager.getInstance().playClick();
    const res = purchaseNerehRune();
    if (res.success) AudioManager.getInstance().playUpgrade();
    showToast(res.message);
  };

  const assignedCounts = DISTRICT_IDS.reduce((acc, id) => {
    acc[id] = echoes.filter(e => e.assignedDistrict === id).length;
    return acc;
  }, {} as Record<DistrictId, number>);
  const slotsByDistrict = DISTRICT_IDS.reduce((acc, id) => {
    acc[id] = getDistrictSlotCount(districts[id]?.restorationLevel || 0);
    return acc;
  }, {} as Record<DistrictId, number>);

  const activeDistrict = activeDistrictId ? districts[activeDistrictId] : undefined;
  const isBrokenHeartRelocation = !!selectedEcho && selectedEcho.trait === 'brokenHeart' && !!selectedEcho.assignedDistrict && selectedEcho.assignedDistrict !== pendingAssignment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.85rem' }}>
      {/* Ciclo de Marés */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700 }}>{tidePhase === 'low' ? '🌊⬇ MARÉ BAIXA' : '🌊⬆ MARÉ ALTA'}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>vira em {tideCountdown}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
          {tidePhase === 'low' ? '· +50% Pesca · −20% custo de drenagem · −10% Pressão' : '· −25% Pesca · +50% Coral · Bênçãos do Templo ativas'}
        </span>
        <button onClick={() => setDrawerOpen((v) => !v)} className="btn btn-xs" style={{ marginLeft: 'auto' }}>
          🎭 Ecos ({echoes.length}/{rosterCap})
        </button>
      </div>

      {toast && (
        <div style={{ background: 'rgba(14, 116, 144, 0.5)', border: '1px solid rgba(34, 211, 238, 0.5)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.78rem' }}>
          {toast}
        </div>
      )}

      {selectedEcho && (
        <div style={{ background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.4)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.75rem' }}>
          🎭 <strong>{selectedEcho.name}</strong> selecionado — toque um distrito restaurado (contorno pulsante) para alocar.
          {pendingAssignment && (
            <>
              <br />
              {isBrokenHeartRelocation && <strong style={{ color: '#fbbf24' }}>⚠️ Isso reinicia os 7 dias do Coração Partido. </strong>}
              Toque <strong>{DISTRICT_NAMES[pendingAssignment]}</strong> de novo para confirmar.
            </>
          )}
        </div>
      )}

      <SubmersaSpriteStage
        districts={districts}
        assignedCounts={assignedCounts}
        slotsByDistrict={slotsByDistrict}
        eligibleForAllocation={selectedEcho ? restoredDistrictIds : []}
        activeDistrictId={activeDistrictId}
        onDistrictClick={handleDistrictClick}
      />

      <EchoRosterDrawer
        open={drawerOpen}
        echoes={echoes}
        efficacies={efficacies}
        echoesRescuedLifetime={sunken?.echoesRescuedLifetime || 0}
        rosterCap={rosterCap}
        selectedEchoId={selectedEchoId}
        onSelectEcho={handleSelectEcho}
        onClose={() => setDrawerOpen(false)}
      />

      {activeDistrictId && (
        <DistrictModal
          id={activeDistrictId}
          flooded={!activeDistrict || activeDistrict.flooded}
          draining={!!activeDistrict?.drainUpgrade}
          drainCompletesAt={activeDistrict?.drainUpgrade?.completesAt}
          restorationLevel={activeDistrict?.restorationLevel || 0}
          assignedEchoes={echoes.filter(e => e.assignedDistrict === activeDistrictId)}
          districtEfficacy={sumDistrictEfficacy(efficacies, activeDistrictId)}
          activeBlessing={activeDistrictId === 'temple' ? activeBlessing : undefined}
          secondActiveBlessing={activeDistrictId === 'temple' ? secondActiveBlessing : undefined}
          tidePhase={tidePhase}
          ownsNereh={(character.runeInventory?.['nereh'] || 0) > 0}
          onDrain={handleDrain}
          onRestore={handleRestore}
          onBlessing={handleBlessing}
          onSecondBlessing={handleSecondBlessing}
          onPurchaseNereh={handlePurchaseNereh}
          onClose={() => setActiveDistrictId(null)}
        />
      )}
    </div>
  );
};
