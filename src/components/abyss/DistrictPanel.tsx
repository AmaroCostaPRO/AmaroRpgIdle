import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import type { DistrictId } from '../../core/types';
import {
  DISTRICT_NAMES, DISTRICT_ICONS, DISTRICT_DESCRIPTIONS, DISTRICT_ADJACENCY, DISTRICT_BASE_EFFECT,
  DISTRICT_DRAIN_COST, getRestorationCost, getDistrictSlotCount,
  ECHO_VOCATION_NAMES, ECHO_VOCATION_ICONS, TIDE_BLESSINGS, getTidePhase, getTidePhaseEndsAt,
  calculateEchoEfficacies, sumDistrictEfficacy, DIVE_SUIT_MAX_LEVEL, getDiveSuitUpgradeCost,
} from '../../core/sunkenCitadelFormulas';
import { LeviathanPanel } from './LeviathanPanel';

interface DistrictPanelProps {
  id: DistrictId;
}

/**
 * Conteúdo do distrito ativo da Cidadela Submersa — mostrado abaixo de `SunkenCitadelTabsBar`,
 * mesmo papel que `VaultPanel`/`AcademyPanel` etc. cumprem para a Cidadela normal. Adaptado de
 * `DistrictModal.tsx` (removido o chrome de modal — sem backdrop `position: fixed` nem `onClose`,
 * já que agora é conteúdo de aba, não um popup).
 */
