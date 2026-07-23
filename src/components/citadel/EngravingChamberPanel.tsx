import React, { useState } from 'react';
import { useGameStore, formatNumber } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';
import {
  ENGRAVING_CHAMBER_MAX_LEVEL, ENGRAVING_CHAMBER_UPGRADE_COST,
} from '../../core/citadelFormulas';
import {
  RuneId, RUNE_CATALOG, isPrimordialRune, isHeavySlot, getMaxSocketsForSlot,
  DRILL_SOCKET_COSTS, RUNE_FUSE_COST_PEARLS, RUNE_FUSE_INPUT_COUNT,
  EXTRACT_RUNE_COST_PEARLS, EXTRACT_PRIMORDIAL_COST_PEARLS, getFusedRuneId,
  RUNEWORD_CATALOG, getRunewordEngraveCost, getActiveRuneword,
} from '../../core/runeFormulas';
import type { EquipmentItem } from '../../core/types';
import {
  getSetVisual, slotIcons, slotLabels, statLabels, formatStatValue, getRuneVisual, getSocketDots, RuneChip,
} from '../shared/itemVisuals';

/**
 * v10.0.0 "A Cidadela Submersa" — 🪬 Câmara de Gravação (Anexo 3, §2.5).
 * Fluxo em 3 vistas encadeadas: seleção de item (grade filtrada aos slots pesados, com pontos
 * ●○ sob o ícone) → vista do item (ações por soquete conforme o nível da Câmara) → picker de
 * runas do cofre (com prévia do efeito). Inclui a fusão 3→1 (N4) e o card travado de Palavras
 * Rúnicas (N5, habilitação em versão futura).
 */

// Descrição curta do efeito de uma runa para a UI (efeito primário + secundário quando houver).
const describeRune = (runeId: RuneId): string => {
  const def = RUNE_CATALOG[runeId];
  if (!def) return '';
  const parts: string[] = [];
  if (def.statKey && typeof def.value === 'number') {
    parts.push(`${formatStatValue(def.statKey, def.value)} ${statLabels[def.statKey] || def.statKey}`);
  }
  if (def.extraStats) {
    for (const [key, value] of Object.entries(def.extraStats)) {
      parts.push(`${formatStatValue(key, value as number)} ${statLabels[key] || key}`);
    }
  }
  if (def.secondaryDesc && !def.extraStats) parts.push(def.secondaryDesc);
  return parts.join(' · ');
};

