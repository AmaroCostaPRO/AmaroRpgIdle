import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore, formatNumber } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';
import { AMULET_ORACLE_MAX_LEVEL, AMULET_ORACLE_UPGRADE_COST, AMULET_ORACLE_REROLL_COST, getAmuletOracleBuffValue } from '../../core/citadelFormulas';
import {
  AstralRuneId, ASTRAL_RUNE_CATALOG, AMULET_TOTAL_SLOTS, getMaxAmuletSlots, getActiveAstralRunewords,
  RUNE_SHEET_ASTRAL, getAstralRuneSpriteIndex, ASTRAL_RUNEWORD_CATALOG,
  RUNE_WORD_SHEET_ASTRAL, getAstralRunewordSpriteIndex, AstralRunewordDefinition,
} from '../../core/astralRuneFormulas';
import { statLabels, isPercentStat, getSetVisual } from '../shared/itemVisuals';
import { IconSprite } from '../shared/IconSprite';
import { ModalCloseButton } from '../shared/ModalCloseButton';
import { getTransparentImageUrl, peekTransparentImageUrl } from '../../core/imageBackgroundStrip';
import type { EquipmentItem } from '../../core/types';

// Modal somente-leitura com os detalhes da Palavra Rúnica Astral ativa — aberto ao clicar no
// sprite do espaço central do amuleto (`AmuletOraclePanel`), já que o selo sozinho não deixa claro
// qual palavra ele representa. Mesmo padrão de portal/overlay de `ItemDetailModal.tsx`.
const RunewordDetailModal: React.FC<{ word: AstralRunewordDefinition; onClose: () => void }> = ({ word, onClose }) => {
  const portalTarget = document.getElementById('ui-modal-root') || document.body;
  return createPortal(
    <div
      style={{
        position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 10, 25, 0.98), rgba(6, 4, 10, 0.99))',
          border: '1px solid rgba(250, 204, 21, 0.5)', boxShadow: '0 0 24px rgba(250, 204, 21, 0.25)',
          borderRadius: 'var(--radius-lg)', padding: '1.25rem', width: '100%', maxWidth: '320px',
          display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalCloseButton onClick={onClose} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <span style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 8px rgba(253, 224, 71, 0.7)' }}>
            <IconSprite src={RUNE_WORD_SHEET_ASTRAL} index={getAstralRunewordSpriteIndex(word.id)} fallbackIcon="✨" />
          </span>
          <h4 className="font-heading" style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: '#fde047' }}>{word.name}</h4>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Efeito</span>
          <p style={{ fontSize: '0.7rem', color: '#e2e8f0', marginTop: '0.2rem', lineHeight: 1.4 }}>{word.effectDesc}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
          <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', width: '100%' }}>Sequência</span>
          {word.sequence.map((runeId, i) => {
            const def = ASTRAL_RUNE_CATALOG[runeId];
            return (
              <span key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: def.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e1b4b', overflow: 'hidden', flexShrink: 0 }} title={def.name}>
                <IconSprite src={RUNE_SHEET_ASTRAL} index={getAstralRuneSpriteIndex(runeId)} fallbackIcon={def.glyph} />
              </span>
            );
          })}
        </div>

        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
          Requer Oráculo Nível {word.minOracleLevel}{word.grantsActiveAbility ? ` • Concede a habilidade ativa "${word.grantsActiveAbility.name}"` : ''}
        </span>

        <button onClick={onClose} className="btn btn-sm btn-gold" style={{ width: '100%' }}>Fechar</button>
      </div>
    </div>,
    portalTarget
  );
};

const AMULET_FRAME_INERT = '/assets/amulet_oracle_frame.png';
const AMULET_FRAME_ACTIVE = '/assets/amulet_oracle_frame_active.png';

/**
 * 🔮 Oráculo Rúnico — tela circular de ativação do Amuleto. 6 espaços dispostos em círculo ao
 * redor do sprite do amuleto (`amulet_oracle_frame.png` / `_active.png`), com 1 espaço central
 * mostrando a(s) Palavra(s) Rúnica(s) Astral(is) reconhecida(s) ao clicar em "Consultar o Oráculo".
 * Runas soltas nunca dão bônus sozinhas — só valem formando uma sequência reconhecida.
 *
 * v-next: gerencia QUALQUER amuleto (equipado, inventário ou Depósito da Cidadela) — antes só era
 * possível engastar/desengastar runas do amuleto EQUIPADO, obrigando a reequipar um amuleto antigo
 * para resgatar as runas dele antes de trocar para um novo. Vista 1 (seletor de amuleto) segue o
 * mesmo padrão da Câmara de Gravação (`EngravingChamberPanel.tsx`).
 */
