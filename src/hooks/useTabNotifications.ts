import { useGameStore, PRESTIGE_UPGRADES_CATALOG } from '../store/useGameStore';
import { useQuestStore, hasClaimableQuest } from '../store/useQuestStore';
import { useTowerStore } from '../store/useTowerStore';
import { useRelicStore } from '../store/useRelicStore';
import { getTotalXpEarned, calculatePrestigePointsFromTotalXp } from '../core/XpEngine';
import { citadelHasAffordableUpgrade } from '../core/citadelFormulas';
import { sunkenCitadelHasAffordableUpgrade, coastalHasNotification } from '../core/sunkenCitadelFormulas';

export interface TabNotifications {
  attributes: boolean;
  skills: boolean;
  quests: boolean;
  prestige: boolean;
  transcendence: boolean;
  citadel: boolean;
  abyss: boolean;
}

// Bolinhas de "algo pra fazer" nas abas principais — pura leitura derivada de stores existentes,
// sem estado próprio. Cada condição espelha exatamente a mesma lógica já usada no painel da aba
// correspondente (PrestigeTreePanel/TranscendencePanel em GameUI.tsx, painéis de Cidadela/Abismo).
export const useTabNotifications = (): TabNotifications => {
  const character = useGameStore((state) => state.character);
  const mainQuests = useQuestStore((state) => state.mainQuests);
  const proceduralQuests = useQuestStore((state) => state.proceduralQuests);
  const isInTowerOrChallenge = useTowerStore((state) => state.towerActive) || !!character.activeDailyChallenge;
  const unstableSoulFragments = useRelicStore((state) => state.unstableSoulFragments);

  const totalXp = getTotalXpEarned(character);
  const prestigeEarnedOnReset = calculatePrestigePointsFromTotalXp(totalXp);
  const ascensionCount = character.ascensionCount || 0;
  const requiredPP = ascensionCount === 0 ? 1 : 3 + 2 * ascensionCount;
  const isProgressReqMet = ascensionCount === 0
    ? (character.highestStageReached >= 6)
    : (character.level >= 5);
  const prestige = isProgressReqMet && prestigeEarnedOnReset >= requiredPP && !isInTowerOrChallenge;

  const currentPP = character.prestigePoints || 0;
  const spentPP = Object.entries(character.prestigeUpgrades || {}).reduce((sum, [id, lvl]) => {
    const upgrade = PRESTIGE_UPGRADES_CATALOG[id];
    if (upgrade && lvl > 0) {
      for (let i = 1; i <= lvl; i++) sum += upgrade.costPerLevel * i;
    }
    return sum;
  }, 0);
  const totalPP = Math.max(character.lifetimePrestigePointsAccumulated || 0, currentPP + spentPP);
  const transcendenceEarnedOnReset = Math.floor(Math.pow(totalPP / 500, 0.75));
  const transcendence = !!character.pandemoniumUnlocked && character.highestStageReached >= 50 && transcendenceEarnedOnReset > 0 && !isInTowerOrChallenge;

  return {
    attributes: character.attributePoints > 0,
    skills: character.skillPoints > 0,
    quests: hasClaimableQuest(mainQuests, proceduralQuests),
    prestige,
    transcendence,
    citadel: citadelHasAffordableUpgrade(character, unstableSoulFragments),
    abyss: coastalHasNotification(character) || sunkenCitadelHasAffordableUpgrade(character),
  };
};
