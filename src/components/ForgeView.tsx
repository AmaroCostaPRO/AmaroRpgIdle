import React, { useState } from 'react';
import { useGameStore, formatNumber } from '../store/useGameStore';
import { EquipmentItem, BaseStats } from '../core/types';
import { getMysticFusionCost } from '../core/citadelFormulas';
import { getRarityColor, getSetVisual } from './shared/itemVisuals';

const isPercentStat = (stat: string) => {
  return [
    'lifesteal', 
    'damageReductionPct', 
    'frenzyChancePct', 
    'dropChancePct', 
    'maxHpPct', 
    'maxManaPct', 
    'attackSpeedPct', 
    'damageMultiplierPct',
    'touchDamageMult',
    'critChance',
    'critDamage'
  ].includes(stat);
};

const formatStatValue = (stat: string, val: number) => {
  if (isPercentStat(stat)) {
    const pct = val * 100;
    const rounded = Number(pct.toFixed(2));
    return `+${rounded}%`;
  }
  return `+${val}`;
};

const getSlotEmoji = (slot: string) => {
  switch (slot) {
    case 'weapon': return '⚔️';
    case 'head': return '🪖';
    case 'chest': return '👕';
    case 'legs': return '👖';
    case 'gloves': return '🧤';
    case 'necklace': return '📿';
    case 'amulet': return '🧿';
    case 'ring': return '💍';
    default: return '❓';
  }
};

// Soquete de entrada do altar (Item A / Item B) — encaixe místico com profundidade 3D via .forge-socket
const ForgeInputSocket: React.FC<{
  item: EquipmentItem | null;
  label: string;
  onSelect: () => void;
  onRemove: () => void;
}> = ({ item, label, onSelect, onRemove }) => {
  const visual = item ? getSetVisual(item) : null;
  return (
  <div className="flex flex-col items-center">
    <div className="relative group">
      <button
        onClick={onSelect}
        className={`forge-socket forge-socket--clickable flex items-center justify-center ${item ? 'forge-socket--filled' : 'forge-socket--empty'}`}
        style={visual ? { border: visual.border, boxShadow: visual.shadow, background: visual.bg } : undefined}
      >
        {item ? (
          <>
            <span className="forge-socket-icon text-2xl">
              {getSlotEmoji(item.slot)}
            </span>
            <span className="text-[9px] font-bold text-gray-400 truncate max-w-[56px] mt-1 px-1">
              {item.name}
            </span>
          </>
        ) : (
          <>
            <span className="text-xl text-[var(--gold-400)]/60 font-bold group-hover:text-[var(--gold-300)] transition-colors">+</span>
            <span className="forge-socket-label group-hover:text-[var(--gold-300)] mt-1">{label}</span>
          </>
        )}
      </button>
      {item && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600/90 text-white font-bold text-[10px] flex items-center justify-center hover:bg-red-500 border border-[#161717] transition-all"
        >
          ×
        </button>
      )}
    </div>
  </div>
  );
};

