import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, SKILLS_CATALOG, PRESTIGE_UPGRADES_CATALOG, CLASS_CONFIGS, SKILL_BASE_MULTIPLIERS } from '../store/useGameStore';
import { bridge } from '../bridge/GameBridge';
import { GameEvent, BaseStats, EquipmentItem } from '../core/types';
import { StatEngine, SET_BONUSES } from '../core/StatEngine';
import { ENEMY_TYPES } from '../core/CombatFSM';
import { AudioManager } from '../core/AudioManager';
import { SavesMenu } from './SavesMenu';


/**
 * HUD Component - High Frequency Feedback via Direct DOM Manipulation.
 * Bypasses React state for performance on HP/Mana updates.
 */
const GameHUD: React.FC = () => {
  const hpBarRef = useRef<HTMLDivElement>(null);
  const manaBarRef = useRef<HTMLDivElement>(null);
  const hpTextRef = useRef<HTMLSpanElement>(null);
  const manaTextRef = useRef<HTMLSpanElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  useEffect(() => {
    bridge.registerDomUpdate('player_hp', (pct, current, max) => {
      if (hpBarRef.current) hpBarRef.current.style.width = `${pct}%`;
      if (hpTextRef.current && current !== undefined && max !== undefined) {
        hpTextRef.current.innerText = `${current} / ${max}`;
      }
    });

    bridge.registerDomUpdate('player_mana', (pct, current, max) => {
      if (manaBarRef.current) manaBarRef.current.style.width = `${pct}%`;
      if (manaTextRef.current && current !== undefined && max !== undefined) {
        manaTextRef.current.innerText = `${current} / ${max}`;
      }
    });

    const logs: string[] = [];
    const unsubscribeLogs = bridge.subscribe(GameEvent.LOG_EMITTED, (payload) => {
      if (logRef.current && payload.message) {
        logs.push(payload.message);
        if (logs.length > 4) {
          logs.shift();
        }
        logRef.current.innerHTML = logs.map((log, idx) => {
          const isLatest = idx === logs.length - 1;
          return `<div style="font-family: var(--font-mono); font-size: 0.62rem; line-height: 1.4; margin-bottom: 0.2rem; color: ${isLatest ? '#fff' : '#94a3b8'}; text-shadow: ${isLatest ? '0 0 4px rgba(255,255,255,0.2)' : 'none'}; opacity: ${isLatest ? 1 : 0.45 + idx * 0.12}">${log}</div>`;
        }).join('');
        
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    });

    return () => unsubscribeLogs();
  }, []);

  return (
    <div className="panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', pointerEvents: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Status do Personagem</span>
          <span className="combat-indicator">● Em Combate</span>
        </div>
        
        {/* Barra de HP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: '#cbd5e1' }}>
            <span className="font-heading" style={{ letterSpacing: '0.05em' }}>Vida (HP)</span>
            <span ref={hpTextRef} className="font-mono" style={{ fontSize: '0.6rem', color: '#f87171' }}>- / -</span>
          </div>
          <div className="progress-track progress-hp" style={{ height: '1rem' }}>
            <div ref={hpBarRef} className="progress-fill" style={{ width: '100%', background: 'linear-gradient(90deg, var(--hp-from), var(--hp-to))', boxShadow: '0 0 10px var(--hp-glow)' }} />
          </div>
        </div>

        {/* Barra de Mana */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: '#cbd5e1' }}>
            <span className="font-heading" style={{ letterSpacing: '0.05em' }}>Mana</span>
            <span ref={manaTextRef} className="font-mono" style={{ fontSize: '0.6rem', color: '#60a5fa' }}>- / -</span>
          </div>
          <div className="progress-track progress-mana" style={{ height: '0.75rem' }}>
            <div ref={manaBarRef} className="progress-fill" style={{ width: '100%', background: 'linear-gradient(90deg, var(--mana-from), var(--mana-to))', boxShadow: '0 0 10px var(--mana-glow)' }} />
          </div>
        </div>
      </div>

      {/* Console de Combate */}
      <div className={`combat-console combat-console-wrapper ${isConsoleExpanded ? 'expanded' : 'collapsed'}`}>
        <button
          onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
          className="console-toggle-btn"
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            outline: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            color: 'inherit',
            display: 'block'
          }}
        >
          <div className="console-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, border: 'none', paddingBottom: 0 }}>
            <span>Console de Combate</span>
            <span className={`console-arrow ${isConsoleExpanded ? 'expanded' : 'collapsed'}`} style={{ fontSize: '0.65rem' }}>
              ▼
            </span>
          </div>
        </button>
        <div 
          ref={logRef} 
          className="console-log-content"
          style={{ 
            color: '#4ade80',
            fontSize: '0.65rem',
            lineHeight: 1.4
          }}
        >
          Aguardando início do combate sidescrolling...
        </div>
      </div>
    </div>
  );
};

const ActiveSkillsPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const classId = character.classId || 'warrior';
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubscribe = bridge.subscribe(GameEvent.COOLDOWNS_CHANGED, (payload: any) => {
      if (payload && payload.cooldowns) {
        setCooldowns({ ...payload.cooldowns });
      }
    });
    return () => unsubscribe();
  }, []);

  const triggerSkill = (skillId: string) => {
    console.log(`Triggering skill via UI: ${skillId}`);
    bridge.emit(GameEvent.EQUIP_SKILL, { skillId });
  };

  // Filtra apenas as habilidades ativas desbloqueadas do personagem
  const activeSkills = Object.entries(SKILLS_CATALOG).filter(([id, skill]) => {
    const isClassSkill = skill.classId === classId || skill.classId === 'common';
    const isUnlocked = (character.skillLevels[id] || 0) > 0;
    return isClassSkill && isUnlocked && skill.type === 'active';
  });

  const isAutoCastUnlocked = character.highestStageReached > 5 || character.currentStage > 5;

  return (
    <div className="panel" style={{ padding: '1rem', color: '#fff', pointerEvents: 'auto' }}>
      <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>Habilidades Ativas Desbloqueadas</h2>
      {activeSkills.length === 0 ? (
        <p style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
          Nenhuma habilidade ativa desbloqueada na árvore de habilidades.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {activeSkills.map(([id, skill]) => {
            const level = character.skillLevels[id] || 0;
            const manaCost = id === 'heal' ? 12 : (id === 'slash' ? 8 : (id === 'fireball' ? 15 : 10 + skill.requiredLevel * 1.5));
            const cooldownMs = cooldowns[id] || 0;
            const isOnCooldown = cooldownMs > 0;
            const cooldownSec = Math.ceil(cooldownMs / 1000);

            return (
              <button
                key={id}
                onClick={() => {
                  if (!isOnCooldown) {
                    AudioManager.getInstance().playClick();
                    triggerSkill(id);
                  }
                }}
                disabled={isOnCooldown}
                className="btn-skill-combat"
              >
                {isOnCooldown && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem', color: '#f87171', zIndex: 10 }}>
                    RECARGA {cooldownSec}s
                  </div>
                )}
                <span className="font-heading" style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold-400)' }}>{skill.name}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: '#94a3b8' }}>Lvl {level}</span>
                  <span className="font-mono" style={{ fontSize: '0.45rem', color: '#60a5fa', letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 600 }}>{Math.floor(manaCost)} Mana</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Seção de Auto-Cast */}
      {isAutoCastUnlocked ? (
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#cbd5e1' }}>Conjuração Automática</span>
            <span style={{ fontSize: '0.5rem', color: '#64748b', lineHeight: 1.4 }}>Usa habilidades fora de recarga.</span>
          </div>
          <button
            onClick={() => {
              AudioManager.getInstance().playClick();
              useGameStore.getState().toggleAutoCast();
            }}
            className={`btn btn-sm ${character.autoCastEnabled ? 'btn-emerald' : 'btn-ghost'}`}
          >
            {character.autoCastEnabled ? 'ATIVADO' : 'DESATIVADO'}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5, background: 'rgba(0,0,0,0.1)', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>Conjuração Automática</span>
            <span style={{ fontSize: '0.5rem', color: '#475569', lineHeight: 1.4 }}>Desbloqueia após vencer a Fase 5.</span>
          </div>
          <span className="badge badge-locked">Bloqueado</span>
        </div>
      )}
    </div>
  );
};

const AttributePanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const upgradeAttribute = useGameStore((state) => state.upgradeAttribute);
  const availablePoints = character.attributePoints;
  const xpNeeded = character.level * 100;

  const handleUpgradeAttribute = (attr: string) => {
    upgradeAttribute(attr as keyof BaseStats);
  };

  const getAttrName = (attr: string): string => {
    switch (attr) {
      case 'strength': return 'Força (Dano Guerreiro)';
      case 'magic': return 'Magia (Dano Mago/Clérigo)';
      case 'dexterity': return 'Destreza (Dano Arqueiro/Ladrão)';
      case 'constitution': return 'Constituição (Dano Paladino)';
      case 'luck': return 'Sorte (Drop & Raridade de Itens)';
      default: return attr;
    }
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto' }}>
      {/* Barra de Experiência e Nível */}
      <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', marginBottom: '0.4rem' }}>
          <span className="font-heading" style={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold-400)' }}>
            {CLASS_CONFIGS[character.classId]?.name || character.classId} (Lv. {character.level})
          </span>
          <span className="font-mono" style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{character.xp} / {xpNeeded} XP</span>
        </div>
        <div className="progress-track progress-xp" style={{ height: '0.5rem' }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, (character.xp / xpNeeded) * 100)}%`, background: 'linear-gradient(90deg, var(--xp-from), var(--xp-to))', boxShadow: '0 0 8px var(--xp-glow)' }} />
        </div>
      </div>

      <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>Atributos Primários</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Object.keys(character.baseStats).map((attr) => (
          <div key={attr} className="stat-row">
            <span style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column' }}>
              <span className="font-heading" style={{ fontWeight: 700, color: '#fff', fontSize: '0.7rem' }}>{getAttrName(attr)}</span>
              <span className="font-mono" style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.15rem' }}>Valor base: {character.baseStats[attr as keyof BaseStats]}</span>
            </span>
            <button
              onClick={() => handleUpgradeAttribute(attr)}
              disabled={availablePoints <= 0}
              className={`btn btn-sm ${availablePoints > 0 ? 'btn-gold' : 'btn-ghost'}`}
              style={{ minWidth: '3rem' }}
            >
              +1
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
          <span style={{ color: '#94a3b8' }}>Pontos de Atributos Disponíveis:</span>
          <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.72rem', color: availablePoints > 0 ? 'var(--gold-400)' : '#64748b', animation: availablePoints > 0 ? 'text-glow-gold 2s infinite ease-in-out' : 'none' }}>
            {availablePoints}
          </span>
        </div>
      </div>
    </div>
  );
};

const EquipmentPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const discardItem = useGameStore((state) => state.discardItem);

  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const finalStats = StatEngine.calculateFinalStats(character);
  const baseStats = character.baseStats;

  // Contabilizar peças dos conjuntos equipados
  const equippedItems = Object.values(character.equipment || {}).filter(Boolean) as EquipmentItem[];
  const setCounts: Record<string, number> = {};
  equippedItems.forEach((item) => {
    if (item.setName) {
      setCounts[item.setName] = (setCounts[item.setName] || 0) + 1;
    }
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'raro': return '#3b82f6';
      case 'lendário': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'raro': return 'rgba(59, 130, 246, 0.15)';
      case 'lendário': return 'rgba(245, 158, 11, 0.15)';
      default: return 'rgba(148, 163, 184, 0.1)';
    }
  };

  const slotLabels: Record<string, string> = {
    head: 'Cabeça',
    chest: 'Peito',
    legs: 'Pernas',
    gloves: 'Luvas',
    weapon: 'Arma'
  };

  const slotIcons: Record<string, string> = {
    head: '🪖',
    chest: '👕',
    legs: '👖',
    gloves: '🧤',
    weapon: '⚔️'
  };

  const statLabels: Record<string, string> = {
    strength: 'Força',
    magic: 'Magia',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    luck: 'Sorte'
  };

  const maxSlots = character.inventorySlots || 30;
  const inventoryGrid = Array.from({ length: maxSlots }, (_, i) => character.inventory[i] || null);

  const handleEquip = (item: EquipmentItem) => {
    AudioManager.getInstance().playClick();
    equipItem(item.id);
    setSelectedItem(null);
  };

  const handleUnequip = (slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon') => {
    AudioManager.getInstance().playClick();
    unequipItem(slot);
    setSelectedSlot(null);
  };

  const handleDiscard = (itemId: string) => {
    AudioManager.getInstance().playClick();
    discardItem(itemId);
    setSelectedItem(null);
    setShowDiscardConfirm(false);
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Layout de Duas Colunas Superior */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Visualização de Equipados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: 0 }}>
            Equipamento Atual
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateRows: 'repeat(3, auto)',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            alignItems: 'center',
            justifyItems: 'center',
            background: 'rgba(0,0,0,0.2)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-dim)',
            position: 'relative'
          }}>
            {/* Cabeça */}
            <div style={{ gridRow: '1', gridColumn: '2' }}>
              <EquipmentSlot 
                slot="head" 
                item={character.equipment.head} 
                onClick={() => character.equipment.head && setSelectedSlot('head')}
                icons={slotIcons}
                labels={slotLabels}
                getRarityColor={getRarityColor}
                getRarityBg={getRarityBg}
              />
            </div>

            {/* Luvas */}
            <div style={{ gridRow: '2', gridColumn: '1' }}>
              <EquipmentSlot 
                slot="gloves" 
                item={character.equipment.gloves} 
                onClick={() => character.equipment.gloves && setSelectedSlot('gloves')}
                icons={slotIcons}
                labels={slotLabels}
                getRarityColor={getRarityColor}
                getRarityBg={getRarityBg}
              />
            </div>

            {/* Peito */}
            <div style={{ gridRow: '2', gridColumn: '2' }}>
              <EquipmentSlot 
                slot="chest" 
                item={character.equipment.chest} 
                onClick={() => character.equipment.chest && setSelectedSlot('chest')}
                icons={slotIcons}
                labels={slotLabels}
                getRarityColor={getRarityColor}
                getRarityBg={getRarityBg}
              />
            </div>

            {/* Arma */}
            <div style={{ gridRow: '2', gridColumn: '3' }}>
              <EquipmentSlot 
                slot="weapon" 
                item={character.equipment.weapon} 
                onClick={() => character.equipment.weapon && setSelectedSlot('weapon')}
                icons={slotIcons}
                labels={slotLabels}
                getRarityColor={getRarityColor}
                getRarityBg={getRarityBg}
              />
            </div>

            {/* Pernas */}
            <div style={{ gridRow: '3', gridColumn: '2' }}>
              <EquipmentSlot 
                slot="legs" 
                item={character.equipment.legs} 
                onClick={() => character.equipment.legs && setSelectedSlot('legs')}
                icons={slotIcons}
                labels={slotLabels}
                getRarityColor={getRarityColor}
                getRarityBg={getRarityBg}
              />
            </div>
          </div>
        </div>

        {/* Atributos Consolidados & Sets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: 0 }}>
            Atributos Totais & Conjuntos
          </h3>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem', 
            background: 'rgba(0,0,0,0.2)', 
            padding: '0.75rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-dim)' 
          }}>
            {Object.keys(baseStats).map((statKey) => {
              const base = baseStats[statKey as keyof BaseStats] || 0;
              const final = finalStats[statKey as keyof BaseStats] || 0;
              const bonus = final - base;

              return (
                <div key={statKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span className="font-heading" style={{ fontWeight: 600, color: '#cbd5e1' }}>{statLabels[statKey] || statKey}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="font-mono" style={{ fontWeight: 700 }}>{final}</span>
                    {bonus > 0 && (
                      <span className="font-mono" style={{ color: '#10b981', fontSize: '0.62rem' }}>+{bonus}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Listagem de Bônus de Conjunto Ativos */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.4rem',
            background: 'rgba(0,0,0,0.15)',
            padding: '0.6rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <span className="font-heading" style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Conjuntos Ativos
            </span>
            {Object.keys(SET_BONUSES).map((setName) => {
              const count = setCounts[setName] || 0;
              const config = SET_BONUSES[setName];
              if (!config) return null;
              
              const isAnyBonusActive = count >= 2;

              return (
                <div key={setName} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', opacity: isAnyBonusActive ? 1 : 0.4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                    <span style={{ fontWeight: 700, color: isAnyBonusActive ? 'var(--gold-400)' : '#cbd5e1' }}>{setName}</span>
                    <span className="font-mono" style={{ fontSize: '0.6rem' }}>{count}/5 Peças</span>
                  </div>
                  {isAnyBonusActive && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.1rem' }}>
                      <span className="badge" style={{ fontSize: '0.5rem', background: count >= 2 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: count >= 2 ? '#34d399' : '#64748b', border: count >= 2 ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent' }}>
                        (2) +15 Atributo
                      </span>
                      <span className="badge" style={{ fontSize: '0.5rem', background: count >= 3 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: count >= 3 ? '#34d399' : '#64748b', border: count >= 3 ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent' }}>
                        (3) +20 Con/For
                      </span>
                      <span className="badge" style={{ fontSize: '0.5rem', background: count >= 5 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: count >= 5 ? '#34d399' : '#64748b', border: count >= 5 ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent' }}>
                        (5) +35 Atributo
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {Object.values(setCounts).length === 0 && (
              <span style={{ fontSize: '0.6rem', color: '#64748b', fontStyle: 'italic' }}>Nenhum conjunto ativo equipado.</span>
            )}
          </div>
        </div>
      </div>

      {/* Inventário */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem' }}>
          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', margin: 0 }}>
            Inventário de Itens
          </h3>
          <span className="font-mono" style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>
            Slots ocupados: {character.inventory.length} / {maxSlots}
          </span>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))', 
          gap: '0.5rem',
          background: 'rgba(0,0,0,0.15)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-dim)'
        }}>
          {inventoryGrid.map((item, idx) => {
            if (!item) {
              return (
                <div 
                  key={`empty-${idx}`} 
                  style={{
                    aspectRatio: '1',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px dashed rgba(255,255,255,0.06)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.55rem',
                    color: '#334155',
                    userSelect: 'none'
                  }}
                >
                  {idx + 1}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  setSelectedItem(item);
                }}
                className="inventory-item-slot"
                style={{
                  aspectRatio: '1',
                  background: getRarityBg(item.rarity),
                  border: `2px solid ${getRarityColor(item.rarity)}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{slotIcons[item.slot]}</span>
                {item.rarity === 'legendary' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    right: '2px', 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    background: '#f59e0b',
                    boxShadow: '0 0 4px #f59e0b'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal / Detalhes de Item do Inventário */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }} onClick={() => { setSelectedItem(null); setShowDiscardConfirm(false); }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 10, 25, 0.98), rgba(6, 4, 10, 0.99))',
            border: `2px solid ${getRarityColor(selectedItem.rarity)}`,
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            width: '100%',
            maxWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} onClick={() => setSelectedItem(null)}>✕</button>

            <div>
              <span className="font-mono" style={{ fontSize: '0.5rem', color: getRarityColor(selectedItem.rarity), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {selectedItem.rarity} • {slotLabels[selectedItem.slot]}
              </span>
              <h4 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0.1rem 0 0.5rem 0', color: getRarityColor(selectedItem.rarity) }}>
                {selectedItem.name}
              </h4>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Atributos do Item</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                {Object.entries(selectedItem.stats).map(([stat, val]) => (
                  <span key={stat} className="font-mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                    +{val} {statLabels[stat] || stat}
                  </span>
                ))}
              </div>
            </div>

            {selectedItem.setName && (
              <div style={{ fontSize: '0.6rem', color: 'var(--gold-400)', fontWeight: 600 }}>
                Conjunto: {selectedItem.setName}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
              <button 
                onClick={() => handleEquip(selectedItem)}
                className="btn btn-sm btn-gold" 
                style={{ width: '100%' }}
              >
                Equipar Item
              </button>

              {showDiscardConfirm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.55rem', color: '#f87171', textAlign: 'center' }}>Confirmar destruição permanente?</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleDiscard(selectedItem.id)} className="btn btn-sm btn-danger" style={{ flex: 1 }}>Sim, Descartar</button>
                    <button onClick={() => setShowDiscardConfirm(false)} className="btn btn-sm btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowDiscardConfirm(true)}
                  className="btn btn-sm btn-danger" 
                  style={{ width: '100%', opacity: 0.8 }}
                >
                  Descartar / Destruir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Detalhes de Item Equipado */}
      {selectedSlot && character.equipment[selectedSlot] && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }} onClick={() => setSelectedSlot(null)}>
          {(() => {
            const item = character.equipment[selectedSlot]!;
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 10, 25, 0.98), rgba(6, 4, 10, 0.99))',
                border: `2px solid ${getRarityColor(item.rarity)}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                width: '100%',
                maxWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
              }} onClick={(e) => e.stopPropagation()}>
                <button style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} onClick={() => setSelectedSlot(null)}>✕</button>

                <div>
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: getRarityColor(item.rarity), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    EQUIPADO • {slotLabels[selectedSlot]}
                  </span>
                  <h4 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0.1rem 0 0.5rem 0', color: getRarityColor(item.rarity) }}>
                    {item.name}
                  </h4>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Atributos do Item</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                    {Object.entries(item.stats).map(([stat, val]) => (
                      <span key={stat} className="font-mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                        +{val} {statLabels[stat] || stat}
                      </span>
                    ))}
                  </div>
                </div>

                {item.setName && (
                  <div style={{ fontSize: '0.6rem', color: 'var(--gold-400)', fontWeight: 600 }}>
                    Conjunto: {item.setName}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button 
                    onClick={() => handleUnequip(selectedSlot)}
                    className="btn btn-sm btn-gold" 
                    style={{ width: '100%' }}
                  >
                    Desequipar Item
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para renderizar cada slot de equipamento
const EquipmentSlot: React.FC<{
  slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon';
  item: EquipmentItem | null;
  onClick: () => void;
  icons: Record<string, string>;
  labels: Record<string, string>;
  getRarityColor: (rarity: string) => string;
  getRarityBg: (rarity: string) => string;
}> = ({ slot, item, onClick, icons, labels, getRarityColor, getRarityBg }) => {
  return (
    <button
      onClick={() => item && onClick()}
      style={{
        width: '52px',
        height: '52px',
        background: item ? getRarityBg(item.rarity) : 'rgba(0,0,0,0.4)',
        border: item ? `2px solid ${getRarityColor(item.rarity)}` : '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: item ? 'pointer' : 'default',
        padding: 0,
        position: 'relative'
      }}
      title={item ? `${item.name} (${labels[slot]})` : `Vazio (${labels[slot]})`}
    >
      <span style={{ fontSize: '1.2rem', opacity: item ? 1 : 0.25 }}>
        {icons[slot]}
      </span>
      <span style={{ 
        position: 'absolute', 
        bottom: '2px', 
        fontSize: '0.45rem', 
        color: item ? getRarityColor(item.rarity) : '#475569',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {labels[slot]}
      </span>
    </button>
  );
};

const SkillsTreePanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const unlockOrUpgradeSkill = useGameStore((state) => state.unlockOrUpgradeSkill);
  
  const classId = character.classId || 'warrior';
  const availableSkillPoints = character.skillPoints;

  // Filtra as habilidades da classe atual + curas comuns
  const classSkills = Object.entries(SKILLS_CATALOG)
    .filter(([id, s]) => s.classId === classId || s.classId === 'common')
    .sort(([idA], [idB]) => {
      if (idA === 'heal') return -1;
      if (idB === 'heal') return 1;
      return 0;
    });

  // Mapeia coordenadas absolutas em porcentagem no grid da árvore de habilidades
  const getSkillPos = (id: string, skill: any) => {
    if (id === 'heal') return { x: 75, y: 60 };
    
    switch (skill.requiredLevel) {
      case 1:
        return { x: 25, y: 60 };
      case 3:
        if (skill.dependencies.length > 0) return { x: 25, y: 170 };
        return { x: 75, y: 170 }; // Se não tiver dep
      case 5:
        return { x: 75, y: 280 }; // Passiva T3
      case 7:
        return { x: 25, y: 280 }; // Active T4
      case 9:
        return { x: 75, y: 390 }; // Passiva T5
      case 11:
        return { x: 25, y: 390 }; // Active T6
      default:
        return { x: 50, y: 50 };
    }
  };

  const [selectedSkillId, setSelectedSkillId] = useState<string>(classSkills[0]?.[0] || 'heal');
  const [showSkillModal, setShowSkillModal] = useState<boolean>(false);
  const selectedSkill = SKILLS_CATALOG[selectedSkillId];

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Árvore de Habilidades</h2>
        <div style={{ fontSize: '0.72rem' }}>
          <span style={{ color: '#94a3b8' }}>Pontos:</span>
          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--gold-400)', marginLeft: '0.25rem' }}>{availableSkillPoints}</span>
        </div>
      </div>

      {/* Árvore Visual 2D (Desktop) */}
      <div className="tree-view-desktop">
        <div className="tree-container" style={{ height: '470px' }}>
          <div className="tree-content-area">
            {/* Renderiza as linhas de conexões SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {classSkills.map(([id, skill]) => {
                const pos = getSkillPos(id, skill);
                return skill.dependencies.map((depId: string) => {
                  const depSkill = SKILLS_CATALOG[depId];
                  if (!depSkill) return null;
                  const depPos = getSkillPos(depId, depSkill);
                  
                  // Verifica se a conexão está ativa (ambos habilitados)
                  const depUnlocked = (character.skillLevels[depId] || 0) > 0;
                  const currentUnlocked = (character.skillLevels[id] || 0) > 0;
                  const isActive = depUnlocked && currentUnlocked;

                  return (
                    <line
                      key={`${depId}-${id}`}
                      x1={`${depPos.x}%`}
                      y1={`${depPos.y}px`}
                      x2={`${pos.x}%`}
                      y2={`${pos.y}px`}
                      stroke={isActive ? '#f59e0b' : '#374151'}
                      strokeWidth={isActive ? '3' : '2'}
                      strokeDasharray={isActive ? 'none' : '4, 4'}
                      style={{
                        filter: isActive ? 'drop-shadow(0px 0px 3px rgba(245,158,11,0.6))' : 'none',
                        transition: 'all 0.3s'
                      }}
                    />
                  );
                });
              })}
            </svg>

            {/* Renderiza os Nós de Habilidades */}
            {classSkills.map(([id, skill]) => {
              const pos = getSkillPos(id, skill);
              const currentLevel = character.skillLevels[id] || 0;
              const isUnlocked = currentLevel > 0;
              const isSelected = selectedSkillId === id;
              const meetsLevelReq = character.level >= skill.requiredLevel;

              // Posições absolutas centralizadas no grid
              const left = `calc(${pos.x}% - 55px)`;
              const top = `calc(${pos.y}px - 22px)`;

              return (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedSkillId(id);
                    setShowSkillModal(true);
                  }}
                  style={{ left, top }}
                  className={`skill-node ${isSelected ? 'selected' : isUnlocked ? 'unlocked' : !meetsLevelReq ? 'locked' : ''}`}
                >
                  <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '105px' }}>{skill.name}</span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.15rem' }}>
                    <span className={`badge ${skill.type === 'active' ? 'badge-active' : 'badge-passive'}`}>
                      {skill.type === 'active' ? 'Ativ' : 'Pass'}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.5rem', color: '#94a3b8' }}>Lv {currentLevel}/{skill.maxLevel}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Modal de Detalhes da Habilidade (Desktop) */}
          {showSkillModal && selectedSkill && (
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '2rem',
                zIndex: 50,
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              {/* Botão de Fechar Modal (X) */}
              <button 
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  setShowSkillModal(false);
                }}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
                className="hover:text-white"
              >
                ✕
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '36rem', margin: '0 auto' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 className="font-heading" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{selectedSkill.name}</h3>
                    <span className={`badge ${selectedSkill.type === 'active' ? 'badge-active' : 'badge-passive'}`}>
                      {selectedSkill.type === 'active' ? 'Habilidade Ativa' : 'Habilidade Passiva'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.5rem', lineHeight: 1.6 }}>{selectedSkill.description}</p>
                  {selectedSkill.type === 'active' && (() => {
                    const skillLvl = character.skillLevels[selectedSkillId] || 0;
                    const baseMult = SKILL_BASE_MULTIPLIERS[selectedSkillId];
                    
                    let currentText = 'Bloqueado';
                    let nextText = '';

                    if (selectedSkillId === 'heal') {
                      if (skillLvl > 0) {
                        currentText = `Restaura ${(30 + (skillLvl - 1) * 5)}% do HP Máx`;
                      }
                      if (skillLvl < selectedSkill.maxLevel) {
                        nextText = `Restaura ${(30 + skillLvl * 5)}% do HP Máx`;
                      }
                    } else if (baseMult) {
                      if (skillLvl > 0) {
                        const currentPct = (baseMult * (1 + (skillLvl - 1) * 0.15) * 100).toFixed(1);
                        currentText = `Causa ${currentPct}% de Dano`;
                      }
                      if (skillLvl < selectedSkill.maxLevel) {
                        const nextPct = (baseMult * (1 + skillLvl * 0.15) * 100).toFixed(1);
                        nextText = `Causa ${nextPct}% de Dano`;
                      }
                    }

                    return (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Efeito Atual:</span>
                          <span style={{ color: skillLvl > 0 ? 'var(--gold-400)' : '#64748b', fontWeight: 700 }}>{currentText}</span>
                        </div>
                        {nextText && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Próximo Nível:</span>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>{nextText}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nível: {character.skillLevels[selectedSkillId] || 0} / {selectedSkill.maxLevel}</span>
                  <span className="font-heading" style={{ fontSize: '0.65rem', color: 'var(--gold-400)', fontWeight: 600 }}>Requer Level {selectedSkill.requiredLevel}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    {selectedSkill.dependencies.length > 0 ? `Requer ${SKILLS_CATALOG[selectedSkill.dependencies[0]]?.name}` : 'Sem requisitos de habilidades'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        AudioManager.getInstance().playClick();
                        setShowSkillModal(false);
                      }}
                      className="btn btn-sm btn-ghost"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => unlockOrUpgradeSkill(selectedSkillId)}
                      disabled={
                        (character.skillLevels[selectedSkillId] || 0) >= selectedSkill.maxLevel ||
                        availableSkillPoints < selectedSkill.cost ||
                        character.level < selectedSkill.requiredLevel ||
                        !selectedSkill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0)
                      }
                      className={`btn btn-sm ${
                        (character.skillLevels[selectedSkillId] || 0) < selectedSkill.maxLevel &&
                        availableSkillPoints >= selectedSkill.cost &&
                        character.level >= selectedSkill.requiredLevel &&
                        selectedSkill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0)
                          ? 'btn-gold' : 'btn-ghost'
                      }`}
                    >
                      {(character.skillLevels[selectedSkillId] || 0) >= selectedSkill.maxLevel ? 'Nível Máximo' : `Aprimorar (${selectedSkill.cost} SP)`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista Simplificada Vertical (Mobile) - Com Cards Expansíveis */}
      <div className="tree-view-mobile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
          {classSkills.map(([id, skill]) => {
            const currentLevel = character.skillLevels[id] || 0;
            const isUnlocked = currentLevel > 0;
            const isSelected = selectedSkillId === id;
            const meetsLevelReq = character.level >= skill.requiredLevel;
            const meetsDeps = skill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0);
            const isLocked = !meetsLevelReq || !meetsDeps;

            return (
              <div
                key={id}
                className={`skill-list-card ${isSelected ? 'selected' : isUnlocked ? 'unlocked' : isLocked ? 'locked' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  padding: '0.6rem 0.8rem',
                  background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0,0,0,0.3)',
                  border: isSelected ? '1px solid var(--gold-400)' : '1px solid var(--border-dim)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.2s'
                }}
              >
                {/* Cabeçalho do Card Clicável para Expansão */}
                <div
                  onClick={() => {
                    AudioManager.getInstance().playClick();
                    if (selectedSkillId === id) {
                      setSelectedSkillId('');
                    } else {
                      setSelectedSkillId(id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: isLocked ? '#64748b' : '#fff' }}>
                        {skill.name}
                      </span>
                      <span className={`badge ${skill.type === 'active' ? 'badge-active' : 'badge-passive'}`} style={{ fontSize: '0.55rem' }}>
                        {skill.type === 'active' ? 'Ativa' : 'Passiva'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                      {isLocked 
                        ? `Requer Lvl ${skill.requiredLevel}${skill.dependencies.length > 0 ? ` + ${SKILLS_CATALOG[skill.dependencies[0]]?.name}` : ''}`
                        : `Nível ${currentLevel} / ${skill.maxLevel}`
                      }
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isLocked && <span style={{ fontSize: '0.6rem', color: '#64748b' }}>🔒 Bloqueada</span>}
                    {!isLocked && !isUnlocked && <span style={{ fontSize: '0.6rem', color: 'var(--gold-400)' }}>Disponível</span>}
                    {isUnlocked && <span className="font-mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Lv {currentLevel}</span>}
                    
                    <span style={{ fontSize: '0.5rem', color: '#64748b', marginLeft: '0.2rem' }}>
                      {isSelected ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Conteúdo Expandido no Mobile */}
                {isSelected && (
                  <div 
                    className="animate-fadeIn"
                    style={{
                      paddingTop: '0.6rem',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      textAlign: 'left'
                    }}
                  >
                    <p style={{ fontSize: '0.65rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {skill.description}
                    </p>
                    {skill.type === 'active' && (() => {
                      const baseMult = SKILL_BASE_MULTIPLIERS[id];
                      
                      let currentText = 'Bloqueado';
                      let nextText = '';

                      if (id === 'heal') {
                        if (currentLevel > 0) {
                          currentText = `Restaura ${(30 + (currentLevel - 1) * 5)}% do HP Máx`;
                        }
                        if (currentLevel < skill.maxLevel) {
                          nextText = `Restaura ${(30 + currentLevel * 5)}% do HP Máx`;
                        }
                      } else if (baseMult) {
                        if (currentLevel > 0) {
                          const currentPct = (baseMult * (1 + (currentLevel - 1) * 0.15) * 100).toFixed(1);
                          currentText = `Causa ${currentPct}% de Dano`;
                        }
                        if (currentLevel < skill.maxLevel) {
                          const nextPct = (baseMult * (1 + currentLevel * 0.15) * 100).toFixed(1);
                          nextText = `Causa ${nextPct}% de Dano`;
                        }
                      }

                      return (
                        <div style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', fontSize: '0.62rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Efeito Atual:</span>
                            <span style={{ color: currentLevel > 0 ? 'var(--gold-400)' : '#64748b', fontWeight: 700 }}>{currentText}</span>
                          </div>
                          {nextText && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b' }}>Próximo Nível:</span>
                              <span style={{ color: '#10b981', fontWeight: 600 }}>{nextText}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>
                        Custo: {skill.cost} SP
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockOrUpgradeSkill(id);
                        }}
                        disabled={
                          (character.skillLevels[id] || 0) >= skill.maxLevel ||
                          availableSkillPoints < skill.cost ||
                          character.level < skill.requiredLevel ||
                          !skill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0)
                        }
                        className={`btn btn-sm ${
                          (character.skillLevels[id] || 0) < skill.maxLevel &&
                          availableSkillPoints >= skill.cost &&
                          character.level >= skill.requiredLevel &&
                          skill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0)
                            ? 'btn-gold' : 'btn-ghost'
                        }`}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem' }}
                      >
                        {(character.skillLevels[id] || 0) >= skill.maxLevel ? 'Nível Máximo' : `Aprimorar (${skill.cost} SP)`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface PrestigeTreePanelProps {
  onPrestige: () => void;
}

const PrestigeTreePanel: React.FC<PrestigeTreePanelProps> = ({ onPrestige }) => {
  const character = useGameStore((state) => state.character);
  const upgradePrestigeStat = useGameStore((state) => state.upgradePrestigeStat);

  const availablePrestigePoints = character.prestigePoints;
  const level = character.level;
  const xp = character.xp;
  const totalXp = 50 * level * (level - 1) + xp;
  const prestigeEarnedOnReset = Math.floor(Math.pow(totalXp / 1000, 0.85));
  const canPrestige = prestigeEarnedOnReset > 0;

  // Coord do Layout Diamante / Estrela
  const hubPos = { x: 50, y: 220 };
  const getUpgradePos = (id: string) => {
    switch (id) {
      case 'perm_mag': return { x: 50, y: 70 };  // Top
      case 'perm_str': return { x: 18, y: 220 }; // Left
      case 'perm_dex': return { x: 82, y: 220 }; // Right
      case 'perm_con': return { x: 50, y: 370 }; // Bottom
      default: return hubPos;
    }
  };

  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string>('perm_str');
  const [showPrestigeModal, setShowPrestigeModal] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const selectedUpgrade = PRESTIGE_UPGRADES_CATALOG[selectedUpgradeId];

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Ascensão Roguelite</h2>
        <div style={{ fontSize: '0.72rem' }}>
          <span style={{ color: '#94a3b8' }}>Prestígio:</span>
          <span className="font-mono" style={{ fontWeight: 700, color: '#a78bfa', marginLeft: '0.25rem' }}>{availablePrestigePoints}</span>
        </div>
      </div>

      {/* Botão de Reset de Prestígio (no topo) */}
      <div style={{ background: 'rgba(139,92,246,0.06)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 className="font-heading" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: 0 }}>Ascender Alma</h4>
          <span style={{ fontSize: '0.58rem', color: 'rgba(196,181,253,0.6)' }}>Reseta Nível e Combate por PP permanentes</span>
        </div>
        {!showConfirm ? (
          <button
            onClick={() => {
              if (!canPrestige) return;
              AudioManager.getInstance().playClick();
              setShowConfirm(true);
            }}
            className={`btn ${canPrestige ? 'btn-purple' : 'btn-secondary'} btn-sm`}
            style={{ width: '100%', cursor: canPrestige ? 'pointer' : 'not-allowed', opacity: canPrestige ? 1 : 0.5 }}
            disabled={!canPrestige}
          >
            {canPrestige ? `Ascender (+${prestigeEarnedOnReset} PP)` : 'Requer Nível 5+ para obter PP'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.2rem' }}>
            <button
              onClick={() => {
                AudioManager.getInstance().playClick();
                setShowConfirm(false);
              }}
              className="btn btn-ghost btn-sm"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.65rem' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                AudioManager.getInstance().playClick();
                setShowConfirm(false);
                onPrestige();
              }}
              className="btn btn-purple btn-sm"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.65rem', fontWeight: 'bold' }}
            >
              Confirmar
            </button>
          </div>
        )}
      </div>

      {/* Árvore Diamante 2D (Desktop) */}
      <div className="tree-view-desktop">
        <div className="tree-container" style={{ height: '430px' }}>
          <div className="tree-content-area">
            {/* Linhas SVG conectadas ao Hub central */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {Object.keys(PRESTIGE_UPGRADES_CATALOG).map((id) => {
                const pos = getUpgradePos(id);
                const level = character.prestigeUpgrades[id] || 0;
                const isActive = level > 0;
                return (
                  <line
                    key={id}
                    x1={`${hubPos.x}%`}
                    y1={`${hubPos.y}px`}
                    x2={`${pos.x}%`}
                    y2={`${pos.y}px`}
                    stroke={isActive ? '#a78bfa' : '#374151'}
                    strokeWidth={isActive ? '3' : '2'}
                    style={{
                      filter: isActive ? 'drop-shadow(0px 0px 4px rgba(139,92,246,0.6))' : 'none',
                      transition: 'all 0.3s'
                    }}
                  />
                );
              })}
            </svg>

            {/* Hub Central (Cristal de Almas) */}
            <div 
              style={{ left: `calc(${hubPos.x}% - 24px)`, top: `calc(${hubPos.y}px - 24px)` }}
              className="absolute"
            >
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--prestige-from), #4338ca)', borderRadius: '50%', border: '2px solid #a78bfa', boxShadow: 'var(--shadow-glow-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 3s ease-in-out infinite' }}>
                <span className="font-heading" style={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Alma</span>
              </div>
            </div>

            {/* Nós de Upgrade ao Redor */}
            {Object.entries(PRESTIGE_UPGRADES_CATALOG).map(([id, upgrade]) => {
              const pos = getUpgradePos(id);
              const currentLevel = character.prestigeUpgrades[id] || 0;
              const isSelected = selectedUpgradeId === id;
              const isUpgraded = currentLevel > 0;

              const left = `calc(${pos.x}% - 55px)`;
              const top = `calc(${pos.y}px - 22px)`;

              return (
                <button
                  key={id}
                  onClick={() => {
                    AudioManager.getInstance().playClick();
                    setSelectedUpgradeId(id);
                    setShowPrestigeModal(true);
                  }}
                  style={{ left, top }}
                  className={`skill-node prestige-node ${isSelected ? 'selected' : isUpgraded ? 'unlocked' : ''}`}
                >
                  <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '105px' }}>{upgrade.name}</span>
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: '#a78bfa', marginTop: '0.15rem' }}>Lvl {currentLevel}/{upgrade.maxLevel}</span>
                </button>
              );
            })}
          </div>

          {/* Modal de Detalhes da Ascensão (Desktop) */}
          {showPrestigeModal && selectedUpgrade && (
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '2rem',
                zIndex: 50,
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              {/* Botão de Fechar Modal (X) */}
              <button 
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  setShowPrestigeModal(false);
                }}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'none',
                  border: 'none',
                  color: '#c4b5fd',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
                className="hover:text-white"
              >
                ✕
              </button>

              {(() => {
                const currentLevel = character.prestigeUpgrades[selectedUpgradeId] || 0;
                const isMax = currentLevel >= selectedUpgrade.maxLevel;
                const cost = selectedUpgrade.costPerLevel * (currentLevel + 1);
                const hasPoints = availablePrestigePoints >= cost;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '36rem', margin: '0 auto' }}>
                    <div>
                      <h3 className="font-heading" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{selectedUpgrade.name}</h3>
                      <p style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.5rem', lineHeight: 1.6 }}>{selectedUpgrade.description}</p>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.72rem', color: '#a78bfa' }}>Nível: {currentLevel} / {selectedUpgrade.maxLevel}</span>
                      <span style={{ fontSize: '0.68rem', color: '#c4b5fd', fontWeight: 500 }}>Bônus atual: +{currentLevel * selectedUpgrade.bonusPerLevel}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Prestígio Disponível: <span className="font-mono" style={{ color: '#a78bfa', fontWeight: 600 }}>{availablePrestigePoints} PP</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => {
                            AudioManager.getInstance().playClick();
                            setShowPrestigeModal(false);
                          }}
                          className="btn btn-sm btn-ghost"
                        >
                          Fechar
                        </button>
                        <button
                          onClick={() => upgradePrestigeStat(selectedUpgradeId)}
                          disabled={isMax || !hasPoints}
                          className={`btn btn-sm ${!isMax && hasPoints ? 'btn-purple' : 'btn-ghost'}`}
                        >
                          {isMax ? 'Nível Máximo' : `Aprimorar (${cost} PP)`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Lista Simplificada Vertical (Mobile) - Com Cards Expansíveis */}
      <div className="tree-view-mobile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
          {Object.entries(PRESTIGE_UPGRADES_CATALOG).map(([id, upgrade]) => {
            const currentLevel = character.prestigeUpgrades[id] || 0;
            const isSelected = selectedUpgradeId === id;
            const isUpgraded = currentLevel > 0;
            const isMax = currentLevel >= upgrade.maxLevel;
            const cost = upgrade.costPerLevel * (currentLevel + 1);
            const hasPoints = availablePrestigePoints >= cost;

            return (
              <div
                key={id}
                className={`prestige-list-card ${isSelected ? 'selected' : isUpgraded ? 'unlocked' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  padding: '0.6rem 0.8rem',
                  background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(0,0,0,0.3)',
                  border: isSelected ? '1px solid #a78bfa' : '1px solid var(--border-dim)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.2s'
                }}
              >
                {/* Cabeçalho do Card Clicável para Expansão */}
                <div
                  onClick={() => {
                    AudioManager.getInstance().playClick();
                    if (selectedUpgradeId === id) {
                      setSelectedUpgradeId('');
                    } else {
                      setSelectedUpgradeId(id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'left' }}>
                    <span className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                      {upgrade.name}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                      Lv {currentLevel}/{upgrade.maxLevel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isUpgraded && <span style={{ fontSize: '0.6rem', color: '#a78bfa' }}>Ativado</span>}
                    <span style={{ fontSize: '0.5rem', color: '#64748b', marginLeft: '0.2rem' }}>
                      {isSelected ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Conteúdo Expandido no Mobile */}
                {isSelected && (
                  <div 
                    className="animate-fadeIn"
                    style={{
                      paddingTop: '0.6rem',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      textAlign: 'left'
                    }}
                  >
                    <p style={{ fontSize: '0.65rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {upgrade.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.6rem', color: '#c4b5fd', fontWeight: 500 }}>
                        Bônus: +{currentLevel * upgrade.bonusPerLevel}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          upgradePrestigeStat(id);
                        }}
                        disabled={isMax || !hasPoints}
                        className={`btn btn-sm ${!isMax && hasPoints ? 'btn-purple' : 'btn-ghost'}`}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem' }}
                      >
                        {isMax ? 'Nível Máximo' : `Aprimorar (${cost} PP)`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const GuidePanel: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('warrior');

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Guia de Classes e Regras</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
        {Object.entries(CLASS_CONFIGS).map(([id, config]) => (
          <button
            key={id}
            onClick={() => {
              AudioManager.getInstance().playClick();
              setSelectedClass(id);
            }}
            className={`tab-btn ${selectedClass === id ? 'active' : ''}`}
            style={{ padding: '0.4rem', fontSize: '0.6rem' }}
          >
            {config.name}
          </button>
        ))}
      </div>

      {(() => {
        const config = CLASS_CONFIGS[selectedClass];
        if (!config) return null;

        // Filtra todas as habilidades da classe
        const classSkills = Object.entries(SKILLS_CATALOG).filter(
          ([_, s]) => s.classId === selectedClass
        );

        let promotionRequirement = 'Inicialmente Desbloqueado';
        if (selectedClass === 'paladin') promotionRequirement = 'Requer Guerreiro Nível 10';
        if (selectedClass === 'cleric') promotionRequirement = 'Requer Mago Nível 10';
        if (selectedClass === 'rogue') promotionRequirement = 'Requer Arqueiro Nível 10';

        const getPrimaryStatName = (stat: keyof BaseStats): string => {
          switch (stat) {
            case 'strength': return 'Força (Strength)';
            case 'magic': return 'Magia (Magic)';
            case 'dexterity': return 'Destreza (Destreza)';
            case 'constitution': return 'Constituição (Constituição)';
            default: return stat;
          }
        };

        return (
          <div className="flex flex-col gap-4 animate-tabFade">
            {/* Visão Geral */}
            <div className="bg-black/35 p-3 rounded-lg border border-gray-800/80">
              <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-widest block">Visão Geral</span>
              <h3 className="text-sm font-bold text-white mt-0.5">{config.name}</h3>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{config.description}</p>
              
              <div className="flex flex-col gap-1.5 mt-3 border-t border-gray-800/40 pt-2.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Atributo Principal:</span>
                  <span className="font-bold text-amber-400 uppercase tracking-wider">{getPrimaryStatName(config.primaryStat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status Iniciais:</span>
                  <span className="font-mono text-gray-300">
                    Str {config.baseStats.strength} | Mag {config.baseStats.magic} | Dex {config.baseStats.dexterity} | Con {config.baseStats.constitution}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Requisito de Desbloqueio:</span>
                  <span className={`font-semibold ${selectedClass !== 'warrior' && selectedClass !== 'mage' && selectedClass !== 'ranger' ? 'text-purple-400' : 'text-emerald-400'}`}>
                    {promotionRequirement}
                  </span>
                </div>
              </div>
            </div>

            {/* Listagem de Habilidades Temáticas (Reposicionada logo abaixo de Visão Geral) */}
            <div>
              <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">Habilidades Exclusivas de {config.name}</span>
              <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                {classSkills.map(([id, skill]) => (
                  <div key={id} className="bg-black/20 p-2 rounded border border-gray-800/50 text-[10px]">
                    <div className="flex justify-between items-center mb-0.5">
                      <strong className="text-white">{skill.name}</strong>
                      <span className={`text-[7px] px-1 rounded font-bold uppercase ${skill.type === 'active' ? 'bg-rose-950/40 text-rose-400 border border-rose-500/20' : 'bg-blue-950/40 text-blue-400 border border-blue-500/20'}`}>
                        {skill.type === 'active' ? 'Ativa' : 'Passiva'}
                      </span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">{skill.description}</p>
                    <div className="text-[8px] text-gray-500 mt-1 flex justify-between">
                      <span>Requer Level {skill.requiredLevel}</span>
                      {skill.type === 'active' && (
                        <span className="text-amber-500">Recarga: {id === 'heal' ? '10s' : (skill.requiredLevel <= 1 ? '3s' : (skill.requiredLevel <= 3 ? '5s' : (skill.requiredLevel <= 7 ? '8s' : '12s')))}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fórmulas de Atributos */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-widest block">Fórmulas e Matemática dos Atributos</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <div>
                  <strong className="text-white block font-semibold">HP Máximo e Regeneração (Constituição)</strong>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">HP Máximo = Constituição × 12</code>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Regeneração de HP = Constituição × 0.05 / segundo</code>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Mana Máxima e Regeneração (Magia)</strong>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Mana Máxima = Magia × 10</code>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Regeneração de Mana = Magia × 0.05 / segundo</code>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Velocidade de Ataque Básico (Destreza)</strong>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Mult. Velocidade = 1.0 + (Destreza × 0.02)</code>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Tempo de Recarga = Max(400ms, 1500ms / Mult. Velocidade)</code>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Ataque Básico da Classe ({config.name})</strong>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Dano Básico = Atributo Principal ({getPrimaryStatName(config.primaryStat).split(' ')[0]}) × 1.0 + Random(0, 2)
                  </code>
                </div>
              </div>
            </div>

            {/* Fórmulas de Habilidades */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-widest block">Matemática das Habilidades Ativas</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <div>
                  <strong className="text-white block font-semibold">Habilidades de Dano Comum</strong>
                  <code className="text-amber-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Dano = Atributo Principal × Mult. Base × (1 + (Nível - 1) × 0.15) + Random(0, 4)
                  </code>
                  <p className="text-gray-500 text-[8px] mt-0.5">O Multiplicador Base varia por habilidade (ex: Golpe Rápido: 1.5x, Bola de Fogo: 2.5x).</p>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Julgamento (Smite) do Paladino</strong>
                  <code className="text-purple-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Dano Sagrado = (Constituição × 1.25 + Força × 1.25) × (1 + (Nível - 1) × 0.15) + Random(0, 4)
                  </code>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Habilidade de Cura (Cura)</strong>
                  <code className="text-emerald-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Cura Final = Magia × 3 + 12 × Nível da Habilidade
                  </code>
                  <p className="text-gray-500 text-[8px] mt-0.5">Restaura a quantidade calculada instantaneamente consumindo 12 de Mana.</p>
                </div>
              </div>
            </div>

            {/* Informações de Fases */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-widest block">Dificuldade das Fases e Escalonamento</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <div>
                  <strong className="text-white block font-semibold">Fases Normais (1 a 5)</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    Fase 1: Floresta | Fase 2: Deserto | Fase 3: Neve | Fase 4: Cemitério | Fase 5: Ruínas.
                  </p>
                  <code className="text-rose-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Fator Dificuldade = 1.65 ^ (Fase - 1)
                  </code>
                  <code className="text-rose-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    HP Normal = (120 + Fase × 35) × Fator Dificuldade × Mult. HP Monstro
                  </code>
                  <code className="text-rose-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    HP Chefe = (120 + Fase × 35) × Fator Dificuldade × Mult. HP Chefe × 3.0
                  </code>
                  <code className="text-rose-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Dano Monstros = (5 + Fase × 2.0 + Random(0, 1)) × 1.3 ^ (Fase - 1) × Mult. Dano Monstro
                  </code>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Fases Pesadelo (6 a 10)</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    As mesmas fases com tint maligno avermelhado, maior agressividade e status maciçamente aumentados.
                  </p>
                  <code className="text-rose-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Status Pesadelo = Status Base × 2.5 (+150% de HP e Dano)
                  </code>
                </div>
              </div>
            </div>

            {/* Como Funciona a Ascensão */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-purple-400 uppercase tracking-widest block">Mecânica de Ascensão e Prestígio (Roguelite)</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <p>
                  A Ascensão é a sua principal mecânica de progressão de longo prazo (Roguelite). Ao atingir níveis mais altos, você pode <strong>Ascender sua Alma</strong> no painel de Ascensão para reiniciar seu progresso atual em troca de poder permanente.
                </p>
                <div>
                  <strong className="text-white block font-semibold">Regras da Ascensão:</strong>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginTop: '0.2rem', gap: '0.2rem', display: 'flex', flexDirection: 'column' }}>
                    <li>
                      <span className="text-gray-400">O que é resetado:</span> Nível atual do personagem, Pontos de Atributos normais distribuídos pelo jogador, progresso atual do combate (fase de combate volta para a Fase 1) e mana/HP.
                    </li>
                    <li>
                      <span className="text-gray-400">O que é mantido (Permanente):</span> Classe escolhida e seu progresso de maestria, Habilidades desbloqueadas (com seus respectivos níveis) e todas as melhorias compradas com Pontos de Prestígio (PP).
                    </li>
                    <li>
                      <span className="text-gray-400">Fórmula de PP obtido:</span>
                      <code className="text-purple-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">PP Recebido = Floor((XP Acumulada / 1000) ^ 0.85)</code>
                      <span className="text-gray-500 text-[8px] block mt-0.5">(Requer pelo menos Nível 5 para obter o primeiro Ponto de Prestígio. A XP acumulada conta toda a XP gasta em níveis anteriores mais a atual)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Melhorias Permanentes de Prestígio:</strong>
                  <p className="text-gray-400 mt-0.5">
                    Com os Pontos de Prestígio (PP) acumulados, você pode comprar melhorias na árvore de Ascensão que aumentam permanentemente seus atributos base (+ Força, + Magia, + Destreza, + Constituição), acelerando drasticamente o progresso nas próximas rodadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const LORE_DATABASE: Record<string, string> = {
  goblin: "Pequenos, ágeis e traiçoeiros, costumam espreitar nas sombras das copas das árvores da Floresta Antiga para emboscar aventureiros desavisados.",
  shadow_wolf: "Um predador voraz cujos olhos brilham no escuro. Sua pelagem negra se confunde com as sombras da floresta, facilitando botes letais e silenciosos.",
  orc_warrior: "Um combatente brutal que empunha machados massivos. Sua força física avantajada compensa sua lerdeza em batalha.",
  boss_forest_golem: "Uma antiga entidade de pedra e raízes despertada pela corrupção da floresta. Protege seu território silvestre com punhos colossais.",
  
  sand_serpent: "Réptil venenoso gigante que desliza silenciosamente sob as dunas do Deserto de Ouro, atacando suas presas de surpresa.",
  desert_bandit: "Exilados implacáveis que aprenderam a sobreviver nos confins mais hostis do deserto através da pilhagem e do combate rápido.",
  desert_scorpion: "Uma criatura monstruosa com uma carapaça que parece lava solidificada, capaz de injetar toxinas ardentes com seu ferrão.",
  boss_sand_scorpion: "O maior predador do deserto. Sua carapaça é fundida com ouro das dunas e suas pinças são capazes de partir armaduras ao meio.",
  
  frost_wolf: "Uma criatura mística adaptada ao frio extremo dos Picos Glaciais. Sua mordida congelante pode paralisar as feridas de suas presas.",
  ice_elemental: "Um espírito da natureza feito de gelo eterno e energia mágica pura, que dispara estilhaços congelantes nos invasores.",
  cave_yeti: "Uma besta peluda colossal e territorial que habita as cavernas mais profundas dos picos glaciais, esmagando oponentes com saltos pesados.",
  boss_frost_dragon: "Um dragão lendário que repousa no topo do pico congelado. Dizem as lendas que seu sopro congelou exércitos inteiros de heróis.",
  
  skeleton_warrior: "Os restos reanimados de antigos defensores do reino, mantidos erguidos por pura magia negra e uma eterna sede de combate.",
  decaying_zombie: "Um cadáver em decomposição lenta que ergueu-se das sepulturas rasas. Embora lento, seu corpo ignora ferimentos fatais.",
  tormented_ghost: "A alma penada de um pecador que não consegue descansar em paz. Flutua vagando pelo Cemitério Maldito e drena a energia vital.",
  boss_necromancer: "Um mago corrupto que dominou os segredos da morte e da reanimação. Comanda o Cemitério Maldito com cajados profanos.",
  
  stone_gargoyle: "Uma criatura demoníaca esculpida em pedra que ganha vida nas Ruínas Sombrias, caindo do alto das muralhas sobre suas vítimas.",
  living_armor: "Um conjunto de placas de aço pesado que ganhou senciência por almas aprisionadas nas ruínas, lutando incansavelmente.",
  demon_imp: "Um pequeno demônio alado vindo das profundezas do submundo, ágil e especializado em conjurar pequenas bolas de fogo e caos.",
  boss_archdemon: "O soberano supremo das Ruínas Sombrias. Um ser titânico que empunha o fogo do inferno e busca consumir a alma de qualquer invasor."
};

const BIOME_NAMES = [
  "Floresta Antiga",
  "Deserto de Ouro",
  "Picos Glaciais",
  "Cemitério Maldito",
  "Ruínas Sombrias"
];

const BestiaryPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const killCount = character.killCount || {};
  const [selectedEnemy, setSelectedEnemy] = useState<any>(null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);

  // Agrupar inimigos por Fase (4 por fase)
  const phases = [];
  for (let i = 0; i < 5; i++) {
    const startIdx = i * 4;
    const endIdx = startIdx + 4;
    phases.push({
      number: i + 1,
      name: BIOME_NAMES[i],
      enemies: ENEMY_TYPES.slice(startIdx, endIdx)
    });
  }

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Bestiário de Monstros</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {phases.map((phase) => (
          <div key={phase.number} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-400)', letterSpacing: '0.05em' }}>
                FASE {phase.number}: {phase.name}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(245,158,11,0.2), transparent)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {phase.enemies.map((enemy) => {
                const kills = killCount[enemy.id] || 0;
                const isBoss = enemy.id.startsWith('boss_');
                const reqKills = isBoss ? 3 : 10;
                const isUnlocked = kills >= reqKills;
                const isHovered = hoveredEnemyId === enemy.id;

                const borderColor = isUnlocked
                  ? (isBoss ? '#ef4444' : 'var(--gold-400)')
                  : 'rgba(255,255,255,0.05)';

                const bgGlow = isUnlocked
                  ? (isBoss ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.03)')
                  : 'rgba(15, 23, 42, 0.4)';

                return (
                  <button
                    key={enemy.id}
                    onClick={() => {
                      if (isUnlocked) {
                        AudioManager.getInstance().playClick();
                        setSelectedEnemy(enemy);
                      }
                    }}
                    onMouseEnter={() => isUnlocked && setHoveredEnemyId(enemy.id)}
                    onMouseLeave={() => setHoveredEnemyId(null)}
                    disabled={!isUnlocked}
                    className={`bestiary-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.5rem',
                      background: bgGlow,
                      border: `1px solid ${borderColor}`,
                      boxShadow: isHovered && isUnlocked ? `0 0 12px ${isBoss ? 'rgba(239, 68, 68, 0.3)' : 'var(--gold-glow)'}` : 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: isUnlocked ? 'pointer' : 'default',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease-in-out',
                      outline: 'none'
                    }}
                  >
                    {/* Badge de Boss ou Comum */}
                    <span 
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        fontSize: '0.45rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        background: isBoss ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                        color: isBoss ? '#ef4444' : '#cbd5e1',
                        border: isBoss ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)'
                      }}
                    >
                      {isBoss ? 'Chefe' : 'Comum'}
                    </span>

                    {/* Sprite do Monstro */}
                    <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.5rem 0', position: 'relative', width: '100%' }}>
                      <img 
                        src={`/assets/${enemy.texture}.png`} 
                        alt={enemy.name}
                        style={{
                          maxHeight: '100%',
                          maxWidth: '85%',
                          objectFit: 'contain',
                          filter: isUnlocked 
                            ? 'none' 
                            : 'grayscale(100%) brightness(15%) opacity(30%) blur(0.5px)',
                          transform: `${enemy.flipX ? 'scaleX(-1)' : 'scaleX(1)'} ${isHovered && isUnlocked ? 'scale(1.1)' : 'scale(1)'}`,
                          transition: 'transform 0.2s ease-in-out, filter 0.2s'
                        }}
                      />
                      {!isUnlocked && (
                        <span style={{ position: 'absolute', fontSize: '1.4rem', color: '#475569', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>?</span>
                      )}
                    </div>

                    {/* Nome do Monstro */}
                    <span 
                      className="font-heading" 
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        color: isUnlocked ? '#fff' : '#475569',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        display: 'block'
                      }}
                    >
                      {isUnlocked ? enemy.name : '???'}
                    </span>

                    {/* Barra de Progresso / Abates */}
                    <div style={{ width: '100%', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.48rem', color: isUnlocked ? 'rgba(255,255,255,0.4)' : '#64748b', fontFamily: 'var(--font-mono)' }}>
                        <span>Derrotas:</span>
                        <span>{kills} / {reqKills}</span>
                      </div>
                      <div style={{ width: '100%', height: '3px', background: 'rgba(0,0,0,0.4)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div 
                          style={{
                            width: `${Math.min(100, (kills / reqKills) * 100)}%`,
                            height: '100%',
                            background: isUnlocked 
                              ? (isBoss ? 'linear-gradient(90deg, #ef4444, #fca5a5)' : 'linear-gradient(90deg, var(--gold-400), #fef08a)')
                              : 'linear-gradient(90deg, #334155, #64748b)',
                            boxShadow: isUnlocked ? `0 0 4px ${isBoss ? '#ef4444' : 'var(--gold-400)'}` : 'none'
                          }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes do Monstro Desbloqueado */}
      {selectedEnemy && (() => {
        const kills = killCount[selectedEnemy.id] || 0;
        const isBoss = selectedEnemy.id.startsWith('boss_');

        return (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 3, 10, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 999999,
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => {
              AudioManager.getInstance().playClick();
              setSelectedEnemy(null);
            }}
          >
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(15, 10, 25, 0.98), rgba(6, 4, 10, 0.99))',
                border: `2px solid ${isBoss ? '#ef4444' : 'var(--gold-400)'}`,
                boxShadow: `0 0 35px rgba(0, 0, 0, 0.9), 0 0 20px ${isBoss ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.15)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '430px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fechar modal */}
              <button 
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  setSelectedEnemy(null);
                }}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
                className="hover:text-white"
              >
                ✕
              </button>

              {/* Cabeçalho */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div 
                  style={{ 
                    width: '90px', 
                    height: '90px', 
                    background: 'rgba(0,0,0,0.4)', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <img 
                    src={`/assets/${selectedEnemy.texture}.png`} 
                    alt={selectedEnemy.name}
                    style={{
                      maxHeight: '90%',
                      maxWidth: '90%',
                      objectFit: 'contain',
                      transform: selectedEnemy.flipX ? 'scaleX(-1)' : 'none'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span 
                    style={{
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: isBoss ? '#ef4444' : '#cbd5e1'
                    }}
                  >
                    {isBoss ? 'Chefe Celestial' : 'Monstro Comum'}
                  </span>
                  <h3 className="font-heading" style={{ fontSize: '1rem', fontWeight: 800, color: isBoss ? '#f87171' : 'var(--gold-400)', margin: 0 }}>
                    {selectedEnemy.name}
                  </h3>
                  <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>
                    Registros de Derrota: <strong className="font-mono text-white" style={{ fontSize: '0.62rem' }}>{kills}</strong>
                  </span>
                </div>
              </div>

              {/* Lore/Descrição */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <p style={{ fontSize: '0.65rem', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.6, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  "{LORE_DATABASE[selectedEnemy.id] || 'Nenhum registro antigo recuperado para esta besta.'}"
                </p>
              </div>

              {/* Estatísticas e Escalonamento */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="font-heading" style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--gold-400)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Atributos e Poder Relativo
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.48rem', color: '#64748b', textTransform: 'uppercase' }}>Multiplicador HP</span>
                    <span className="font-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171' }}>
                      {selectedEnemy.hpMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.48rem', color: '#64748b', textTransform: 'uppercase' }}>Multiplicador Dano</span>
                    <span className="font-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fb7185' }}>
                      {selectedEnemy.damageMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.48rem', color: '#64748b', textTransform: 'uppercase' }}>Mult. Vel. Ataque</span>
                    <span className="font-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa' }}>
                      {selectedEnemy.attackSpeedMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.48rem', color: '#64748b', textTransform: 'uppercase' }}>Experiência Cedida</span>
                    <span className="font-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399' }}>
                      +{selectedEnemy.xpValue} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Fechar Button */}
              <button 
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  setSelectedEnemy(null);
                }} 
                className="btn btn-sm"
                style={{
                  width: '100%',
                  background: isBoss 
                    ? 'linear-gradient(135deg, #b91c1c 0%, #450a0a 100%)' 
                    : 'linear-gradient(135deg, var(--gold-600) 0%, var(--surface-3) 100%)',
                  border: isBoss ? '1px solid #ef4444' : '1px solid var(--gold-400)',
                  color: '#fff',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Fechar Registro
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default function GameUI() {
  const [activeTab, setActiveTab] = useState<'combat' | 'attributes' | 'skills' | 'equipment' | 'prestige' | 'bestiary' | 'guide' | 'saves'>('combat');
  const setScreen = useGameStore((state) => state.setScreen);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const sfxEnabled = useGameStore((state) => state.sfxEnabled);
  const bgmEnabled = useGameStore((state) => state.bgmEnabled);
  const toggleSfx = useGameStore((state) => state.toggleSfx);
  const toggleBgm = useGameStore((state) => state.toggleBgm);

  const performPrestige = useGameStore((state) => state.performPrestige);
  const [prestigeTransition, setPrestigeTransition] = useState<'idle' | 'fade-in' | 'fade-out'>('idle');
  const [transitionText, setTransitionText] = useState('Ascendendo a Alma...');

  const handlePrestigeWithTransition = () => {
    setPrestigeTransition('fade-in');
    setTransitionText('Ascendendo a Alma...');
    
    // 1.5s para escurecer totalmente
    setTimeout(() => {
      performPrestige();
      setActiveTab('combat');
      setTransitionText('Sua Alma Ascendeu!');
      
      // Mantém na tela totalmente escura por 1.2s para leitura e compreensão do jogador
      setTimeout(() => {
        setPrestigeTransition('fade-out');
        
        // 0.8s do fade-out do CSS antes de sumir o overlay
        setTimeout(() => {
          setPrestigeTransition('idle');
        }, 800);
      }, 1200);
    }, 1500);
  };

  useEffect(() => {
    if (showExitConfirm) {
      const timer = setTimeout(() => setShowExitConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showExitConfirm]);

  const tabs = [
    { id: 'combat' as const, label: 'Combate', icon: '⚔' },
    { id: 'attributes' as const, label: 'Atributos', icon: '◆' },
    { id: 'skills' as const, label: 'Habilidades', icon: '★' },
    { id: 'equipment' as const, label: 'Equipamento', icon: '🛡️' },
    { id: 'prestige' as const, label: 'Ascensão', icon: '☾' },
    { id: 'bestiary' as const, label: 'Bestiário', icon: '🐉' },
    { id: 'guide' as const, label: 'Guia', icon: '▤' },
    { id: 'saves' as const, label: 'Saves', icon: '💾' },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const extendedTabs = [
    tabs[tabs.length - 1], // Guia no início
    ...tabs,
    tabs[0]                // Combate no final
  ];

  return (
    <div className="game-ui-root" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', pointerEvents: 'auto', minHeight: 0 }}>
      {/* Cabeçalho do Painel com Botão Sair */}
      <div className="panel header-panel" style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px rgba(16,185,129,0.5)', animation: 'glow-pulse 2s infinite' }} />
          <span className="font-heading" style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-400)' }}>Painel do Herói</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Controles rápidos de Áudio */}
          <button
            onClick={() => {
              toggleBgm();
              AudioManager.getInstance().playClick();
            }}
            style={{
              background: bgmEnabled ? 'rgba(139, 92, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: bgmEnabled ? 'var(--gold-400)' : '#f87171',
              border: bgmEnabled ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.55rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease'
            }}
            title="Alternar Música"
          >
            🎵 {bgmEnabled ? 'Música' : 'Mudo'}
          </button>
          <button
            onClick={() => {
              toggleSfx();
              setTimeout(() => AudioManager.getInstance().playClick(), 30);
            }}
            style={{
              background: sfxEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: sfxEnabled ? '#34d399' : '#f87171',
              border: sfxEnabled ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.55rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease',
              marginRight: '0.5rem'
            }}
            title="Alternar Efeitos"
          >
            🔊 {sfxEnabled ? 'Sons' : 'Mudo'}
          </button>
          
          {showExitConfirm ? (
            <button
              onClick={() => {
                AudioManager.getInstance().playClick();
                setScreen('menu');
              }}
              className="btn btn-danger btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
            >
              Confirmar Sair?
            </button>
          ) : (
            <button
              onClick={() => {
                AudioManager.getInstance().playClick();
                setShowExitConfirm(true);
              }}
              className="btn btn-danger btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          )}
        </div>
      </div>
  
      {/* Abas Superiores — Premium Tab Bar (Desktop) */}
      <div className="tabs-container tabs-container-desktop">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              AudioManager.getInstance().playClick();
              setActiveTab(tab.id);
            }}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
          >
            <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Abas Superiores — Carrossel Circular de Roleta (Mobile) */}
      <div className="tabs-container-mobile">
        <div 
          className="tabs-carousel-inner"
          style={{
            transform: `translateX(calc(33.333% - ${(activeIndex + 1) * 33.333}%))`
          }}
        >
          {extendedTabs.map((tab, idx) => {
            const isCurrentActive = tab.id === activeTab;
            return (
              <button
                key={`${tab.id}-${idx}`}
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  setActiveTab(tab.id);
                }}
                className={`carousel-tab-btn ${isCurrentActive ? 'active' : ''}`}
                style={{
                  flex: '0 0 33.333%',
                  width: '33.333%'
                }}
              >
                <span className="carousel-icon">{tab.icon}</span>
                <span className="carousel-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
  
      {/* Conteúdo Dinâmico */}
      <div className="animate-tabFade ui-scrollable-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {activeTab === 'combat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <GameHUD />
            <ActiveSkillsPanel />
          </div>
        )}
        {activeTab === 'attributes' && <AttributePanel />}
        {activeTab === 'skills' && <SkillsTreePanel />}
        {activeTab === 'equipment' && <EquipmentPanel />}
        {activeTab === 'prestige' && <PrestigeTreePanel onPrestige={handlePrestigeWithTransition} />}
        {activeTab === 'bestiary' && <BestiaryPanel />}
        {activeTab === 'guide' && <GuidePanel />}
        {activeTab === 'saves' && <SavesMenu isInGame={true} onBackToCombat={() => setActiveTab('combat')} />}
      </div>

      {/* Overlay de Transição de Ascensão */}
      {prestigeTransition !== 'idle' && (
        <div 
          className={`prestige-overlay-${prestigeTransition}`}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 3, 10, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            pointerEvents: 'all'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', textAlign: 'center', padding: '2rem' }}>
            {/* Cristal de Alma / Runa central com pulso e brilho místico roxo */}
            <div 
              style={{ 
                width: 80, 
                height: 80, 
                background: 'radial-gradient(circle, #c4b5fd 0%, #7c3aed 70%, #4c1d95 100%)', 
                borderRadius: '50%', 
                border: '4px solid #c4b5fd', 
                boxShadow: '0 0 50px rgba(124, 58, 237, 0.9), inset 0 0 20px rgba(255, 255, 255, 0.6)', 
                animation: 'float 2.5s infinite ease-in-out',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Símbolo de Alma/Estrela interno */}
              <span style={{ fontSize: '2.2rem', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.8)', transform: 'translateY(-1px)' }}>☾</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <h2 className="font-heading animate-pulse" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0, filter: 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.5))' }}>
                {transitionText}
              </h2>
              <p className="font-heading" style={{ fontSize: '0.62rem', color: '#a78bfa', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.8 }}>
                O ciclo se renova...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
