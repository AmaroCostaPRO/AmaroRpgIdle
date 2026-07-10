import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';

const RARITY_COLOR: Record<string, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const VAULT_MAX_LEVEL = 5;

export const VaultPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeVault = useGameStore((state) => state.buildOrUpgradeVault);
  const depositItemToVault = useGameStore((state) => state.depositItemToVault);
  const withdrawItemFromVault = useGameStore((state) => state.withdrawItemFromVault);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const vault = citadel?.vault || { level: 0, lastTick: 0, storedItems: [] };
  const isBuilt = vault.level > 0;
  const nextLevel = vault.level + 1;
  const maxSlots = Math.min(10, vault.level * 2);
  const cost = {
    wood: Math.round(50 * Math.pow(1.8, nextLevel - 1)),
    stone: Math.round(50 * Math.pow(1.8, nextLevel - 1)),
  };

  const depositableItems = character.inventory.filter(
    (item) => item.slot !== 'consumable' && item.rarity !== 'mystic'
  );

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeVault();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-300)' }}>
            📦 Depósito {isBuilt ? `— Nível ${vault.level}` : '(Não construído)'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
            Protege equipamentos Comuns, Raros, Épicos e Lendários do reset de Ascensão.
          </p>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
          <span>🪵 {materials.wood}</span>
          <span>🪨 {materials.stone}</span>
          <span>🥩 {materials.meat}</span>
        </div>
      </div>

      {vault.level < VAULT_MAX_LEVEL ? (
        <button
          onClick={handleUpgrade}
          disabled={materials.wood < cost.wood || materials.stone < cost.stone}
          style={{
            alignSelf: 'flex-start',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-accent)',
            background: 'var(--surface-3)',
            color: 'var(--gold-300)',
            cursor: materials.wood < cost.wood || materials.stone < cost.stone ? 'not-allowed' : 'pointer',
            opacity: materials.wood < cost.wood || materials.stone < cost.stone ? 0.5 : 1,
          }}
        >
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Depósito'} — 🪵 {cost.wood} / 🪨 {cost.stone}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Depósito no nível máximo.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
            Itens guardados ({vault.storedItems.length}/{maxSlots})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {vault.storedItems.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Nenhum item guardado.</p>
            )}
            {vault.storedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => withdrawItemFromVault(item.id)}
                title="Clique para retirar"
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${RARITY_COLOR[item.rarity] || '#94a3b8'}`,
                  background: 'var(--surface-2)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: RARITY_COLOR[item.rarity] || '#94a3b8' }}>{item.name}</span>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
            Inventário disponível para guardar
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {depositableItems.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Nenhum equipamento elegível no inventário.</p>
            )}
            {depositableItems.map((item) => (
              <div
                key={item.id}
                onClick={() => vault.storedItems.length < maxSlots && depositItemToVault(item.id)}
                title={vault.storedItems.length < maxSlots ? 'Clique para guardar' : 'Depósito cheio'}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${RARITY_COLOR[item.rarity] || '#94a3b8'}`,
                  background: 'var(--surface-2)',
                  cursor: vault.storedItems.length < maxSlots ? 'pointer' : 'not-allowed',
                  opacity: vault.storedItems.length < maxSlots ? 1 : 0.5,
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: RARITY_COLOR[item.rarity] || '#94a3b8' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