export const AmuletOraclePanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeAmuletOracle = useGameStore((state) => state.buildOrUpgradeAmuletOracle);
  const socketAstralRune = useGameStore((state) => state.socketAstralRune);
  const unsocketAstralRune = useGameStore((state) => state.unsocketAstralRune);
  const activateAstralRuneword = useGameStore((state) => state.activateAstralRuneword);
  const rerollAmuletOracleBuff = useGameStore((state) => state.rerollAmuletOracleBuff);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0, coral: 0 };
  const oracle = citadel?.amuletOracle || { level: 0, lastTick: 0 };
  const oracleLevel = oracle.level;
  const isBuilt = oracleLevel > 0;
  const nextLevel = oracleLevel + 1;
  const cost = AMULET_ORACLE_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && (character.pearls || 0) >= cost.pearls;
  const lockedByCommandCenter = nextLevel > (citadel?.commandCenter.level || 1);
  const upgrading = (oracle as any).upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pickerSocketIndex, setPickerSocketIndex] = useState<number | null>(null);
  const [confirmReroll, setConfirmReroll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [detailWord, setDetailWord] = useState<AstralRunewordDefinition | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  // Amuletos elegíveis: equipado, inventário e Depósito da Cidadela — mesmo princípio da Câmara de
  // Gravação (itens de qualquer lugar podem ser gerenciados, não só o equipado).
  const equippedAmulet = character.equipment?.amulet;
  const inventoryAmulets = (character.inventory || []).filter(i => i.slot === 'amulet');
  const vaultAmulets = (citadel?.vault?.storedItems || []).filter(i => i.slot === 'amulet');
  const allAmulets: { item: EquipmentItem; origin: string }[] = [
    ...(equippedAmulet ? [{ item: equippedAmulet, origin: 'Equipado' }] : []),
    ...inventoryAmulets.map(item => ({ item, origin: 'Inventário' })),
    ...vaultAmulets.map(item => ({ item, origin: 'Depósito' })),
  ];
  const selected = allAmulets.find(e => e.item.id === selectedItemId) || null;
  const amulet = selected?.item || null;

  const maxSlots = getMaxAmuletSlots(oracleLevel);
  const sockets: (AstralRuneId | null)[] = Array.from({ length: AMULET_TOTAL_SLOTS }, (_, i) => amulet?.amuletSockets?.[i] || null);
  const activeWords = amulet ? getActiveAstralRunewords(amulet).filter(w => (amulet.activeAstralRunewords || []).includes(w.id)) : [];
  const isActive = activeWords.length > 0;

  // Sprites do amuleto foram gerados com fundo em chroma key (a IA não produz alpha real) —
  // mesmo pipeline de remoção de fundo (`imageBackgroundStrip.ts`) já usado pelos sprites de
  // construção/runas, com `peekTransparentImageUrl` evitando o flash do PNG "cru" (com o fundo
  // vermelho ainda visível) se o processamento já tiver sido pré-carregado (ver `App.tsx`).
  const frameSrc = isActive ? AMULET_FRAME_ACTIVE : AMULET_FRAME_INERT;
  const [resolvedFrameSrc, setResolvedFrameSrc] = useState<string | null>(() => peekTransparentImageUrl(frameSrc));
  useEffect(() => {
    let cancelled = false;
    setResolvedFrameSrc(peekTransparentImageUrl(frameSrc));
    getTransparentImageUrl(frameSrc)
      .then((dataUrl) => { if (!cancelled) setResolvedFrameSrc(dataUrl); })
      .catch(() => { if (!cancelled) setResolvedFrameSrc(frameSrc); });
    return () => { cancelled = true; };
  }, [frameSrc]);

  const runeEntries = Object.entries(character.astralRuneInventory || {}).filter(([, qty]) => (qty || 0) > 0) as [AstralRuneId, number][];

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeAmuletOracle();
  };

  const handleSocket = (runeId: AstralRuneId) => {
    if (!selectedItemId || pickerSocketIndex === null) return;
    AudioManager.getInstance().playClick();
    const res = socketAstralRune(selectedItemId, pickerSocketIndex, runeId);
    if (res.success) setPickerSocketIndex(null);
    showToast(res.message);
  };

  const handleUnsocket = (socketIndex: number) => {
    if (!selectedItemId) return;
    AudioManager.getInstance().playClick();
    showToast(unsocketAstralRune(selectedItemId, socketIndex).message);
  };

  const handleReroll = () => {
    if (!confirmReroll) {
      setConfirmReroll(true);
      window.setTimeout(() => setConfirmReroll(false), 3000);
      return;
    }
    setConfirmReroll(false);
    AudioManager.getInstance().playClick();
    const res = rerollAmuletOracleBuff();
    if (res.success) AudioManager.getInstance().playUpgrade();
    showToast(res.message);
  };

  const handleActivate = () => {
    if (!selectedItemId) return;
    AudioManager.getInstance().playClick();
    const res = activateAstralRuneword(selectedItemId);
    if (res.success) AudioManager.getInstance().playRunewordComplete();
    showToast(res.message);
  };

  // Posições dos 6 espaços em círculo, começando no topo e girando em sentido horário.
  // Calibrado por medição direta dos pixels de `amulet_oracle_frame.png` (1024×1024): os 6
  // encaixes formam um hexágono perfeitamente CENTRADO na imagem (o argolão no canto superior
  // direito não desloca o centro, ao contrário do que se imaginava antes), com raio de
  // ≈276px/512px de meia-largura = 53,97% — convertido para o container de 280px (meia-largura
  // 140px) dá ≈76px. Cada encaixe mede ≈135px de diâmetro em 1024px (≈37px em 280px).
  const RADIUS = 76;
  const slotPositions = Array.from({ length: AMULET_TOTAL_SLOTS }, (_, i) => {
    const angle = (Math.PI * 2 * i) / AMULET_TOTAL_SLOTS - Math.PI / 2;
    return { x: RADIUS * Math.cos(angle), y: RADIUS * Math.sin(angle) };
  });

  return (
    <CitadelBuildingPanel
      icon="🔮"
      title="Oráculo Rúnico"
      subtitle="Habilita a tela de ativação do Amuleto — 6 espaços em círculo para Runas Astrais, exclusivas deste sistema. N1: 3 espaços · N2: 4 · N3: 5 + produção passiva · N4: 6 (2 palavras de 3 runas simultâneas) · N5: Palavras Lendárias (concedem habilidade ativa)."
      isBuilt={isBuilt}
      level={oracleLevel}
      maxLevel={AMULET_ORACLE_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construído)"
      buildLabel="Construir Oráculo"
      costDisplay={<>🪵 {cost.wood} / 🪨 {cost.stone} / 🦪 {cost.pearls}</>}
      maxLevelLabel="Oráculo Rúnico no nível máximo."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {toast && (
          <div style={{ background: 'rgba(147, 51, 234, 0.25)', border: '1px solid rgba(192, 132, 252, 0.5)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.78rem' }}>
            {toast}
          </div>
        )}

        {/* Bônus de NÍVEL da estrutura (não do item) — sorteado 1x na 1ª construção, vale mesmo
            sem amuleto equipado/selecionado. */}
        {oracle.selectedBuffKey && (() => {
          const rerollCost = AMULET_ORACLE_REROLL_COST(oracleLevel);
          return (
            <div style={{ fontSize: '0.75rem', color: '#fde047', background: 'rgba(250, 204, 21, 0.12)', border: '1px solid rgba(250, 204, 21, 0.35)', borderRadius: '6px', padding: '0.4rem 0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span>
                🎁 Bônus da Estrutura: +{(() => {
                  const val = getAmuletOracleBuffValue(oracle.selectedBuffKey!, oracleLevel);
                  return isPercentStat(oracle.selectedBuffKey!) ? `${(val * 100).toFixed(1)}%` : val;
                })()} {statLabels[oracle.selectedBuffKey]} (Nível {oracleLevel}/{AMULET_ORACLE_MAX_LEVEL}) — vale para qualquer amuleto, mesmo sem runas.
              </span>
              <button
                className="btn btn-xs"
                onClick={handleReroll}
                style={{
                  alignSelf: 'flex-start',
                  background: confirmReroll ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
                  borderColor: confirmReroll ? '#10b981' : undefined,
                  color: confirmReroll ? '#fff' : undefined,
                }}
              >
                {confirmReroll ? 'Confirmar?' : `🎲 Rerolar Bônus — 💰 ${formatNumber(rerollCost.gold)} + 🦪 ${rerollCost.pearls}`}
              </button>
            </div>
          );
        })()}

        {/* Vista 1 — Seleção de amuleto (equipado / inventário / Depósito) */}
        {!selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Escolha um amuleto:</p>
            {allAmulets.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Nenhum amuleto disponível (equipado, inventário ou Depósito).</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {allAmulets.map(({ item, origin }) => {
                const visual = getSetVisual(item);
                const socketedCount = (item.amuletSockets || []).filter(Boolean).length;
                return (
                  <button
                    key={item.id}
                    onClick={() => { AudioManager.getInstance().playClick(); setSelectedItemId(item.id); }}
                    title={`${item.name} (${origin})`}
                    style={{
                      width: '64px', height: '68px', borderRadius: '8px', cursor: 'pointer',
                      background: visual.bg, border: visual.border, boxShadow: visual.shadow,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                      color: '#fff',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>🔮</span>
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)' }}>{origin === 'Equipado' ? '🧍' : origin === 'Depósito' ? '📦' : ''}Amuleto</span>
                    <span style={{ fontSize: '0.55rem', color: '#c084fc' }}>{socketedCount}/{AMULET_TOTAL_SLOTS} runas</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista 2 — Círculo do amuleto selecionado */}
        {selected && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{selected.item.name} <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>({selected.origin})</span></p>
              <button className="btn btn-xs" onClick={() => { setSelectedItemId(null); setPickerSocketIndex(null); }}>← Trocar amuleto</button>
            </div>

            <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto' }}>
              {resolvedFrameSrc && (
                <img
                  src={resolvedFrameSrc}
                  alt="Amuleto"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
              {/* Espaço central — sprite da(s) palavra(s) ativa(s). 1 palavra = sprite inteiro;
                  2 palavras (modo simultâneo) = cada uma ocupa metade do círculo (esquerda/direita),
                  recorte feito só com CSS (overflow: hidden) sobre o IconSprite de tamanho cheio —
                  ver Sprites_Necessarios.md, seção 4. Cada metade/sprite é clicável e abre um modal
                  com os detalhes da palavra, já que o selo sozinho não deixa claro qual palavra é. */}
              <div style={{
                position: 'absolute',
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '68px', height: '68px', pointerEvents: 'none',
              }}>
                {activeWords.length === 0 && (
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', paddingTop: '22px' }}>
                    Nenhuma palavra reconhecida
                  </div>
                )}
                {activeWords.length === 1 && (
                  <button
                    type="button"
                    title={`${activeWords[0].name} — clique para ver detalhes`}
                    onClick={() => { AudioManager.getInstance().playClick(); setDetailWord(activeWords[0]); }}
                    style={{
                      width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', pointerEvents: 'auto',
                      boxShadow: '0 0 8px rgba(253, 224, 71, 0.7)', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent',
                    }}
                  >
                    <IconSprite src={RUNE_WORD_SHEET_ASTRAL} index={getAstralRunewordSpriteIndex(activeWords[0].id)} fallbackIcon="✨" />
                  </button>
                )}
                {activeWords.length === 2 && (
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', boxShadow: '0 0 8px rgba(253, 224, 71, 0.7)' }}>
                    <button
                      type="button"
                      title={`${activeWords[0].name} — clique para ver detalhes`}
                      onClick={() => { AudioManager.getInstance().playClick(); setDetailWord(activeWords[0]); }}
                      style={{ width: '50%', height: '100%', overflow: 'hidden', position: 'relative', pointerEvents: 'auto', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}
                    >
                      <div style={{ position: 'absolute', left: 0, top: 0, width: '68px', height: '68px' }}>
                        <IconSprite src={RUNE_WORD_SHEET_ASTRAL} index={getAstralRunewordSpriteIndex(activeWords[0].id)} fallbackIcon="✨" />
                      </div>
                    </button>
                    <button
                      type="button"
                      title={`${activeWords[1].name} — clique para ver detalhes`}
                      onClick={() => { AudioManager.getInstance().playClick(); setDetailWord(activeWords[1]); }}
                      style={{ width: '50%', height: '100%', overflow: 'hidden', position: 'relative', pointerEvents: 'auto', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent' }}
                    >
                      <div style={{ position: 'absolute', right: 0, top: 0, width: '68px', height: '68px' }}>
                        <IconSprite src={RUNE_WORD_SHEET_ASTRAL} index={getAstralRunewordSpriteIndex(activeWords[1].id)} fallbackIcon="✨" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
              {detailWord && <RunewordDetailModal word={detailWord} onClose={() => setDetailWord(null)} />}
              {/* 6 espaços em círculo */}
              {slotPositions.map((pos, i) => {
                const unlocked = i < maxSlots;
                const runeId = sockets[i];
                const runeDef = runeId ? ASTRAL_RUNE_CATALOG[runeId] : null;
                return (
                  <button
                    key={i}
                    disabled={!unlocked}
                    onClick={() => (runeId ? handleUnsocket(i) : setPickerSocketIndex(i))}
                    title={!unlocked ? 'Espaço bloqueado — melhore o Oráculo' : (runeDef ? `${runeDef.name} — clique para remover` : 'Engastar Runa Astral')}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${pos.x}px - 18px)`,
                      top: `calc(50% + ${pos.y}px - 18px)`,
                      width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', cursor: unlocked ? 'pointer' : 'not-allowed',
                      background: runeDef ? runeDef.color : 'rgba(255,255,255,0.06)',
                      border: unlocked ? '2px solid rgba(192, 132, 252, 0.6)' : '2px dashed rgba(255,255,255,0.2)',
                      color: runeDef ? '#1e1b4b' : 'rgba(255,255,255,0.3)',
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    {unlocked ? (
                      runeDef
                        ? <IconSprite src={RUNE_SHEET_ASTRAL} index={getAstralRuneSpriteIndex(runeId!)} fallbackIcon={runeDef.glyph} />
                        : '○'
                    ) : '🔒'}
                  </button>
                );
              })}
            </div>

            <button className="btn btn-gold" style={{ alignSelf: 'center' }} onClick={handleActivate}>
              🔮 Consultar o Oráculo
            </button>

            {/* Picker de runas astrais */}
            {pickerSocketIndex !== null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid rgba(34, 211, 238, 0.35)', borderRadius: '8px', padding: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Escolha a Runa Astral para o espaço {pickerSocketIndex + 1}:</p>
                  <button className="btn btn-xs" onClick={() => setPickerSocketIndex(null)}>← Voltar</button>
                </div>
                {runeEntries.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Seu cofre de Runas Astrais está vazio.</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {runeEntries.map(([runeId, qty]) => {
                    const def = ASTRAL_RUNE_CATALOG[runeId];
                    return (
                      <button
                        key={runeId}
                        onClick={() => handleSocket(runeId)}
                        className="btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left', fontSize: '0.72rem', padding: '0.4rem 0.6rem' }}
                      >
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: def.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e1b4b', overflow: 'hidden' }}>
                          <IconSprite src={RUNE_SHEET_ASTRAL} index={getAstralRuneSpriteIndex(runeId)} fallbackIcon={def.glyph} />
                        </span>
                        <span>
                          <strong>{def.name}</strong> × {qty}
                          <br /><span style={{ color: 'rgba(255,255,255,0.55)' }}>{def.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Palavras Rúnicas Astrais conhecidas — só informativo (revelação por tentativa e
                erro ao consultar o Oráculo com sucesso, ou pela Garrafa Perdida). Diferente da
                Câmara de Gravação, não há botão de gravar/aplicar aqui: o jogador precisa montar
                a sequência manualmente e na ordem certa nos espaços do círculo acima. */}
            <div style={{ border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '8px', padding: '0.7rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>📜 Palavras Rúnicas Astrais Conhecidas</p>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>
                Revelada ao reconhecer a sequência com sucesso no Oráculo, ou ao abrir uma 🍾 Garrafa Perdida.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                {ASTRAL_RUNEWORD_CATALOG.map((rw) => {
                  const revealed = (character.revealedAstralRunewordIds || []).includes(rw.id);
                  if (!revealed) {
                    return (
                      <p key={rw.id} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                        ??? — uma sequência desconhecida ressoa em algum lugar do Oráculo...
                      </p>
                    );
                  }
                  return (
                    <div key={rw.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {rw.sequence.map((runeId, i) => {
                          const def = ASTRAL_RUNE_CATALOG[runeId];
                          return (
                            <span key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: def.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e1b4b', overflow: 'hidden', flexShrink: 0 }}>
                              <IconSprite src={RUNE_SHEET_ASTRAL} index={getAstralRuneSpriteIndex(runeId)} fallbackIcon={def.glyph} />
                            </span>
                          );
                        })}
                        <strong style={{ fontSize: '0.72rem', marginLeft: '0.3rem' }}>{rw.name}</strong>
                      </div>
                      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.25rem' }}>
                        {rw.effectDesc} {rw.minOracleLevel > 1 ? `(requer Oráculo Nível ${rw.minOracleLevel})` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </CitadelBuildingPanel>
  );
};
