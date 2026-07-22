import { create } from 'zustand';
import { bridge } from '../bridge/GameBridge';
import { GameEvent } from '../core/types';
import { useGameStore } from './useGameStore';
import { useTowerStore } from './useTowerStore';
import { hasEquippedRuneFlag, isPrimordialRune, type RuneId } from '../core/runeFormulas';
import {
  ECHO_RESCUE_CHANCE_PER_DEPTH, ECHO_RESCUE_MAX_PER_DIVE, getVocationPerkTotal,
  ABYSSAL_SET_DROP_CHANCE, rollAbyssalSetDrop,
} from '../core/sunkenCitadelFormulas';
import {
  SHALLOW_DIVE_MAX_DEPTH, AIR_POCKET_INTERVAL, GUARDIAN_PEARL_REWARD,
  getPearlsForDepth, DIVE_RUNE_DROP_CHANCE, PROFUNDEZAS_TITLE_MILESTONES,
  DIVE_SURFACE_KEEP_FRACTION, DIVE_DEATH_KEEP_FRACTION, DIVE_DROWNED_KEEP_FRACTION,
  AIR_POCKET_BREATH_RESTORE, AIR_POCKET_PEARL_BONUS, AirPocketChoice,
  getZoneForDepth, isFullDepthsUnlocked, getGuardianForDepth,
  getDiveKeyCost, CHECKPOINT_START_DEPTHS, rollRuneForZone, getCoralPerKill,
} from '../core/abyssFormulas';

/**
 * v10.0.0 "A Cidadela Submersa" — estado de RUNTIME dos Mergulhos Rasos (Zona 1, prof. 1–25).
 * Padrão exato do useTowerStore (startTowerAttempt/exitTower): a campanha é salva/pausada ao
 * iniciar, o CombatFSM ramifica em `diveActive`, e a restauração emite START_COMBAT campaign.
 *
 * Persistência: o runtime vive aqui; a cada profundidade concluída um SNAPSHOT vai para
 * `character.abyss` (via useGameStore.updateAbyssState). Um save fechado no meio de um mergulho
 * é resolvido no carregamento como "subiu à superfície" (banca 100% — mergeLoadedCharacter).
 *
 * O dreno de Fôlego NÃO vive aqui: roda no CombatFSM.update() com o deltaTime já multiplicado
 * pela velocidade do jogo (paridade de profundidade em 1x/2x/3x — QA obrigatório do Anexo §1.8),
 * escrevendo via `setBreath`.
 */

export interface DiveStoreState {
  diveActive: boolean;
  currentDepth: number;
  breath: number;               // 0–100
  drowning: boolean;            // Fôlego 0: dano recebido ×2, regen de HP zerada
  inCombat: boolean;            // controla o botão "Subir à Superfície" (só fora de combate)
  airPocketOpen: boolean;
  airPocketResolvedDepth: number; // última profundidade cujo Bolsão já foi resolvido
  bankedPearls: number;
  bankedCoral: number;
  bankedRunes: Partial<Record<RuneId, number>>;
  airPocketPearlBonus: number;  // +25% por escolha de Bolsão (acumula na descida)
  savedStageBeforeDive: number;
  savedEnemiesDefeatedBeforeDive: number;
  lastDiveSummary: string | null;
  echoesRescuedThisDive: number; // cap de 2 por descida (Anexo 2 §1.5)

  // v10.1.0: startDepth aceita os checkpoints liberados por Guardiões vencidos (26/51/81),
  // custando 2 Chaves de Mergulho em vez de 1 (ver getDiveKeyCost).
  startDive: (startDepth?: number) => void;
  setBreath: (breath: number) => void;
  setInCombat: (inCombat: boolean) => void;
  openAirPocket: () => void;
  resolveAirPocket: (choice: AirPocketChoice) => void;
  // Banca as recompensas da profundidade concluída (abate ou bolsão) e avança. Chamado pelo FSM.
  completeDepth: (opts?: { killedGuardian?: boolean; runeRoll?: boolean; guardianZone?: 1 | 2 | 3; bonusPearls?: number }) => void;
  surface: (reason: 'voluntary' | 'death' | 'drowned' | 'cleared') => void;
}

