export type TopLevelTabId =
  | 'combat'
  | 'quests'
  | 'tower'
  | 'attributes'
  | 'skills'
  | 'equipment'
  | 'forge'
  | 'prestige'
  | 'transcendence'
  | 'shop'
  | 'bestiary'
  | 'codex'
  | 'guide'
  | 'saves'
  | 'options'
  | 'citadel'
  | 'abyss';

export type CategoryId = 'personagem' | 'atividades' | 'evolucao' | 'codex' | 'config';

export interface NavCategory {
  id: CategoryId;
  label: string;
  icon: string;
  items: TopLevelTabId[];
}

/**
 * Árvore de navegação: agrupa as 16 abas não-Combate em 5 categorias lógicas.
 * Combate não entra aqui — é um atalho avulso sempre visível (sidebar/bottom-nav),
 * fora do sistema de categorias, para garantir retorno em 1 clique.
 *
 * Ícones/labels/estado de bloqueio de cada aba continuam resolvidos em GameUI.tsx
 * a partir de `character` (ver array `tabs`); este módulo só define o agrupamento.
 */
export const NAV_CATEGORIES: NavCategory[] = [
  { id: 'personagem', label: 'Personagem', icon: '🧝', items: ['equipment', 'attributes', 'skills', 'quests'] },
  { id: 'atividades', label: 'Atividades', icon: '🗺️', items: ['tower', 'abyss', 'citadel'] },
  { id: 'evolucao', label: 'Evolução', icon: '🌟', items: ['forge', 'prestige', 'transcendence', 'shop'] },
  { id: 'codex', label: 'Codex', icon: '📖', items: ['guide', 'bestiary', 'codex'] },
  { id: 'config', label: 'Opções', icon: '⚙️', items: ['saves', 'options'] },
];

/** Categoria padrão exibida na primeira vez que cada categoria é aberta. */
export const CATEGORY_DEFAULT_TAB: Record<CategoryId, TopLevelTabId> = {
  personagem: 'equipment',
  atividades: 'tower',
  evolucao: 'forge',
  codex: 'guide',
  config: 'saves',
};

export function findCategoryForTab(tabId: TopLevelTabId): CategoryId | null {
  if (tabId === 'combat') return null;
  const category = NAV_CATEGORIES.find((cat) => cat.items.includes(tabId));
  return category ? category.id : null;
}
