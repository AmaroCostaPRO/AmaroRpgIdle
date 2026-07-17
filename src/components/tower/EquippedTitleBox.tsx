import React from 'react';

interface EquippedTitleBoxProps {
  selectedTitle: string;
  onRemove: () => void;
  accentColor: string;
  borderColor: string;
}

// v8.0.0 "O Espelho Faminto": componente puro compartilhado entre a Torre Normal e a Ramificação
// de Maldições — o pai decide qual título/branch exibir via props, evitando duas cópias divergentes.
export const EquippedTitleBox: React.FC<EquippedTitleBoxProps> = ({ selectedTitle, onRemove, accentColor, borderColor }) => (
  <div style={{
    background: 'var(--surface-1)',
    border: `1px solid ${borderColor}`,
    borderRadius: 'var(--radius-lg)',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem'
  }}>
    <div>
      <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Título Honorífico Equipado</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedTitle ? accentColor : '#64748b', marginTop: '0.15rem' }}>
        {selectedTitle ? `👑 ${selectedTitle}` : 'Nenhum Título Equipado'}
      </div>
    </div>
    {selectedTitle && (
      <button
        onClick={onRemove}
        className="btn btn-xs btn-ghost"
        style={{ fontSize: '0.6rem', color: '#ef4444' }}
      >
        Remover
      </button>
    )}
  </div>
);
