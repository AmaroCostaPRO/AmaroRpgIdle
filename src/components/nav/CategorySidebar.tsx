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
 *
 * `.nav-sidebar-anchor` fica no fluxo flex normal, reservando a largura recolhida (então
 * a coluna de conteúdo ao lado nunca muda de tamanho). A `.nav-sidebar` de verdade é
 * `position: absolute` ancorada em `left:0` desse anchor — ao expandir no hover, ela
 * cresce só pra direita, por cima do espaço vazio da página, sem empurrar o conteúdo.
 */
export const CategorySidebar: React.FC<Props> = ({
  categories,
  activeCategory,
  onSelectCategory,
  onSelectCombat,
  categoryHasNotification,
}) => {
  const combatActive = activeCategory === null;

  // "Opções" fica separada, ancorada embaixo do componente (config/preferências não é uma
  // categoria de conteúdo do jogo como as demais — faz sentido ficar à parte, tipo rodapé).
  const mainCategories = categories.filter((cat) => cat.id !== 'config');
  const configCategory = categories.find((cat) => cat.id === 'config');

  const renderItem = (
    id: string,
    icon: string,
    label: string,
    isActive: boolean,
    onClick: () => void,
    hasNotification?: boolean
  ) => (
    <button
      key={id}
      onClick={() => {
        AudioManager.getInstance().playClick();
        onClick();
      }}
      className={`nav-sidebar-item ${isActive ? 'active' : ''}`}
      title={label}
      style={{ position: 'relative' }}
    >
      <span className="nav-sidebar-icon-slot">
        <span className="nav-sidebar-icon">{icon}</span>
      </span>
      <span className="nav-sidebar-label">{label}</span>
      {hasNotification && <TabBadgeDot />}
    </button>
  );

  return (
    <div className="nav-sidebar-anchor">
      <div className="nav-sidebar panel">
        {renderItem('combat', '⚔', 'Combate', combatActive, onSelectCombat)}

        <div className="nav-sidebar-divider" />

        {mainCategories.map((cat) =>
          renderItem(cat.id, cat.icon, cat.label, activeCategory === cat.id, () => onSelectCategory(cat.id), categoryHasNotification(cat.id))
        )}

        {configCategory && (
          <>
            <div className="nav-sidebar-divider nav-sidebar-divider-push" />
            {renderItem(
              configCategory.id,
              configCategory.icon,
              configCategory.label,
              activeCategory === configCategory.id,
              () => onSelectCategory(configCategory.id),
              categoryHasNotification(configCategory.id)
            )}
          </>
        )}
      </div>
    </div>
  );
};
