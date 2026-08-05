import React from 'react';
import { createPortal } from 'react-dom';
import type { EquipmentItem } from '../../core/types';
import { getActiveRelicDefinition } from '../../core/CombatFSM';
import {
  getRarityColor, getSetVisual, getSetPrefixAndColor, getSocketDots, RuneChip,
  slotLabels, statLabels, formatStatValue,
} from './itemVisuals';

interface ItemDetailModalProps {
  item: EquipmentItem;
  originLabel?: string;
  onClose: () => void;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  errorMessage?: string | null;
}

// Modal de detalhes de item somente-leitura (raridade, atributos, conjunto, soquetes/runas) —
// extraído do modal já usado pelo Depósito da Cidadela (VaultPanel.tsx) para ser reaproveitado
// em qualquer picker de item que precise mostrar as informações completas antes de confirmar uma
// seleção (Oficina da Forja, Câmara de Gravação), em vez de escolher às cegas só pelo ícone.
//
// Renderizado via `createPortal` para `#ui-modal-root` (o wrapper `position: relative` que embrulha
// `.ui-scrollable-content` em GameUI.tsx, do qual o modal de item do Inventário — abas Equipamentos/
// Consumíveis — já era filho direto): os painéis da Cidadela usam a classe `.panel`, que tem
// `backdrop-filter` (vidro fosco) — isso cria um novo "containing block" para filhos `position:
// fixed`, então sem o portal o modal ficava preso relativo ao painel rolável em vez de fixo, e se
// movia junto com o scroll do conteúdo. Portar para `#ui-modal-root` (em vez de `document.body`)
// também restringe o modal à área de conteúdo da aba, no lugar de cobrir a tela inteira — mesmo
// comportamento do modal de Equipamentos/Consumíveis.
export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item, originLabel, onClose, confirmLabel, onConfirm, confirmDisabled, errorMessage,
}) => {
  const { isAncestral, isPandemonium, isCelestial, isPandemoniumMystic, isPandemoniumBase, border: itemBorder, shadow: itemShadow } = getSetVisual(item);
  let nameColor = getRarityColor(item.rarity);
  if (isAncestral) {
    nameColor = '#c084fc';
  } else if (isPandemonium) {
    nameColor = isPandemoniumBase ? '#10b981' : (isPandemoniumMystic ? '#8b5cf6' : nameColor);
  } else if (isCelestial) {
    nameColor = '#38bdf8';
  }

  const portalTarget = document.getElementById('ui-modal-root') || document.body;

  return createPortal(
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: '1rem',
      }}
      onClick={onClose}
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
          onClick={onClose}
        >
          ✕
        </button>

        <div>
          <span className="font-mono" style={{ fontSize: '0.5rem', color: nameColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {item.rarity} • {slotLabels[item.slot] || item.slot}{originLabel ? ` • ${originLabel}` : ''}
          </span>
          <h4 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0.1rem 0 0.5rem 0', color: nameColor }}>
            {item.name} {item.mysticLevel ? `+${item.mysticLevel}` : ''}
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
                    {formatStatValue(stat, val as number)} {statLabels[stat] || stat}
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

        {(item.sockets || 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6rem', color: '#c084fc', fontWeight: 600 }}>Soquetes: {getSocketDots(item)}</span>
            {(item.socketedRunes || []).filter(Boolean).map((runeId, i) => (
              <RuneChip key={i} runeId={runeId!} size={22} />
            ))}
          </div>
        )}

        {errorMessage && (
          <div style={{ fontSize: '0.65rem', color: '#f87171', background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
            {errorMessage}
          </div>
        )}

        {onConfirm ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onClose} className="btn btn-sm" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="btn btn-sm btn-gold"
              style={{ flex: 2, opacity: confirmDisabled ? 0.5 : 1 }}
            >
              {confirmLabel || 'Confirmar seleção'}
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="btn btn-sm btn-gold" style={{ width: '100%' }}>
            Fechar
          </button>
        )}
      </div>
    </div>,
    portalTarget
  );
};
