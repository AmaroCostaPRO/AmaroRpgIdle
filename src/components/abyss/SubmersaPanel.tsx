import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import type { DistrictId, DrownedEcho } from '../../core/types';
import {
  DISTRICT_IDS, DISTRICT_NAMES, DISTRICT_ICONS, DISTRICT_DRAIN_COST, getRestorationCost,
  getDistrictSlotCount, ECHO_VOCATION_NAMES, ECHO_VOCATION_ICONS, ECHO_TRAIT_NAMES,
  TIDE_BLESSINGS, getTidePhase, getTidePhaseEndsAt, calculateEchoEfficacies, sumDistrictEfficacy,
  BROKEN_HEART_HEAL_MS, EchoEfficacyBreakdown,
} from '../../core/sunkenCitadelFormulas';
import { LeviathanPanel } from './LeviathanPanel';

const cardStyle: React.CSSProperties = {
  background: 'rgba(8, 47, 73, 0.35)', border: '1px solid rgba(34, 211, 238, 0.2)',
  borderRadius: 'var(--radius-md, 8px)', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
};

interface DistrictCardProps {
  id: DistrictId;
  assignedEchoes: DrownedEcho[];
  districtEfficacy: number;
  activeBlessing?: { id: string; expiresAt: number };
  tidePhase: 'low' | 'high';
  onDrain: (id: DistrictId) => void;
  onRestore: (id: DistrictId) => void;
  onBlessing: (id: string) => void;
}

// Componente próprio por distrito: `useCountdown` só pode ser chamado no topo de um componente,
// nunca dentro de um .map() — cada card é sua própria instância de hooks.
const DistrictCard: React.FC<DistrictCardProps> = ({
  id, assignedEchoes, districtEfficacy, activeBlessing, tidePhase, onDrain, onRestore, onBlessing,
}) => {
  const d = useGameStore((state) => state.character.sunkenCitadel?.districts[id]);
  const flooded = !d || d.flooded;
  const draining = !!d?.drainUpgrade;
  const restorationLevel = d?.restorationLevel || 0;
  const slots = getDistrictSlotCount(restorationLevel);
  const drainCost = DISTRICT_DRAIN_COST[id];
  const drainCountdown = useCountdown(d?.drainUpgrade?.completesAt);
  const restoreCost = !flooded && restorationLevel < 3 ? getRestorationCost(id, (restorationLevel + 1) as 2 | 3) : null;

  return (
    <div style={cardStyle}>
      <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{DISTRICT_ICONS[id]} {DISTRICT_NAMES[id]}</p>
      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>
        {flooded && !draining && 'Alagado'}
        {draining && `Drenando... conclusão em ${drainCountdown}`}
        {!flooded && `Restaurado ${restorationLevel === 1 ? 'I' : restorationLevel === 2 ? 'II' : 'III'} · Slots de Eco: ${assignedEchoes.length}/${slots}`}
      </p>
      {!flooded && districtEfficacy > 0 && (
        <p style={{ fontSize: '0.68rem', color: '#a5f3fc' }}>Eficácia acumulada: +{(districtEfficacy * 100).toFixed(1)}%</p>
      )}

      {flooded && !draining && (
        <button onClick={() => onDrain(id)} className="btn" style={{ fontSize: '0.72rem', alignSelf: 'flex-start' }}>
          Drenar — 🦪 {drainCost.pearls} + 🪸 {drainCost.coral} ({drainCost.durationHours}h)
        </button>
      )}
      {restoreCost && (
        <button onClick={() => onRestore(id)} className="btn btn-gold" style={{ fontSize: '0.72rem', alignSelf: 'flex-start' }}>
          Restaurar {restorationLevel === 1 ? 'II' : 'III'} — 🦪 {restoreCost.pearls} + 🪸 {restoreCost.coral}
        </button>
      )}
      {!flooded && restorationLevel >= 3 && (
        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Restauração máxima.</span>
      )}

      {!flooded && assignedEchoes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {assignedEchoes.map(e => (
            <span key={e.id} style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>
              {ECHO_VOCATION_ICONS[e.vocation]} {e.name}
            </span>
          ))}
        </div>
      )}

      {id === 'throne' && restorationLevel >= 1 && <LeviathanPanel />}

      {id === 'temple' && restorationLevel >= 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem' }}>
          {activeBlessing ? (
            <span style={{ fontSize: '0.7rem', color: '#fde047' }}>
              🕍 Bênção ativa: {TIDE_BLESSINGS.find(b => b.id === activeBlessing.id)?.name}
            </span>
          ) : tidePhase === 'high' ? (
            <>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>Escolha a Bênção da Maré Alta:</span>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {TIDE_BLESSINGS.map(b => (
                  <button key={b.id} onClick={() => onBlessing(b.id)} className="btn btn-xs" title={b.desc} style={{ fontSize: '0.65rem' }}>
                    {b.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Bênçãos só podem ser escolhidas na Maré Alta.</span>
          )}
        </div>
      )}
    </div>
  );
};

interface EchoRowProps {
  echo: DrownedEcho;
  efficacy?: EchoEfficacyBreakdown;
  restoredDistrictIds: DistrictId[];
  onAssign: (echoId: string, districtId: DistrictId | null) => void;
}

const EchoRow: React.FC<EchoRowProps> = ({ echo, efficacy, restoredDistrictIds, onAssign }) => {
  const healCountdown = useCountdown(echo.trait === 'brokenHeart' ? echo.brokenHeartHealsAt : undefined);
  const healed = echo.trait === 'brokenHeart' && !!echo.brokenHeartHealsAt && Date.now() >= echo.brokenHeartHealsAt;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem 0.6rem', fontSize: '0.72rem',
    }}>
      <span style={{ fontWeight: 700 }}>{ECHO_VOCATION_ICONS[echo.vocation]} {echo.name}</span>
      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{ECHO_VOCATION_NAMES[echo.vocation]} · {ECHO_TRAIT_NAMES[echo.trait]}</span>
      {echo.trait === 'brokenHeart' && (
        <span style={{ color: healed ? '#4ade80' : '#f87171' }}>
          {healed ? 'Coração Curado (+30%)' : `cura em ${healCountdown || `${Math.ceil(BROKEN_HEART_HEAL_MS / 86400000)}d`}`}
        </span>
      )}
      {efficacy && <span style={{ color: '#a5f3fc' }}>eficácia: {(efficacy.finalEfficacy * 100).toFixed(1)}%</span>}
      <select
        value={echo.assignedDistrict || ''}
        onChange={(ev) => onAssign(echo.id, (ev.target.value || null) as DistrictId | null)}
        style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0.2rem' }}
      >
        <option value="">Descansando</option>
        {restoredDistrictIds.map(id => (
          <option key={id} value={id}>{DISTRICT_ICONS[id]} {DISTRICT_NAMES[id]}</option>
        ))}
      </select>
    </div>
  );
};