export const EngravingChamberPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeEngravingChamber = useGameStore((state) => state.buildOrUpgradeEngravingChamber);
  const drillSocket = useGameStore((state) => state.drillSocket);
  const socketRune = useGameStore((state) => state.socketRune);
  const unsocketRuneDestructive = useGameStore((state) => state.unsocketRuneDestructive);
  const extractRune = useGameStore((state) => state.extractRune);
  const fuseRunes = useGameStore((state) => state.fuseRunes);
  const engraveRuneword = useGameStore((state) => state.engraveRuneword);
  const undoRuneword = useGameStore((state) => state.undoRuneword);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0, coral: 0 };
  const chamber = citadel?.engravingChamber || { level: 0, lastTick: 0 };
  const chamberLevel = chamber.level;
  const isBuilt = chamberLevel > 0;
  const nextLevel = chamberLevel + 1;
  const cost = ENGRAVING_CHAMBER_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && (materials.coral || 0) >= cost.coral;
  const lockedByCommandCenter = nextLevel > (citadel?.commandCenter.level || 1);
  const upgrading = (chamber as any).upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pickerSocketIndex, setPickerSocketIndex] = useState<number | null>(null);
  const [confirmDestroyIndex, setConfirmDestroyIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  // Itens elegíveis: slots pesados, de qualquer lugar (equipado / inventário / Depósito)
  const equippedItems = Object.values(character.equipment || {}).filter((i): i is EquipmentItem => !!i && isHeavySlot(i.slot));
  const inventoryItems = (character.inventory || []).filter(i => isHeavySlot(i.slot));
  const vaultItems = (citadel?.vault?.storedItems || []).filter(i => isHeavySlot(i.slot));
  const allItems: { item: EquipmentItem; origin: string }[] = [
    ...equippedItems.map(item => ({ item, origin: 'Equipado' })),
    ...inventoryItems.map(item => ({ item, origin: 'Inventário' })),
    ...vaultItems.map(item => ({ item, origin: 'Depósito' })),
  ];
  const selected = allItems.find(e => e.item.id === selectedItemId) || null;

  const runeEntries = Object.entries(character.runeInventory || {}).filter(([, qty]) => (qty || 0) > 0) as [RuneId, number][];

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeEngravingChamber();
  };

  const handleDrill = (itemId: string) => {
    AudioManager.getInstance().playClick();
    const res = drillSocket(itemId);
    if (res.success) AudioManager.getInstance().playUpgrade();
    showToast(res.message);
  };

  const handleSocket = (runeId: RuneId) => {
    if (!selectedItemId || pickerSocketIndex === null) return;
    AudioManager.getInstance().playClick();
    const res = socketRune(selectedItemId, pickerSocketIndex, runeId);
    if (res.success) {
      AudioManager.getInstance().playUpgrade();
      setPickerSocketIndex(null);
    }
    showToast(res.message);
  };

  const handleExtract = (socketIndex: number) => {
    if (!selectedItemId) return;
    AudioManager.getInstance().playClick();
    showToast(extractRune(selectedItemId, socketIndex).message);
  };

  const handleDestroy = (socketIndex: number) => {
    if (!selectedItemId) return;
    AudioManager.getInstance().playClick();
    if (confirmDestroyIndex !== socketIndex) {
      setConfirmDestroyIndex(socketIndex);
      window.setTimeout(() => setConfirmDestroyIndex(null), 3000);
      return;
    }
    setConfirmDestroyIndex(null);
    showToast(unsocketRuneDestructive(selectedItemId, socketIndex).message);
  };

  const handleFuse = (runeId: RuneId) => {
    AudioManager.getInstance().playClick();
    const res = fuseRunes(runeId);
    if (res.success) AudioManager.getInstance().playUpgrade();
    showToast(res.message);
  };

  const handleEngrave = (runewordId: string) => {
    if (!selectedItemId) return;
    AudioManager.getInstance().playClick();
    const res = engraveRuneword(selectedItemId, runewordId);
    if (res.success) AudioManager.getInstance().playRunewordComplete();
    showToast(res.message);
  };

  const handleUndoRuneword = () => {
    if (!selectedItemId) return;
    AudioManager.getInstance().playClick();
    showToast(undoRuneword(selectedItemId).message);
  };

  const runeChip = (runeId: RuneId, qty?: number) => {
    const visual = getRuneVisual(runeId);
    return <RuneChip runeId={runeId} qty={qty} title={`${visual.name} (${visual.tierLabel}) — ${describeRune(runeId)}`} />;
  };

  return (
    <CitadelBuildingPanel
      icon="🪬"
      title="Câmara de Gravação"
      subtitle="Perfura soquetes em equipamentos pesados e engasta Runas Abissais (pescadas no Litoral e resgatadas nos Mergulhos). N1: armas · N2: peitorais + remoção · N3: 2º soquete/qualquer slot pesado · N4: extração intacta + fusão 3→1 · N5: 3º soquete + Palavras Rúnicas."
      isBuilt={isBuilt}
      level={chamberLevel}
      maxLevel={ENGRAVING_CHAMBER_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construída)"
      buildLabel="Construir Câmara"
      costDisplay={<>🪵 {cost.wood} / 🪨 {cost.stone} / 🪸 {cost.coral}</>}
      maxLevelLabel="Câmara de Gravação no nível máximo."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '0.8rem' }}>
          🦪 Pérolas: <strong>{formatNumber(character.pearls || 0)}</strong> · Cofre de runas: <strong>{runeEntries.reduce((s, [, q]) => s + q, 0)}</strong> runa(s)
        </p>
        {toast && (
          <div style={{ background: 'rgba(147, 51, 234, 0.25)', border: '1px solid rgba(192, 132, 252, 0.5)', borderRadius: '6px', padding: '0.5rem 0.7rem', fontSize: '0.78rem' }}>
            {toast}
          </div>
        )}

        {/* Vista 1 — Seleção de item */}
        {!selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Escolha um item (slots pesados):</p>
            {allItems.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Nenhum equipamento pesado disponível.</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {allItems.map(({ item, origin }) => {
                const visual = getSetVisual(item);
                const dots = getSocketDots(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => { AudioManager.getInstance().playClick(); setSelectedItemId(item.id); }}
                    title={`${item.name} (${origin})`}
                    style={{
                      width: '58px', height: '64px', borderRadius: '8px', cursor: 'pointer',
                      background: visual.bg, border: visual.border, boxShadow: visual.shadow,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                      color: '#fff',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{slotIcons[item.slot]}</span>
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)' }}>{origin === 'Equipado' ? '🧍' : origin === 'Depósito' ? '📦' : ''}{slotLabels[item.slot]}</span>
                    <span style={{ fontSize: '0.6rem', color: '#c084fc', letterSpacing: '2px', minHeight: '0.7rem' }}>{dots}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista 2 — Item selecionado */}
        {selected && pickerSocketIndex === null && (() => {
          const item = selected.item;
          const sockets = item.sockets || 0;
          const maxNow = getMaxSocketsForSlot(item.slot, chamberLevel);
          const maxEver = getMaxSocketsForSlot(item.slot, ENGRAVING_CHAMBER_MAX_LEVEL);
          const drillCost = sockets < DRILL_SOCKET_COSTS.length ? DRILL_SOCKET_COSTS[sockets] : null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '8px', padding: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{slotIcons[item.slot]} {item.name} <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>({selected.origin})</span></p>
                <button className="btn btn-xs" onClick={() => { setSelectedItemId(null); setConfirmDestroyIndex(null); }}>← Voltar</button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                Soquetes: {sockets}/{maxEver} {maxNow < maxEver ? `(Câmara Nv ${chamberLevel} permite até ${maxNow} neste slot)` : ''}
              </p>
              {(() => {
                const activeRuneword = getActiveRuneword(item);
                return activeRuneword ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.4)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                    <span style={{ fontSize: '0.72rem' }}>⚡ <strong>{activeRuneword.name}</strong> ativa — {activeRuneword.effectDesc}</span>
                    <button className="btn btn-xs" onClick={handleUndoRuneword}>Desfazer</button>
                  </div>
                ) : null;
              })()}

              {/* Soquetes */}
              {Array.from({ length: sockets }, (_, i) => {
                const runeId = item.socketedRunes?.[i] || null;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                    {runeId ? runeChip(runeId) : (
                      <span style={{ width: '34px', height: '34px', borderRadius: '6px', border: '2px dashed rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>○</span>
                    )}
                    <div style={{ flex: 1, fontSize: '0.72rem' }}>
                      {runeId ? (
                        <>
                          <strong>{RUNE_CATALOG[runeId]?.name}</strong>
                          <br /><span style={{ color: 'rgba(255,255,255,0.55)' }}>{describeRune(runeId)}</span>
                        </>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Soquete vazio</span>
                      )}
                    </div>
                    {runeId ? (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button className="btn btn-xs" onClick={() => handleExtract(i)} title={`Extrai a runa intacta (${isPrimordialRune(runeId) ? EXTRACT_PRIMORDIAL_COST_PEARLS : EXTRACT_RUNE_COST_PEARLS} Pérolas, Câmara N${isPrimordialRune(runeId) ? 2 : 4})`}>
                          ⚗️ Extrair
                        </button>
                        {!isPrimordialRune(runeId) && (
                          <button className="btn btn-xs" onClick={() => handleDestroy(i)} style={{ color: confirmDestroyIndex === i ? '#f87171' : undefined }} title="Remove a runa DESTRUINDO-a (grátis, Câmara N2)">
                            {confirmDestroyIndex === i ? 'Confirmar?' : '💥 Remover'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button className="btn btn-xs btn-gold" onClick={() => setPickerSocketIndex(i)}>Engastar</button>
                    )}
                  </div>
                );
              })}

              {/* Perfurar */}
              {sockets < maxEver && drillCost && (
                <button className="btn" onClick={() => handleDrill(item.id)} style={{ alignSelf: 'flex-start', fontSize: '0.75rem' }} disabled={sockets >= maxNow}>
                  ⛏️ Perfurar {sockets + 1}º soquete — 🦪 {drillCost.pearls} + 💰 {formatNumber(drillCost.gold)}
                  {sockets >= maxNow ? ' (requer Câmara em nível mais alto)' : ''}
                </button>
              )}
            </div>
          );
        })()}

        {/* Vista 3 — Picker de runas */}
        {selected && pickerSocketIndex !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid rgba(34, 211, 238, 0.35)', borderRadius: '8px', padding: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Escolha a runa para o soquete {pickerSocketIndex + 1} de [{selected.item.name}]:</p>
              <button className="btn btn-xs" onClick={() => setPickerSocketIndex(null)}>← Voltar</button>
            </div>
            {runeEntries.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Seu cofre de runas está vazio — pesque Runas Encharcadas no Litoral ou mergulhe no Recife Partido.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {runeEntries.map(([runeId, qty]) => (
                <button key={runeId} onClick={() => handleSocket(runeId)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left', fontSize: '0.72rem', padding: '0.4rem 0.6rem' }}>
                  {runeChip(runeId, qty)}
                  <span>
                    <strong>{RUNE_CATALOG[runeId]?.name}</strong> × {qty}
                    <br /><span style={{ color: 'rgba(255,255,255,0.55)' }}>{describeRune(runeId)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fusão 3→1 (N4) */}
        <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>⚗️ Fusão de Runas (3 → 1 do tier acima) {chamberLevel < 4 ? '— requer Câmara Nível 4' : ''}</p>
          {chamberLevel >= 4 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              {runeEntries.filter(([runeId, qty]) => qty >= RUNE_FUSE_INPUT_COUNT && getFusedRuneId(runeId)).map(([runeId, qty]) => {
                const def = RUNE_CATALOG[runeId];
                const fuseCost = RUNE_FUSE_COST_PEARLS[def.tier as 1 | 2];
                return (
                  <button key={runeId} className="btn btn-xs" onClick={() => handleFuse(runeId)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {runeChip(runeId, qty)} 3x {def.name} → {RUNE_CATALOG[getFusedRuneId(runeId)!]?.name} (🦪 {fuseCost})
                  </button>
                );
              })}
              {runeEntries.filter(([runeId, qty]) => qty >= RUNE_FUSE_INPUT_COUNT && getFusedRuneId(runeId)).length === 0 && (
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Junte 3 runas idênticas para fundir.</p>
              )}
            </div>
          )}
        </div>

        {/* v10.3.0 "O Coração do Abismo": Palavras Rúnicas (N5) */}
        <div style={{ border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '8px', padding: '0.7rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>📜 Palavras Rúnicas {chamberLevel >= 5 ? '' : '— requer Câmara Nível 5'}</p>
          {chamberLevel < 5 ? (
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
              Sequências exatas de runas ressoam em efeitos únicos — a Câmara ainda não alcançou o Nível 5.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
              {RUNEWORD_CATALOG.map((rw) => {
                const revealed = (character.revealedRunewordIds || []).includes(rw.id);
                if (!revealed) {
                  return (
                    <p key={rw.id} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                      ??? — uma sequência desconhecida ressoa em algum lugar do Abismo...
                    </p>
                  );
                }
                const sequenceGlyphs = rw.sequence.map(id => getRuneVisual(id).glyph).join(' – ');
                const canEngraveHere = !!selected && (rw.requiredSlot === 'any' || selected.item.slot === rw.requiredSlot)
                  && (selected.item.sockets || 0) >= rw.sequence.length && !getActiveRuneword(selected.item);
                return (
                  <div key={rw.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                    <span style={{ fontSize: '0.72rem' }}>
                      <strong>{rw.name}</strong> ({sequenceGlyphs}, {rw.requiredSlot === 'any' ? 'qualquer item' : slotLabels[rw.requiredSlot]})
                      <br /><span style={{ color: 'rgba(255,255,255,0.55)' }}>{rw.effectDesc}</span>
                    </span>
                    {selected && (
                      <button className="btn btn-xs btn-gold" disabled={!canEngraveHere} onClick={() => handleEngrave(rw.id)} title={canEngraveHere ? `Gravar — 🦪 ${getRunewordEngraveCost(rw)} Pérolas` : 'Este item não atende aos requisitos'}>
                        Gravar (🦪 {getRunewordEngraveCost(rw)})
                      </button>
                    )}
                  </div>
                );
              })}
              {!selected && (
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Selecione um item acima para gravar uma Palavra revelada.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </CitadelBuildingPanel>
  );
};
