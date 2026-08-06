import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { FORGE_WORKSHOP_MAX_LEVEL, FORGE_WORKSHOP_UPGRADE_COST, FORGE_ORDER_GOLD_COST, FORGE_ORDER_WOOD_COST, FORGE_ORDER_CRYSTAL_YIELD, FORGE_ORDER_HOURS } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { useForgeOrderProgress } from '../../hooks/useForgeOrderProgress';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';
import { CitadelStatRow, CitadelProgressCard, CitadelListCard } from './shared/CitadelUI';
import { getRarityColor, getSetVisual, slotIcons } from '../shared/itemVisuals';
import { ItemDetailModal } from '../shared/ItemDetailModal';
import type { EquipmentItem } from '../../core/types';

const NON_REROLLABLE_SLOTS = new Set(['consumable', 'activeRelic', 'amulet']);

// Picker de item no mesmo padrão de grade de cards da Câmara de Gravação/Oráculo Rúnico
// (itemVisuals.tsx: getSetVisual para borda/glow por raridade/conjunto) — substitui o `<select>`
// nativo, que abria como um menu de navegador fora do estilo do jogo, por um componente que já é
// a linguagem visual estabelecida do jogo para "escolher um item". Clicar num card abre o
// `ItemDetailModal` (mesmas informações do inventário) para o jogador conferir os atributos antes
// de confirmar a seleção, em vez de escolher às cegas só pelo ícone do slot.
const ForgeItemPicker: React.FC<{
  items: EquipmentItem[];
  selectedItemId: string;
  onSelect: (id: string) => void;
}> = ({ items, selectedItemId, onSelect }) => {
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const selected = items.find(i => i.id === selectedItemId) || null;
  const previewItem = items.find(i => i.id === previewItemId) || null;

  if (selected) {
    const visual = getSetVisual(selected);
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          padding: '0.5rem 0.6rem',
          borderRadius: 'var(--radius-sm)',
          background: visual.bg,
          border: visual.border,
          boxShadow: visual.shadow,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', minWidth: 0 }}>
          <span style={{ fontSize: '1.1rem' }}>{slotIcons[selected.slot] || '❔'}</span>
          <span style={{ color: getRarityColor(selected.rarity), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.name} {selected.mysticLevel ? `+${selected.mysticLevel}` : ''}
          </span>
        </span>
        <button type="button" className="btn btn-xs" style={{ flexShrink: 0 }} onClick={() => { AudioManager.getInstance().playClick(); onSelect(''); }}>
          ← Trocar item
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Escolha um item do inventário:</p>
      {items.length === 0 && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Nenhum item elegível no inventário.</p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
        {items.map(item => {
          const visual = getSetVisual(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { AudioManager.getInstance().playClick(); setPreviewItemId(item.id); }}
              title={`${item.name} ${item.mysticLevel ? `+${item.mysticLevel}` : ''} (${item.rarity})`}
              style={{
                width: '58px', height: '64px', borderRadius: '8px', cursor: 'pointer',
                background: visual.bg, border: visual.border, boxShadow: visual.shadow,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                color: '#fff',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{slotIcons[item.slot] || '❔'}</span>
              {item.mysticLevel ? <span style={{ fontSize: '0.6rem', color: 'var(--gold-300)' }}>+{item.mysticLevel}</span> : null}
            </button>
          );
        })}
      </div>

      {previewItem && (
        <ItemDetailModal
          item={previewItem}
          originLabel="Inventário"
          onClose={() => setPreviewItemId(null)}
          confirmLabel="Selecionar para a Oficina"
          onConfirm={() => { onSelect(previewItem.id); setPreviewItemId(null); }}
        />
      )}
    </div>
  );
};

export const ForgeWorkshopPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeForgeWorkshop = useGameStore((state) => state.buildOrUpgradeForgeWorkshop);
  const rerollItemStats = useGameStore((state) => state.rerollItemStats);
  const improveOrDestroyItem = useGameStore((state) => state.improveOrDestroyItem);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const forgeWorkshop = citadel?.forgeWorkshop || { level: 0, lastTick: 0 };
  const isBuilt = forgeWorkshop.level > 0;
  const isMasterForger = forgeWorkshop.level >= 5;
  const nextLevel = forgeWorkshop.level + 1;
  const cost = FORGE_WORKSHOP_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.studyInsignias >= cost.studyInsignias;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const upgrading = forgeWorkshop.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);
  const { progressPct, remainingLabel } = useForgeOrderProgress(forgeWorkshop.lastTick, FORGE_ORDER_HOURS * 60 * 60 * 1000);
  const canAffordNextOrder = materials.wood >= FORGE_ORDER_WOOD_COST && character.gold >= FORGE_ORDER_GOLD_COST;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeForgeWorkshop();
  };

  const rerollableItems = character.inventory.filter(i => !NON_REROLLABLE_SLOTS.has(i.slot) && Object.keys(i.stats).length > 0);
  const selectedItem = rerollableItems.find(i => i.id === selectedItemId) || null;
  const rerollCost = selectedItem ? 100 + 100 * (selectedItem.mysticLevel || 0) : 0;
  const improveCost = selectedItem ? 200 + 200 * (selectedItem.mysticLevel || 0) : 0;
  const attemptAlreadyUsed = !!selectedItem && selectedItem.forgeAttemptUsedAtLevel === (selectedItem.mysticLevel || 0);

  const handleReroll = () => {
    if (!selectedItem) return;
    AudioManager.getInstance().playClick();
    const res = rerollItemStats(selectedItem.id);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleImproveOrDestroy = () => {
    if (!selectedItem) return;
    if (!confirm(`Atenção: 1/3 de chance de Melhoria Lendária (+50%), 1/3 de nada acontecer, 1/3 de DESTRUIR "${selectedItem.name}" permanentemente. Custo: ${improveCost} Cristal Rúnico. Deseja prosseguir?`)) return;
    AudioManager.getInstance().playClick();
    const res = improveOrDestroyItem(selectedItem.id);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    if (res.outcome === 'destroyed') setSelectedItemId('');
  };

  return (
    <CitadelBuildingPanel
      icon="🛠️"
      title="Oficina de Automação da Forja"
      subtitle="Converte Ouro e Madeira excedentes em Cristal Rúnico através de ordens de serviço automáticas — a moeda da Forja Mística avançada (fusões +3 em diante) e das funções ativas da Oficina."
      isBuilt={isBuilt}
      level={forgeWorkshop.level}
      maxLevel={FORGE_WORKSHOP_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construída)"
      buildLabel="Construir Oficina"
      costDisplay={<>🪵 {cost.wood} / 🪨 {cost.stone} / 📜 {cost.studyInsignias}</>}
      maxLevelLabel="Oficina no nível máximo — Mestre Forjador."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <CitadelStatRow
          icon="🔮"
          label="Cada ordem de serviço (1h)"
          value={`+${FORGE_ORDER_CRYSTAL_YIELD} Cristal`}
          detail={`consome 🪙 ${FORGE_ORDER_GOLD_COST} + 🪵 ${FORGE_ORDER_WOOD_COST}`}
        />
        <CitadelStatRow icon="🔮" label="Cristal Rúnico atual" value={character.runicCrystals || 0} />
        <CitadelStatRow icon="⚙️" label="Ordens paralelas por hora" value={forgeWorkshop.level} />

        {isBuilt && (
          canAffordNextOrder ? (
            <CitadelProgressCard
              icon="🏗️"
              title="Ordem de serviço em andamento"
              countdown={remainingLabel}
              progressPct={progressPct}
            />
          ) : (
            <p style={{ fontSize: '0.7rem', color: '#f87171', margin: 0 }}>
              ⏸️ Produção pausada: ouro ou madeira insuficientes para a próxima ordem de serviço.
            </p>
          )
        )}
        {isMasterForger && (
          <p style={{ fontSize: '0.85rem', color: 'var(--gold-300)' }}>
            ⚙️ Desmonte Automatizado ativo: equipamentos Comuns e Raros "puros" dropados em combate são convertidos direto em Fragmentos de Forja, sem passar pelo inventário.
          </p>
        )}

        {isBuilt && (
          <CitadelListCard
            icon="🔮"
            title="Funções Ativas da Oficina"
          >
            <ForgeItemPicker
              items={rerollableItems}
              selectedItemId={selectedItemId}
              onSelect={(id) => { setSelectedItemId(id); setFeedback(null); }}
            />

            {selectedItem && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleReroll}
                    disabled={(character.runicCrystals || 0) < rerollCost}
                    className="btn btn-sm"
                    style={{ flex: 1, fontSize: '0.7rem', opacity: (character.runicCrystals || 0) < rerollCost ? 0.5 : 1 }}
                  >
                    🎲 Rerolar Atributos ({rerollCost} 🔮)
                  </button>
                  <button
                    onClick={handleImproveOrDestroy}
                    disabled={(character.runicCrystals || 0) < improveCost || attemptAlreadyUsed}
                    className="btn btn-sm btn-danger"
                    style={{ flex: 1, fontSize: '0.7rem', opacity: ((character.runicCrystals || 0) < improveCost || attemptAlreadyUsed) ? 0.5 : 1 }}
                  >
                    ⚠️ Melhorar ou Destruir ({improveCost} 🔮)
                  </button>
                </div>
                <p style={{ fontSize: '0.62rem', color: '#94a3b8', margin: 0 }}>
                  Rerolagem: sorteia uma fase efetiva entre {Math.max(1, (character.currentStage || 1) - 5)} e {(character.currentStage || 1) + 5} e regera os atributos (pode melhorar ou piorar). Melhorar/Destruir: 1/3 Melhoria Lendária (+50%), 1/3 nada acontece, 1/3 destrói o item — limitado a 1 tentativa por nível de fusão.
                  {attemptAlreadyUsed && ' Você já usou a tentativa de Melhoria/Destruição neste nível de fusão.'}
                </p>
              </>
            )}

            {feedback && (
              <p style={{ fontSize: '0.7rem', color: feedback.type === 'success' ? '#4ade80' : '#f87171', margin: 0 }}>
                {feedback.message}
              </p>
            )}
          </CitadelListCard>
        )}
      </div>
    </CitadelBuildingPanel>
  );
};