export const DistrictPanel: React.FC<DistrictPanelProps> = ({ id }) => {
  const character = useGameStore((state) => state.character);
  const startDistrictDrain = useGameStore((state) => state.startDistrictDrain);
  const upgradeDistrictRestoration = useGameStore((state) => state.upgradeDistrictRestoration);
  const chooseTideBlessing = useGameStore((state) => state.chooseTideBlessing);
  const chooseSecondTideBlessing = useGameStore((state) => state.chooseSecondTideBlessing);
  const purchaseNerehRune = useGameStore((state) => state.purchaseNerehRune);
  const upgradeDivingSuit = useGameStore((state) => state.upgradeDivingSuit);
  const divingSuitLevel = character.abyss?.divingSuitLevel || 0;
  const divingSuitUpgrading = !!character.abyss?.divingSuitUpgrade;
  const suitUpgradeCountdown = useCountdown(character.abyss?.divingSuitUpgrade?.completesAt);

  const sunken = character.sunkenCitadel;
  const districts = sunken?.districts || {};
  const echoes = sunken?.echoes || [];
  const tidePhase = getTidePhase();
  const tideCountdown = useCountdown(getTidePhaseEndsAt());
  const salonLevel = districts.echoHall?.restorationLevel || 0;
  const efficacies = calculateEchoEfficacies(echoes, tidePhase, Date.now(), salonLevel);
  const activeBlessing = sunken?.tideBlessing && sunken.tideBlessing.expiresAt > Date.now() ? sunken.tideBlessing : undefined;
  const secondActiveBlessing = sunken?.secondTideBlessing && sunken.secondTideBlessing.expiresAt > Date.now() ? sunken.secondTideBlessing : undefined;
  const ownsNereh = (character.runeInventory?.['nereh'] || 0) > 0;

  const [confirmDrain, setConfirmDrain] = React.useState(false);
  const [confirmRestore, setConfirmRestore] = React.useState(false);
  const [confirmNereh, setConfirmNereh] = React.useState(false);
  const [confirmSuitUpgrade, setConfirmSuitUpgrade] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<number | undefined>(undefined);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const state = districts[id];
  const flooded = !state || state.flooded;
  const draining = !!state?.drainUpgrade;
  const restorationLevel = state?.restorationLevel || 0;
  const assignedEchoes = echoes.filter((e) => e.assignedDistrict === id);
  const districtEfficacy = sumDistrictEfficacy(efficacies, id);
  const drainCountdown = useCountdown(state?.drainUpgrade?.completesAt);
  const restoring = !!state?.restoreUpgrade;
  const restoreCountdown = useCountdown(state?.restoreUpgrade?.completesAt);
  const slots = getDistrictSlotCount(restorationLevel);
  const drainCost = DISTRICT_DRAIN_COST[id];
  const restoreCost = !flooded && !restoring && restorationLevel < 3 ? getRestorationCost(id, (restorationLevel + 1) as 2 | 3) : null;
  const sockets = Array.from({ length: slots }, (_, i) => assignedEchoes[i]);

  const handleDrain = () => {
    if (!confirmDrain) {
      setConfirmDrain(true);
      setTimeout(() => setConfirmDrain(false), 3000);
      return;
    }
    setConfirmDrain(false);
    AudioManager.getInstance().playClick();
    showToast(startDistrictDrain(id).message);
  };
  const handleRestore = () => {
    if (!confirmRestore) {
      setConfirmRestore(true);
      setTimeout(() => setConfirmRestore(false), 3000);
      return;
    }
    setConfirmRestore(false);
    AudioManager.getInstance().playClick();
    showToast(upgradeDistrictRestoration(id).message);
  };
  const handleBlessing = (blessingId: string) => { AudioManager.getInstance().playClick(); showToast(chooseTideBlessing(blessingId).message); };
  const handleSecondBlessing = (blessingId: string) => { AudioManager.getInstance().playClick(); showToast(chooseSecondTideBlessing(blessingId).message); };
  const handlePurchaseNereh = () => {
    if (!confirmNereh) {
      setConfirmNereh(true);
      setTimeout(() => setConfirmNereh(false), 3000);
      return;
    }
    setConfirmNereh(false);
    AudioManager.getInstance().playClick();
    const res = purchaseNerehRune();
    if (res.success) AudioManager.getInstance().playUpgrade();
    showToast(res.message);
  };
  const handleUpgradeSuit = () => {
    if (!confirmSuitUpgrade) {
      setConfirmSuitUpgrade(true);
      setTimeout(() => setConfirmSuitUpgrade(false), 3000);
      return;
    }
    setConfirmSuitUpgrade(false);
    AudioManager.getInstance().playClick();
    showToast(upgradeDivingSuit().message);
  };

  const statusSuffix = flooded && !draining ? '— Alagado'
    : draining ? `— Drenando (${drainCountdown})`
    : restoring ? `— Restaurando (${restoreCountdown})`
    : `— Restaurado ${restorationLevel === 1 ? 'I' : restorationLevel === 2 ? 'II' : 'III'}`;
  const subtitle = restoring
    ? `Evoluindo para Restauração ${state?.restoreUpgrade?.targetLevel === 2 ? 'II' : 'III'}.`
    : !flooded && districtEfficacy > 0
    ? `Eficácia acumulada: +${(districtEfficacy * 100).toFixed(1)}%`
    : flooded && !draining ? 'A função principal ainda não opera.'
    : draining ? 'Drenando a água acumulada.'
    : 'Restauração aplicada com sucesso.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', padding: '0.85rem' }}>
      {/* Ciclo de Marés — contexto ambiente, não específico do distrito, fica fora do card. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700 }}>{tidePhase === 'low' ? '🌊⬇ MARÉ BAIXA' : '🌊⬆ MARÉ ALTA'}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>vira em {tideCountdown}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
          {tidePhase === 'low' ? '· +50% Pesca · −20% custo de drenagem · −10% Pressão' : '· −25% Pesca · +50% Coral · Bênçãos do Templo ativas'}
        </span>
      </div>

      {toast && (
        <div style={{ background: 'rgba(14, 116, 144, 0.5)', border: '1px solid rgba(34, 211, 238, 0.5)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.78rem' }}>
          {toast}
        </div>
      )}

      <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
              {DISTRICT_ICONS[id]} {DISTRICT_NAMES[id]} {statusSuffix}
            </h2>
            <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>{subtitle}</p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>
              {DISTRICT_DESCRIPTIONS[id]}
            </p>
            {!flooded && (
              <p style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.45)', margin: '0.35rem 0 0 0' }}>
                Base por Eco alocado: +{(DISTRICT_BASE_EFFECT[id] * 100).toFixed(0)}% · Vizinhos: {DISTRICT_ADJACENCY[id].map((n) => `${DISTRICT_ICONS[n]} ${DISTRICT_NAMES[n]}`).join(', ')}
                {id !== 'echoHall' && ' · traços como Contador de Histórias/Farol Humano em Ecos vizinhos também alteram a Eficácia aqui'}
              </p>
            )}
          </div>
        </div>

        {flooded && !draining && (
          <button
            onClick={handleDrain}
            className="btn btn-ocean"
            style={{
              alignSelf: 'flex-start',
              background: confirmDrain ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
              borderColor: confirmDrain ? '#10b981' : undefined,
              color: confirmDrain ? '#fff' : undefined,
            }}
          >
            {confirmDrain ? 'Confirmar?' : `Drenar — 🦪 ${drainCost.pearls} + 🪸 ${drainCost.coral} (${drainCost.durationHours}h)`}
          </button>
        )}
        {restoreCost && (
          <button
            onClick={handleRestore}
            className="btn btn-ocean"
            style={{
              alignSelf: 'flex-start',
              background: confirmRestore ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
              borderColor: confirmRestore ? '#10b981' : undefined,
              color: confirmRestore ? '#fff' : undefined,
            }}
          >
            {confirmRestore ? 'Confirmar?' : `Restaurar ${restorationLevel === 1 ? 'II' : 'III'} — 🦪 ${restoreCost.pearls} + 🪸 ${restoreCost.coral} (${restorationLevel === 1 ? '1h' : '1h30'})`}
          </button>
        )}
        {restoring && (
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
            Restaurando para {state?.restoreUpgrade?.targetLevel === 2 ? 'II' : 'III'}... conclusão em {restoreCountdown}.
          </span>
        )}
        {!flooded && !restoring && restorationLevel >= 3 && (
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Restauração máxima.</span>
        )}

        {/* Slots de Eco como soquetes circulares — vazio = tracejado, ocupado = retrato/glifo. */}
        {!flooded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Slots de Eco ({assignedEchoes.length}/{slots}) — aloque pela aba 🎭 Ecos:</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sockets.map((echo, i) => (
                <div
                  key={i}
                  title={echo ? `${echo.name} (${ECHO_VOCATION_NAMES[echo.vocation]})` : 'Slot vazio'}
                  style={{
                    width: '48px', height: '48px', borderRadius: '999px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                    border: echo ? '2px solid #22d3ee' : '2px dashed rgba(255,255,255,0.25)',
                    background: echo ? 'rgba(14, 116, 144, 0.35)' : 'transparent',
                  }}
                >
                  {echo ? ECHO_VOCATION_ICONS[echo.vocation] : '·'}
                </div>
              ))}
            </div>
            {assignedEchoes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {assignedEchoes.map((e) => {
                  const eff = efficacies.find((b) => b.echoId === e.id);
                  return (
                    <span key={e.id} style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.6)' }}>
                      {ECHO_VOCATION_ICONS[e.vocation]} {e.name}
                      {eff && (
                        <> — Base {(eff.base * 100).toFixed(0)}% × Afin. {eff.affinity.toFixed(2)} × Traço {eff.selfMult.toFixed(2)} × Viz. {eff.neighborMult.toFixed(2)} × Salão {eff.salonMult.toFixed(2)} = <strong style={{ color: '#a5f3fc' }}>{(eff.finalEfficacy * 100).toFixed(1)}%</strong></>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {id === 'dock' && restorationLevel >= 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>🤿 Traje de Mergulho — Nível {divingSuitLevel}/{DIVE_SUIT_MAX_LEVEL}</p>
            {divingSuitUpgrading ? (
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                Melhorando para o Nível {character.abyss?.divingSuitUpgrade?.targetLevel}... conclusão em {suitUpgradeCountdown}.
              </span>
            ) : divingSuitLevel < DIVE_SUIT_MAX_LEVEL ? (
              <button
                onClick={handleUpgradeSuit}
                className="btn btn-ocean btn-xs"
                style={{
                  fontSize: '0.72rem',
                  alignSelf: 'flex-start',
                  background: confirmSuitUpgrade ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
                  borderColor: confirmSuitUpgrade ? '#10b981' : undefined,
                  color: confirmSuitUpgrade ? '#fff' : undefined,
                }}
              >
                {confirmSuitUpgrade ? 'Confirmar?' : `Melhorar — 🦪 ${getDiveSuitUpgradeCost(divingSuitLevel + 1).pearls} + 🪸 ${getDiveSuitUpgradeCost(divingSuitLevel + 1).coral} (30min)`}
              </button>
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>Traje no nível máximo.</span>
            )}
          </div>
        )}

        {id === 'throne' && restorationLevel >= 1 && <LeviathanPanel />}

        {id === 'temple' && restorationLevel >= 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
            {!ownsNereh && (
              <button
                onClick={handlePurchaseNereh}
                className="btn btn-ocean btn-xs"
                style={{
                  fontSize: '0.68rem',
                  alignSelf: 'flex-start',
                  background: confirmNereh ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
                  borderColor: confirmNereh ? '#10b981' : undefined,
                  color: confirmNereh ? '#fff' : undefined,
                }}
              >
                {confirmNereh ? 'Confirmar?' : '🜄 Comprar Nereh, a Maré Primeira — 200 🦪'}
              </button>
            )}
            {activeBlessing ? (
              <span style={{ fontSize: '0.7rem', color: '#fde047' }}>
                🕍 Bênção ativa: {TIDE_BLESSINGS.find(b => b.id === activeBlessing.id)?.name}
              </span>
            ) : tidePhase === 'high' ? (
              <>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>Escolha a Bênção da Maré Alta:</span>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {TIDE_BLESSINGS.map(b => (
                    <button key={b.id} onClick={() => handleBlessing(b.id)} className="btn btn-ocean btn-xs" title={b.desc} style={{ fontSize: '0.65rem' }}>
                      {b.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Bênçãos só podem ser escolhidas na Maré Alta.</span>
            )}
            {restorationLevel >= 3 && tidePhase === 'high' && (
              secondActiveBlessing ? (
                <span style={{ fontSize: '0.68rem', color: '#fde047' }}>
                  🕍 2ª Bênção (50%): {TIDE_BLESSINGS.find(b => b.id === secondActiveBlessing.id)?.name}
                </span>
              ) : (
                <>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Restauração III: escolha uma 2ª Bênção (50% de força):</span>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {TIDE_BLESSINGS.map(b => (
                      <button key={b.id} onClick={() => handleSecondBlessing(b.id)} className="btn btn-ocean btn-xs" title={b.desc} style={{ fontSize: '0.65rem' }}>
                        {b.name}
                      </button>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
