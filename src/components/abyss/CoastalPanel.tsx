import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, formatNumber } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import { EvolutionSprite } from '../citadel/EvolutionSprite';
import {
  BAIT_DEFINITIONS, BAIT_BATCH_SIZE, BaitType,
  getPassiveCatchesPerHour, getFishingBufferCap,
  COASTAL_DOCK_MAX_LEVEL, getCoastalDockUpgradeCost,
  getActiveFishingCooldownMs, FARO_PERFECT_CATCHES_REQUIRED,
  BATHYSPHERE_FRAGMENTS_PER_KEY, ActiveFishingQuality,
} from '../../core/abyssFormulas';
import { getTidePhase, getTidePhaseEndsAt } from '../../core/sunkenCitadelFormulas';

/**
 * v10.0.0 — 🎣 Litoral Naufragado (Anexo 3, §2.2).
 * Pesca passiva (rede com buffer + coleta manual, padrão Torre de Vigia) + pesca ativa
 * ("Puxar a Linha", minigame de timing 100% React — nenhum Phaser envolvido) + Doca de Pesca.
 * Fundo `coastal_hub_background.png` com fallback de cor enquanto a arte não existe.
 */

// Janela verde do minigame (% da barra) e zona de acerto perfeito (20% centrais da janela).
const HIT_WINDOW_PCT = 30;
const PERFECT_WINDOW_PCT = HIT_WINDOW_PCT * 0.2;
const MARKER_SWEEP_MS = 900; // tempo de uma varredura completa (ida)

