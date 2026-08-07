import { create } from 'zustand';
import { useGameStore } from './useGameStore';
import { AudioManager } from '../core/AudioManager';
import { EquipmentItem } from '../core/types';

export interface TutorialStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  instruction: string;
  targetId: string; // Ex: 'btn-tab-character', 'btn-add-stat-str', etc.
  requiredTab?: string; // Aba que precisa estar aberta (ex: 'combat', 'inventory', 'shop', 'forge', 'skills')
  subTab?: string;
  actionTrigger: string; // Ação que valida o passo (ex: 'ALLOCATED_STAT', 'EQUIPPED_SKILL', 'EQUIPPED_ITEM', 'SOLD_ITEM', 'BOUGHT_CHEST', 'FUSED_ITEMS')
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'step_welcome',
    stepNumber: 0,
    totalSteps: 6,
    title: 'Boas-Vindas à Sua Jornada',
    instruction: 'Bem-vindo, Herói! Sou a Alma do Mundo. Vamos aprender as mecânicas vitais para fortalecer seu personagem e enfrentar os males do reino.',
    targetId: 'tutorial-welcome-start-btn',
    actionTrigger: 'START_TUTORIAL',
  },
  {
    id: 'step_stats',
    stepNumber: 1,
    totalSteps: 6,
    title: '1. Atribuição de Atributos',
    instruction: 'Abra a tela do Herói e distribua seus Pontos de Atributo (ex: Força ou Agilidade) para aumentar seu poder de ataque!',
    targetId: 'btn-add-stat-str',
    requiredTab: 'character',
    actionTrigger: 'ALLOCATED_STAT',
  },
  {
    id: 'step_skills',
    stepNumber: 2,
    totalSteps: 6,
    title: '2. Habilidades de Classe',
    instruction: 'Acesse a aba de Habilidades e habilite ou equipe a sua primeira habilidade no slot de ação!',
    targetId: 'btn-equip-first-skill',
    requiredTab: 'skills',
    actionTrigger: 'EQUIPPED_SKILL',
  },
  {
    id: 'step_equip_item',
    stepNumber: 3,
    totalSteps: 6,
    title: '3. Equipar Equipamento',
    instruction: 'Abra o seu Inventário e clique em Equipar no equipamento para vestir suas armas e armaduras.',
    targetId: 'btn-equip-item-0',
    requiredTab: 'inventory',
    actionTrigger: 'EQUIPPED_ITEM',
  },
  {
    id: 'step_sell_item',
    stepNumber: 4,
    totalSteps: 6,
    title: '4. Vender Equipamento',
    instruction: 'No seu Inventário, selecione o equipamento sobressalente e clique em Vender para convertê-lo em Ouro!',
    targetId: 'btn-sell-item-1',
    requiredTab: 'inventory',
    actionTrigger: 'SOLD_ITEM',
  },
  {
    id: 'step_buy_chest',
    stepNumber: 5,
    totalSteps: 6,
    title: '5. Loja & Baús de Tesouro',
    instruction: 'Vá até a Loja e compre um Baú de Equipamento com o Ouro recebido para obter novos itens de combate!',
    targetId: 'btn-buy-starter-chest',
    requiredTab: 'shop',
    actionTrigger: 'BOUGHT_CHEST',
  },
  {
    id: 'step_fusion',
    stepNumber: 6,
    totalSteps: 6,
    title: '6. Forja & Fusão de Itens',
    instruction: 'Acesse a Forja (Aba de Fusão), selecione dois equipamentos equivalentes e realize uma Fusão para subir a raridade!',
    targetId: 'btn-confirm-fusion',
    requiredTab: 'forge',
    subTab: 'fusion',
    actionTrigger: 'FUSED_ITEMS',
  },
];

interface TutorialStoreState {
  isTutorialActive: boolean;
  currentStepIndex: number;
  completed: boolean;

  startTutorial: () => void;
  advanceStep: () => void;
  completeAction: (action: string) => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
}

const TUTORIAL_STORAGE_KEY = 'medieval_idle_tutorial_completed';

