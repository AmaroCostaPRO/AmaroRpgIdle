// Agrupamento do Bestiário por bioma/zona — fonte ÚNICA de verdade, consumida tanto pelo cálculo
// do bônus de dano (StatEngine.calculateBestiaryDamageMultiplier) quanto pela UI (GameUI.tsx
// BestiaryPanel). Antes desta extração cada um tinha sua PRÓPRIA lista hardcoded (StatEngine com
// os 7 biomas originais; a UI com um slice posicional de ENEMY_TYPES limitado a 9 grupos) — os dois
// desincronizaram assim que o Abismo (v10.0.0-10.4.0) foi adicionado ao fim de ENEMY_TYPES: o
// bônus de dano nunca contava os abates de lá, e a UI só mostrava os 2 primeiros grupos novos
// (Litoral + Profundezas Z1) por causa do slice fixo. Agrupar por ID (não por posição no array)
// elimina as duas classes de bug de uma vez.

export interface BestiaryPhaseGroup {
  name: string;
  enemyIds: string[];
  // Multiplicador do bônus de dano deste grupo (2 = tratamento "Purgatório", 1 = padrão). Novos
  // grupos do Abismo ficam em 1 — a Fossa/Trono já têm economia própria (só Pérolas), então o
  // bônus de dano da campanha aqui é só um perk permanente extra, não recalibrado para "endgame".
  bonusMultiplier?: number;
}

export const BESTIARY_PHASE_GROUPS: BestiaryPhaseGroup[] = [
  { name: 'Bosque Sussurrante', enemyIds: ['whisper_sprite', 'thorned_treant', 'fae_rabbit', 'boss_whispering_warden'] },
  { name: 'Floresta Antiga', enemyIds: ['goblin', 'shadow_wolf', 'orc_warrior', 'boss_forest_golem'] },
  { name: 'Deserto de Ouro', enemyIds: ['sand_serpent', 'desert_bandit', 'desert_scorpion', 'boss_sand_scorpion'] },
  { name: 'Picos Glaciais', enemyIds: ['frost_wolf', 'ice_elemental', 'cave_yeti', 'boss_frost_dragon'] },
  { name: 'Cemitério Maldito', enemyIds: ['skeleton_warrior', 'decaying_zombie', 'tormented_ghost', 'boss_necromancer'] },
  { name: 'Ruínas Sombrias', enemyIds: ['stone_gargoyle', 'living_armor', 'demon_imp', 'boss_archdemon'] },
  { name: 'Purgatório', enemyIds: ['purgatory_specter', 'lost_soul', 'crystal_shatterer', 'boss_crystal_guardian'], bonusMultiplier: 2 },
  // v10.0.0-v10.4.0 "A Cidadela Submersa": Litoral + as 4 zonas das Profundezas + o Trono.
  { name: 'Litoral Naufragado', enemyIds: ['wreck_crab', 'drift_jelly', 'slime_moray', 'drowned_echo'] },
  { name: 'Profundezas — Recife Partido', enemyIds: ['grudge_puffer', 'reef_shark', 'hungry_anemone', 'boss_reef_arachnid'] },
  { name: 'Profundezas — Bosque de Algas Negras', enemyIds: ['kelp_strangler', 'mirror_octopus', 'gloom_angler', 'boss_kelp_thing'] },
  { name: 'Profundezas — Ruínas da Cidadela', enemyIds: ['guardian_echo', 'salt_mourner', 'barnacle_knight', 'boss_drowned_castellan'] },
  { name: 'Profundezas — Fossa do Caco', enemyIds: ['trench_serpent', 'false_light', 'leviathan_spawn', 'dark_breather'] },
  { name: 'O Trono Afundado', enemyIds: ['boss_leviathan'] },
];

// 200 abates para comuns, 50 para chefes — exceção histórica: o Guardião de Cristal (Purgatório)
// pede só 20, mantida por compatibilidade com jogadores que já o desbloquearam nesse patamar.
export const getBestiaryRequiredKills = (enemyId: string): number =>
  enemyId === 'boss_crystal_guardian' ? 20 : (enemyId.startsWith('boss_') ? 50 : 200);
