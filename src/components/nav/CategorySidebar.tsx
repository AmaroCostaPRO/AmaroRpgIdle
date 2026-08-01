import React from 'react';
import { AudioManager } from '../../core/AudioManager';
import { TabBadgeDot } from '../TabBadgeDot';
import type { NavCategory, CategoryId } from './navConfig';

interface Props {
  categories: NavCategory[];
  activeCategory: CategoryId | null;
  onSelectCategory: (id: CategoryId) => void;
  onSelectCombat: () => void;
  categoryHasNotification: (id: CategoryId) => boolean;
}

/**
 * Rail lateral fixo (desktop, >840px) com Combate fixado no topo (atalho de 1 clique,
 * fora do sistema de categorias) seguido pelas categorias de navegação. Selecionar uma
 * categoria não abre um painel próprio — apenas troca qual conjunto de sub-abas aparece
 * no `SubTabBar` do cabeçalho de conteúdo (ver GameUI.tsx).
 */
export const CategorySidebar: React.FC<Props> = ({
  categories,
  activeCategory,
  onSelectCategory,
  onSelectCombat,
  categoryHasNotification,
}) => {
  const combatActive = activeCategory === null;

  return (
    <div className="nav-sidebar panel">
      <button
        onClick={() => {
          AudioManager.getInstance().playClick();
          onSelectCombat();
        }}
        className={`nav-sidebar-item ${combatActive ? 'active' : ''}`}
        title="Combate"
      >
        <span className="nav-sidebar-icon">⚔</span>
        {combatActive && <span className="nav-sidebar-label">Combate</span>}
      </button>

      <div className="nav-sidebar-divider" />

      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => {
              AudioManager.getInstance().playClick();
              onSelectCategory(cat.id);
            }}
            className={`nav-sidebar-item ${isActive ? 'active' : ''}`}
            title={cat.label}
            style={{ position: 'relative' }}
          >
            <span className="nav-sidebar-icon">{cat.icon}</span>
            {isActive && <span className="nav-sidebar-label">{cat.label}</span>}
            {categoryHasNotification(cat.id) && <TabBadgeDot />}
          </button>
        );
      })}
    </div>
  );
};