/**
 * v10.2.0 "Os Ecos Afogados" — 🔱 Cidadela Submersa: restauração dos 6 distritos + alocação dos
 * Ecos Afogados. Um único painel rolável (em vez do grid 2×3 com sprites/drag-and-drop do Anexo 3
 * — decisão de escopo desta versão: a mesma informação e as mesmas ações, em cards de lista, mais
 * rápido de entregar e igualmente funcional em mobile).
 */
export const SubmersaPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const startDistrictDrain = useGameStore((state) => state.startDistrictDrain);
  const upgradeDistrictRestoration = useGameStore((state) => state.upgradeDistrictRestoration);
  const assignEcho = useGameStore((state) => state.assignEcho);
  const chooseTideBlessing = useGameStore((state) => state.chooseTideBlessing);

  const sunken = character.sunkenCitadel;
  const districts = sunken?.districts || {};
  const echoes = sunken?.echoes || [];
  const tidePhase = getTidePhase();
  const tideCountdown = useCountdown(getTidePhaseEndsAt());
  const efficacies = calculateEchoEfficacies(echoes, tidePhase);
  const activeBlessing = sunken?.tideBlessing && sunken.tideBlessing.expiresAt > Date.now() ? sunken.tideBlessing : undefined;
  const restoredDistrictIds = DISTRICT_IDS.filter(id => (districts[id]?.restorationLevel || 0) >= 1);

  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<number | undefined>(undefined);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
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
  const handleAssign = (echoId: string, districtId: DistrictId | null) => {
    AudioManager.getInstance().playClick();
    showToast(assignEcho(echoId, districtId).message);
  };
  const handleBlessing = (blessingId: string) => {
    AudioManager.getInstance().playClick();
    showToast(chooseTideBlessing(blessingId).message);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.85rem' }}>
      {/* Ciclo de Marés */}
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

      {/* Distritos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.7rem' }}>
        {DISTRICT_IDS.map((id) => (
          <DistrictCard
            key={id}
            id={id}
            assignedEchoes={echoes.filter(e => e.assignedDistrict === id)}
            districtEfficacy={sumDistrictEfficacy(efficacies, id)}
            activeBlessing={id === 'temple' ? activeBlessing : undefined}
            tidePhase={tidePhase}
            onDrain={handleDrain}
            onRestore={handleRestore}
            onBlessing={handleBlessing}
          />
        ))}
      </div>

      {/* Roster de Ecos */}
      <div style={cardStyle}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>🎭 Ecos Afogados ({echoes.length}/16) · resgatados: {sunken?.echoesRescuedLifetime || 0}</p>
        {echoes.length === 0 && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
            Nenhum Eco resgatado ainda — mergulhe até a Zona 3 das Profundezas (prof. 51+) ou conclua uma drenagem de distrito.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {echoes.map((e) => (
            <EchoRow
              key={e.id}
              echo={e}
              efficacy={efficacies.find(b => b.echoId === e.id)}
              restoredDistrictIds={restoredDistrictIds}
              onAssign={handleAssign}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