export const ForgeView: React.FC = () => {
  const { character, reforgeItems, abbreviateNumbers } = useGameStore();
  const [slot1, setSlot1] = useState<EquipmentItem | null>(null);
  const [slot2, setSlot2] = useState<EquipmentItem | null>(null);
  const [activeSelectionSlot, setActiveSelectionSlot] = useState<1 | 2 | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'legendary' } | null>(null);
  const [successItem, setSuccessItem] = useState<EquipmentItem | null>(null);
  const [isLegendarySuccess, setIsLegendarySuccess] = useState(false);

  // Tradução das chaves de status primários
  const statLabels: Record<keyof BaseStats, string> = {
    strength: 'Força',
    magic: 'Magia',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    luck: 'Sorte',
    touch: 'Poder do Toque',
    critChance: 'Chance de Crítico',
    critDamage: 'Dano Crítico',
    robotClicks: 'Cliques do Robô',
    lifesteal: 'Roubo de Vida',
    touchDamageMult: 'Mult. Dano de Toque',
    damageMultiplierPct: 'Dano Global',
    maxHpPct: 'Vida Máxima Pct.',
    attackSpeedPct: 'Velocidade de Ataque',
    maxManaPct: 'Mana Máxima Pct.',
    dropChancePct: 'Chance de Drop',
    damageReductionPct: 'Redução de Dano',
    frenzyChancePct: 'Chance de Frenesi',
    dodgeChancePct: 'Chance de Esquiva',
    reflectDamagePct: 'Reflexão de Dano',
    goldBonusPct: 'Bônus de Ouro',
    eliteDamagePct: 'Dano vs. Elite/Chefe'
  };

  const slotLabels: Record<string, string> = {
    head: 'Elmo',
    chest: 'Armadura',
    legs: 'Calça',
    gloves: 'Luvas',
    weapon: 'Arma',
    necklace: 'Colar',
    amulet: 'Amuleto',
    ring: 'Anel'
  };

  const rarityNames: Record<string, string> = {
    common: 'Comum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
    mystic: 'Místico'
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const isLegendary = message.startsWith('⚡');
    setToast({ message, type: isLegendary ? 'legendary' : type });
    setTimeout(() => {
      setToast(null);
    }, isLegendary ? 6000 : 4000);
  };

  // Filtra itens do inventário elegíveis para o slot ativo
  const getEligibleItems = (): EquipmentItem[] => {
    // Exclui consumíveis e Relíquias Ativas da lista de itens elegíveis para a forja
    const inv = (character.inventory || []).filter(item => item.slot !== 'consumable' && item.slot !== 'activeRelic');
    
    // Se for o slot 1, permite selecionar qualquer item
    if (activeSelectionSlot === 1) {
      // Se o slot 2 já tiver item, só permite itens do mesmo tipo (slot) e mesma classe/compatibilidade de místico
      if (slot2) {
        return inv.filter(item => {
          if (item.id === slot2.id) return false;
          if (item.slot !== slot2.slot) return false;
          
          // Regra de compatibilidade mística e conjunto:
          const isBothMystic = item.rarity === 'mystic' && slot2.rarity === 'mystic';
          const isBothNormal = item.rarity !== 'mystic' && slot2.rarity !== 'mystic';
          const isSameSet = item.setName === slot2.setName;
          return (isBothMystic || isBothNormal) && isSameSet;
        });
      }
      return inv;
    }

    // Se for o slot 2
    if (activeSelectionSlot === 2) {
      if (slot1) {
        return inv.filter(item => {
          if (item.id === slot1.id) return false;
          if (item.slot !== slot1.slot) return false;
          
          const isBothMystic = item.rarity === 'mystic' && slot1.rarity === 'mystic';
          const isBothNormal = item.rarity !== 'mystic' && slot1.rarity !== 'mystic';
          const isSameSet = item.setName === slot1.setName;
          return (isBothMystic || isBothNormal) && isSameSet;
        });
      }
      return inv;
    }

    return [];
  };

  // Verifica se a fusão é possível e calcula custos
  const checkReforgeValidity = () => {
    if (!slot1 || !slot2) return { valid: false, reason: 'Selecione dois itens.', cost: 0, fragmentCost: 0, nextLevel: 1 };
    if (slot1.slot !== slot2.slot) return { valid: false, reason: 'Os itens devem ser do mesmo slot.', cost: 0, fragmentCost: 0, nextLevel: 1 };
    if (slot1.setName !== slot2.setName) return { valid: false, reason: 'Os itens devem pertencer ao mesmo conjunto (Set).', cost: 0, fragmentCost: 0, nextLevel: 1 };

    const isBothMystic = slot1.rarity === 'mystic' && slot2.rarity === 'mystic';
    const isBothNormal = slot1.rarity !== 'mystic' && slot2.rarity !== 'mystic';

    if (!isBothMystic && !isBothNormal) {
      return { valid: false, reason: 'Fusão indisponível: misture dois itens normais ou dois místicos.', cost: 0, fragmentCost: 0, nextLevel: 1 };
    }
    let cost = 500;
    let fragmentCost = 250;
    let nextLevel = 1;

    if (isBothMystic) {
      const lvl1 = slot1.mysticLevel || 1;
      const lvl2 = slot2.mysticLevel || 1;

      if (lvl1 !== lvl2) {
        return { valid: false, reason: 'Itens Místicos devem ter o mesmo nível para fusão.', cost: 0, fragmentCost: 0, nextLevel: 1 };
      }
      if (lvl1 >= 8) {
        return { valid: false, reason: 'O nível máximo de item Místico é +8.', cost: 0, fragmentCost: 0, nextLevel: 1 };
      }

      nextLevel = lvl1 + 1;
      const fusionCost = getMysticFusionCost(lvl1);
      cost = fusionCost.cost;
      fragmentCost = fusionCost.fragmentCost;
    }

    const hasGold = (character.gold || 0) >= cost;
    const hasFragments = (character.forgeFragments || 0) >= fragmentCost;

    return {
      valid: hasGold && hasFragments,
      reason: !hasGold 
        ? `Você precisa de ${cost} Ouro para esta fusão.` 
        : !hasFragments 
        ? `Você precisa de ${fragmentCost} Fragmentos de Forja para esta fusão.` 
        : '',
      cost,
      fragmentCost,
      nextLevel
    };
  };

  const reforgeState = checkReforgeValidity();

  // Executa a fusão
  const handleForge = () => {
    if (!slot1 || !slot2) return;
    
    const result = reforgeItems(slot1.id, slot2.id);

    if (result.success && result.newItem) {
      const legendary = result.message.startsWith('⚡');
      setIsLegendarySuccess(legendary);
      setSuccessItem(result.newItem);
      showToast(result.message, 'success');
      setSlot1(null);
      setSlot2(null);
    } else {
      showToast(result.message || 'Erro ao realizar a fusão.', 'error');
    }
  };

  // Prévia com a fórmula real da forja (normal/95%):
  // • Ambos têm o stat → maior preservado + ceil(menor × 0.5)
  // • Só um tem       → copiado integralmente
  const getMergedStatsPreview = (): Partial<BaseStats> => {
    if (!slot1 || !slot2) return {};
    const merged: Partial<BaseStats> = {};
    const keys = new Set([...Object.keys(slot1.stats), ...Object.keys(slot2.stats)]) as Set<keyof BaseStats>;
    keys.forEach(k => {
      const v1 = slot1.stats[k] || 0;
      const v2 = slot2.stats[k] || 0;
      if (v1 === 0 || v2 === 0) {
        merged[k] = v1 + v2; // único portador: 100%
      } else {
        const maior = Math.max(v1, v2);
        const menor = Math.min(v1, v2);
        merged[k] = maior + Math.ceil(menor * 0.5);
      }
    });
    return merged;
  };

  const previewStats = getMergedStatsPreview();

  const getMergedItemName = (): string => {
    if (!slot1) return '';
    // Usa o mesmo nível calculado por checkReforgeValidity (fonte única de verdade):
    // normal+normal -> nível 1; místico+místico -> nível atual + 1.
    const targetMysticLevel = reforgeState.nextLevel;
    const slotNamesMap: Record<string, string> = {
      weapon: 'Arma Mística',
      head: 'Elmo Místico',
      chest: 'Armadura Mística',
      legs: 'Calça Mística',
      gloves: 'Luva Mística',
      necklace: 'Colar Místico',
      amulet: 'Amuleto Místico',
      ring: 'Anel Místico'
    };

    let baseName = slotNamesMap[slot1.slot] || 'Item Místico';
    let newName = `${baseName} +${targetMysticLevel}`;

    if (slot1.setName) {
      let cleanSetName = slot1.setName;
      const isAncestral = slot1.setName.startsWith('Set Ancestral');
      const isPandemonium = slot1.setName.startsWith('Set Pandemoníaco');
      const isCelestial = slot1.setName.startsWith('Set Celestial');
      
      if (isAncestral) {
        if (cleanSetName.startsWith('Set Ancestral do ')) {
          cleanSetName = cleanSetName.replace('Set Ancestral do ', '');
        } else if (cleanSetName.startsWith('Set Ancestral de ')) {
          cleanSetName = cleanSetName.replace('Set Ancestral de ', '');
        }
        baseName = baseName.replace('Mística', 'Mística Ancestral');
        baseName = baseName.replace('Místico', 'Místico Ancestral');
        
        if (slot1.setName.includes(' do ')) {
          newName = `${baseName} do ${cleanSetName} +${targetMysticLevel}`;
        } else if (slot1.setName.includes(' da ')) {
          newName = `${baseName} da ${cleanSetName} +${targetMysticLevel}`;
        } else {
          newName = `${baseName} de ${cleanSetName} +${targetMysticLevel}`;
        }
      } else if (isPandemonium) {
        if (cleanSetName.startsWith('Set Pandemoníaco do ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco do ', '');
        } else if (cleanSetName.startsWith('Set Pandemoníaco de ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco de ', '');
        }
        baseName = baseName.replace('Mística', 'Mística Pandemoníaca');
        baseName = baseName.replace('Místico', 'Místico Pandemoníaco');
        
        if (slot1.setName.includes(' do ')) {
          newName = `${baseName} do ${cleanSetName} +${targetMysticLevel}`;
        } else if (slot1.setName.includes(' da ')) {
          newName = `${baseName} da ${cleanSetName} +${targetMysticLevel}`;
        } else {
          newName = `${baseName} de ${cleanSetName} +${targetMysticLevel}`;
        }
      } else if (isCelestial) {
        if (cleanSetName.startsWith('Set Celestial do ')) {
          cleanSetName = cleanSetName.replace('Set Celestial do ', '');
        } else if (cleanSetName.startsWith('Set Celestial de ')) {
          cleanSetName = cleanSetName.replace('Set Celestial de ', '');
        }
        baseName = baseName.replace('Mística', 'Mística Celestial');
        baseName = baseName.replace('Místico', 'Místico Celestial');
        
        if (slot1.setName.includes(' do ')) {
          newName = `${baseName} do ${cleanSetName} +${targetMysticLevel}`;
        } else if (slot1.setName.includes(' da ')) {
          newName = `${baseName} da ${cleanSetName} +${targetMysticLevel}`;
        } else {
          newName = `${baseName} de ${cleanSetName} +${targetMysticLevel}`;
        }
      } else {
        if (cleanSetName.startsWith('Set do ')) {
          cleanSetName = cleanSetName.replace('Set do ', '');
        } else if (cleanSetName.startsWith('Set de ')) {
          cleanSetName = cleanSetName.replace('Set de ', '');
        }
        
        if (slot1.setName.includes(' do ')) {
          newName = `${baseName} do ${cleanSetName} +${targetMysticLevel}`;
        } else if (slot1.setName.includes(' da ')) {
          newName = `${baseName} da ${cleanSetName} +${targetMysticLevel}`;
        } else {
          newName = `${baseName} de ${cleanSetName} +${targetMysticLevel}`;
        }
      }
    }
    return newName;
  };

  return (
    <div className="w-full flex flex-col gap-6 forge-view-root">
      
      {/* PAINEL PRINCIPAL DA FORJA */}
      <div className="panel flex-1 flex flex-col min-h-[480px]">
        
        {/* Background da Forja */}
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none"
          style={{ backgroundImage: 'url("/assets/forge_background.png")' }}
        />
        
        {/* HUD de Recursos */}
        <div className="p-3 sm:p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface-1)]/60 backdrop-blur-md z-10 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-lg sm:text-xl flex-shrink-0">⚒️</span>
            <h2 className="section-title truncate whitespace-nowrap" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>Grande Forja Arcana</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full whitespace-nowrap">
              <span className="text-yellow-400 font-semibold text-xs sm:text-sm">🪙 {formatNumber(character.gold || 0, abbreviateNumbers)}</span>
            </div>
            <div className="flex items-center px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full whitespace-nowrap">
              <span className="text-purple-400 font-semibold text-xs sm:text-sm">🔩 {formatNumber(character.forgeFragments || 0, abbreviateNumbers)}</span>
            </div>
          </div>
        </div>

        {/* ÁREA TRIANGULAR DO ALTAR DE FUSÃO */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-10">
          
          {/* Altar de Fusão: soquete de resultado + correntes místicas + soquetes de entrada */}
          <div className="forge-altar">

            {/* SLOT RESULTADO (CENTRO SUPERIOR) */}
            <div className="forge-result-zone">
              <div
                className={`forge-socket forge-socket--result flex items-center justify-center ${
                  slot1 && slot2 ? 'forge-socket--filled' : 'forge-socket--empty'
                } ${slot1 && slot2 && reforgeState.nextLevel ? 'forge-socket--ready' : ''}`}
                style={slot1 && slot2 ? { borderColor: '#d946ef' } : undefined}
              >
                {slot1 && slot2 ? (
                  <div className="flex flex-col items-center">
                    <span className="forge-socket-icon text-3xl text-[#d946ef]">
                      {getSlotEmoji(slot1.slot)}
                    </span>
                    <span className="text-[10px] font-extrabold text-[#d946ef] bg-[#d946ef]/10 px-1 rounded mt-1">
                      +{reforgeState.nextLevel}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-light text-gray-500 opacity-50">?</span>
                )}
              </div>
              <span className="forge-result-label">Resultado Místico</span>
            </div>

            {/* CORRENTES DE ENERGIA ARCANA (conectores) — fluxo animado sobe dos itens até o resultado */}
            <svg
              className="forge-connector-svg"
              viewBox="0 0 200 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="forge-chain-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              {/* Início no topo-centro do soquete de entrada (base), fim no soquete de resultado (topo) */}
              <path
                d="M 42 97 Q 70 45, 100 3"
                className={`forge-chain-path ${slot1 && slot2 ? 'forge-chain-path--active' : ''}`}
              />
              <path
                d="M 158 97 Q 130 45, 100 3"
                className={`forge-chain-path ${slot1 && slot2 ? 'forge-chain-path--active' : ''}`}
              />
            </svg>

            {/* SLOTS DE ENTRADA (BASE DO ALTAR) */}
            <div className="forge-sockets-row">
              <ForgeInputSocket
                item={slot1}
                label="Item A"
                onSelect={() => setActiveSelectionSlot(1)}
                onRemove={() => setSlot1(null)}
              />
              <ForgeInputSocket
                item={slot2}
                label="Item B"
                onSelect={() => setActiveSelectionSlot(2)}
                onRemove={() => setSlot2(null)}
              />
            </div>
          </div>

          {/* PAINEL DE AÇÃO E FEEDBACK DA FUSÃO */}
          <div className="mt-4 w-full max-w-[340px] flex flex-col items-center">
            {slot1 && slot2 ? (
              <div className="w-full bg-[var(--surface-1)]/80 backdrop-blur-sm border border-[var(--border-subtle)] rounded-lg p-4 flex flex-col items-center">
                <div className="flex flex-col gap-2 w-full mb-3">
                  <div className="flex justify-between w-full text-sm">
                    <span className="forge-cost-label text-gray-400">Custo de Ouro:</span>
                    <span className={`font-bold ${character.gold >= reforgeState.cost ? 'text-yellow-400' : 'text-red-500'}`}>
                      🪙 {formatNumber(reforgeState.cost || 0, abbreviateNumbers)} Ouro
                    </span>
                  </div>
                  <div className="flex justify-between w-full text-sm">
                    <span className="forge-cost-label text-gray-400">Custo de Fragmentos:</span>
                    <span className={`font-bold ${(character.forgeFragments || 0) >= (reforgeState.fragmentCost || 0) ? 'text-purple-400' : 'text-red-500'}`}>
                      🔩 {formatNumber(reforgeState.fragmentCost || 0, abbreviateNumbers)} Fragmentos
                    </span>
                  </div>
                </div>

                {reforgeState.reason && (
                  <div className="text-xs text-red-400/90 text-center bg-red-950/20 border border-red-900/30 rounded p-2 mb-3 w-full">
                    ⚠️ {reforgeState.reason}
                  </div>
                )}

                <button
                  onClick={handleForge}
                  disabled={!reforgeState.valid}
                  className={`forge-forge-button w-full py-2.5 rounded-lg font-bold text-sm transition-all shadow-md ${
                    reforgeState.valid
                      ? 'bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white cursor-pointer active:scale-95 shadow-purple-900/30'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                  }`}
                >
                  🚀 Forjar Equipamento Místico
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center px-4 bg-[#161717]/30 border border-[#252727]/50 rounded-lg py-3 w-full">
                Insira dois equipamentos do mesmo tipo (ex: duas armas) para realizar a fusão e forjar um poderoso item Místico de raridade roxa.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* PAINEL DE COMPARAÇÃO DE ESTATÍSTICAS E PRÉVIA */}
      <div className="w-full flex flex-col gap-6">
        
        {/* COMPARAÇÃO LADO A LADO */}
        <div className="panel w-full p-5 flex flex-col min-h-[300px] z-10 bg-[var(--surface-1)]/80 backdrop-blur-md border border-[var(--border-subtle)] rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-60" />
          <h3 className="forge-card-title text-md font-bold text-gray-200 border-b border-[var(--border-subtle)] pb-3 mb-4 flex items-center gap-2">
            <span>⚖️</span> Comparação de Equipamentos e Resultado Estimado
          </h3>
          
          {slot1 && slot2 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              
              {/* COLUNA 1: SACRIFÍCIO A */}
              <div className="flex flex-col bg-[var(--surface-2)]/45 border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm relative overflow-hidden transition-all hover:border-purple-500/20">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-[var(--border-subtle)]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl shadow-inner">
                    {getSlotEmoji(slot1.slot)}
                  </div>
                  <div>
                    <h4 className="forge-card-title text-xs font-bold truncate max-w-[150px]" style={{ color: getRarityColor(slot1.rarity) }}>{slot1.name}</h4>
                    <span className="forge-card-subtitle text-[9px] text-gray-500 font-bold">Sacrifício A ({rarityNames[slot1.rarity]}{slot1.mysticLevel ? ` +${slot1.mysticLevel}` : ''})</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {Object.keys(slot1.stats).map((statKey) => {
                    const key = statKey as keyof BaseStats;
                    const val = slot1.stats[key] || 0;
                    if (val === 0) return null;
                    return (
                      <div key={key} className="flex justify-between text-xs py-1 border-b border-zinc-800/30">
                        <span className="text-gray-400">{statLabels[key]}</span>
                        <span className="font-semibold text-gray-200">{formatStatValue(key, val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLUNA 2: RESULTADO ESTIMADO (CENTRAL, DESTAQUE) */}
              <div className="flex flex-col bg-gradient-to-b from-[#2e1065]/10 to-[var(--surface-2)]/60 border border-purple-500/40 rounded-xl p-4 shadow-md relative overflow-hidden ring-2 ring-purple-500/10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-purple-500/25">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-1)] border-2 border-[#d946ef] flex items-center justify-center text-2xl shadow-[0_0_10px_rgba(217,70,239,0.3)]">
                    {getSlotEmoji(slot1.slot)}
                  </div>
                  <div>
                    <h4 className="forge-card-title text-xs font-extrabold text-[#d946ef] truncate max-w-[150px]">
                      {getMergedItemName()}
                    </h4>
                    <span className="forge-card-subtitle text-[9px] text-[#d946ef] font-extrabold">Previsão de Fusão</span>
                  </div>
                </div>
                {/* v10.0.0: aviso de runas — o resultado herda max(soquetes) e as runas do Item A;
                    as runas engastadas no Item B voltam intactas ao cofre de runas. */}
                {(slot2?.socketedRunes || []).some(r => !!r) && (
                  <p style={{ fontSize: '0.6rem', color: '#c084fc', marginBottom: '0.4rem' }}>
                    ⚠️ As runas engastadas no Item B serão devolvidas ao seu cofre de runas.
                  </p>
                )}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {Object.keys(previewStats).map((statKey) => {
                    const key = statKey as keyof BaseStats;
                    const v1 = slot1.stats[key] || 0;
                    const v2 = slot2.stats[key] || 0;
                    const total = previewStats[key] || 0;
                    if (total === 0) return null;

                    const exclusivo = v1 === 0 || v2 === 0;
                    const maxSacrifice = Math.max(v1, v2);
                    const diff = total - maxSacrifice;

                    return (
                      <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-purple-500/10">
                        <span className="text-gray-300 font-medium">{statLabels[key]}</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-[#d946ef]">{formatStatValue(key, total)}</span>
                          {!exclusivo && diff > 0 && (
                            <span className="text-[9px] px-1 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-sm font-semibold">
                              {formatStatValue(key, diff)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLUNA 3: SACRIFÍCIO B */}
              <div className="flex flex-col bg-[var(--surface-2)]/45 border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm relative overflow-hidden transition-all hover:border-purple-500/20">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-[var(--border-subtle)]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl shadow-inner">
                    {getSlotEmoji(slot2.slot)}
                  </div>
                  <div>
                    <h4 className="forge-card-title text-xs font-bold truncate max-w-[150px]" style={{ color: getRarityColor(slot2.rarity) }}>{slot2.name}</h4>
                    <span className="forge-card-subtitle text-[9px] text-gray-500 font-bold">Sacrifício B ({rarityNames[slot2.rarity]}{slot2.mysticLevel ? ` +${slot2.mysticLevel}` : ''})</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {Object.keys(slot2.stats).map((statKey) => {
                    const key = statKey as keyof BaseStats;
                    const val = slot2.stats[key] || 0;
                    if (val === 0) return null;
                    return (
                      <div key={key} className="flex justify-between text-xs py-1 border-b border-zinc-800/30">
                        <span className="text-gray-400">{statLabels[key]}</span>
                        <span className="font-semibold text-gray-200">{formatStatValue(key, val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--surface-1)]/40 min-h-[220px]">
              <span className="text-4xl mb-3">⚖️</span>
              <p className="forge-card-title text-sm font-semibold text-gray-300">Pronto para Comparação</p>
              <p className="text-xs text-gray-500 max-w-sm mt-1.5">
                Selecione os dois itens de sacrifício no altar acima para ativar a visualização de comparação lado a lado em tempo real.
              </p>
            </div>
          )}
        </div>

        {/* FEEDBACK DO ÚLTIMO ITEM CRIADO */}
        {successItem && (
          <div className="panel w-full bg-gradient-to-b from-[var(--surface-glass)] to-[#2e1065]/15 border border-purple-500/30 p-5 shadow-lg animate-tabFade relative overflow-hidden rounded-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center mb-3">
              <span className={`forge-card-subtitle text-xs font-extrabold ${isLegendarySuccess ? 'text-yellow-400' : 'text-purple-400'}`}>
                {isLegendarySuccess ? '⚡ Forja Lendária!' : 'Equipamento Forjado com Sucesso!'}
              </span>
              <button 
                onClick={() => { setSuccessItem(null); setIsLegendarySuccess(false); }}
                className="text-gray-400 hover:text-gray-200 text-xs px-2 py-0.5 bg-zinc-800/50 rounded border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
              >
                Dispensar
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--surface-1)] border-2 border-[#d946ef] flex items-center justify-center text-3xl shadow-[0_0_12px_rgba(217,70,239,0.4)]">
                {getSlotEmoji(successItem.slot)}
              </div>
              <div>
                <h4 className="forge-card-title text-md font-extrabold text-[#d946ef]">{successItem.name}</h4>
                <p className="text-xs text-gray-400 font-medium">Equipamento Místico nível +{successItem.mysticLevel}</p>
                {successItem.setName && (
                  <p className="text-[11px] text-yellow-400/90 mt-1 flex items-center gap-1">
                    <span>🏅</span> Conjunto: <strong>{successItem.setName}</strong>
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.keys(successItem.stats).map((k) => {
                const key = k as keyof BaseStats;
                const value = successItem.stats[key];
                if (!value) return null;
                return (
                  <div key={key} className="flex justify-between items-center text-xs bg-[var(--surface-2)]/40 border border-[var(--border-subtle)] rounded-lg p-2.5">
                    <span className="text-gray-400">{statLabels[key]}</span>
                    <span className="text-purple-400 font-bold">{formatStatValue(key, value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {activeSelectionSlot !== null && (
        <div className="absolute inset-0 bg-[var(--surface-0)]/90 backdrop-blur-md flex items-center justify-center z-20 p-4">
          <div className="panel w-full max-w-[460px] max-h-[92%] flex flex-col shadow-2xl animate-fadeIn">
            
            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface-1)]/80">
              <h3 className="text-md font-bold text-gray-200">
                Selecionar para Slot {activeSelectionSlot === 1 ? 'Item A' : 'Item B'}
              </h3>
              <button
                onClick={() => setActiveSelectionSlot(null)}
                className="text-gray-400 hover:text-white font-bold text-lg px-2"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(() => {
                const eligibleItems = getEligibleItems();
                return eligibleItems.length > 0 ? (
                eligibleItems.map((item) => {
                  const visual = getSetVisual(item);
                  return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (activeSelectionSlot === 1) {
                        setSlot1(item);
                      } else {
                        setSlot2(item);
                      }
                      setActiveSelectionSlot(null);
                    }}
                    className="flex items-center justify-between p-3 hover:bg-[var(--surface-2)] rounded-lg cursor-pointer transition-all hover:border-purple-500/40 group"
                    style={{ background: visual.bg, border: visual.border, boxShadow: visual.shadow }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center text-xl group-hover:border-purple-500/20">
                        {getSlotEmoji(item.slot)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-200" style={{ color: getRarityColor(item.rarity) }}>
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-gray-500">
                          {slotLabels[item.slot]} | Raridade: {rarityNames[item.rarity]} {item.mysticLevel ? `(+${item.mysticLevel})` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] text-right text-gray-400">
                      {Object.keys(item.stats).slice(0, 2).map((k) => {
                        const key = k as keyof BaseStats;
                        return (
                          <div key={key}>
                            {statLabels[key].split(' ')[0]}: {formatStatValue(key, item.stats[key] ?? 0)}
                          </div>
                        );
                      })}
                      {Object.keys(item.stats).length > 2 && <div>...</div>}
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-gray-500 space-y-1">
                  <p>Nenhum equipamento compatível no inventário.</p>
                  <p className="text-[10px] opacity-75">
                    {slot1 || slot2 
                      ? `Você precisa de outro item do slot "${slotLabels[(slot1 || slot2)!.slot]}" no inventário.`
                      : 'Colete equipamentos normais ou místicos em combate primeiro.'
                    }
                  </p>
                </div>
                );
              })()}
            </div>

            <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-1)]/60 flex justify-end">
              <button
                onClick={() => setActiveSelectionSlot(null)}
                className="px-4 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs rounded font-medium"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          <div 
            className={`px-4 py-3 rounded-lg border shadow-xl flex items-center gap-2 animate-slideUp text-xs font-semibold ${
              toast.type === 'legendary'
                ? 'bg-yellow-950/80 border-yellow-400 text-yellow-200 shadow-yellow-900/40'
                : toast.type === 'success' 
                ? 'bg-purple-950/70 border-purple-500 text-purple-200' 
                : 'bg-red-950/70 border-red-500 text-red-200'
            }`}
          >
            <span>{toast.type === 'legendary' ? '⚡' : toast.type === 'success' ? '✨' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
};