export const CoastalPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const craftBait = useGameStore((state) => state.craftBait);
  const equipBait = useGameStore((state) => state.equipBait);
  const collectFishingNet = useGameStore((state) => state.collectFishingNet);
  const resolveActiveFishing = useGameStore((state) => state.resolveActiveFishing);
  const buildOrUpgradeCoastalDock = useGameStore((state) => state.buildOrUpgradeCoastalDock);
  const tickCoastalProduction = useGameStore((state) => state.tickCoastalProduction);

  const coastal = character.coastal;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0, coral: 0 };
  const dockLevel = coastal?.dockLevel || 0;
  const bufferCap = getFishingBufferCap(dockLevel);
  const buffer = Math.floor(coastal?.passiveBuffer || 0);
  const ratePerHour = getPassiveCatchesPerHour(character.highestStageReached || 1, dockLevel);
  const dockUpgrade = coastal?.dockUpgrade;
  const dockCountdown = useCountdown(dockUpgrade?.completesAt);
  const nextDockLevel = dockLevel + 1;
  const dockCost = getCoastalDockUpgradeCost(nextDockLevel);

  const tidePhase = getTidePhase();
  const tideCountdown = useCountdown(getTidePhaseEndsAt());

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  // Log das últimas 5 capturas (padrão console de combate — rolante, não persistido entre sessões).
  const [catchLog, setCatchLog] = useState<string[]>([]);
  const logCatch = (message: string) => {
    setCatchLog((prev) => [message, ...prev].slice(0, 5));
  };

  // ── Minigame "Puxar a Linha" ───────────────────────────────────────────────
  const [casting, setCasting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const castStartRef = useRef<number>(0);
  const markerPosRef = useRef<number>(0);

  // Cooldown reativo (1s) da pesca ativa
  useEffect(() => {
    const update = () => {
      const last = useGameStore.getState().character.coastal?.lastActiveFishAt || 0;
      setCooldownLeft(Math.max(0, Math.ceil((last + getActiveFishingCooldownMs() - Date.now()) / 1000)));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Marcador em ping-pong via rAF, escrevendo direto no style (sem re-render por frame)
  useEffect(() => {
    if (!casting) return;
    castStartRef.current = performance.now();
    const step = (now: number) => {
      const t = (now - castStartRef.current) / MARKER_SWEEP_MS;
      const phase = t % 2;
      const pos = (phase <= 1 ? phase : 2 - phase) * 100; // 0→100→0
      markerPosRef.current = pos;
      if (markerRef.current) markerRef.current.style.left = `${pos}%`;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [casting]);

  const handleCastLine = () => {
    AudioManager.getInstance().playClick();
    setCasting(true);
  };

  const handleHook = () => {
    setCasting(false);
    const distance = Math.abs(markerPosRef.current - 50);
    const quality: ActiveFishingQuality =
      distance <= PERFECT_WINDOW_PCT / 2 ? 'perfect' :
      distance <= HIT_WINDOW_PCT / 2 ? 'hit' : 'miss';
    const res = resolveActiveFishing(quality);
    if (res.success) {
      AudioManager.getInstance().playCoin();
      setCooldownLeft(Math.ceil(getActiveFishingCooldownMs() / 1000));
      logCatch(res.message);
    }
    showToast(res.message);
  };

  const handleCollect = () => {
    AudioManager.getInstance().playClick();
    tickCoastalProduction();
    const res = collectFishingNet();
    if (res.success) {
      AudioManager.getInstance().playCoin();
      logCatch(res.message);
    }
    showToast(res.message);
  };

  const handleCraft = (type: BaitType) => {
    AudioManager.getInstance().playClick();
    showToast(craftBait(type).message);
  };

  const handleEquip = (type: BaitType | null) => {
    AudioManager.getInstance().playClick();
    equipBait(type);
  };

  const handleDockUpgrade = () => {
    AudioManager.getInstance().playClick();
    const res = buildOrUpgradeCoastalDock();
    if (res.success) AudioManager.getInstance().playUpgrade();
    showToast(res.message);
  };

  if (!coastal?.unlocked) {
    return (
      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
        <p style={{ fontSize: '1.5rem' }}>🌫️</p>
        <p style={{ fontSize: '0.85rem' }}>A névoa do mar ainda esconde o Litoral. Complete a <strong>Fase 2</strong> para descobri-lo.</p>
      </div>
    );
  }

  const sectionStyle: React.CSSProperties = {
    background: 'rgba(8, 47, 73, 0.35)',
    border: '1px solid rgba(34, 211, 238, 0.2)',
    borderRadius: 'var(--radius-md, 8px)',
    padding: '0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.85rem',
        backgroundImage: 'linear-gradient(rgba(2, 20, 34, 0.82), rgba(2, 20, 34, 0.92)), url(/assets/coastal_hub_background.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        borderRadius: 'var(--radius-md, 8px)', padding: '0.85rem',
      }}
    >
      {/* Ciclo de Marés */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700 }}>{tidePhase === 'low' ? '🌊⬇ MARÉ BAIXA' : '🌊⬆ MARÉ ALTA'}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>vira em {tideCountdown}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
          {tidePhase === 'low' ? '· +50% Pesca · −20% custo de drenagem · −10% Pressão' : '· −25% Pesca · +50% Coral · Bênçãos do Templo ativas'}
        </span>
      </div>

      {/* Moedas e recursos do Litoral */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
        <span title="Pérolas Abissais">🦪 {formatNumber(character.pearls || 0)}</span>
        <span title="Coral Vivo">🪸 {formatNumber(materials.coral || 0)}</span>
        <span title="Carne">🥩 {formatNumber(materials.meat)}</span>
        <span title="Fragmentos de Batisfera">🗝️ {character.batisphereFragments || 0}/{BATHYSPHERE_FRAGMENTS_PER_KEY}</span>
        <span title="Chaves de Mergulho">🤿 {character.diveKeys || 0}</span>
      </div>

      {toast && (
        <div style={{ background: 'rgba(14, 116, 144, 0.5)', border: '1px solid rgba(34, 211, 238, 0.5)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.78rem' }}>
          {toast}
        </div>
      )}

      {/* O Píer: Doca de Pesca + rede */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', flexShrink: 0 }}>
            <EvolutionSprite src="/assets/coastal_dock.png" level={Math.max(1, dockLevel)} maxLevel={COASTAL_DOCK_MAX_LEVEL} fallbackIcon="🎣" fallbackClassName="" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚓ Doca de Pesca {dockLevel > 0 ? `— Nível ${dockLevel}` : '(cais improvisado)'}</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              Rendimento passivo: {ratePerHour.toFixed(1)} capturas/hora · Rede: {buffer}/{bufferCap}
            </p>
          </div>
        </div>

        {/* Barra da rede */}
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (buffer / bufferCap) * 100)}%`, background: 'linear-gradient(90deg, #0891b2, #22d3ee)', transition: 'width 0.4s' }} />
        </div>
        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
          A rede pausa quando enche — recolha para retomar a pesca passiva. A isca equipada é consumida 1x por captura ao recolher.
        </p>

        <button onClick={handleCollect} disabled={buffer <= 0} className="btn btn-gold" style={{ alignSelf: 'center', opacity: buffer <= 0 ? 0.5 : 1 }}>
          🕸️ Recolher a Rede ({buffer})
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {dockUpgrade ? (
            <span style={{ fontSize: '0.75rem', alignSelf: 'center', color: '#fbbf24' }}>🔨 Obras: Nível {dockUpgrade.targetLevel} em {dockCountdown}</span>
          ) : nextDockLevel <= COASTAL_DOCK_MAX_LEVEL ? (
            <button onClick={handleDockUpgrade} className="btn" style={{ fontSize: '0.75rem' }}>
              {dockLevel === 0 ? 'Construir Doca' : `Melhorar Doca (Nv ${nextDockLevel})`} — 💰 {formatNumber(dockCost.gold)} + 🥩 {dockCost.meat}
            </button>
          ) : (
            <span style={{ fontSize: '0.75rem', alignSelf: 'center', color: 'rgba(255,255,255,0.45)' }}>Doca no nível máximo.</span>
          )}
        </div>
      </div>

      {/* Pesca Ativa */}
      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>🎣 Pesca Ativa</p>
        {!casting ? (
          <button
            onClick={handleCastLine}
            disabled={cooldownLeft > 0}
            className="btn btn-gold"
            style={{ alignSelf: 'center', opacity: cooldownLeft > 0 ? 0.5 : 1 }}
          >
            {cooldownLeft > 0 ? `Recolhendo a linha... (${cooldownLeft}s)` : '🎣 JOGAR A LINHA'}
          </button>
        ) : (
          <>
            {/* Barra de timing: janela verde central; acerte o marcador dentro dela */}
            <div style={{ position: 'relative', height: '26px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${50 - HIT_WINDOW_PCT / 2}%`, width: `${HIT_WINDOW_PCT}%`,
                background: 'rgba(34, 197, 94, 0.35)', borderLeft: '1px solid #22c55e', borderRight: '1px solid #22c55e',
              }} />
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${50 - PERFECT_WINDOW_PCT / 2}%`, width: `${PERFECT_WINDOW_PCT}%`,
                background: 'rgba(250, 204, 21, 0.5)',
              }} />
              <div ref={markerRef} style={{
                position: 'absolute', top: 0, bottom: 0, width: '3px', left: '0%',
                background: '#fff', boxShadow: '0 0 6px #22d3ee', transform: 'translateX(-50%)',
              }} />
            </div>
            <button onClick={handleHook} className="btn btn-gold" style={{ alignSelf: 'center' }}>
              ⚡ Fisgar!
            </button>
          </>
        )}
        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
          Acertar a janela verde dobra a captura. A faixa dourada central conta como <strong>acerto perfeito</strong>.
        </p>
        <p style={{ fontSize: '0.72rem', color: '#fde047' }}>
          ✨ Acertos perfeitos: {coastal.faroPerfectCatches % FARO_PERFECT_CATCHES_REQUIRED}/{FARO_PERFECT_CATCHES_REQUIRED}
          {(coastal.faroGrantedCount ?? (coastal.faroGranted ? 1 : 0)) > 0
            ? ` — 🜠 Faro obtida ${coastal.faroGrantedCount ?? 1}x!`
            : ''}
        </p>
      </div>

      {/* Log das últimas capturas */}
      {catchLog.length > 0 && (
        <div style={sectionStyle}>
          <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>📋 Últimas capturas</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {catchLog.map((entry, i) => (
              <p key={i} style={{ fontSize: '0.68rem', color: i === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)', margin: 0 }}>
                {entry}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Iscas */}
      <div style={sectionStyle}>
        <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>🪱 Iscas (fabricadas com Carne)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
          <button
            onClick={() => handleEquip(null)}
            className="btn"
            style={{
              fontSize: '0.72rem', padding: '0.45rem 0.6rem',
              border: coastal.equippedBait === null ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            🚫 Sem isca<br /><span style={{ color: 'rgba(255,255,255,0.5)' }}>só capturas comuns</span>
          </button>
          {(Object.values(BAIT_DEFINITIONS)).map((def) => {
            const stock = coastal.baitInventory[def.id] || 0;
            const equipped = coastal.equippedBait === def.id;
            return (
              <div key={def.id} style={{
                border: equipped ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px', padding: '0.45rem 0.6rem', fontSize: '0.72rem',
                display: 'flex', flexDirection: 'column', gap: '0.25rem',
                background: equipped ? 'rgba(14, 116, 144, 0.25)' : 'transparent',
              }}>
                <span style={{ fontWeight: 700 }}>{def.icon} {def.name} × {stock}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{def.bias}</span>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleCraft(def.id)} className="btn btn-xs" style={{ fontSize: '0.65rem' }}>
                    +{BAIT_BATCH_SIZE} por 🥩 {def.meatCost}
                  </button>
                  {!equipped && stock > 0 && (
                    <button onClick={() => handleEquip(def.id)} className="btn btn-xs btn-gold" style={{ fontSize: '0.65rem' }}>Equipar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
