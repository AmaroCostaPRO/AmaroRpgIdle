import { Character } from '../types';
import { QuestDef } from './types';

// Biomas e seus monstros representativos para geração procedural de Caçadas
const BIOME_MONSTERS: { biomeName: string; maxStage: number; enemyIds: string[]; enemyNames: string[] }[] = [
  {
    biomeName: 'Bosque & Floresta Antiga',
    maxStage: 5,
    enemyIds: ['goblin', 'shadow_wolf', 'orc_warrior'],
    enemyNames: ['Goblin Ladino', 'Lobo das Sombras', 'Guerreiro Orc'],
  },
  {
    biomeName: 'Deserto de Ouro',
    maxStage: 10,
    enemyIds: ['sand_serpent', 'desert_bandit', 'desert_scorpion'],
    enemyNames: ['Serpente da Areia', 'Bandido Nômade', 'Escorpião de Fogo'],
  },
  {
    biomeName: 'Picos Glaciais',
    maxStage: 15,
    enemyIds: ['frost_wolf', 'ice_elemental', 'cave_yeti'],
    enemyNames: ['Lobo Invernal', 'Elemental de Gelo', 'Yeti das Cavernas'],
  },
  {
    biomeName: 'Cemitério & Ruínas',
    maxStage: 20,
    enemyIds: ['skeleton_warrior', 'decaying_zombie', 'tormented_ghost', 'demon_imp'],
    enemyNames: ['Esqueleto Guerreiro', 'Zumbi Putrefato', 'Fantasma Atormentado', 'Diabrete Menor'],
  },
  {
    biomeName: 'Purgatório & Pandemônio',
    maxStage: 999,
    enemyIds: ['purgatory_specter', 'lost_soul', 'crystal_shatterer'],
    enemyNames: ['Espectro do Purgatório', 'Alma Perdida', 'Quebrador de Cristais'],
  },
];

// Gerador Procedural de Contratos de Caçada (Bounties)
function generateHuntQuest(stage: number, level: number): QuestDef {
  const suitableBiome = BIOME_MONSTERS.find((b) => stage <= b.maxStage) || BIOME_MONSTERS[BIOME_MONSTERS.length - 1];
  const monsterIndex = Math.floor(Math.random() * suitableBiome.enemyIds.length);
  const enemyId = suitableBiome.enemyIds[monsterIndex];
  const enemyName = suitableBiome.enemyNames[monsterIndex];

  // Escalonamento de quantidade e recompensas
  const requiredAmount = Math.min(100, Math.max(15, Math.floor(15 + stage * 2)));
  const goldReward = Math.floor((200 + stage * 100) * (1 + level * 0.05));
  const forgeReward = Math.floor(50 + stage * 15);

  return {
    id: `hunt_proc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    category: 'hunt',
    title: `Caçada: ${enemyName}`,
    description: `As patrulhas da Cidadela relatam um surto de ${enemyName} em ${suitableBiome.biomeName}. Elimine o grupo para manter a região segura.`,
    npcId: 'forge_master_vulkan',
    npcName: 'Vulkan, Mestre da Forja',
    isProcedural: true,
    objectives: [
      {
        id: 'obj_hunt_1',
        type: 'kill',
        targetId: enemyId,
        description: `Elimine ${requiredAmount}x ${enemyName}`,
        requiredAmount,
        currentAmount: 0,
      },
    ],
    rewards: {
      gold: goldReward,
      forgeFragments: forgeReward,
    },
    isCompleted: false,
    isClaimed: false,
  };
}

// Gerador Procedural de Missões de Forja, Alquimia e Runas
function generateCraftQuest(stage: number): QuestDef {
  const craftTypes = ['forge_equip', 'brew_potion', 'socket_rune'];
  const chosenType = craftTypes[Math.floor(Math.random() * craftTypes.length)];

  if (chosenType === 'forge_equip') {
    return {
      id: `craft_proc_${Date.now()}_1`,
      category: 'craft',
      title: 'Mestria do Metal',
      description: 'Vulkan precisa de equipamentos refinados para reforçar os arsenais da Cidadela.',
      npcId: 'forge_master_vulkan',
      npcName: 'Vulkan, Mestre da Forja',
      isProcedural: true,
      objectives: [
        {
          id: 'obj_craft_1',
          type: 'craft',
          description: 'Refine ou forje 1 equipamento de raridade Rara ou superior',
          requiredAmount: 1,
          currentAmount: 0,
        },
      ],
      rewards: {
        gold: Math.floor(1000 + stage * 200),
        forgeFragments: Math.floor(100 + stage * 30),
      },
      isCompleted: false,
      isClaimed: false,
    };
  } else {
    return {
      id: `craft_proc_${Date.now()}_2`,
      category: 'craft',
      title: 'Ressonância do Laboratório',
      description: 'Valéria solicita que você prepare consumíveis ou soquetes de runas para fortalecer o herói.',
      npcId: 'archivist_valeria',
      npcName: 'Valéria, a Arquivista Astral',
      isProcedural: true,
      objectives: [
        {
          id: 'obj_craft_2',
          type: 'runeword',
          description: 'Engaste uma runa ou ative uma Palavra Rúnica na Câmara',
          requiredAmount: 1,
          currentAmount: 0,
        },
      ],
      rewards: {
        gold: Math.floor(1500 + stage * 250),
        studyInsignias: 20 + stage * 2,
      },
      isCompleted: false,
      isClaimed: false,
    };
  }
}

// Gerador Procedural de Requisições Táticas de NPCs
function generateNpcRequestQuest(character: Character): QuestDef {
  const stage = character.currentStage || 1;
  const level = character.level || 1;

  const targetLevel = level + 5;
  const goldReward = Math.floor(2000 + stage * 300);
  const insigniasReward = Math.floor(30 + stage * 5);

  return {
    id: `npc_proc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    category: 'npc',
    title: 'Requisição de Valéria: Maestria de Batalha',
    description: `Valéria requer que seu herói acumule mais experiência em combate para catalogar novas técnicas no Codex.`,
    npcId: 'archivist_valeria',
    npcName: 'Valéria, a Arquivista Astral',
    isProcedural: true,
    objectives: [
      {
        id: 'obj_npc_lvl',
        type: 'level',
        description: `Alcance o Nível ${targetLevel} com seu personagem`,
        requiredAmount: targetLevel,
        currentAmount: level,
      },
    ],
    rewards: {
      gold: goldReward,
      studyInsignias: insigniasReward,
    },
    isCompleted: false,
    isClaimed: false,
  };
}

/**
 * Função principal do motor procedural: gera o pool dinâmico de missões secundárias da run/dia.
 */
export function generateProceduralQuests(character: Character): QuestDef[] {
  const stage = character.currentStage || 1;
  const level = character.level || 1;

  return [
    generateHuntQuest(stage, level),
    generateCraftQuest(stage),
    generateNpcRequestQuest(character),
  ];
}
