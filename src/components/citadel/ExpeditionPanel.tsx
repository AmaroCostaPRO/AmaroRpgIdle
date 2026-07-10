import React from 'react';
import { useGameStore, CLASS_CONFIGS, isClassUnlocked, getGlobalClassLevels } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';

const GROUP_LABEL: Record<string, string> = {
  warrior: 'Força', paladin: 'Força',
  ranger: 'Destreza', rogue: 'Destreza',
  mage: 'Magia', cleric: 'Magia', necromancer: 'Magia', avatar: 'Magia',
};

const EXPEDITIONS_MAX_LEVEL = 5;

export const ExpeditionPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeExpeditions = useGameStore((state) => state.buildOrUpgradeExpeditions);
  const allocateClassToExpedition = useGameStore((state) => state.allocateClassToExpedition);
  const deallocateClassFromExpedition = useGameStore((state) => state.deallocateClassFromExpedition);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const expeditions = citadel?.expeditions || { level: 0, lastTick: 0, allocatedClassIds: [] };
  const isBuilt = expeditions.level > 0;
  const nextLevel = expeditions.level + 1;
  const maxSlots = expeditions.level >= 5 ? 3 : expeditions.level >= 3 ? 2 : expeditions.level >= 1 ? 1 : 0;
  const cost = {
    wood: Math.round(150 * Math.pow(1.6, nextLevel - 1)),
    stone: Math.round(200 * Math.pow(1.6, nextLevel - 1)),
    meat: Math.round(100 * Math.pow(1.6, nextLevel - 1)),
  };
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.meat >= cost.meat;

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
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-300)' }}>
            🎖️ Quartel de Expedições {isBuilt ? `— Nível ${expeditions.level}` : '(Não construído)'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
            Aloque classes inativas em missões automáticas que geram materiais e Insígnias de Estudo por hora.
          </p>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
          <span>🪵 {materials.wood}</span>
          <span>🪨 {materials.stone}</span>
          <span>🥩 {materials.meat}</span>
          <span>📜 {materials.studyInsignias}</span>
        </div>
      </div>

      {expeditions.level < EXPEDITIONS_MAX_LEVEL ? (
        <button
          onClick={handleUpgrade}
          disabled={!canAffordUpgrade}
          style={{
            alignSelf: 'flex-start',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-accent)',
            background: 'var(--surface-3)',
            color: 'var(--gold-300)',
            cursor: canAffordUpgrade ? 'pointer' : 'not-allowed',
            opacity: canAffordUpgrade ? 1 : 0.5,
          }}
        >
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Quartel'} — 🪵 {cost.wood} / 🪨 {cost.stone} / 🥩 {cost.meat}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Quartel no nível máximo.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
            Classes em expedição ({expeditions.allocatedClassIds.length}/{maxSlots})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {expeditions.allocatedClassIds.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Nenhuma classe alocada.</p>
            )}
            {expeditions.allocatedClassIds.map((classId) => (
              <div
                key={classId}
                onClick={() => deallocateClassFromExpedition(classId)}
                title="Clique para retornar da expedição"
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-accent)',
                  background: 'var(--surface-2)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {CLASS_CONFIGS[classId]?.name || classId} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({GROUP_LABEL[classId]})</span>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
            Classes disponíveis
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {eligibleClasses.filter(id => !expeditions.allocatedClassIds.includes(id)).length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Nenhuma classe disponível para expedição.</p>
            )}
            {eligibleClasses.filter(id => !expeditions.allocatedClassIds.includes(id)).map((classId) => {
              const full = expeditions.allocatedClassIds.length >= maxSlots;
              return (
                <div
                  key={classId}
                  onClick={() => !full && allocateClassToExpedition(classId)}
                  title={full ? 'Sem slots disponíveis' : 'Clique para alocar'}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-2)',
                    cursor: full ? 'not-allowed' : 'pointer',
                    opacity: full ? 0.5 : 1,
                    fontSize: '0.8rem',
                  }}
                >
                  {CLASS_CONFIGS[classId]?.name || classId} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({GROUP_LABEL[classId]})</span>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
            Força: +25% Pedra/h · Destreza: +25% Madeira e Carne/h · Magia: +30% Insígnias de Estudo/h
          </p>
        </div>
      )}
    </div>
  );
};
