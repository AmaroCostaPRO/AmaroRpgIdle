import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { EquipmentItem } from '../../core/types';
import { VAULT_MAX_LEVEL, VAULT_UPGRADE_COST } from '../../core/citadelFormulas';

const RARITY_COLOR: Record<string, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mystic: '#d946ef',
};

const RARITY_BG: Record<string, string> = {
  common: 'rgba(148, 163, 184, 0.1)',
  rare: 'rgba(59, 130, 246, 0.15)',
  epic: 'rgba(168, 85, 247, 0.15)',
  legendary: 'rgba(245, 158, 11, 0.15)',
  mystic: 'rgba(217, 70, 239, 0.15)',
};

const SLOT_ICONS: Record<string, string> = {
  head: '🪖',
  chest: '👕',
  legs: '👖',
  gloves: '🧤',
  weapon: '⚔️',
  necklace: '📿',
};

const SLOT_LABELS: Record<string, string> = {
  head: 'Cabeça',
  chest: 'Peito',
  legs: 'Pernas',
  gloves: 'Luvas',
  weapon: 'Arma',
  necklace: 'Colar',
};

const STAT_LABELS: Record<string, string> = {
  strength: 'Força',
  magic: 'Magia',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  luck: 'Sorte',
  touch: 'Poder do Toque',
  touchCritChance: 'Chance de Crítico',
  touchCritDamage: 'Dano Crítico',
  robotClicks: 'Cliques do Robô',
  lifesteal: 'Roubo de Vida',
  touchDamageMult: 'Multiplicador de Toque',
};

const PERCENT_STATS = ['lifesteal', 'touchDamageMult', 'touchCritChance', 'touchCritDamage'];

const formatStatValue = (stat: string, val: number) => {
  if (PERCENT_STATS.includes(stat)) {
    return `+${Number((val * 100).toFixed(2))}%`;
  }
  return `+${val}`;
};

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

  return (
    <button
      onClick={onClick}
      style={{
        aspectRatio: '1',
        background: RARITY_BG[item.rarity] || RARITY_BG.common,
        border: `2px solid ${RARITY_COLOR[item.rarity] || RARITY_COLOR.common}`,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        transition: 'transform 0.15s ease',
      }}
      title={item.name}
    >
      <span style={{ fontSize: '1.2rem' }}>{SLOT_ICONS[item.slot] || '❔'}</span>
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

  const depositableItems = character.inventory.filter((item) => item.slot !== 'consumable');

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeVault();
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
        <button
          onClick={handleUpgrade}
          disabled={materials.wood < cost.wood || materials.stone < cost.stone}
          className="btn btn-gold"
          style={{ alignSelf: 'flex-start' }}
        >
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Depósito'} — 🪵 {cost.wood} / 🪨 {cost.stone}
        </button>
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
        const nameColor = RARITY_COLOR[item.rarity] || RARITY_COLOR.common;
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
                border: `2px solid ${nameColor}`,
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
                <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Atributos do Item</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                  {Object.entries(item.stats).map(([stat, val]) => (
                    <span key={stat} className="font-mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                      {formatStatValue(stat, val as number)} {STAT_LABELS[stat] || stat}
                    </span>
                  ))}
                </div>
              </div>

              {item.setName && (
                <div style={{ fontSize: '0.6rem', color: 'var(--gold-400)', fontWeight: 600 }}>
                  Conjunto: {item.setName}
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
