import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { EquipmentItem, BaseStats } from '../core/types';

export const ForgeView: React.FC = () => {
  const { character, reforgeItems } = useGameStore();
  const [slot1, setSlot1] = useState<EquipmentItem | null>(null);
  const [slot2, setSlot2] = useState<EquipmentItem | null>(null);
  const [activeSelectionSlot, setActiveSelectionSlot] = useState<1 | 2 | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [successItem, setSuccessItem] = useState<EquipmentItem | null>(null);

  // Tradução das chaves de status primários
  const statLabels: Record<keyof BaseStats, string> = {
    strength: 'Força',
    magic: 'Magia',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    luck: 'Sorte'
  };

  const slotLabels: Record<string, string> = {
    head: 'Elmo',
    chest: 'Armadura',
    legs: 'Calça',
    gloves: 'Luvas',
    weapon: 'Arma'
  };

  const rarityColors: Record<string, string> = {
    common: '#9ca3af', // Cinza
    rare: '#3b82f6',   // Azul
    epic: '#a855f7',   // Roxo
    legendary: '#eab308', // Dourado
    mystic: '#d946ef'  // Lilás/Rosa vibrante
  };

  const rarityNames: Record<string, string> = {
    common: 'Comum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
    mystic: 'Místico'
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Filtra itens do inventário elegíveis para o slot ativo
  const getEligibleItems = (): EquipmentItem[] => {
    const inv = character.inventory || [];
    
    // Se for o slot 1, permite selecionar qualquer item
    if (activeSelectionSlot === 1) {
      // Se o slot 2 já tiver item, só permite itens do mesmo tipo (slot) e mesma classe/compatibilidade de místico
      if (slot2) {
        return inv.filter(item => {
          if (item.id === slot2.id) return false;
          if (item.slot !== slot2.slot) return false;
          
          // Regra de compatibilidade mística:
          const isBothMystic = item.rarity === 'mystic' && slot2.rarity === 'mystic';
          const isBothNormal = item.rarity !== 'mystic' && slot2.rarity !== 'mystic';
          return isBothMystic || isBothNormal;
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
          return isBothMystic || isBothNormal;
        });
      }
      return inv;
    }

    return [];
  };

  // Verifica se a fusão é possível e calcula custos
  const checkReforgeValidity = () => {
    if (!slot1 || !slot2) return { valid: false, reason: 'Selecione dois itens.', cost: 0 };
    if (slot1.slot !== slot2.slot) return { valid: false, reason: 'Os itens devem ser do mesmo slot.', cost: 0 };

    const isBothMystic = slot1.rarity === 'mystic' && slot2.rarity === 'mystic';
    const isBothNormal = slot1.rarity !== 'mystic' && slot2.rarity !== 'mystic';

    if (!isBothMystic && !isBothNormal) {
      return { valid: false, reason: 'Fusão indisponível: misture dois itens normais ou dois místicos.', cost: 0 };
    }

    let cost = 100;
    let nextLevel = 1;

    if (isBothMystic) {
      const lvl1 = slot1.mysticLevel || 1;
      const lvl2 = slot2.mysticLevel || 1;

      if (lvl1 !== lvl2) {
        return { valid: false, reason: 'Itens Místicos devem ter o mesmo nível para fusão.', cost: 0 };
      }
      if (lvl1 >= 5) {
        return { valid: false, reason: 'O nível máximo de item Místico é +5.', cost: 0 };
      }

      nextLevel = lvl1 + 1;
      const costs = [0, 500, 2500, 12500, 62500];
      cost = costs[lvl1] || 100;
    }

    const hasGold = (character.gold || 0) >= cost;

    return {
      valid: hasGold,
      reason: hasGold ? '' : `Você precisa de ${cost} Ouro para esta fusão.`,
      cost,
      nextLevel
    };
  };

  const reforgeState = checkReforgeValidity();

  // Executa a fusão
  const handleForge = () => {
    if (!slot1 || !slot2) return;
    
    const result = reforgeItems(slot1.id, slot2.id);

    if (result.success && result.newItem) {
      setSuccessItem(result.newItem);
      showToast(result.message, 'success');
      setSlot1(null);
      setSlot2(null);
    } else {
      showToast(result.message || 'Erro ao realizar a fusão.', 'error');
    }
  };

  // Retorna os stats somados de prévia
  const getMergedStatsPreview = (): Partial<BaseStats> => {
    if (!slot1 || !slot2) return {};
    const merged: Partial<BaseStats> = {};
    const keys = new Set([...Object.keys(slot1.stats), ...Object.keys(slot2.stats)]) as Set<keyof BaseStats>;
    keys.forEach(k => {
      merged[k] = (slot1.stats[k] || 0) + (slot2.stats[k] || 0);
    });
    return merged;
  };

  const previewStats = getMergedStatsPreview();

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
      
      {/* PAINEL PRINCIPAL DA FORJA */}
      <div className="panel flex-1 flex flex-col min-h-[480px]">
        
        {/* Background da Forja */}
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none"
          style={{ backgroundImage: 'url("/assets/forge_background.png")' }}
        />
        
        {/* HUD de Recursos */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface-1)]/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚒️</span>
            <h2 className="text-lg font-bold text-gray-100">Grande Forja Arcana</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
            <span className="text-yellow-400 font-semibold">🪙 {(character.gold || 0).toLocaleString()}</span>
            <span className="text-xs text-yellow-500/80 font-medium">Ouro</span>
          </div>
        </div>

        {/* ÁREA TRIANGULAR DO ALTAR DE FUSÃO */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-10">
          
          {/* Triângulo / Pirâmide de Slots */}
          <div className="relative w-full max-w-[340px] aspect-[4/3] flex flex-col justify-between items-center py-3">
            
            {/* Linhas de conexão (Efeito visual) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Linha esquerda */}
              <line x1="50" y1="20" x2="20" y2="80" stroke="#d946ef" strokeWidth="2" strokeDasharray="3" />
              {/* Linha direita */}
              <line x1="50" y1="20" x2="80" y2="80" stroke="#d946ef" strokeWidth="2" strokeDasharray="3" />
              {/* Linha base */}
              <line x1="20" y1="80" x2="80" y2="80" stroke="#52525b" strokeWidth="1" />
            </svg>

            {/* SLOT RESULTADO (CENTRO SUPERIOR) */}
            <div className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-20 h-20 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-[0_0_20px_rgba(217,70,239,0.15)] ${
                  slot1 && slot2 && reforgeState.nextLevel
                    ? 'border-[#d946ef] animate-pulse shadow-[0_0_25px_rgba(217,70,239,0.4)] bg-[var(--surface-2)]/90'
                    : 'border-[var(--border-subtle)] border-dashed text-gray-500 bg-[var(--surface-1)]/90'
                }`}
              >
                {slot1 && slot2 ? (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl text-[#d946ef] drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]">
                      {slot1.slot === 'weapon' ? '⚔️' : slot1.slot === 'head' ? '🪖' : slot1.slot === 'chest' ? '🛡️' : slot1.slot === 'legs' ? '👖' : '🧤'}
                    </span>
                    <span className="text-[10px] font-extrabold text-[#d946ef] bg-[#d946ef]/10 px-1 rounded mt-1">
                      +{reforgeState.nextLevel}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-light opacity-50">?</span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-[#d946ef] mt-2 tracking-wide uppercase">Resultado Místico</span>
            </div>

            {/* SLOTS DE ENTRADA (BASE DO TRIÂNGULO) */}
            <div className="w-full flex justify-between px-6 z-10 mt-6">
              
              {/* SLOT 1 */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <button
                    onClick={() => setActiveSelectionSlot(1)}
                    className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-200 ${
                      slot1 
                        ? 'bg-[var(--surface-1)] border-purple-500 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]' 
                        : 'bg-[var(--surface-2)]/75 border-dashed border-purple-500/40 text-purple-400/70 hover:border-purple-400 hover:text-purple-300 hover:bg-purple-950/10 hover:scale-105 active:scale-95 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    }`}
                  >
                    {slot1 ? (
                      <>
                        <span className="text-2xl mt-1">
                          {slot1.slot === 'weapon' ? '⚔️' : slot1.slot === 'head' ? '🪖' : slot1.slot === 'chest' ? '🛡️' : slot1.slot === 'legs' ? '👖' : '🧤'}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 truncate max-w-[56px] mt-1 px-1">
                          {slot1.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl text-purple-400 font-bold group-hover:text-purple-300 transition-colors">+</span>
                        <span className="text-[9px] font-bold text-purple-400/80 group-hover:text-purple-300 mt-1">Item A</span>
                      </>
                    )}
                  </button>
                  {slot1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSlot1(null); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600/90 text-white font-bold text-[10px] flex items-center justify-center hover:bg-red-500 border border-[#161717] transition-all"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* SLOT 2 */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <button
                    onClick={() => setActiveSelectionSlot(2)}
                    className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-200 ${
                      slot2 
                        ? 'bg-[var(--surface-1)] border-purple-500 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]' 
                        : 'bg-[var(--surface-2)]/75 border-dashed border-purple-500/40 text-purple-400/70 hover:border-purple-400 hover:text-purple-300 hover:bg-purple-950/10 hover:scale-105 active:scale-95 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    }`}
                  >
                    {slot2 ? (
                      <>
                        <span className="text-2xl mt-1">
                          {slot2.slot === 'weapon' ? '⚔️' : slot2.slot === 'head' ? '🪖' : slot2.slot === 'chest' ? '🛡️' : slot2.slot === 'legs' ? '👖' : '🧤'}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 truncate max-w-[56px] mt-1 px-1">
                          {slot2.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl text-purple-400 font-bold group-hover:text-purple-300 transition-colors">+</span>
                        <span className="text-[9px] font-bold text-purple-400/80 group-hover:text-purple-300 mt-1">Item B</span>
                      </>
                    )}
                  </button>
                  {slot2 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSlot2(null); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600/90 text-white font-bold text-[10px] flex items-center justify-center hover:bg-red-500 border border-[#161717] transition-all"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* PAINEL DE AÇÃO E FEEDBACK DA FUSÃO */}
          <div className="mt-4 w-full max-w-[340px] flex flex-col items-center">
            {slot1 && slot2 ? (
              <div className="w-full bg-[var(--surface-1)]/80 backdrop-blur-sm border border-[var(--border-subtle)] rounded-lg p-4 flex flex-col items-center">
                <div className="flex justify-between w-full text-sm mb-3">
                  <span className="text-gray-400">Custo da Forja:</span>
                  <span className={`font-bold ${character.gold >= reforgeState.cost ? 'text-yellow-400' : 'text-red-500'}`}>
                    🪙 {reforgeState.cost.toLocaleString()} Ouro
                  </span>
                </div>
                
                {reforgeState.reason && (
                  <div className="text-xs text-red-400/90 text-center bg-red-950/20 border border-red-900/30 rounded p-2 mb-3 w-full">
                    ⚠️ {reforgeState.reason}
                  </div>
                )}

                <button
                  onClick={handleForge}
                  disabled={!reforgeState.valid}
                  className={`w-full py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all shadow-md ${
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

      {/* PAINEL LATERAL DE ESTATÍSTICAS E PRÉVIA */}
      <div className="w-full flex flex-col md:flex-row gap-6">
        
        {/* COMPARAÇÃO DE ATRIBUTOS */}
        <div className="panel flex-1 p-4 flex flex-col h-[280px]">
          <h3 className="text-sm font-bold text-gray-300 border-b border-[var(--border-subtle)] pb-2 mb-3">Soma de Atributos da Fusão</h3>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {slot1 && slot2 ? (
              Object.keys(previewStats).map((statKey) => {
                const key = statKey as keyof BaseStats;
                const val1 = slot1.stats[key] || 0;
                const val2 = slot2.stats[key] || 0;
                const total = previewStats[key] || 0;
                if (total === 0) return null;
                return (
                  <div key={key} className="flex flex-col text-xs bg-[var(--surface-2)]/60 border border-[var(--border-subtle)] rounded p-2">
                    <span className="font-semibold text-gray-300">{statLabels[key]}</span>
                    <div className="flex justify-between items-center mt-1 text-gray-400">
                      <span>Item A: <strong className="text-gray-200">+{val1}</strong></span>
                      <span>+</span>
                      <span>Item B: <strong className="text-gray-200">+{val2}</strong></span>
                      <span className="text-purple-400 font-bold">➔ +{total}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-gray-500 px-4">
                Selecione dois itens compatíveis para ver a soma de atributos resultante aqui.
              </div>
            )}
          </div>
        </div>

        {/* FEEDBACK DO ÚLTIMO ITEM CRIADO */}
        {successItem && (
          <div className="panel flex-1 bg-gradient-to-b from-[var(--surface-glass)] to-[#2e1065]/15 border border-purple-500/30 p-4 shadow-lg animate-tabFade relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Sucesso</span>
              <button 
                onClick={() => setSuccessItem(null)}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                Dispensar
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-1)] border border-[#d946ef] flex items-center justify-center text-2xl shadow-[0_0_10px_rgba(217,70,239,0.3)]">
                {successItem.slot === 'weapon' ? '⚔️' : successItem.slot === 'head' ? '🪖' : successItem.slot === 'chest' ? '🛡️' : successItem.slot === 'legs' ? '👖' : '🧤'}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#d946ef]">{successItem.name}</h4>
                <p className="text-[10px] text-gray-400">Equipamento Místico nível +{successItem.mysticLevel}</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] space-y-1">
              {Object.keys(successItem.stats).map((k) => {
                const key = k as keyof BaseStats;
                const value = successItem.stats[key];
                if (!value) return null;
                return (
                  <div key={key} className="flex justify-between text-[11px]">
                    <span className="text-gray-400">{statLabels[key]}</span>
                    <span className="text-purple-400 font-bold">+{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* MODAL DE SELEÇÃO DE ITENS DO INVENTÁRIO */}
      {activeSelectionSlot !== null && (
        <div className="absolute inset-0 bg-[var(--surface-0)]/90 backdrop-blur-md flex items-center justify-center z-20 p-4">
          <div className="panel w-full max-w-[460px] max-h-[85vh] flex flex-col">
            
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

            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
              {getEligibleItems().length > 0 ? (
                getEligibleItems().map((item) => (
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
                    className="flex items-center justify-between p-3 bg-[var(--surface-1)]/55 hover:bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg cursor-pointer transition-all hover:border-purple-500/40 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center text-xl group-hover:border-purple-500/20">
                        {item.slot === 'weapon' ? '⚔️' : item.slot === 'head' ? '🪖' : item.slot === 'chest' ? '🛡️' : item.slot === 'legs' ? '👖' : '🧤'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-200" style={{ color: rarityColors[item.rarity] }}>
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
                            {statLabels[key].split(' ')[0]}: +{item.stats[key]}
                          </div>
                        );
                      })}
                      {Object.keys(item.stats).length > 2 && <div>...</div>}
                    </div>
                  </div>
                ))
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
              )}
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

      {/* TOAST DE AVISO / FEEDBACK */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          <div 
            className={`px-4 py-3 rounded-lg border shadow-xl flex items-center gap-2 animate-slideUp text-xs font-semibold ${
              toast.type === 'success' 
                ? 'bg-purple-950/70 border-purple-500 text-purple-200' 
                : 'bg-red-950/70 border-red-500 text-red-200'
            }`}
          >
            <span>{toast.type === 'success' ? '✨' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
};
