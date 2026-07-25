import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { EquipmentItem } from '../../core/types';
import { VAULT_MAX_LEVEL, VAULT_UPGRADE_COST } from '../../core/citadelFormulas';
import { getRarityColor, slotLabels as SLOT_LABELS, slotIcons as SLOT_ICONS, statLabels as STAT_LABELS, formatStatValue, getSetVisual, getSetPrefixAndColor, getSocketDots, RuneChip } from '../shared/itemVisuals';
import { getActiveRelicDefinition } from '../../core/CombatFSM';
import { useCountdown } from '../../hooks/useCountdown';

interface SelectedVaultItem {
  item: EquipmentItem;
  source: 'vault' | 'inventory';
}

const ItemSlot: React.FC<{ item: EquipmentItem | null; index: number; onClick: () => void }> = ({ item, index, onClick }) => {
  if (!item) {
    return (
      <div
        style={{
          aspectRatio: '1',
          background: 'rgba(0,0,0,0.3)',
          border: '1px dashed rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.55rem',
          color: '#334155',
          userSelect: 'none',
        }}
      >
        {index + 1}
      </div>
    );
  }

  const { border, shadow, bg } = getSetVisual(item);

  return (
    <button
      onClick={onClick}
      style={{
        aspectRatio: '1',
        background: bg,
        border,
        boxShadow: shadow,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        position: 'relative',
        transition: 'transform 0.15s ease',
      }}
      title={item.name}
    >
      <span style={{ fontSize: '1.2rem' }}>{SLOT_ICONS[item.slot] || '❔'}</span>
      {item.rarity === 'mystic' && item.mysticLevel && (
        <div style={{
          position: 'absolute',
          top: '1px',
          left: '1px',
          fontSize: '10px',
          fontWeight: 800,
          lineHeight: 1,
          color: '#e879f9',
          textShadow: '0 0 4px #a21caf',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          +{item.mysticLevel}
        </div>
      )}
    </button>
  );
};

export const VaultPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeVault = useGameStore((state) => state.buildOrUpgradeVault);
  const depositItemToVault = useGameStore((state) => state.depositItemToVault);
  const withdrawItemFromVault = useGameStore((state) => state.withdrawItemFromVault);

  const [selected, setSelected] = useState<SelectedVaultItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmUpgrade, setConfirmUpgrade] = useState(false);

  const openItem = (item: EquipmentItem, source: 'vault' | 'inventory') => {
    setActionError(null);
    setSelected({ item, source });
  };

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const vault = citadel?.vault || { level: 0, lastTick: 0, storedItems: [] };
  const isBuilt = vault.level > 0;
  const nextLevel = vault.level + 1;
  const maxSlots = Math.min(10, vault.level * 2);
  const cost = VAULT_UPGRADE_COST(nextLevel);
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;

  const depositableItems = character.inventory.filter((item) => item.slot !== 'consumable');

  const handleUpgrade = () => {
    if (confirmUpgrade) {
      setConfirmUpgrade(false);
      AudioManager.getInstance().playClick();
      buildOrUpgradeVault();
    } else {
      setConfirmUpgrade(true);
      setTimeout(() => setConfirmUpgrade(false), 3000);
    }
  };

  const handleWithdraw = (itemId: string) => {
    AudioManager.getInstance().playClick();
    const res = withdrawItemFromVault(itemId);
    if (!res.success) {
      setActionError(res.message);
      return;
    }
    setSelected(null);
  };

  const handleDeposit = (itemId: string) => {
    AudioManager.getInstance().playClick();
    const res = depositItemToVault(itemId);
    if (!res.success) {
      setActionError(res.message);
      return;
    }
    setSelected(null);
  };

  const vaultGrid = Array.from({ length: maxSlots }, (_, i) => vault.storedItems[i] || null);
  const upgrading = vault.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  return (
    <>
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
            📦 Depósito {isBuilt ? `— Nível ${vault.level}` : '(Não construído)'}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Protege qualquer peça de equipamento, incluindo itens Místicos, do reset de Ascensão.
          </p>
        </div>
      </div>

      {vault.level < VAULT_MAX_LEVEL ? (
        <>
          {upgrading ? (
            <button disabled className="btn btn-disabled" style={{ alignSelf: 'flex-start' }}>
              🏗️ Melhorando para Nível {upgrading.targetLevel}... ({countdown})
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={materials.wood < cost.wood || materials.stone < cost.stone || lockedByCommandCenter}
              className="btn btn-gold"
              style={{
                alignSelf: 'flex-start',
                background: confirmUpgrade ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
                borderColor: confirmUpgrade ? '#10b981' : undefined,
                color: confirmUpgrade ? '#fff' : undefined,
              }}
            >
              {confirmUpgrade ? 'Confirmar?' : (isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Depósito')} — 🪵 {cost.wood} / 🪨 {cost.stone}
            </button>
          )}
          {lockedByCommandCenter && (
            <p style={{ fontSize: '0.68rem', color: '#f87171', margin: 0 }}>🏛️ Requer o Centro de Comando no Nível {nextLevel}.</p>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Depósito no nível máximo.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: 0 }}>
            Itens guardados ({vault.storedItems.length}/{maxSlots})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))',
            gap: '0.5rem',
            background: 'rgba(0,0,0,0.15)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-dim)',
          }}>
            {vaultGrid.map((item, idx) => (
              <ItemSlot
                key={item ? item.id : `empty-vault-${idx}`}
                item={item}
                index={idx}
                onClick={() => item && openItem(item, 'vault')}
              />
            ))}
          </div>

          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: '0.5rem 0 0 0' }}>
            Inventário disponível para guardar
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))',
            gap: '0.5rem',
            background: 'rgba(0,0,0,0.15)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-dim)',
            minHeight: '60px',
          }}>
            {depositableItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.65rem', fontStyle: 'italic' }}>
                Nenhum equipamento elegível no inventário.
              </div>
            )}
            {depositableItems.map((item) => (
              <ItemSlot
                key={item.id}
                item={item}
                index={0}
                onClick={() => openItem(item, 'inventory')}
              />
            ))}
          </div>
        </div>
      )}
    </div>

    {selected && (() => {
        const { item, source } = selected;
        const { isAncestral, isPandemonium, isCelestial, isPandemoniumMystic, isPandemoniumBase, border: itemBorder, shadow: itemShadow } = getSetVisual(item);
        let nameColor = getRarityColor(item.rarity);
        if (isAncestral) {
          nameColor = '#c084fc';
        } else if (isPandemonium) {
          nameColor = isPandemoniumBase ? '#10b981' : (isPandemoniumMystic ? '#8b5cf6' : nameColor);
        } else if (isCelestial) {
          nameColor = '#38bdf8';
        }
        const vaultFull = vault.storedItems.length >= maxSlots;

        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              padding: '1rem',
            }}
            onClick={() => { setSelected(null); setActionError(null); }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(15, 10, 25, 0.98), rgba(6, 4, 10, 0.99))',
                border: itemBorder,
                boxShadow: itemShadow,
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                width: '100%',
                maxWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setSelected(null)}
              >
                ✕
              </button>

              <div>
                <span className="font-mono" style={{ fontSize: '0.5rem', color: nameColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {item.rarity} • {SLOT_LABELS[item.slot] || item.slot}
                </span>
                <h4 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0.1rem 0 0.5rem 0', color: nameColor }}>
                  {item.name}
                </h4>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                {item.slot === 'activeRelic' ? (
                  <>
                    <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Habilidade Ativa</span>
                    <div style={{ fontSize: '0.65rem', color: '#c084fc', marginTop: '0.2rem', lineHeight: 1.4, fontWeight: 700 }}>
                      {(() => {
                        const relicDef = item.activeRelicId ? getActiveRelicDefinition(item.activeRelicId) : undefined;
                        if (!relicDef) return 'Relíquia desconhecida.';
                        const rolled = item.activeRelicRolledValue ?? 0;
                        return `${relicDef.icon} ${relicDef.description.replace('{value}', String(rolled))} (Recarga: ${Math.round(relicDef.cooldownMs / 1000)}s)`;
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Atributos do Item</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                      {Object.entries(item.stats).map(([stat, val]) => (
                        <span key={stat} className="font-mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                          {formatStatValue(stat, val as number)} {STAT_LABELS[stat] || stat}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {item.setName && (() => {
                const { setTextColor, setShadow, prefix } = getSetPrefixAndColor(item.setName);
                return (
                  <div style={{ fontSize: '0.6rem', color: setTextColor, fontWeight: 600, textShadow: setShadow }}>
                    {prefix} {item.setName}
                  </div>
                );
              })()}

              {/* v10.0.0: linha de soquetes/runas do item (engaste na Câmara de Gravação) — mesmo
                  padrão do tooltip principal do inventário (GameUI.tsx), que faltava aqui. */}
              {(item.sockets || 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6rem', color: '#c084fc', fontWeight: 600 }}>Soquetes: {getSocketDots(item)}</span>
                  {(item.socketedRunes || []).filter(Boolean).map((runeId, i) => (
                    <RuneChip key={i} runeId={runeId!} size={22} />
                  ))}
                </div>
              )}

              {actionError && (
                <div style={{ fontSize: '0.65rem', color: '#f87171', background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                  {actionError}
                </div>
              )}

              {source === 'vault' ? (
                <button onClick={() => handleWithdraw(item.id)} className="btn btn-sm btn-gold" style={{ width: '100%' }}>
                  Retirar do Depósito
                </button>
              ) : (
                <button
                  onClick={() => handleDeposit(item.id)}
                  disabled={vaultFull}
                  className="btn btn-sm btn-gold"
                  style={{ width: '100%', opacity: vaultFull ? 0.5 : 1, cursor: vaultFull ? 'not-allowed' : 'pointer' }}
                >
                  {vaultFull ? 'Depósito Cheio' : 'Guardar no Depósito'}
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
};