const snapshotToCharacter = (state: DiveStoreState) => {
  useGameStore.getState().updateAbyssState({
    unlocked: true,
    currentDepth: state.diveActive ? state.currentDepth : 0,
    breath: state.breath,
    bankedRewards: { pearls: state.bankedPearls, coral: state.bankedCoral, runes: { ...state.bankedRunes } },
    airPocketPearlBonus: state.airPocketPearlBonus,
  });
};

export const useDiveStore = create<DiveStoreState>((set, get) => ({
  diveActive: false,
  currentDepth: 0,
  breath: 100,
  drowning: false,
  inCombat: false,
  airPocketOpen: false,
  airPocketResolvedDepth: 0,
  bankedPearls: 0,
  bankedCoral: 0,
  bankedRunes: {},
  airPocketPearlBonus: 0,
  savedStageBeforeDive: 1,
  savedEnemiesDefeatedBeforeDive: 0,
  lastDiveSummary: null,
  echoesRescuedThisDive: 0,

  startDive: (startDepth = 1) => {
    const gameStore = useGameStore.getState();
    const char = gameStore.character;

    if ((char.ascensionCount || 0) < 1) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '🔒 O mar fundo exige experiência: complete sua 1ª Ascensão antes de mergulhar.' });
      return;
    }
    if (useDiveStore.getState().diveActive) return;
    if (char.activeDailyChallenge) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '⚠️ Saia do Desafio Diário antes de mergulhar.' });
      return;
    }
    if (useTowerStore.getState().towerActive) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '⚠️ Saia da Torre Infinita antes de mergulhar.' });
      return;
    }
    // v10.1.0: checkpoints (26/51/81) só liberados após vencer o Guardião da zona anterior.
    if (startDepth > 1 && !CHECKPOINT_START_DEPTHS.includes(startDepth)) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '❌ Ponto de partida inválido.' });
      return;
    }
    if (startDepth > 1) {
      const guardianZoneNeeded = (CHECKPOINT_START_DEPTHS.indexOf(startDepth)) as 1 | 2 | 3;
      if (!char.abyss?.guardiansDefeated?.[guardianZoneNeeded]) {
        bridge.emit(GameEvent.LOG_EMITTED, { message: '🔒 Vença o Guardião da zona anterior para destravar este checkpoint.' });
        return;
      }
    }
    const keyCost = getDiveKeyCost(startDepth);
    if (!gameStore.spendDiveKey(keyCost)) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `❌ Você precisa de ${keyCost} 🤿 Chave${keyCost > 1 ? 's' : ''} de Mergulho (5 Fragmentos de Batisfera na pesca).` });
      return;
    }

    set({
      diveActive: true,
      currentDepth: startDepth,
      breath: 100,
      drowning: false,
      inCombat: false,
      airPocketOpen: false,
      airPocketResolvedDepth: 0,
      bankedPearls: 0,
      bankedCoral: 0,
      bankedRunes: {},
      airPocketPearlBonus: 0,
      echoesRescuedThisDive: 0,
      savedStageBeforeDive: char.currentStage,
      savedEnemiesDefeatedBeforeDive: char.enemiesDefeatedInStage,
      lastDiveSummary: null,
    });
    snapshotToCharacter(get());

    const zoneName = getZoneForDepth(startDepth) === 1 ? 'RECIFE PARTIDO' :
      getZoneForDepth(startDepth) === 2 ? 'BOSQUE DE ALGAS NEGRAS' :
      getZoneForDepth(startDepth) === 3 ? 'RUÍNAS DA CIDADELA' : 'FOSSA DO CACO';
    bridge.emit(GameEvent.LOG_EMITTED, { message: `🤿 A batisfera desce rangendo... Bem-vindo ao ${zoneName} (Profundidade ${startDepth}). Morte afogada custa 50% do acumulado; suba nos Bolsões de Ar para bancar tudo.` });
    bridge.emit(GameEvent.DIVE_STARTED, { depth: startDepth });
    bridge.emit(GameEvent.START_COMBAT, { mode: 'dive' });
  },

  setBreath: (breath) => {
    const clamped = Math.max(0, Math.min(100, breath));
    const wasDrowning = get().drowning;
    const drowning = clamped <= 0;
    set({ breath: clamped, drowning });
    if (drowning && !wasDrowning) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '🫧 SEM FÔLEGO! Você está se AFOGANDO: dano recebido dobrado e regeneração de HP zerada. Morrer agora custa 50% das recompensas!' });
    }
  },

  setInCombat: (inCombat) => set({ inCombat }),

  openAirPocket: () => {
    set({ airPocketOpen: true, inCombat: false });
    bridge.emit(GameEvent.AIR_POCKET_OPENED, { depth: get().currentDepth });
  },

  resolveAirPocket: (choice) => {
    const state = get();
    if (!state.diveActive || !state.airPocketOpen) return;
    let message = '';
    if (choice === 'breath') {
      const restored = Math.min(100, state.breath + AIR_POCKET_BREATH_RESTORE * 100);
      set({ breath: restored, drowning: false });
      message = `🫧 Você respira fundo no bolsão: Fôlego restaurado para ${Math.round(restored)}%.`;
    } else if (choice === 'rune') {
      const runeId = rollRuneForZone(getZoneForDepth(state.currentDepth), Math.random(), Math.random());
      set({ bankedRunes: { ...state.bankedRunes, [runeId]: (state.bankedRunes[runeId] || 0) + 1 } });
      message = `📜 Presa numa fenda do bolsão, uma runa: +1 Runa do tier da zona no acumulado da descida.`;
    } else {
      set({ airPocketPearlBonus: state.airPocketPearlBonus + AIR_POCKET_PEARL_BONUS });
      message = `🦪 Um banco de ostras dentro do bolsão: +25% de Pérolas ao bancar esta descida.`;
    }
    set({ airPocketOpen: false, airPocketResolvedDepth: state.currentDepth });
    bridge.emit(GameEvent.LOG_EMITTED, { message });
    bridge.emit(GameEvent.AIR_POCKET_RESOLVED, { choice });
  },

  completeDepth: (opts = {}) => {
    const state = get();
    if (!state.diveActive) return;
    const depth = state.currentDepth;
    const zone = getZoneForDepth(depth);

    // Escriba (perk global, "Cartas Batimétricas"): +5% de Pérolas bancadas por descida, cap +15%.
    const scribePerk = getVocationPerkTotal(useGameStore.getState().character.sunkenCitadel?.echoes || [], 'scribe');
    let pearls = state.bankedPearls + Math.round(getPearlsForDepth(depth) * (1 + scribePerk)) + (opts.bonusPearls || 0);
    let coral = state.bankedCoral;
    const runes = { ...state.bankedRunes };

    if (opts.runeRoll) {
      coral += getCoralPerKill(zone);
      // Fen T3 (fen_rune_drop): +2% de chance de drop de runa (8%→10%).
      const runeDropChance = DIVE_RUNE_DROP_CHANCE + (hasEquippedRuneFlag(useGameStore.getState().character.equipment, 'fen_rune_drop') ? 0.02 : 0);
      if (Math.random() < runeDropChance) {
        const runeId = rollRuneForZone(zone, Math.random(), Math.random());
        runes[runeId] = (runes[runeId] || 0) + 1;
        bridge.emit(GameEvent.LOG_EMITTED, { message: `📜 O inimigo soltou uma runa encharcada! (+1 Runa no acumulado)` });
      }

      // v10.3.0 "O Coração do Abismo": Set Abissal — rolagem SEPARADA (padrão Colar), só na Zona 4,
      // única exceção à pureza econômica das Profundezas (nenhum outro equipamento normal dropa aqui).
      if (zone === 4 && Math.random() < ABYSSAL_SET_DROP_CHANCE) {
        const gameChar = useGameStore.getState().character;
        const item = rollAbyssalSetDrop(gameChar.classId, gameChar.highestStageReached || 1);
        const added = useGameStore.getState().addItemToInventory(item);
        bridge.emit(GameEvent.LOG_EMITTED, {
          message: added
            ? `🔱 Das trevas da Fossa, um item do SET ABISSAL emergiu: [${item.name}]!`
            : `🔱 Um item do SET ABISSAL caiu, mas seu inventário está cheio!`,
        });
      }
    }

    // v10.2.0 "Os Ecos Afogados": resgate de Eco Afogado — Zona 3+, 10% por profundidade
    // concluída, máx. 2 por descida (Anexo 2 §1.5). Fora do banco de recompensas da descida
    // (Ecos não se perdem em morte — vão direto para o roster via useGameStore).
    let echoesRescuedThisDive = state.echoesRescuedThisDive;
    if (zone >= 3 && echoesRescuedThisDive < ECHO_RESCUE_MAX_PER_DIVE && Math.random() < ECHO_RESCUE_CHANCE_PER_DEPTH) {
      useGameStore.getState().rescueEcho(zone === 4 ? 'divesZone4' : 'divesZone3');
      echoesRescuedThisDive += 1;
    }

    if (opts.killedGuardian && opts.guardianZone) {
      const guardian = getGuardianForDepth(depth);
      pearls += guardian?.pearlReward ?? GUARDIAN_PEARL_REWARD;
      const runeId = rollRuneForZone(zone, Math.random(), Math.random());
      runes[runeId] = (runes[runeId] || 0) + 1; // runa garantida do Guardião
      const abyss = useGameStore.getState().character.abyss;
      const alreadyDefeated = !!abyss?.guardiansDefeated?.[opts.guardianZone];
      if (!alreadyDefeated && guardian) {
        const primordialId = guardian.primordialRuneId;
        runes[primordialId] = (runes[primordialId] || 0) + 1;
        useGameStore.getState().updateAbyssState({
          guardiansDefeated: { ...abyss?.guardiansDefeated, [opts.guardianZone]: true },
        });
        bridge.emit(GameEvent.LOG_EMITTED, { message: `🜲 O Guardião caiu e deixou para trás uma Runa Primordial (${primordialId.toUpperCase()}), adicionada ao acumulado!` });
        // v10.3.0: 1ª vez com Thal → revela a receita da Palavra Rúnica ÂNCORA DO MUNDO.
        if (primordialId === 'thal') useGameStore.getState().revealRuneword('ancora_mundo');
      }
      bridge.emit(GameEvent.LOG_EMITTED, { message: `👑 ${guardian?.name?.toUpperCase() || 'GUARDIÃO'} DERROTADO! +${guardian?.pearlReward ?? GUARDIAN_PEARL_REWARD} Pérolas e +1 runa garantida no acumulado.` });
    }

    const previousMax = useGameStore.getState().character.abyss?.historicalMaxDepth || 0;
    const historicalMax = Math.max(previousMax, depth);
    const nextDepth = depth + 1;

    // v10.4.0: título honorífico de Profundezas — concede no exato milestone recém-alcançado
    // (evita re-conceder títulos de marcos já passados quando o recorde salta vários de uma vez).
    for (const [milestoneDepth, title] of Object.entries(PROFUNDEZAS_TITLE_MILESTONES)) {
      const md = Number(milestoneDepth);
      if (previousMax < md && historicalMax >= md) {
        useTowerStore.getState().unlockTitle(title);
      }
    }

    set({
      bankedPearls: pearls,
      bankedCoral: coral,
      bankedRunes: runes,
      currentDepth: nextDepth,
      inCombat: false,
      echoesRescuedThisDive,
    });
    useGameStore.getState().updateAbyssState({ historicalMaxDepth: historicalMax });
    snapshotToCharacter(get());
    bridge.emit(GameEvent.DEPTH_CHANGED, { depth: nextDepth, banked: { pearls, coral, runes } });

    // Pré-F50: os Mergulhos Rasos continuam tetados na prof. 25 (comportamento 10.0.0 intacto).
    // Pós-F50 ("graduado" para As Profundezas completas), a Zona 4 é infinita — só termina ao
    // subir manualmente ou morrer.
    const highestStageReached = useGameStore.getState().character.highestStageReached || 1;
    if (!isFullDepthsUnlocked(highestStageReached) && depth >= SHALLOW_DIVE_MAX_DEPTH) {
      get().surface('cleared');
    }
  },

  surface: (reason) => {
    const state = get();
    if (!state.diveActive) return;

    const keepFraction =
      reason === 'drowned' ? DIVE_DROWNED_KEEP_FRACTION :
      reason === 'death' ? DIVE_DEATH_KEEP_FRACTION :
      DIVE_SURFACE_KEEP_FRACTION;

    const pearlMult = (1 + state.airPocketPearlBonus) * keepFraction;
    const keptPearls = Math.floor(state.bankedPearls * pearlMult);
    const keptCoral = Math.floor(state.bankedCoral * keepFraction);
    const keptRunes: Partial<Record<RuneId, number>> = {};
    (Object.entries(state.bankedRunes) as [RuneId, number][]).forEach(([runeId, qty]) => {
      // Runas são discretas: em morte, cada uma sobrevive com a fração de chance (Primordiais nunca se perdem)
      const kept = isPrimordialRune(runeId) ? qty : (keepFraction >= 1 ? qty : Array.from({ length: qty }).filter(() => Math.random() < keepFraction).length);
      if (kept > 0) keptRunes[runeId] = kept;
    });

    const gameStore = useGameStore.getState();
    if (keptPearls > 0) gameStore.addPearls(keptPearls);
    if (keptCoral > 0) gameStore.addMaterials(0, 0, 0, keptCoral);
    gameStore.addRunes(keptRunes);

    const maxDepthReached = state.currentDepth - (reason === 'cleared' ? 0 : 1);
    const runeCount = Object.values(keptRunes).reduce((s, q) => s + (q || 0), 0);
    const summary = `Prof. máx. ${Math.max(1, maxDepthReached)} · 🦪 ${keptPearls} · 🪸 ${keptCoral} · 📜 ${runeCount} runa(s)` +
      (keepFraction < 1 ? ` (${Math.round(keepFraction * 100)}% mantido)` : '');

    const savedStage = state.savedStageBeforeDive;
    const savedEnemies = state.savedEnemiesDefeatedBeforeDive;

    set({
      diveActive: false,
      currentDepth: 0,
      breath: 100,
      drowning: false,
      inCombat: false,
      airPocketOpen: false,
      bankedPearls: 0,
      bankedCoral: 0,
      bankedRunes: {},
      airPocketPearlBonus: 0,
      lastDiveSummary: summary,
    });

    gameStore.updateAbyssState({
      currentDepth: 0,
      breath: 100,
      bankedRewards: { pearls: 0, coral: 0, runes: {} },
      airPocketPearlBonus: 0,
      lifetimePearlsBanked: (gameStore.character.abyss?.lifetimePearlsBanked || 0) + keptPearls,
    });

    // Restaura a campanha (padrão exitTower)
    useGameStore.setState((s) => ({
      character: { ...s.character, currentStage: savedStage, enemiesDefeatedInStage: savedEnemies },
    }));

    const reasonMsg =
      reason === 'cleared' ? '🏆 RECIFE PARTIDO LIMPO! Alcance a Fase 50 do Pandemônio para mergulhar nas Profundezas completas — Zonas 2, 3 e 4 aguardam além daqui.' :
      reason === 'voluntary' ? '⬆️ Você subiu à superfície e bancou tudo o que acumulou.' :
      reason === 'drowned' ? '💀🫧 Você morreu AFOGADO — metade do acumulado se perdeu na escuridão.' :
      '💀 Você foi derrotado nas profundezas — parte do acumulado se perdeu na subida às pressas.';
    bridge.emit(GameEvent.LOG_EMITTED, { message: `${reasonMsg} ${summary}` });
    bridge.emit(GameEvent.DIVE_ENDED, { reason, summary });
    bridge.emit(GameEvent.START_COMBAT, { mode: 'campaign' });
  },
}));
