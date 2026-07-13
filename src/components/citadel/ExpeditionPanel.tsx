import React, { useEffect, useState } from 'react';
import { useGameStore, CLASS_CONFIGS, isClassUnlocked, getGlobalClassLevels } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import {
  EXPEDITIONS_MAX_LEVEL, EXPEDITIONS_UPGRADE_COST, EXPEDITIONS_MAX_SLOTS,
  EXPEDITION_ALLOCATION_GOLD_COST, computeClassExpeditionProduction,
} from '../../core/citadelFormulas';

const GROUP_LABEL: Record<string, string> = {
  warrior: 'Força', paladin: 'Força',
  ranger: 'Destreza', rogue: 'Destreza',
  mage: 'Magia', cleric: 'Magia', necromancer: 'Magia', avatar: 'Magia',
};

const getClassHourlyProduction = (classId: string, expeditionLevel: number) =>
  computeClassExpeditionProduction(classId, expeditionLevel, 1);

const EXPEDITION_ALLOCATION_DURATION_HOURS = 8;

const formatRemaining = (ms: number): string => {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export const ExpeditionPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeExpeditions = useGameStore((state) => state.buildOrUpgradeExpeditions);
  const allocateClassToExpedition = useGameStore((state) => state.allocateClassToExpedition);
  const deallocateClassFromExpedition = useGameStore((state) => state.deallocateClassFromExpedition);

  // Força a UI a se atualizar periodicamente para manter a contagem regressiva das expedições correta
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Exige confirmação explícita antes de alocar (gasta ouro) ou retirar (perde o tempo
  // restante) uma classe, para evitar toques/cliques acidentais nesses cartões.
  const [pendingAction, setPendingAction] = useState<{ type: 'allocate' | 'deallocate'; classId: string } | null>(null);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const expeditions = citadel?.expeditions || { level: 0, lastTick: 0, allocatedClasses: [] };
  const isBuilt = expeditions.level > 0;
  const nextLevel = expeditions.level + 1;
  const maxSlots = EXPEDITIONS_MAX_SLOTS(expeditions.level);
  const cost = EXPEDITIONS_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.meat >= cost.meat;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const allocationGoldCost = EXPEDITION_ALLOCATION_GOLD_COST(expeditions.level);
  const allocatedClassIds = expeditions.allocatedClasses.map((a) => a.classId);

  const globalLevels = getGlobalClassLevels();
  const eligibleClasses = Object.keys(CLASS_CONFIGS).filter((classId) => {
    if (classId === character.classId) return false;
    if (!isClassUnlocked(classId, character.classLevels || {})) return false;
    const level = Math.max(character.classLevels?.[classId] || 0, globalLevels[classId] || 0);
    return level > 0;
  });

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeExpeditions();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
            🎖️ Quartel de Expedições {isBuilt ? `— Nível ${expeditions.level}` : '(Não construído)'}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Pague ouro para enviar uma classe inativa em expedição por {EXPEDITION_ALLOCATION_DURATION_HOURS}h, gerando materiais e Insígnias de Estudo por hora automaticamente. Cada nível do Quartel aumenta a produção por hora em +15% (além de liberar mais slots).
          </p>
        </div>
      </div>

      {expeditions.level < EXPEDITIONS_MAX_LEVEL ? (
        <>
          <button
            onClick={handleUpgrade}
            disabled={!canAffordUpgrade || lockedByCommandCenter}
            className="btn btn-gold"
            style={{ alignSelf: 'flex-start' }}
          >
            {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Quartel'} — 🪵 {cost.wood} / 🪨 {cost.stone} / 🥩 {cost.meat}
          </button>
          {lockedByCommandCenter && (
            <p style={{ fontSize: '0.68rem', color: '#f87171', margin: 0 }}>🏛️ Requer o Centro de Comando no Nível {nextLevel}.</p>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Quartel no nível máximo.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: 0 }}>
            Classes em expedição ({expeditions.allocatedClasses.length}/{maxSlots})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {expeditions.allocatedClasses.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Nenhuma classe alocada.</p>
            )}
            {expeditions.allocatedClasses.map(({ classId, expiresAt }) => {
              const prod = getClassHourlyProduction(classId, expeditions.level);
              const remainingMs = expiresAt - Date.now();
              const isConfirming = pendingAction?.type === 'deallocate' && pendingAction.classId === classId;

              if (isConfirming) {
                return (
                  <div
                    key={classId}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #f87171',
                      background: 'rgba(248,113,113,0.08)',
                      fontSize: '0.75rem',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      maxWidth: '220px',
                    }}
                  >
                    <div>Retornar {CLASS_CONFIGS[classId]?.name || classId} agora? Perde o tempo restante ({formatRemaining(remainingMs)}).</div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => { AudioManager.getInstance().playClick(); setPendingAction(null); }}
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, fontSize: '0.65rem' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => { AudioManager.getInstance().playClick(); deallocateClassFromExpedition(classId); setPendingAction(null); }}
                        className="btn btn-danger btn-sm"
                        style={{ flex: 1, fontSize: '0.65rem' }}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={classId}
                  onClick={() => { AudioManager.getInstance().playClick(); setPendingAction({ type: 'deallocate', classId }); }}
                  title="Clique para retornar a classe agora (perde o tempo restante)"
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-accent)',
                    background: 'linear-gradient(135deg, var(--surface-3), var(--surface-2))',
                    boxShadow: 'var(--shadow-button)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#fff',
                    textAlign: 'left',
                  }}
                >
                  <div>{CLASS_CONFIGS[classId]?.name || classId} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({GROUP_LABEL[classId]})</span></div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--gold-300)', marginTop: '0.2rem' }}>
                    🪵{prod.wood.toFixed(1)} · 🪨{prod.stone.toFixed(1)} · 🥩{prod.meat.toFixed(1)} · 📜{prod.studyInsignias.toFixed(1)} /h
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                    ⏳ Retorna em {formatRemaining(remainingMs)}
                  </div>
                </button>
              );
            })}
          </div>

          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: '0.5rem 0 0 0' }}>
            Classes disponíveis
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {eligibleClasses.filter(id => !allocatedClassIds.includes(id)).length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Nenhuma classe disponível para expedição.</p>
            )}
            {eligibleClasses.filter(id => !allocatedClassIds.includes(id)).map((classId) => {
              const slotsFull = expeditions.allocatedClasses.length >= maxSlots;
              const canAffordAllocation = character.gold >= allocationGoldCost;
              const disabled = slotsFull || !canAffordAllocation;
              const prod = getClassHourlyProduction(classId, expeditions.level);
              const isConfirming = pendingAction?.type === 'allocate' && pendingAction.classId === classId;

              if (isConfirming) {
                return (
                  <div
                    key={classId}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--gold-400)',
                      background: 'rgba(245,158,11,0.08)',
                      fontSize: '0.75rem',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      maxWidth: '220px',
                    }}
                  >
                    <div>Enviar {CLASS_CONFIGS[classId]?.name || classId} em expedição por {EXPEDITION_ALLOCATION_DURATION_HOURS}h? Custa 🪙 {allocationGoldCost}.</div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => { AudioManager.getInstance().playClick(); setPendingAction(null); }}
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, fontSize: '0.65rem' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => { AudioManager.getInstance().playClick(); allocateClassToExpedition(classId); setPendingAction(null); }}
                        className="btn btn-gold btn-sm"
                        style={{ flex: 1, fontSize: '0.65rem' }}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={classId}
                  onClick={() => { if (!disabled) { AudioManager.getInstance().playClick(); setPendingAction({ type: 'allocate', classId }); } }}
                  disabled={disabled}
                  title={slotsFull ? 'Sem slots disponíveis' : !canAffordAllocation ? 'Ouro insuficiente' : `Clique para alocar por ${EXPEDITION_ALLOCATION_DURATION_HOURS}h`}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'linear-gradient(135deg, var(--surface-3), var(--surface-2))',
                    boxShadow: 'var(--shadow-button)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    fontSize: '0.8rem',
                    color: '#fff',
                    textAlign: 'left',
                  }}
                >
                  <div>{CLASS_CONFIGS[classId]?.name || classId} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({GROUP_LABEL[classId]})</span></div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    🪵{prod.wood.toFixed(1)} · 🪨{prod.stone.toFixed(1)} · 🥩{prod.meat.toFixed(1)} · 📜{prod.studyInsignias.toFixed(1)} /h
                  </div>
                  <div style={{ fontSize: '0.6rem', color: canAffordAllocation ? 'var(--gold-300)' : '#f87171', marginTop: '0.15rem' }}>
                    🪙 {allocationGoldCost} · {EXPEDITION_ALLOCATION_DURATION_HOURS}h de expedição
                  </div>
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Cada classe alocada custa 🪙 {allocationGoldCost} e produz os valores acima por hora (mesmo offline) durante {EXPEDITION_ALLOCATION_DURATION_HOURS}h, retornando automaticamente ao fim do prazo. Grupo <strong>Força</strong>: +25% Pedra · <strong>Destreza</strong>: +25% Madeira e Carne · <strong>Magia</strong>: +30% Insígnias de Estudo — bônus de grupo e de nível do Quartel (+15%/nível) já incluídos nos números mostrados.
          </p>
        </div>
      )}
    </div>
  );
};
