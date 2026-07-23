import React, { useState } from 'react';
import { RuneId, RUNE_CATALOG, isPrimordialRune } from '../../core/runeFormulas';
import { RuneChip, describeRuneEffect, getRuneVisual } from './itemVisuals';

interface RuneInventoryPanelProps {
  runeInventory: Partial<Record<RuneId, number>> | undefined;
}

// Mostruário de runas do Inventário — somente leitura (sem vender/usar/equipar).
// Reaproveita RuneChip/describeRuneEffect, os mesmos usados na Câmara de Gravação, para
// nunca divergir visualmente do resto do jogo.
export const RuneInventoryPanel: React.FC<RuneInventoryPanelProps> = ({ runeInventory }) => {
  const [selectedRuneId, setSelectedRuneId] = useState<RuneId | null>(null);
  const runeEntries = Object.entries(runeInventory || {}).filter(([, qty]) => (qty || 0) > 0) as [RuneId, number][];

  return (
    <>
      {runeEntries.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.65rem', fontStyle: 'italic' }}>
          Nenhuma runa no cofre.
        </div>
      ) : (
        runeEntries.map(([runeId, qty]) => (
          <button
            key={runeId}
            onClick={() => setSelectedRuneId(runeId)}
            title={RUNE_CATALOG[runeId]?.name}
            style={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <RuneChip runeId={runeId} qty={qty} size={40} />
          </button>
        ))
      )}

      {selectedRuneId && (() => {
        const def = RUNE_CATALOG[selectedRuneId];
        const visual = getRuneVisual(selectedRuneId);
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={() => setSelectedRuneId(null)}
          >
            <div
              className="panel"
              style={{ padding: '1.25rem', maxWidth: '320px', width: '90%', color: '#fff' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <RuneChip runeId={selectedRuneId} size={48} />
                <div>
                  <p style={{ fontWeight: 700 }}>{def?.name}</p>
                  <p style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{isPrimordialRune(selectedRuneId) ? 'Primordial' : visual.tierLabel}</p>
                </div>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.6rem' }}>
                {describeRuneEffect(selectedRuneId)}
              </p>
              {def?.primordialSource && (
                <p style={{ fontSize: '0.65rem', color: '#c084fc', marginTop: '0.4rem' }}>Fonte: {def.primordialSource}</p>
              )}
              <button className="btn btn-xs" style={{ marginTop: '0.8rem', width: '100%' }} onClick={() => setSelectedRuneId(null)}>
                Fechar
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
};
