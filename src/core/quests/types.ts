import type { BaseStats } from '../types';

export type QuestCategory = 'main' | 'hunt' | 'craft' | 'npc';

export type ObjectiveType =
  | 'kill'
  | 'kill_elite'
  | 'boss_time'
  | 'stage'
  | 'level'
  | 'craft'
  | 'runeword'
  | 'ascend'
  | 'transcend'
  | 'abyss_echo'
  | 'citadel_build';

export interface QuestObjective {
  id: string;
  type: ObjectiveType;
  description: string;
  targetId?: string;
  requiredAmount: number;
  currentAmount: number;
}

export interface QuestReward {
  gold?: number;
  forgeFragments?: number;
  studyInsignias?: number;
  abyssPearls?: number;
  transcendenceEssence?: number;
  prestigePoints?: number;
  statBonus?: Partial<BaseStats>;
  titleId?: string;
  storyItemId?: string;
}

export interface QuestDef {
  id: string;
  category: QuestCategory;
  act?: 1 | 2 | 3 | 4 | 5 | 6;
  chapterNumber?: number;
  title: string;
  description: string;
  npcId?: string;
  npcName?: string;
  isProcedural?: boolean;
  objectives: QuestObjective[];
  rewards: QuestReward;
  isCompleted: boolean;
  isClaimed: boolean;
  unlockedAtStage?: number;
  unlockHint?: string;
  completionLore?: string;
}

export interface NpcDialogOption {
  label: string;
  action: 'close' | 'accept_quest' | 'claim_reward' | 'trigger_next';
  nextText?: string;
  questId?: string;
}

export interface NpcDialogState {
  npcId: string;
  npcName: string;
  factionColor: string;
  text: string;
  options?: NpcDialogOption[];
  questId?: string;
}

export interface StoryItemDef {
  id: string;
  name: string;
  icon: string;
  lore: string;
  statBonus: Partial<BaseStats>;
  passiveDescription: string;
}
