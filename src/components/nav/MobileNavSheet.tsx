import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AudioManager } from '../../core/AudioManager';
import { TabBadgeDot } from '../TabBadgeDot';
import type { NavCategory, CategoryId } from './navConfig';

interface Props {
  open: boolean;
  onClose: () => void;
  categories: NavCategory[];
  activeCategory: CategoryId | null;
  onSelectCategory: (id: CategoryId) => void;
  onSelectCombat: () => void;
  categoryHasNotification: (id: CategoryId) => boolean;
}

// Precisa bater com a duração de `nav-sheet-slide-down`/`nav-sheet-fade-out` no index.css —
// o componente só desmonta depois que a animação reversa termina, para não "sumir" abruptamente.
const CLOSE_ANIMATION_MS = 200;

/**
 * Menu de categorias no mobile — folha que sobe de baixo, aberta pelo botão de menu no
 * `header-panel` (rodapé fixo do jogo). Substitui a antiga barra `MobileBottomNav`, que
 * ficava sempre visível disputando espaço com o botão Sair/Voltar do mesmo rodapé.
 * Renderizada via portal para não herdar overflow/stacking do `game-ui-root`.
 */
export const MobileNavSheet: React.FC<Props> = ({
  open,
  onClose,
  categories,
  activeCategory,
  onSelectCategory,
  onSelectCombat,
  categoryHasNotification,
}) => {
  const [shouldRender, setShouldRender] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setClosing(false);
      return;
    }
    if (shouldRender) {
      setClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setClosing(false);
      }, CLOSE_ANIMATION_MS);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!shouldRender) return null;

  const select = (action: () => void) => {
    AudioManager.getInstance().playClick();
    action();
    onClose();
  };

  return createPortal(
    <>
      <div className={`nav-sheet-scrim ${closing ? 'closing' : ''}`} onClick={onClose} />
      <div className={`nav-sheet panel ${closing ? 'closing' : ''}`}>
        <div className="nav-sheet-grid">
          <button
            onClick={() => select(onSelectCombat)}
            className={`nav-sheet-item ${activeCategory === null ? 'active' : ''}`}
          >
            <span className="nav-sheet-icon">⚔</span>
            <span className="nav-sheet-label">Combate</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => select(() => onSelectCategory(cat.id))}
              className={`nav-sheet-item ${activeCategory === cat.id ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              <span className="nav-sheet-icon">{cat.icon}</span>
              <span className="nav-sheet-label">{cat.label}</span>
              {categoryHasNotification(cat.id) && <TabBadgeDot />}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
};
