import { CitadelSubTab } from './CitadelTabsBar';

/**
 * Caminho da spritesheet de evolução (1024x1024, grid 2x2 — ver EvolutionSprite.tsx)
 * de cada construção da Cidadela. Compartilhado entre <CitadelSpriteStage>
 * (pátio clicável) e <CitadelOverview> (lista de status), para que os dois
 * lugares peguem a arte definitiva automaticamente assim que os arquivos
 * forem colocados em `public/assets/` com esses nomes — nenhuma mudança de
 * código é necessária nos dois componentes.
 */
export const BUILDING_SPRITE_SRC: Record<CitadelSubTab, string> = {
  overview: '/assets/citadel_command_center.png',
  vault: '/assets/citadel_vault.png',
  expeditions: '/assets/citadel_expeditions.png',
  academy: '/assets/citadel_academy.png',
  watchTower: '/assets/citadel_watch_tower.png',
  forgeWorkshop: '/assets/citadel_forge_workshop.png',
  cosmicSiphon: '/assets/citadel_cosmic_siphon.png',
  synchronyAltar: '/assets/citadel_synchrony_altar.png',
  relicLab: '/assets/citadel_relic_lab.png',
  alchemyLab: '/assets/citadel_alchemy_lab.png',
};

/** Nível máximo de cada construção — usado para calcular o tier visual (0-3) em EvolutionSprite. */
export const BUILDING_MAX_LEVEL: Record<CitadelSubTab, number> = {
  overview: 5,
  vault: 5,
  expeditions: 5,
  academy: 5,
  watchTower: 5,
  forgeWorkshop: 5,
  cosmicSiphon: 5,
  synchronyAltar: 5,
  relicLab: 5,
  alchemyLab: 5,
};