export const useTutorialStore = create<TutorialStoreState>((set, get) => ({
  isTutorialActive: false,
  currentStepIndex: 0,
  completed: localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true',

  startTutorial: () => {
    set({ isTutorialActive: true, currentStepIndex: 0, completed: false });
    // Injeta os recursos do primeiro passo (Atributos)
    const store = useGameStore.getState();
    if (store.character.attributePoints <= 0) {
      useGameStore.setState((s) => ({
        character: {
          ...s.character,
          attributePoints: (s.character.attributePoints || 0) + 5,
        },
      }));
    }
  },

  advanceStep: () => {
    const { currentStepIndex } = get();
    const nextIdx = currentStepIndex + 1;

    if (nextIdx >= TUTORIAL_STEPS.length) {
      // Concluiu o tutorial
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      set({ isTutorialActive: false, completed: true });
      AudioManager.getInstance().playQuestComplete();

      // Recompensa final (+100 Gemas, +5000 Ouro)
      useGameStore.setState((s) => ({
        character: {
          ...s.character,
          gold: s.character.gold + 5000,
          pearls: (s.character.pearls || 0) + 10,
        },
      }));
      return;
    }

    set({ currentStepIndex: nextIdx });
    AudioManager.getInstance().playDialogAdvance();

    // Injeção de recursos para o próximo passo se necessário
    const nextStep = TUTORIAL_STEPS[nextIdx];
    const game = useGameStore.getState();
    const currentClass = game.character.classId || 'warrior';

    if (nextStep.id === 'step_equip_item' || nextStep.id === 'step_sell_item') {
      // Injeta 2 itens no inventário caso o jogador tenha menos que 2
      if (game.character.inventory.length < 2) {
        const dummyItem1: EquipmentItem = {
          id: `tut_item_${Date.now()}_1`,
          name: 'Espada de Treinamento',
          slot: 'weapon',
          classId: currentClass,
          rarity: 'common',
          spriteName: 'item_sword',
          stage: 1,
          stats: { strength: 3 },
        };
        const dummyItem2: EquipmentItem = {
          id: `tut_item_${Date.now()}_2`,
          name: 'Escudo de Madeira Usado',
          slot: 'chest',
          classId: currentClass,
          rarity: 'common',
          spriteName: 'item_shield',
          stage: 1,
          stats: { constitution: 3 },
        };
        useGameStore.setState((s) => ({
          character: {
            ...s.character,
            inventory: [...s.character.inventory, dummyItem1, dummyItem2],
          },
        }));
      }
    } else if (nextStep.id === 'step_buy_chest') {
      // Injeta Ouro para comprar o baú se o jogador tiver menos de 1000
      if (game.character.gold < 1000) {
        useGameStore.setState((s) => ({
          character: {
            ...s.character,
            gold: s.character.gold + 1000,
          },
        }));
      }
    } else if (nextStep.id === 'step_fusion') {
      // Injeta 2 itens idênticos para fusão
      const fuseItemA: EquipmentItem = {
        id: `tut_fuse_${Date.now()}_A`,
        name: 'Daga de Aprendiz',
        slot: 'weapon',
        classId: currentClass,
        rarity: 'common',
        spriteName: 'item_dagger',
        stage: 1,
        stats: { dexterity: 4 },
      };
      const fuseItemB: EquipmentItem = {
        id: `tut_fuse_${Date.now()}_B`,
        name: 'Daga de Aprendiz',
        slot: 'weapon',
        classId: currentClass,
        rarity: 'common',
        spriteName: 'item_dagger',
        stage: 1,
        stats: { dexterity: 4 },
      };
      useGameStore.setState((s) => ({
        character: {
          ...s.character,
          inventory: [...s.character.inventory, fuseItemA, fuseItemB],
        },
      }));
    }
  },

  completeAction: (action: string) => {
    const { isTutorialActive, currentStepIndex, advanceStep } = get();
    if (!isTutorialActive) return;

    const step = TUTORIAL_STEPS[currentStepIndex];
    if (step && step.actionTrigger === action) {
      advanceStep();
    }
  },

  skipTutorial: () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    set({ isTutorialActive: false, completed: true });
  },

  resetTutorial: () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    set({ isTutorialActive: false, currentStepIndex: 0, completed: false });
  },
}));
