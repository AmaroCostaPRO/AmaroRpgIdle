import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, SKILLS_CATALOG, PRESTIGE_UPGRADES_CATALOG, CLASS_CONFIGS } from '../store/useGameStore';
import { bridge } from '../bridge/GameBridge';
import { GameEvent, BaseStats } from '../core/types';

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
            <span className="console-arrow">
              {isConsoleExpanded ? '▲' : '▼'}
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
                onClick={() => !isOnCooldown && triggerSkill(id)}
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
            onClick={() => useGameStore.getState().toggleAutoCast()}
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
  const addXp = useGameStore((state) => state.addXp);

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
        <button className="btn btn-emerald" style={{ width: '100%', marginTop: '0.4rem' }} onClick={() => addXp(50)}>
          Ganhar +50 XP (Modo de Teste)
        </button>
      </div>
    </div>
  );
};

const SkillsTreePanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const unlockOrUpgradeSkill = useGameStore((state) => state.unlockOrUpgradeSkill);
  
  const classId = character.classId || 'warrior';
  const availableSkillPoints = character.skillPoints;

  // Filtra as habilidades da classe atual + curas comuns
  const classSkills = Object.entries(SKILLS_CATALOG).filter(
    ([id, s]) => s.classId === classId || s.classId === 'common'
  );

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
                  onClick={() => setSelectedSkillId(id)}
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
        </div>
      </div>

      {/* Lista Simplificada Vertical (Mobile) */}
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
                onClick={() => setSelectedSkillId(id)}
                className={`skill-list-card ${isSelected ? 'selected' : isUnlocked ? 'unlocked' : isLocked ? 'locked' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.3)',
                  border: isSelected ? '1px solid var(--gold-400)' : '1px solid var(--border-dim)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel de Detalhes da Habilidade Selecionada */}
      {selectedSkill && (
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{selectedSkill.name}</h3>
                <span className={`badge ${selectedSkill.type === 'active' ? 'badge-active' : 'badge-passive'}`}>
                  {selectedSkill.type === 'active' ? 'Habilidade Ativa' : 'Habilidade Passiva'}
                </span>
              </div>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem', lineHeight: 1.6 }}>{selectedSkill.description}</p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span className="font-mono" style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block' }}>Nível: {character.skillLevels[selectedSkillId] || 0} / {selectedSkill.maxLevel}</span>
              <span className="font-heading" style={{ fontSize: '0.55rem', color: 'var(--gold-400)', fontWeight: 600, display: 'block', marginTop: '0.15rem' }}>Requer Level {selectedSkill.requiredLevel}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
              {selectedSkill.dependencies.length > 0 ? `Requer ${SKILLS_CATALOG[selectedSkill.dependencies[0]]?.name}` : 'Sem requisitos'}
            </div>
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
      )}
    </div>
  );
};

const PrestigeTreePanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const upgradePrestigeStat = useGameStore((state) => state.upgradePrestigeStat);
  const performPrestige = useGameStore((state) => state.performPrestige);

  const availablePrestigePoints = character.prestigePoints;
  const prestigeEarnedOnReset = Math.max(1, Math.floor(character.level * 1.5));

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
                  onClick={() => setSelectedUpgradeId(id)}
                  style={{ left, top }}
                  className={`skill-node prestige-node ${isSelected ? 'selected' : isUpgraded ? 'unlocked' : ''}`}
                >
                  <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '105px' }}>{upgrade.name}</span>
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: '#a78bfa', marginTop: '0.15rem' }}>Lvl {currentLevel}/{upgrade.maxLevel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista Simplificada Vertical (Mobile) */}
      <div className="tree-view-mobile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
          {Object.entries(PRESTIGE_UPGRADES_CATALOG).map(([id, upgrade]) => {
            const currentLevel = character.prestigeUpgrades[id] || 0;
            const isSelected = selectedUpgradeId === id;
            const isUpgraded = currentLevel > 0;

            return (
              <div
                key={id}
                onClick={() => setSelectedUpgradeId(id)}
                className={`prestige-list-card ${isSelected ? 'selected' : isUpgraded ? 'unlocked' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0,0,0,0.3)',
                  border: isSelected ? '1px solid #a78bfa' : '1px solid var(--border-dim)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'left' }}>
                  <span className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                    {upgrade.name}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                    {upgrade.description}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.65rem', color: '#a78bfa', fontWeight: 600 }}>
                    Lv {currentLevel}/{upgrade.maxLevel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel do Upgrade Selecionado */}
      {selectedUpgrade && (
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{selectedUpgrade.name}</h3>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem', lineHeight: 1.6 }}>{selectedUpgrade.description}</p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span className="font-mono" style={{ fontSize: '0.62rem', color: '#a78bfa', display: 'block' }}>Nível: {character.prestigeUpgrades[selectedUpgradeId] || 0} / {selectedUpgrade.maxLevel}</span>
            </div>
          </div>

          {(() => {
            const currentLevel = character.prestigeUpgrades[selectedUpgradeId] || 0;
            const isMax = currentLevel >= selectedUpgrade.maxLevel;
            const cost = selectedUpgrade.costPerLevel * (currentLevel + 1);
            const hasPoints = availablePrestigePoints >= cost;

            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.62rem', color: '#c4b5fd', fontWeight: 500 }}>Bônus atual: +{currentLevel * selectedUpgrade.bonusPerLevel}</span>
                <button
                  onClick={() => upgradePrestigeStat(selectedUpgradeId)}
                  disabled={isMax || !hasPoints}
                  className={`btn btn-sm ${!isMax && hasPoints ? 'btn-purple' : 'btn-ghost'}`}
                >
                  {isMax ? 'Nível Máximo' : `Aprimorar (${cost} PP)`}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Botão de Reset de Prestígio */}
      <div style={{ background: 'rgba(139,92,246,0.06)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <h4 className="font-heading" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Ascender Alma</h4>
        <p style={{ fontSize: '0.62rem', color: 'rgba(196,181,253,0.8)', lineHeight: 1.6 }}>
          Reseta seu Nível, Atributos normais e progresso do combate, mas concede pontos de Prestígio permanentes.
        </p>
        <button
          onClick={() => { if (confirm('Deseja realmente Ascender sua Alma?')) performPrestige(); }}
          className="btn btn-purple"
          style={{ width: '100%', marginTop: '0.25rem' }}
        >
          Ascender (+{prestigeEarnedOnReset} PP)
        </button>
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
            onClick={() => setSelectedClass(id)}
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
            case 'dexterity': return 'Destreza (Dexterity)';
            case 'constitution': return 'Constituição (Constitution)';
            default: return stat;
          }
        };

        return (
          <div className="flex flex-col gap-4 animate-fadeIn">
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
                    Dano Básico = Atributo Principal ({getPrimaryStatName(config.primaryStat).split(' ')[0]}) × 1.5 + Random(0, 2)
                  </code>
                </div>
              </div>
            </div>

            {/* Fórmulas de Habilidades */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-widest block">Matemática das Habilidades Ativas</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <div>
                  <strong className="text-white block font-semibold">Habilidades de Dano</strong>
                  <code className="text-amber-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Mult. Dano = 1.0 + (Tier × 0.25) + (Nível da Habilidade × 0.15)
                  </code>
                  <code className="text-amber-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Dano Final = Atributo Principal × Mult. Dano + Random(0, 4)
                  </code>
                  <p className="text-gray-500 text-[8px] mt-0.5">O Tier corresponde ao nível requerido para desbloquear a habilidade (1, 3, 7 ou 11).</p>
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
                  <code className="text-rose-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Vida dos Monstros = (100 + Fase × 20) × Mult. do Monstro</code>
                  <code className="text-rose-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Dano dos Monstros = (5 + Fase × 1.5) × Mult. do Monstro</code>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Fases Pesadelo (6 a 10)</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    As mesmas fases com tint maligno avermelhado, maior agressividade e status maciçamente aumentados.
                  </p>
                  <code className="text-rose-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Status Pesadelo = Status Base × 2.5 (+150% de Vida e Dano)</code>
                </div>
              </div>
            </div>

            {/* Listagem de Habilidades Temáticas */}
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
          </div>
        );
      })()}
    </div>
  );
};

export default function GameUI() {
  const [activeTab, setActiveTab] = useState<'combat' | 'attributes' | 'skills' | 'prestige' | 'guide'>('combat');
  const setScreen = useGameStore((state) => state.setScreen);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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
    { id: 'prestige' as const, label: 'Ascensão', icon: '☾' },
    { id: 'guide' as const, label: 'Guia', icon: '▤' },
  ];

  return (
    <div className="game-ui-root" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', pointerEvents: 'auto', minHeight: 0 }}>
      {/* Cabeçalho do Painel com Botão Sair */}
      <div className="panel header-panel" style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px rgba(16,185,129,0.5)', animation: 'glow-pulse 2s infinite' }} />
          <span className="font-heading" style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-400)' }}>Painel do Herói</span>
        </div>
        {showExitConfirm ? (
          <button
            onClick={() => setScreen('menu')}
            className="btn btn-danger btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
          >
            Confirmar Sair?
          </button>
        ) : (
          <button
            onClick={() => setShowExitConfirm(true)}
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
 
      {/* Abas Superiores — Premium Tab Bar */}
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
          >
            <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
 
      {/* Conteúdo Dinâmico */}
      <div className="animate-fadeIn ui-scrollable-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {activeTab === 'combat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <GameHUD />
            <ActiveSkillsPanel />
          </div>
        )}
        {activeTab === 'attributes' && <AttributePanel />}
        {activeTab === 'skills' && <SkillsTreePanel />}
        {activeTab === 'prestige' && <PrestigeTreePanel />}
        {activeTab === 'guide' && <GuidePanel />}
      </div>
    </div>
  );
}
