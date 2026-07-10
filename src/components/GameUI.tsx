import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore, SKILLS_CATALOG, PRESTIGE_UPGRADES_CATALOG, TRANSCENDENCE_UPGRADES_CATALOG, CLASS_CONFIGS, SKILL_BASE_MULTIPLIERS, getSkillMaxLevel, calculateItemSellValue, getPersonalRecords, formatNumber, getGlobalClassLevels, isClassUnlocked } from '../store/useGameStore';
import { getXpNeededForLevel, getTotalXpEarned, calculatePrestigePointsFromTotalXp } from '../core/XpEngine';
import { useTowerStore } from '../store/useTowerStore';
import { useRelicStore } from '../store/useRelicStore';
import { bridge } from '../bridge/GameBridge';
import { GameEvent, BaseStats, EquipmentItem } from '../core/types';
import { StatEngine, SET_BONUSES } from '../core/StatEngine';
import { ENEMY_TYPES } from '../core/CombatFSM';
import { AudioManager } from '../core/AudioManager';
import { SavesMenu } from './SavesMenu';
import { ForgeView } from './ForgeView';
import { ShopPanel } from './ShopPanel';
import { TowerPanel } from './TowerPanel';
import { ProgressNotifications } from './ProgressNotifications';

export const DAILY_MODIFIERS = [
  {
    name: "🩸 Dreno de Alma",
    description: "Os monstros curam a si mesmos em 15% do dano que causam a você.",
    color: "#f87171"
  },
  {
    name: "⚡ Escudo de Espinhos",
    description: "Os monstros refletem 20% do dano direto recebido (limitado a 5% da sua Vida Máxima por golpe).",
    color: "#facc15"
  },
  {
    name: "🌀 Frenesi Sombrio",
    description: "A velocidade de ataque dos monstros é aumentada em 30%.",
    color: "#a78bfa"
  },
  {
    name: "🌪️ Vento Cortante",
    description: "O vento congelante reduz sua Chance de Esquiva em 15%.",
    color: "#60a5fa"
  },
  {
    name: "🤢 Veneno Rastejante",
    description: "Você perde 1% da sua Vida Máxima a cada 1.5 segundos.",
    color: "#34d399"
  }
];

// Funções utilitárias para obter informações sobre Efeitos de Status aplicados por Habilidades
export const getSimpleStatusEffectInfo = (id: string, skillLevel: number = 1): string => {
  const levelMultiplier = 1 + (Math.max(1, skillLevel) - 1) * 0.15;
  switch (id) {
    case 'shield_bash': 
      return `Atordoa por ${(2.0 * levelMultiplier).toFixed(1)}s`;
    case 'frostbolt': 
      return `Lento 40% por ${(4.0 * levelMultiplier).toFixed(1)}s`;
    case 'fireball': 
      return `Queima por 3.0s (${Math.round(15 * levelMultiplier)}% Magia/s)`;
    case 'meteor': 
      return `Atordoa por ${(1.5 * levelMultiplier).toFixed(1)}s e Queima por 5.0s (${Math.round(15 * levelMultiplier)}% Magia/s)`;
    case 'poison_arrow': 
      return `Veneno por 5.0s (${Math.round(20 * levelMultiplier)}% Destreza/s)`;
    case 'shield_righteousness': 
      return `Fraqueza (Inimigo causa -30% dano) por ${(5.0 * levelMultiplier).toFixed(1)}s`;
    case 'consecration': 
      return `Regenera ${Math.round(15 * levelMultiplier)}% Const/s por 6.0s`;
    case 'wrath_heaven': 
      return `Exposto (Inimigo sofre +20% dano) por ${(5.0 * levelMultiplier).toFixed(1)}s`;
    case 'poison_dagger': 
      return `Veneno por 4.0s (${Math.round(25 * levelMultiplier)}% Destreza/s)`;
    default: 
      return '';
  }
};

export const getDetailedStatusEffectInfo = (id: string, skillLevel: number = 1): string => {
  const levelMultiplier = 1 + (Math.max(1, skillLevel) - 1) * 0.15;
  switch (id) {
    case 'shield_bash':
      return `Efeito: Atordoa o inimigo por ${(2.0 * levelMultiplier).toFixed(1)}s (impede ações). Ao se recuperar, o monstro é forçado a recarregar o tempo total de seu ataque do zero.`;
    case 'frostbolt':
      return `Efeito: Reduz a velocidade de ataque do inimigo em 40% (Lentidão) por ${(4.0 * levelMultiplier).toFixed(1)}s.`;
    case 'fireball':
      return `Efeito: Aplica Queimadura por 3.0s, causando dano contínuo (DOT) de ${Math.round(15 * levelMultiplier)}% do Poder Mágico por segundo.`;
    case 'meteor':
      return `Efeito: Atordoa o inimigo por ${(1.5 * levelMultiplier).toFixed(1)}s (recarrega ataque dele após expirar) e aplica Queimadura por 5.0s, causando ${Math.round(15 * levelMultiplier)}% do Poder Mágico por segundo como dano.`;
    case 'poison_arrow':
      return `Efeito: Aplica Veneno por 5.0s, causando dano contínuo (DOT) de ${Math.round(20 * levelMultiplier)}% da Destreza por segundo.`;
    case 'shield_righteousness':
      return `Efeito: Aplica Fraqueza por ${(5.0 * levelMultiplier).toFixed(1)}s, reduzindo todo o dano causado pelo inimigo em 30%.`;
    case 'consecration':
      return `Efeito: Cria área sagrada que cura o jogador em ${Math.round(15 * levelMultiplier)}% da sua Constituição por segundo durante 6.0s.`;
    case 'wrath_heaven':
      return `Efeito: Aplica Exposto por ${(5.0 * levelMultiplier).toFixed(1)}s, aumentando todo o dano sofrido pelo inimigo em 20%.`;
    case 'poison_dagger':
      return `Efeito: Aplica Veneno por 4.0s, causando dano contínuo (DOT) de ${Math.round(25 * levelMultiplier)}% da Destreza por segundo.`;
    default:
      return '';
  }
};

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
  const consoleEnabled = useGameStore((state) => state.consoleEnabled);
  const abbreviateNumbers = useGameStore((state) => state.abbreviateNumbers);

  const lastHp = useRef({ current: 0, max: 0 });
  const lastMana = useRef({ current: 0, max: 0 });

  useEffect(() => {
    if (hpTextRef.current && lastHp.current.max > 0) {
      hpTextRef.current.innerText = `${formatNumber(lastHp.current.current, abbreviateNumbers)} / ${formatNumber(lastHp.current.max, abbreviateNumbers)}`;
    }
    if (manaTextRef.current && lastMana.current.max > 0) {
      manaTextRef.current.innerText = `${formatNumber(lastMana.current.current, abbreviateNumbers)} / ${formatNumber(lastMana.current.max, abbreviateNumbers)}`;
    }
  }, [abbreviateNumbers]);

  // Detecta se está em viewport mobile (≤840px) para aplicar o toggle do console
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 840px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 840px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // O console agora respeita o toggle em ambas as resoluções (desktop e mobile)
  const showConsole = consoleEnabled;

  useEffect(() => {
    bridge.registerDomUpdate('player_hp', (pct, current, max) => {
      if (hpBarRef.current) hpBarRef.current.style.width = `${pct}%`;
      if (current !== undefined && max !== undefined) {
        lastHp.current = { current, max };
        if (hpTextRef.current) {
          const abbrev = useGameStore.getState().abbreviateNumbers;
          hpTextRef.current.innerText = `${formatNumber(current, abbrev)} / ${formatNumber(max, abbrev)}`;
        }
      }
    });

    bridge.registerDomUpdate('player_mana', (pct, current, max) => {
      if (manaBarRef.current) manaBarRef.current.style.width = `${pct}%`;
      if (current !== undefined && max !== undefined) {
        lastMana.current = { current, max };
        if (manaTextRef.current) {
          const abbrev = useGameStore.getState().abbreviateNumbers;
          manaTextRef.current.innerText = `${formatNumber(current, abbrev)} / ${formatNumber(max, abbrev)}`;
        }
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

    const unsubscribeCombo = bridge.subscribe(GameEvent.COMBO_STATE_CHANGED, (payload) => {
      const badge = document.getElementById('combo-badge');
      const badgeFrenzy = document.getElementById('combo-badge-frenzy');
      if (payload.combo > 0) {
        if (badge) {
          badge.style.display = 'inline-block';
          badge.innerText = `${payload.combo}x COMBO`;
        }
        if (badgeFrenzy) {
          badgeFrenzy.style.display = 'inline-block';
          badgeFrenzy.innerText = `${payload.combo}x COMBO`;
        }
      } else {
        if (badge) badge.style.display = 'none';
        if (badgeFrenzy) badgeFrenzy.style.display = 'none';
      }
    });

    const unsubscribeFrenzy = bridge.subscribe(GameEvent.FRENZY_STATE_CHANGED, (payload) => {
      const fill = document.getElementById('frenzy-fill');
      const text = document.getElementById('frenzy-text');
      
      if (fill && text) {
        fill.style.width = `${payload.energy}%`;
        text.innerText = payload.active ? '🔥 FRENESI ATIVO!' : `${payload.energy}%`;
        if (payload.active) {
          fill.classList.add('frenzy-active-glow');
          text.style.color = '#ef4444';
        } else {
          fill.classList.remove('frenzy-active-glow');
          text.style.color = '#f59e0b';
        }
      }
    });

    return () => {
      unsubscribeLogs();
      unsubscribeCombo();
      unsubscribeFrenzy();
    };
  }, []);

  return (
    <div className="panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', pointerEvents: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Cabeçalho: oculto no mobile via CSS */}
        <div className="hud-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Status do Personagem</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span id="combo-badge" style={{ display: 'none', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', animation: 'pulse 1s infinite' }}>0x COMBO</span>
            <span className="combat-indicator">● Em Combate</span>
          </div>
        </div>

        {/* Barras de HP, Mana e Frenesi */}
        <div className="hud-bars-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }} className="hud-bars-inner-container">
            {/* Barra de HP */}
            <div className="hud-bar-item" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: '#cbd5e1' }}>
                <span className="font-heading" style={{ letterSpacing: '0.05em' }}>Vida (HP)</span>
                <span ref={hpTextRef} className="font-mono" style={{ fontSize: '0.6rem', color: '#f87171' }}>- / -</span>
              </div>
              <div className="progress-track progress-hp" style={{ height: '0.85rem' }}>
                <div ref={hpBarRef} className="progress-fill" style={{ width: '100%', background: 'linear-gradient(90deg, var(--hp-from), var(--hp-to))', boxShadow: '0 0 10px var(--hp-glow)' }} />
              </div>
            </div>

            {/* Barra de Mana */}
            <div className="hud-bar-item" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: '#cbd5e1' }}>
                <span className="font-heading" style={{ letterSpacing: '0.05em' }}>Mana</span>
                <span ref={manaTextRef} className="font-mono" style={{ fontSize: '0.6rem', color: '#60a5fa' }}>- / -</span>
              </div>
              <div className="progress-track progress-mana" style={{ height: '0.85rem' }}>
                <div ref={manaBarRef} className="progress-fill" style={{ width: '100%', background: 'linear-gradient(90deg, var(--mana-from), var(--mana-to))', boxShadow: '0 0 10px var(--mana-glow)' }} />
              </div>
            </div>
          </div>

          {/* Barra de Frenesi */}
          <div className="hud-bar-item" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: '#cbd5e1' }}>
              <span className="font-heading" style={{ letterSpacing: '0.05em', color: '#f59e0b' }}>Frenesi (Toques)</span>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span id="combo-badge-frenzy" style={{ display: 'none', padding: '0.05rem 0.25rem', borderRadius: '3px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>0x COMBO</span>
                <span id="frenzy-text" className="font-mono" style={{ fontSize: '0.6rem', color: '#f59e0b' }}>0%</span>
              </div>
            </div>
            <div className="progress-track" style={{ height: '0.6rem', background: 'var(--surface-1)' }}>
              <div id="frenzy-fill" className="progress-fill" style={{ width: '0%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Console de Combate — respeita a opção de toggle em ambas as resoluções (desktop e mobile) */}
      {showConsole && (
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
      )}
    </div>
  );
};

const ActiveSkillsPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const setGameSpeed = useGameStore((state) => state.setGameSpeed);
  const classId = character.classId || 'warrior';
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [isAutoCastModalOpen, setIsAutoCastModalOpen] = useState(false);
  const [tempHealPercent, setTempHealPercent] = useState<number>(50);
  const [tempDisabledSkills, setTempDisabledSkills] = useState<string[]>([]);

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

  const isAutoCastUnlocked = (character.ascensionCount || 0) >= 1 || character.highestStageReached > 5 || character.currentStage > 5;

  const handleOpenModal = () => {
    setTempHealPercent(character.autoCastHealPercent !== undefined ? character.autoCastHealPercent : 50);
    setTempDisabledSkills(character.autoCastDisabledSkills || []);
    setIsAutoCastModalOpen(true);
    AudioManager.getInstance().playClick();
  };

  const handleSaveSettings = () => {
    useGameStore.getState().updateAutoCastSettings(tempHealPercent, tempDisabledSkills);
    setIsAutoCastModalOpen(false);
    AudioManager.getInstance().playClick();
  };

  const handleCancelSettings = () => {
    setIsAutoCastModalOpen(false);
    AudioManager.getInstance().playClick();
  };

  const toggleSkillInSettings = (skillId: string) => {
    AudioManager.getInstance().playClick();
    if (tempDisabledSkills.includes(skillId)) {
      setTempDisabledSkills(tempDisabledSkills.filter(id => id !== skillId));
    } else {
      setTempDisabledSkills([...tempDisabledSkills, skillId]);
    }
  };

  const hasHealSkill = activeSkills.some(([id]) => id === 'heal');

  return (
    <div className="panel" style={{ padding: '1rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h2 className="section-title" style={{ marginBottom: '0.2rem' }}>Habilidades Ativas Desbloqueadas</h2>
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
                style={{ position: 'relative', overflow: 'hidden' }}
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
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#cbd5e1' }}>Conjuração Automática</span>
                <span className="font-mono" style={{ fontSize: '0.5rem', color: 'var(--gold-400)', background: 'rgba(245, 158, 11, 0.08)', padding: '1px 4px', borderRadius: '3px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  {hasHealSkill ? `HP Cura <${character.autoCastHealPercent || 50}%` : 'Sem Cura'}
                </span>
              </div>
              <span style={{ fontSize: '0.5rem', color: '#64748b', lineHeight: 1.4, marginTop: '2px' }}>Usa habilidades fora de recarga.</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <button
                onClick={handleOpenModal}
                className="btn btn-sm btn-ghost"
                style={{
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.75rem',
                  height: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="Configurar Auto-Cast"
              >
                ⚙️
              </button>
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
          </div>

          {/* Modal/Painel de Configurações inline no fluxo normal */}
          {isAutoCastModalOpen && (
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(25, 20, 15, 0.98), rgba(45, 33, 20, 0.99))',
                border: '1px solid var(--gold-500)',
                boxShadow: '0 0 12px rgba(217, 119, 6, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                animation: 'fade-in 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(217, 119, 6, 0.15)', paddingBottom: '0.4rem' }}>
                <span className="font-heading" style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--gold-400)', letterSpacing: '0.04em' }}>⚙️ CONFIGURAÇÃO DE CONJURAÇÃO</span>
                <button 
                  onClick={handleCancelSettings}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', padding: '0 2px' }}
                >
                  ✕
                </button>
              </div>

              {/* Escolha de Habilidades */}
              <div>
                <span className="font-heading" style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Habilidades Permitidas</span>
                {activeSkills.length === 0 ? (
                  <span style={{ fontSize: '0.52rem', color: '#64748b', fontStyle: 'italic' }}>Nenhuma habilidade ativa.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {activeSkills.map(([id, skill]) => {
                      const isDisabled = tempDisabledSkills.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => toggleSkillInSettings(id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            padding: '0.35rem 0.5rem',
                            background: isDisabled ? 'rgba(0, 0, 0, 0.4)' : 'rgba(217, 119, 6, 0.08)',
                            border: `1px solid ${isDisabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(217, 119, 6, 0.3)'}`,
                            borderRadius: 'var(--radius-sm)',
                            color: isDisabled ? '#64748b' : '#fff',
                            fontSize: '0.62rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{skill.name}</span>
                          <span style={{ 
                            fontSize: '0.52rem', 
                            fontWeight: 700, 
                            color: isDisabled ? '#ef4444' : '#10b981',
                            fontFamily: 'var(--font-heading)',
                            textTransform: 'uppercase'
                          }}>
                            {isDisabled ? 'Bloqueada' : 'Permitida'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Slider de Vida para Cura */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span className="font-heading" style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Limiar de Cura (HP)</span>
                  <span className="font-mono" style={{ fontSize: '0.6rem', color: hasHealSkill ? 'var(--gold-400)' : '#64748b', fontWeight: 700 }}>
                    {hasHealSkill ? `${tempHealPercent}% HP` : 'N/A'}
                  </span>
                </div>
                {hasHealSkill ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <input 
                      type="range" 
                      min="10" 
                      max="90" 
                      step="5"
                      value={tempHealPercent}
                      onChange={(e) => {
                        setTempHealPercent(Number(e.target.value));
                      }}
                      style={{
                        width: '100%',
                        accentColor: 'var(--gold-500)',
                        background: 'rgba(0,0,0,0.5)',
                        height: '4px',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '0.48rem', color: '#64748b', lineHeight: 1.3 }}>
                      A habilidade Cura será conjurada automaticamente se a vida cair abaixo de {tempHealPercent}%.
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.52rem', color: '#64748b', fontStyle: 'italic' }}>
                    Você não possui a habilidade "Cura" desbloqueada na árvore de habilidades desta classe.
                  </span>
                )}
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                <button
                  onClick={handleSaveSettings}
                  className="btn btn-sm btn-gold font-heading"
                  style={{ flex: 1, fontSize: '0.58rem', height: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Salvar
                </button>
                <button
                  onClick={handleCancelSettings}
                  className="btn btn-sm btn-ghost font-heading"
                  style={{ flex: 1, fontSize: '0.58rem', height: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5, background: 'rgba(0,0,0,0.1)', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>Conjuração Automática</span>
            <span style={{ fontSize: '0.5rem', color: '#475569', lineHeight: 1.4 }}>Desbloqueia após vencer a Fase 5.</span>
          </div>
          <span className="badge badge-locked">Bloqueado</span>
        </div>
      )}

      {/* Seção de Velocidade do Jogo (Aceleração 1x/2x/3x) */}
      <div style={{ 
        marginTop: '0.6rem', 
        paddingTop: '0.6rem', 
        borderTop: '1px solid var(--border-dim)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'rgba(0,0,0,0.15)', 
        padding: '0.5rem 0.6rem', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-dim)' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ⚡ Velocidade do Jogo
          </span>
          <span style={{ fontSize: '0.5rem', color: '#64748b', lineHeight: 1.4 }}>Acelera o tempo e combates.</span>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {[0, 1, 2, 3].map((speed) => {
            const isActive = gameSpeed === speed;
            const ascensionCount = character.ascensionCount || 0;
            const isSpeedLocked = (speed === 2 && ascensionCount < 1) || (speed === 3 && ascensionCount < 5);
            
            const getSpeedTooltip = () => {
              if (speed === 2 && ascensionCount < 1) return "Velocidade 2x: Requer 1 Ascensão";
              if (speed === 3 && ascensionCount < 5) return "Velocidade 3x: Requer 5 Ascensões";
              return undefined;
            };

            return (
              <button
                key={speed}
                onClick={() => {
                  if (isSpeedLocked) return;
                  AudioManager.getInstance().playClick();
                  setGameSpeed(speed);
                }}
                className={`btn btn-sm ${isActive ? 'btn-gold' : 'btn-ghost'}`}
                style={{ 
                  minWidth: '1.8rem', 
                  height: '1.3rem', 
                  padding: 0, 
                  fontSize: '0.55rem', 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? undefined : 'rgba(255,255,255,0.03)',
                  border: isActive ? undefined : '1px solid rgba(255,255,255,0.08)',
                  opacity: isSpeedLocked ? 0.3 : 1,
                  cursor: isSpeedLocked ? 'not-allowed' : 'pointer'
                }}
                disabled={isSpeedLocked}
                title={getSpeedTooltip()}
              >
                {isSpeedLocked ? '🔒' : (speed === 0 ? '⏸' : `${speed}x`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modo de Teste (Cheat Mode) */}
      <div style={{ 
        marginTop: '0.6rem', 
        paddingTop: '0.6rem', 
        borderTop: '1px solid var(--border-dim)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'rgba(239, 68, 68, 0.05)', 
        padding: '0.5rem 0.6rem', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid rgba(239, 68, 68, 0.2)' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            🧪 Modo de Teste (5x)
          </span>
          <span style={{ fontSize: '0.5rem', color: '#fca5a5', opacity: 0.7, lineHeight: 1.4 }}>Multiplica Dano, Vida, Mana e XP por 5.</span>
        </div>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            useGameStore.getState().toggleTestMode();
          }}
          className={`btn btn-sm ${character.testMode ? 'btn-red' : 'btn-ghost'}`}
          style={{ 
            minWidth: '4.2rem', 
            height: '1.3rem', 
            padding: 0, 
            fontSize: '0.55rem', 
            fontWeight: 700,
            color: character.testMode ? '#fff' : '#ef4444',
            background: character.testMode ? '#ef4444' : 'rgba(255,255,255,0.03)',
            border: character.testMode ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: character.testMode ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
          }}
        >
          {character.testMode ? 'ATIVADO' : 'DESATIVADO'}
        </button>
      </div>
    </div>
  );
};

const AttributePanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const upgradeAttribute = useGameStore((state) => state.upgradeAttribute);
  const abbreviateNumbers = useGameStore((state) => state.abbreviateNumbers);
  const availablePoints = character.attributePoints;
  const xpNeeded = getXpNeededForLevel(character.level, character.currentStage);
  const [multiplier, setMultiplier] = useState<1 | 10 | 100>(1);

  const handleUpgradeAttribute = (attr: string) => {
    upgradeAttribute(attr as keyof BaseStats, multiplier);
  };

  const getAttrName = (attr: string): string => {
    switch (attr) {
      case 'strength': return 'Força (Dano Guerreiro)';
      case 'magic': return 'Magia (Dano Mago/Clérigo)';
      case 'dexterity': return 'Destreza (Dano Arqueiro/Ladrão)';
      case 'constitution': return 'Constituição (Dano Paladino)';
      case 'luck': return 'Sorte (Dano Necromante & Drop)';
      case 'touch': return 'Toque (Dano de Clique/Tap)';
      default: return attr;
    }
  };

  const getAttrDetails = (attr: string, classId: string): string => {
    switch (attr) {
      case 'strength': 
        return classId === 'warrior' ? 'Aumenta consideravelmente o Dano Físico.' : 'Aumenta levemente o Dano Geral (+0.25 de Dano por ponto).';
      case 'magic': {
        const isPrimary = classId === 'mage' || classId === 'cleric';
        return isPrimary 
          ? 'Mana Máxima +6 / Regen +0.02/s (Escala reduzida por ser primário)' 
          : 'Mana Máxima +18 / Regen +0.09/s (Bônus secundário aumentado!)';
      }
      case 'dexterity': {
        const isPrimary = classId === 'ranger' || classId === 'rogue';
        return isPrimary 
          ? 'Vel. de Ataque +1.0% | Esquiva +0.1% por ponto (Escala reduzida por ser primário)' 
          : 'Vel. de Ataque +3.5% | Esquiva +0.1% por ponto (Bônus secundário aumentado!)';
      }
      case 'constitution': {
        const isPrimary = classId === 'paladin';
        return isPrimary 
          ? 'Vida Máxima +8 / Regen +0.03/s (Escala reduzida por ser primário)' 
          : 'Vida Máxima +18 / Regen +0.08/s (Bônus secundário aumentado!)';
      }
      case 'luck': 
        return 'Aumenta a chance e raridade dos drops de itens, ouro obtido, Chance de Crítico (+0.05%/pt) e Dano Crítico (+0.2%/pt).';
      case 'touch': 
        return 'Aumenta o Dano de Clique (cada 2 pontos de Toque aumentam 1 de dano base).';
      default: 
        return '';
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
          <span className="font-mono" style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{formatNumber(character.xp, abbreviateNumbers)} / {formatNumber(xpNeeded, abbreviateNumbers)} XP</span>
        </div>
        <div className="progress-track progress-xp" style={{ height: '0.5rem' }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, (character.xp / xpNeeded) * 100)}%`, background: 'linear-gradient(90deg, var(--xp-from), var(--xp-to))', boxShadow: '0 0 8px var(--xp-glow)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 calc(0.75rem + 1px)' }}>
        <h2 className="section-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>Atributos Primários</h2>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            setMultiplier((prev) => (prev === 1 ? 10 : prev === 10 ? 100 : 1));
          }}
          className="btn btn-sm btn-gold"
          style={{ minWidth: '3rem' }}
        >
          x{multiplier}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {Object.keys(character.baseStats)
          .filter((attr) => ['strength', 'magic', 'dexterity', 'constitution', 'luck', 'touch'].includes(attr))
          .map((attr) => (
            <div key={attr} className="stat-row">
              <span style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '0.5rem' }}>
                <span className="font-heading" style={{ fontWeight: 700, color: '#fff', fontSize: '0.7rem' }}>{getAttrName(attr)}</span>
                <span className="font-mono" style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.15rem' }}>Valor base: {character.baseStats[attr as keyof BaseStats]}</span>
                <span style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: '0.15rem', opacity: 0.95, lineHeight: 1.2 }}>{getAttrDetails(attr, character.classId)}</span>
              </span>
              <button
                onClick={() => handleUpgradeAttribute(attr)}
                disabled={availablePoints <= 0}
                className={`btn btn-sm ${availablePoints > 0 ? 'btn-gold' : 'btn-ghost'}`}
                style={{ minWidth: '3rem' }}
              >
                +{multiplier}
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

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'rare':
    case 'raro': 
      return '#3b82f6';
    case 'epic':
    case 'épico':
      return '#a855f7';
    case 'legendary':
    case 'lendário': 
      return '#f59e0b';
    case 'mystic':
    case 'místico':
    case 'mística':
      return '#d946ef';
    case 'consumable':
      return '#06b6d4';
    default: 
      return '#94a3b8';
  }
};

const getRarityBg = (rarity: string) => {
  switch (rarity) {
    case 'rare':
    case 'raro': 
      return 'rgba(59, 130, 246, 0.15)';
    case 'epic':
    case 'épico':
      return 'rgba(168, 85, 247, 0.15)';
    case 'legendary':
    case 'lendário': 
      return 'rgba(245, 158, 11, 0.15)';
    case 'mystic':
    case 'místico':
    case 'mística':
      return 'rgba(217, 70, 239, 0.2)';
    case 'consumable':
      return 'rgba(6, 182, 212, 0.15)';
    default: 
      return 'rgba(148, 163, 184, 0.1)';
  }
};

const slotLabels: Record<string, string> = {
  head: 'Cabeça',
  chest: 'Peito',
  legs: 'Pernas',
  gloves: 'Luvas',
  weapon: 'Arma',
  necklace: 'Colar',
  consumable: 'Consumível'
};

const slotIcons: Record<string, string> = {
  head: '🪖',
  chest: '👕',
  legs: '👖',
  gloves: '🧤',
  weapon: '⚔️',
  necklace: '📿',
  consumable: '📦'
};

const statLabels: Record<string, string> = {
  strength: 'Força',
  magic: 'Magia',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  luck: 'Sorte',
  touch: 'Poder do Toque',
  touchCritChance: 'Chance de Crítico',
  touchCritDamage: 'Dano Crítico',
  robotClicks: 'Cliques do Robô',
  lifesteal: 'Roubo de Vida',
  touchDamageMult: 'Multiplicador de Toque',
  damageMultiplierPct: 'Bônus de Dano',
  maxHpPct: 'Bônus de HP',
  attackSpeedPct: 'Velocidade de Ataque',
  maxManaPct: 'Bônus de Mana',
  dropChancePct: 'Chance de Drop',
  damageReductionPct: 'Redução de Dano',
  frenzyChancePct: 'Chance de Frenesi'
};

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
    'touchCritChance',
    'touchCritDamage'
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

interface EquipmentPanelProps {
  selectedItem: EquipmentItem | null;
  setSelectedItem: (item: EquipmentItem | null) => void;
  selectedSlot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace' | null;
  setSelectedSlot: (slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace' | null) => void;
  showDiscardConfirm: boolean;
  setShowDiscardConfirm: (show: boolean) => void;
}

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  selectedItem,
  setSelectedItem,
  selectedSlot,
  setSelectedSlot,
  showDiscardConfirm,
  setShowDiscardConfirm
}) => {
  const [showStats, setShowStats] = useState(() => {
    const saved = localStorage.getItem('amaro_rpg_show_equip_stats');
    return saved !== 'false';
  });
  const [confirmSellCommon, setConfirmSellCommon] = useState(false);
  const [confirmSellLegendary, setConfirmSellLegendary] = useState(false);
  const character = useGameStore((state) => state.character);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const discardItem = useGameStore((state) => state.discardItem);
  const sellAllCommonAndRare = useGameStore((state) => state.sellAllCommonAndRare);
  const sellAllLegendary = useGameStore((state) => state.sellAllLegendary);

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

  const [inventoryTab, setInventoryTab] = useState<'equipment' | 'consumable'>('equipment');
  const maxSlots = character.inventorySlots || 30;
  
  const equipmentItems = character.inventory.filter(item => 
    item.slot !== 'consumable' || 
    item.consumableType === 'chest_legendary' || 
    item.consumableType === 'chest_ancestral'
  );
  
  const consumableItems = character.inventory.filter(item => 
    item.slot === 'consumable' && 
    item.consumableType !== 'chest_legendary' && 
    item.consumableType !== 'chest_ancestral'
  );

  const inventoryGrid = inventoryTab === 'equipment'
    ? Array.from({ length: maxSlots }, (_, i) => equipmentItems[i] || null)
    : consumableItems;

  const handleEquip = (item: EquipmentItem) => {
    AudioManager.getInstance().playClick();
    equipItem(item.id);
    setSelectedItem(null);
  };

  const handleUnequip = (slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace') => {
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

            {/* Colar */}
            <div style={{ gridRow: '1', gridColumn: '3' }}>
              <EquipmentSlot 
                slot="necklace" 
                item={character.equipment.necklace} 
                onClick={() => character.equipment.necklace && setSelectedSlot('necklace')}
                icons={slotIcons}
                labels={slotLabels}
                getRarityColor={getRarityColor}
                getRarityBg={getRarityBg}
              />
            </div>

            {/* Luvas */}
            <div style={{ gridRow: '2', gridColumn: '3' }}>
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
            <div style={{ gridRow: '2', gridColumn: '1' }}>
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
          <h3 
            className="font-heading" 
            onClick={() => {
              AudioManager.getInstance().playClick();
              const nextState = !showStats;
              setShowStats(nextState);
              localStorage.setItem('amaro_rpg_show_equip_stats', String(nextState));
            }}
            style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: 'var(--gold-400)', 
              borderBottom: '1px solid var(--border-dim)', 
              paddingBottom: '0.25rem', 
              margin: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              userSelect: 'none'
            }}
          >
            <span>Atributos Totais & Conjuntos</span>
            <span style={{ fontSize: '0.62rem', color: '#cbd5e1', transition: 'transform 0.15s', transform: showStats ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
              ▼
            </span>
          </h3>

          {showStats && (
            <>
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
                  const baseVal = baseStats[statKey as keyof BaseStats] || 0;
                  const finalVal = finalStats[statKey as keyof BaseStats] || 0;

                  // Calcular bônus de ascensão (prestígio)
                  let ascensionBonus = 0;
                  if (character.prestigeUpgrades) {
                    Object.entries(character.prestigeUpgrades).forEach(([upgradeId, lvl]) => {
                      const upgrade = PRESTIGE_UPGRADES_CATALOG[upgradeId];
                      if (upgrade && upgrade.stat === statKey) {
                        ascensionBonus += upgrade.bonusPerLevel * lvl;
                      }
                    });
                  }

                  const pureBase = Math.max(0, baseVal - ascensionBonus);
                  const equipBonus = Math.max(0, finalVal - baseVal);
                  const hasAnyBonus = equipBonus > 0 || ascensionBonus > 0;

                  const isPercent = statKey === 'touchCritChance' || statKey === 'touchCritDamage';
                  const formatVal = (val: number) => {
                    const rounded = Number(val.toFixed(2));
                    return isPercent ? `${rounded}%` : rounded.toString();
                  };

                  return (
                    <div key={statKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span className="font-heading" style={{ fontWeight: 600, color: '#cbd5e1' }}>{statLabels[statKey] || statKey}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>{formatVal(pureBase)}</span>
                        {hasAnyBonus && (
                          <span className="font-mono" style={{ color: '#64748b', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>(</span>
                            {equipBonus > 0 && (
                              <span style={{ color: '#10b981' }}>+{formatVal(equipBonus)}</span>
                            )}
                            {ascensionBonus > 0 && (
                              <span style={{ color: '#c084fc' }}>+{formatVal(ascensionBonus)}</span>
                            )}
                            <span>)</span>
                          </span>
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
                  if (!config || config.classId !== character.classId) return null;
                  
                  const isAnyBonusActive = count >= 2;
                  const isAncestral = setName.startsWith('Set Ancestral');
                  const isPandemonium = setName.startsWith('Set Pandemoníaco');
                  const isCelestial = setName.startsWith('Set Celestial');
                  
                  let bonusText2 = '(2) +15 Atrib.';
                  let bonusText3 = '(3) +20 Con/For';
                  let bonusText5 = '(5) +35 Atrib.';

                  if (isPandemonium) {
                    bonusText2 = '(2) +250 Atrib.';
                    bonusText3 = '(3) +300 Con/For +150 Sorte e +5% Roubo de Vida';
                    bonusText5 = '(5) +600 Atrib., +25% Dano e +10% HP';
                  } else if (isAncestral) {
                    bonusText2 = '(2) +80 Atrib.';
                    bonusText3 = '(3) +100 Con/For +50 Sorte e Dano de Toque x2';
                    bonusText5 = '(5) +200 Atrib. e +15% Dano';
                  } else if (isCelestial) {
                    bonusText2 = '(2) +160 Atrib.';
                    bonusText3 = '(3) +200 Con/For +100 Sorte e +2 Cliques do Robô';
                    bonusText5 = '(5) +400 Atrib., +40% Dano, +20% HP e +10% Vel. Atq.';
                  }

                  const setIcon = isPandemonium ? '🔥 ' : (isAncestral ? '✨ ' : (isCelestial ? '🌌 ' : ''));
                  const activeColor = isPandemonium ? '#10b981' : (isAncestral ? '#c084fc' : (isCelestial ? '#38bdf8' : 'var(--gold-400)'));
                  const badgeBg = isPandemonium ? 'rgba(16,185,129,0.15)' : (isAncestral ? 'rgba(139,92,246,0.15)' : (isCelestial ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.1)'));
                  const badgeColor = isPandemonium ? '#34d399' : (isAncestral ? '#c4b5fd' : (isCelestial ? '#38bdf8' : 'var(--gold-400)'));
                  const badgeBorder = isPandemonium ? '1px solid rgba(16,185,129,0.3)' : (isAncestral ? '1px solid rgba(139,92,246,0.3)' : (isCelestial ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(245,158,11,0.2)'));

                  return (
                    <div key={setName} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', opacity: isAnyBonusActive ? 1 : 0.4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                        <span style={{ fontWeight: 700, color: isAnyBonusActive ? activeColor : '#cbd5e1' }}>
                          {setIcon}{setName}
                        </span>
                        <span className="font-mono" style={{ fontSize: '0.6rem', color: isAnyBonusActive ? activeColor : 'inherit' }}>{count}/5 Peças</span>
                      </div>
                      {isAnyBonusActive && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.1rem' }}>
                          <span className="badge" style={{ 
                            fontSize: '0.5rem', 
                            background: count >= 2 ? badgeBg : 'rgba(255,255,255,0.05)', 
                            color: count >= 2 ? badgeColor : '#64748b', 
                            border: count >= 2 ? badgeBorder : '1px solid transparent' 
                          }}>
                            {bonusText2}
                          </span>
                          <span className="badge" style={{ 
                            fontSize: '0.5rem', 
                            background: count >= 3 ? badgeBg : 'rgba(255,255,255,0.05)', 
                            color: count >= 3 ? badgeColor : '#64748b', 
                            border: count >= 3 ? badgeBorder : '1px solid transparent' 
                          }}>
                            {bonusText3}
                          </span>
                          <span className="badge" style={{ 
                            fontSize: '0.5rem', 
                            background: count >= 5 ? badgeBg : 'rgba(255,255,255,0.05)', 
                            color: count >= 5 ? badgeColor : '#64748b', 
                            border: count >= 5 ? badgeBorder : '1px solid transparent' 
                          }}>
                            {bonusText5}
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
            </>
          )}
        </div>
      </div>

      {/* Inventário */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        {/* Abas do Inventário */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', gap: '0.25rem' }}>
          <button 
            onClick={() => {
              AudioManager.getInstance().playClick();
              setInventoryTab('equipment');
            }}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: inventoryTab === 'equipment' ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: inventoryTab === 'equipment' ? '2px solid var(--gold-400)' : '2px solid transparent',
              color: inventoryTab === 'equipment' ? 'var(--gold-400)' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            ⚔️ Equipamentos
            <span style={{ 
              fontSize: '0.55rem', 
              background: 'rgba(255,255,255,0.06)', 
              padding: '0.05rem 0.25rem', 
              borderRadius: '4px',
              color: inventoryTab === 'equipment' ? 'var(--gold-400)' : '#64748b'
            }}>
              {equipmentItems.length}/{maxSlots}
            </span>
          </button>
          
          <button 
            onClick={() => {
              AudioManager.getInstance().playClick();
              setInventoryTab('consumable');
            }}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: inventoryTab === 'consumable' ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: inventoryTab === 'consumable' ? '2px solid #a855f7' : '2px solid transparent',
              color: inventoryTab === 'consumable' ? '#c084fc' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            🧪 Consumíveis
            <span style={{ 
              fontSize: '0.55rem', 
              background: 'rgba(255,255,255,0.06)', 
              padding: '0.05rem 0.25rem', 
              borderRadius: '4px',
              color: inventoryTab === 'consumable' ? '#c084fc' : '#64748b'
            }}>
              {consumableItems.length}
            </span>
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))', 
          gap: '0.5rem',
          background: 'rgba(0,0,0,0.15)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-dim)',
          minHeight: inventoryTab === 'equipment' ? '170px' : 'auto'
        }}>
          {inventoryTab === 'consumable' && consumableItems.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.65rem',
              fontStyle: 'italic'
            }}>
              Nenhum item consumível no inventário.
            </div>
          ) : (
            inventoryGrid.map((item, idx) => {
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

              const isAncestral = !!(item.setName && item.setName.startsWith('Set Ancestral'));
              const isPandemonium = !!(item.setName && item.setName.startsWith('Set Pandemoníaco'));
              const isCelestial = !!(item.setName && item.setName.startsWith('Set Celestial'));
              const isPandemoniumMystic = isPandemonium && item.rarity === 'mystic';
              const isPandemoniumBase = isPandemonium && item.rarity !== 'mystic';

              let itemBorder = `2px solid ${getRarityColor(item.rarity)}`;
              let itemShadow = 'none';
              let itemBg = getRarityBg(item.rarity);

              if (isAncestral) {
                itemBorder = '2px dashed #a78bfa';
                itemShadow = '0 0 10px rgba(167, 139, 250, 0.8)';
              } else if (isPandemonium) {
                itemBorder = '2px dashed #10b981';
                itemShadow = '0 0 10px rgba(16, 185, 129, 0.8)';
                if (isPandemoniumBase) {
                  itemBg = 'rgba(16, 185, 129, 0.15)';
                } else if (isPandemoniumMystic) {
                  itemBg = 'rgba(124, 58, 237, 0.2)'; // Violeta escuro
                }
              } else if (isCelestial) {
                itemBorder = '2px dashed #38bdf8';
                itemShadow = '0 0 10px rgba(56, 189, 248, 0.8)';
                itemBg = 'rgba(56, 189, 248, 0.15)';
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
                    background: itemBg,
                    border: itemBorder,
                    boxShadow: itemShadow,
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
                  <span style={{ fontSize: '1.2rem' }}>
                    {item.slot === 'consumable' ? (
                      item.consumableType === 'boost_touch' ? '⚡' :
                      item.consumableType === 'boost_touch_x3' ? '⚡3' :
                      item.consumableType === 'chest_ancestral' ? '🔮' :
                      item.consumableType === 'relic_chest' ? '💜' :
                      item.consumableType === 'unstable_soul_fragment' ? '🔮' :
                      item.consumableType === 'tower_key' ? '🔑' : '🎁'
                    ) : (
                      slotIcons[item.slot]
                    )}
                  </span>
                  {isAncestral && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '2px', 
                      right: '2px', 
                      width: '5px', 
                      height: '5px', 
                      borderRadius: '50%', 
                      background: '#c084fc',
                      boxShadow: '0 0 6px #c084fc',
                      animation: 'glow-pulse 1.5s infinite'
                    }} />
                  )}
                  {isPandemonium && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '2px', 
                      right: '2px', 
                      width: '5px', 
                      height: '5px', 
                      borderRadius: '50%', 
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                      animation: 'glow-pulse 1.5s infinite'
                    }} />
                  )}
                  {!isAncestral && !isPandemonium && item.rarity === 'legendary' && (
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
                  {!isPandemonium && item.rarity === 'mystic' && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '2px', 
                      right: '2px', 
                      width: '5px', 
                      height: '5px', 
                      borderRadius: '50%', 
                      background: '#d946ef',
                      boxShadow: '0 0 6px #d946ef',
                      animation: 'glow-pulse 1.5s infinite'
                    }} />
                  )}
                  {item.rarity === 'mystic' && item.mysticLevel && (
                    <div style={{
                      position: 'absolute',
                      top: '1px',
                      left: '1px',
                      fontSize: '10px',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: '#e879f9',
                      textShadow: '0 0 4px #a21caf',
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}>
                      +{item.mysticLevel}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Botões de Venda em Lote */}
        {inventoryTab === 'equipment' && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => {
                if (confirmSellCommon) {
                  AudioManager.getInstance().playCoin();
                  sellAllCommonAndRare();
                  setConfirmSellCommon(false);
                } else {
                  AudioManager.getInstance().playClick();
                  setConfirmSellCommon(true);
                  // Auto reseta a confirmação após 3 segundos
                  setTimeout(() => {
                    setConfirmSellCommon(current => current ? false : false);
                  }, 3000);
                }
              }}
              className="btn btn-sm"
              style={{ 
                flex: 1, 
                fontSize: '0.62rem', 
                padding: '0.45rem 0.5rem',
                background: confirmSellCommon 
                  ? 'linear-gradient(to right, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25))'
                  : 'linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))',
                border: confirmSellCommon
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: confirmSellCommon ? '#34d399' : '#c084fc',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{confirmSellCommon ? '🪙 Confirmar Venda?' : '🪙 Vender Comuns & Mágicos'}</span>
            </button>
            <button
              onClick={() => {
                if (confirmSellLegendary) {
                  AudioManager.getInstance().playCoin();
                  sellAllLegendary();
                  setConfirmSellLegendary(false);
                } else {
                  AudioManager.getInstance().playClick();
                  setConfirmSellLegendary(true);
                  // Auto reseta a confirmação após 3 segundos
                  setTimeout(() => {
                    setConfirmSellLegendary(current => current ? false : false);
                  }, 3000);
                }
              }}
              className="btn btn-sm"
              style={{ 
                flex: 1, 
                fontSize: '0.62rem', 
                padding: '0.45rem 0.5rem',
                background: confirmSellLegendary
                  ? 'linear-gradient(to right, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25))'
                  : 'linear-gradient(to right, rgba(245, 158, 11, 0.15), rgba(217, 70, 239, 0.15))',
                border: confirmSellLegendary
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: confirmSellLegendary ? '#34d399' : '#fbbf24',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{confirmSellLegendary ? '🪙 Confirmar Venda?' : '🪙 Vender Lendários'}</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

// Componente auxiliar para renderizar cada slot de equipamento
const EquipmentSlot: React.FC<{
  slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace';
  item: EquipmentItem | null;
  onClick: () => void;
  icons: Record<string, string>;
  labels: Record<string, string>;
  getRarityColor: (rarity: string) => string;
  getRarityBg: (rarity: string) => string;
}> = ({ slot, item, onClick, icons, labels, getRarityColor, getRarityBg }) => {
  const isAncestral = !!(item && item.setName && item.setName.startsWith('Set Ancestral'));
  const isPandemonium = !!(item && item.setName && item.setName.startsWith('Set Pandemoníaco'));
  const isCelestial = !!(item && item.setName && item.setName.startsWith('Set Celestial'));
  const isPandemoniumMystic = isPandemonium && item?.rarity === 'mystic';
  const isPandemoniumBase = isPandemonium && item?.rarity !== 'mystic';

  let itemBorder = item ? `2px solid ${getRarityColor(item.rarity)}` : '1px dashed rgba(255,255,255,0.08)';
  let itemShadow = 'none';
  let itemBg = item ? getRarityBg(item.rarity) : 'rgba(0,0,0,0.4)';

  if (item) {
    if (isAncestral) {
      itemBorder = '2px dashed #a78bfa';
      itemShadow = '0 0 10px rgba(167, 139, 250, 0.8)';
    } else if (isPandemonium) {
      itemBorder = '2px dashed #10b981';
      itemShadow = '0 0 10px rgba(16, 185, 129, 0.8)';
      if (isPandemoniumBase) {
        itemBg = 'rgba(16, 185, 129, 0.15)';
      } else if (isPandemoniumMystic) {
        itemBg = 'rgba(124, 58, 237, 0.2)'; // Violeta escuro
      }
    } else if (isCelestial) {
      itemBorder = '2px dashed #38bdf8';
      itemShadow = '0 0 10px rgba(56, 189, 248, 0.8)';
      itemBg = 'rgba(56, 189, 248, 0.15)';
    }
  }

  return (
    <button
      onClick={() => item && onClick()}
      style={{
        width: '52px',
        height: '52px',
        background: itemBg,
        border: itemBorder,
        boxShadow: itemShadow,
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
      {isAncestral && (
        <div style={{ 
          position: 'absolute', 
          top: '2px', 
          right: '2px', 
          width: '5px', 
          height: '5px', 
          borderRadius: '50%', 
          background: '#c084fc',
          boxShadow: '0 0 6px #c084fc',
          animation: 'glow-pulse 1.5s infinite'
        }} />
      )}
      {isPandemonium && (
        <div style={{ 
          position: 'absolute', 
          top: '2px', 
          right: '2px', 
          width: '5px', 
          height: '5px', 
          borderRadius: '50%', 
          background: '#10b981',
          boxShadow: '0 0 6px #10b981',
          animation: 'glow-pulse 1.5s infinite'
        }} />
      )}
      {!isAncestral && !isPandemonium && item?.rarity === 'legendary' && (
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
      {!isPandemonium && item?.rarity === 'mystic' && (
        <div style={{ 
          position: 'absolute', 
          top: '2px', 
          right: '2px', 
          width: '5px', 
          height: '5px', 
          borderRadius: '50%', 
          background: '#d946ef',
          boxShadow: '0 0 6px #d946ef',
          animation: 'glow-pulse 1.5s infinite'
        }} />
      )}
      {item?.rarity === 'mystic' && item.mysticLevel && (
        <div style={{
          position: 'absolute',
          top: '1px',
          left: '2px',
          fontSize: '10px',
          fontWeight: 800,
          lineHeight: 1,
          color: '#e879f9',
          textShadow: '0 0 4px #a21caf',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          +{item.mysticLevel}
        </div>
      )}
      <span style={{ 
        position: 'absolute', 
        bottom: '2px', 
        fontSize: '0.45rem', 
        color: item ? (isPandemoniumBase ? '#10b981' : (isPandemoniumMystic ? '#8b5cf6' : (isAncestral ? '#c084fc' : getRarityColor(item.rarity)))) : '#475569',
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
      case 15:
        return { x: 50, y: 500 }; // Ultimate no rodapé centralizado
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
        <div className="tree-container" style={{ height: '560px' }}>
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
                  className={`skill-node ${
                    isSelected ? 'selected' : 
                    getSkillMaxLevel(id, character.currentStage) === 0 ? 'locked' :
                    isUnlocked ? 'unlocked' : 
                    !meetsLevelReq ? 'locked' : ''
                  }`}
                >
                  <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '105px' }}>{skill.name}</span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.15rem' }}>
                    <span className={`badge ${skill.type === 'active' ? 'badge-active' : 'badge-passive'}`}>
                      {skill.type === 'active' ? 'Ativ' : 'Pass'}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.5rem', color: '#94a3b8' }}>
                      {getSkillMaxLevel(id, character.currentStage) === 0 
                        ? 'Bloq' 
                        : `Lv ${currentLevel}/${getSkillMaxLevel(id, character.currentStage) === Infinity ? '∞' : getSkillMaxLevel(id, character.currentStage)}`
                      }
                    </span>
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
                      if (skillLvl < getSkillMaxLevel(selectedSkillId, character.currentStage)) {
                        nextText = `Restaura ${(30 + skillLvl * 5)}% do HP Máx`;
                      }
                    } else if (baseMult) {
                      if (skillLvl > 0) {
                        const currentPct = (baseMult * (1 + (skillLvl - 1) * 0.15) * 100).toFixed(1);
                        currentText = `Causa ${currentPct}% de Dano`;
                      }
                      if (skillLvl < getSkillMaxLevel(selectedSkillId, character.currentStage)) {
                        const nextPct = (baseMult * (1 + skillLvl * 0.15) * 100).toFixed(1);
                        nextText = `Causa ${nextPct}% de Dano`;
                      }
                    }

                    return (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {getSimpleStatusEffectInfo(selectedSkillId, skillLvl || 1) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#94a3b8' }}>Status Aplicado:</span>
                              <span style={{ color: '#60a5fa', fontWeight: 600 }}>{getSimpleStatusEffectInfo(selectedSkillId, skillLvl || 1)}</span>
                            </div>
                            {skillLvl > 0 && skillLvl < getSkillMaxLevel(selectedSkillId, character.currentStage) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.85 }}>
                                <span style={{ color: '#64748b', fontSize: '0.62rem' }}>Próx. Nível Status:</span>
                                <span style={{ color: '#34d399', fontWeight: 500, fontSize: '0.62rem' }}>{getSimpleStatusEffectInfo(selectedSkillId, skillLvl + 1)}</span>
                              </div>
                            )}
                          </div>
                        )}
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
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {getSkillMaxLevel(selectedSkillId, character.currentStage) === 0 
                      ? 'Bloqueado (Requer Dificuldade Inferno)'
                      : `Nível: ${character.skillLevels[selectedSkillId] || 0} / ${getSkillMaxLevel(selectedSkillId, character.currentStage) === Infinity ? '∞' : getSkillMaxLevel(selectedSkillId, character.currentStage)}`
                    }
                  </span>
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
                        (character.skillLevels[selectedSkillId] || 0) >= getSkillMaxLevel(selectedSkillId, character.currentStage) ||
                        availableSkillPoints < selectedSkill.cost ||
                        character.level < selectedSkill.requiredLevel ||
                        !selectedSkill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0)
                      }
                      className={`btn btn-sm ${
                        (character.skillLevels[selectedSkillId] || 0) < getSkillMaxLevel(selectedSkillId, character.currentStage) &&
                        availableSkillPoints >= selectedSkill.cost &&
                        character.level >= selectedSkill.requiredLevel &&
                        selectedSkill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0)
                          ? 'btn-gold' : 'btn-ghost'
                      }`}
                    >
                      {getSkillMaxLevel(selectedSkillId, character.currentStage) === 0 
                        ? 'Bloqueado'
                        : (character.skillLevels[selectedSkillId] || 0) >= getSkillMaxLevel(selectedSkillId, character.currentStage) 
                          ? 'Nível Máximo' 
                          : `Aprimorar (${selectedSkill.cost} SP)`
                      }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
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
                      {getSkillMaxLevel(id, character.currentStage) === 0
                        ? 'Requer Dificuldade Inferno'
                        : isLocked 
                          ? `Requer Lvl ${skill.requiredLevel}${skill.dependencies.length > 0 ? ` + ${SKILLS_CATALOG[skill.dependencies[0]]?.name}` : ''}`
                          : `Nível ${currentLevel}/${getSkillMaxLevel(id, character.currentStage) === Infinity ? '∞' : getSkillMaxLevel(id, character.currentStage)}`
                      }
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getSkillMaxLevel(id, character.currentStage) === 0 ? (
                      <span style={{ fontSize: '0.6rem', color: '#f43f5e' }}>🔒 Requer Inferno</span>
                    ) : (
                      <>
                        {isLocked && <span style={{ fontSize: '0.6rem', color: '#64748b' }}>🔒 Bloqueada</span>}
                        {!isLocked && !isUnlocked && <span style={{ fontSize: '0.6rem', color: 'var(--gold-400)' }}>Disponível</span>}
                        {isUnlocked && <span className="font-mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Lv {currentLevel}</span>}
                      </>
                    )}
                    
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
                        if (currentLevel < getSkillMaxLevel(id, character.currentStage)) {
                          nextText = `Restaura ${(30 + currentLevel * 5)}% do HP Máx`;
                        }
                      } else if (baseMult) {
                        if (currentLevel > 0) {
                          const currentPct = (baseMult * (1 + (currentLevel - 1) * 0.15) * 100).toFixed(1);
                          currentText = `Causa ${currentPct}% de Dano`;
                        }
                        if (currentLevel < getSkillMaxLevel(id, character.currentStage)) {
                          const nextPct = (baseMult * (1 + currentLevel * 0.15) * 100).toFixed(1);
                          nextText = `Causa ${nextPct}% de Dano`;
                        }
                      }

                      return (
                        <div style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', fontSize: '0.62rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {getSimpleStatusEffectInfo(id, currentLevel || 1) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Status Aplicado:</span>
                                <span style={{ color: '#60a5fa', fontWeight: 600 }}>{getSimpleStatusEffectInfo(id, currentLevel || 1)}</span>
                              </div>
                              {currentLevel > 0 && currentLevel < getSkillMaxLevel(id, character.currentStage) && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.85 }}>
                                  <span style={{ color: '#64748b', fontSize: '0.58rem' }}>Próx. Nível Status:</span>
                                  <span style={{ color: '#34d399', fontWeight: 500, fontSize: '0.58rem' }}>{getSimpleStatusEffectInfo(id, currentLevel + 1)}</span>
                                </div>
                              )}
                            </div>
                          )}
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
                          (character.skillLevels[id] || 0) >= getSkillMaxLevel(id, character.currentStage) ||
                          availableSkillPoints < skill.cost ||
                          character.level < skill.requiredLevel ||
                          !skill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0)
                        }
                        className={`btn btn-sm ${
                          (character.skillLevels[id] || 0) < getSkillMaxLevel(id, character.currentStage) &&
                          availableSkillPoints >= skill.cost &&
                          character.level >= skill.requiredLevel &&
                          skill.dependencies.every(dep => (character.skillLevels[dep] || 0) > 0)
                            ? 'btn-gold' : 'btn-ghost'
                        }`}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem' }}
                      >
                        {getSkillMaxLevel(id, character.currentStage) === 0 
                          ? 'Bloqueado' 
                          : (character.skillLevels[id] || 0) >= getSkillMaxLevel(id, character.currentStage) 
                            ? 'Nível Máximo' 
                            : `Aprimorar (${skill.cost} SP)`
                        }
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
  const startDailyChallenge = useGameStore((state) => state.startDailyChallenge);
  const exitDailyChallenge = useGameStore((state) => state.exitDailyChallenge);
  const getTodayYYYYMMDD = useGameStore((state) => state.getTodayYYYYMMDD);
  const performTranscendence = useGameStore((state) => state.performTranscendence);
  const upgradeTranscendenceStat = useGameStore((state) => state.upgradeTranscendenceStat);
  const resetTranscendenceUpgrades = useGameStore((state) => state.resetTranscendenceUpgrades);
  const toggleEcoterra = useGameStore((state) => state.toggleEcoterra);

  const [subTab, setSubTab] = useState<'tree' | 'trail' | 'relics'>('tree');

  const unstableSoulFragments = useRelicStore((state) => state.unstableSoulFragments);
  const relics = useRelicStore((state) => state.relics);
  const forgeRelic = useRelicStore((state) => state.forgeRelic);
  const [forgeResult, setForgeResult] = useState<string | null>(null);

  const upgradeable = Object.values(relics).filter(r => r.level < r.maxLevel);
  const isAllMaxed = upgradeable.length === 0;

  const handleForge = () => {
    AudioManager.getInstance().playClick();
    const res = forgeRelic();
    if (res.success) {
      setForgeResult(res.message);
      setTimeout(() => setForgeResult(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const availablePrestigePoints = character.prestigePoints;
  const level = character.level;
  const totalXp = getTotalXpEarned(character);
  // Multiplicado por 1.5 para alinhar com a triplicação no store
  const prestigeEarnedOnReset = calculatePrestigePointsFromTotalXp(totalXp);
  const ascensionCount = character.ascensionCount || 0;
  const requiredPP = ascensionCount === 0 ? 1 : 3 + 2 * ascensionCount;
  const isProgressReqMet = ascensionCount === 0
    ? (character.highestStageReached >= 6)
    : (level >= 5);
  const isInTowerOrChallenge = useTowerStore((state) => state.towerActive) || !!character.activeDailyChallenge;
  const canPrestige = isProgressReqMet && prestigeEarnedOnReset >= requiredPP && !isInTowerOrChallenge;

  const baseKeys = ['perm_str', 'perm_mag', 'perm_dex', 'perm_con', 'perm_luk'];
  const isBaseMaxed = baseKeys.every(key => (character.prestigeUpgrades[key] || 0) >= 10);

  // Coord do Layout Diamante / Estrela
  const hubPos = { x: 50, y: 220 };
  const getUpgradePos = (id: string) => {
    switch (id) {
      case 'perm_mag': return { x: 50, y: 70 };  // Top
      case 'perm_dex': return { x: 80, y: 174 }; // Top Right
      case 'perm_con': return { x: 69, y: 341 }; // Bottom Right
      case 'perm_str': return { x: 31, y: 341 }; // Bottom Left
      case 'perm_luk': return { x: 20, y: 174 }; // Top Left
      case 'perm_touch': return { x: 20, y: 400 };
      case 'perm_touch_crit': return { x: 40, y: 400 };
      case 'perm_touch_crit_dmg': return { x: 60, y: 400 };
      case 'perm_robot': return { x: 80, y: 400 };
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

      {/* Sub-abas */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            setSubTab('tree');
          }}
          className={`btn btn-sm ${subTab === 'tree' ? 'btn-purple' : 'btn-ghost'}`}
          style={{ flex: 1, fontSize: '0.62rem', padding: '0.35rem 0', fontWeight: 'bold' }}
        >
          🌳 Árvore de Almas
        </button>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            setSubTab('trail');
          }}
          className={`btn btn-sm ${subTab === 'trail' ? 'btn-purple' : 'btn-ghost'}`}
          style={{ flex: 1, fontSize: '0.62rem', padding: '0.35rem 0', fontWeight: 'bold' }}
        >
          🏆 Trilha da Ascensão
        </button>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            setSubTab('relics');
          }}
          className={`btn btn-sm ${subTab === 'relics' ? 'btn-purple' : 'btn-ghost'}`}
          style={{ flex: 1, fontSize: '0.62rem', padding: '0.35rem 0', fontWeight: 'bold' }}
        >
          🔮 Altar de Relíquias
        </button>
      </div>

      {subTab === 'trail' ? (
        (() => {
          const today = getTodayYYYYMMDD();
          const seed = parseInt(today, 10);
          const challengeStage = (seed % 10) + 10;
          const activeModifierIndex = seed % 5;
          const modifier = DAILY_MODIFIERS[activeModifierIndex] || DAILY_MODIFIERS[0];
          const isCompleted = character.lastCompletedDailyChallenge === today;
          const isActive = character.activeDailyChallenge;
          const records = getPersonalRecords();

          const formatTime = (seconds: number) => {
            if (seconds === 999999) return 'N/A';
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m ${secs}s`;
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }} className="animate-tabFade">
              {/* Card de Desafio Diário */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(76,29,149,0.08) 100%)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(124,58,237,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📅 Desafio Diário (Fase Espelho)
                  </h3>
                  <span style={{ fontSize: '0.58rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    {today.substring(6, 8)}/{today.substring(4, 6)}/{today.substring(0, 4)}
                  </span>
                </div>

                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>
                  Enfrente a Fase Espelho com modificadores únicos que mudam diariamente à meia-noite (horário local).
                </p>

                {/* Fase Espelho & Modificador */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border-dim)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Dificuldade do Dia:</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b' }}>Fase Espelho {challengeStage}</span>
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: modifier.color, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      {modifier.name}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', lineHeight: '1.3' }}>
                      {modifier.description}
                    </div>
                  </div>
                </div>

                {/* Recompensas */}
                <div>
                  <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.68rem', fontWeight: 'bold', color: '#e2e8f0' }}>Recompensas de Primeira Conclusão:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>🪙</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.62rem', color: '#a1a1aa' }}>Ouro</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--gold-400)' }}>+{1000 * challengeStage}</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>🌀</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.62rem', color: '#a1a1aa' }}>Fragmento de Alma</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#c084fc' }}>+2 Instáveis</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div style={{ marginTop: '0.25rem' }}>
                  {isCompleted ? (
                    <button 
                      disabled
                      style={{ width: '100%', cursor: 'not-allowed', opacity: 0.8 }}
                      className="btn btn-secondary btn-sm"
                    >
                      🏆 Desafio Diário Concluído Hoje
                    </button>
                  ) : isActive ? (
                    <button 
                      onClick={() => {
                        AudioManager.getInstance().playClick();
                        exitDailyChallenge(false);
                      }}
                      style={{ width: '100%' }}
                      className="btn btn-red btn-sm"
                    >
                      🚪 Abandonar Desafio Diário
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        AudioManager.getInstance().playClick();
                        startDailyChallenge();
                      }}
                      style={{ width: '100%', background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', color: '#fff' }}
                      className="btn btn-purple btn-sm"
                    >
                      ⚔️ Iniciar Desafio Diário
                    </button>
                  )}
                </div>
              </div>

              {/* Card de Recordes Pessoais */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(76,29,149,0.08) 100%)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(124,58,237,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🏅 Recordes Pessoais
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.68rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#94a3b8' }}>Maior Fase Alcançada:</span>
                    <span className="font-semibold text-white font-mono">{records.maxStageReached}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#94a3b8' }}>Maior ganho de PP em uma rodada:</span>
                    <span className="font-semibold text-white font-mono">{records.maxPPGainedInSingleReset} PP</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#94a3b8' }}>Melhor tempo até Fase 20:</span>
                    <span className="font-semibold text-white font-mono">{formatTime(records.minTimeToStage20)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                    <span style={{ color: '#94a3b8' }}>Total de Ascensões Realizadas:</span>
                    <span className="font-semibold text-white font-mono">{records.totalAscensions || ascensionCount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : subTab === 'relics' ? (
        (() => {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }} className="animate-tabFade">
              {/* Card Central do Altar */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🔮 Altar de Relíquias de Alma
                  </h3>
                  <div style={{
                    fontSize: '0.68rem',
                    color: '#c4b5fd',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(167, 139, 250, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>🌀 Fragmentos:</span>
                    <strong className="font-mono text-purple-300" style={{ fontSize: '0.75rem' }}>{unstableSoulFragments}</strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>
                  Canalize seus <strong>Fragmentos de Alma Instável</strong> no altar para forjar relíquias lendárias. Cada tentativa consome <strong>10 Fragmentos</strong> e concede ou aprimora uma relíquia aleatória. As relíquias permanecem ativas permanentemente e <strong>são preservadas durante a Ascensão</strong>!
                </p>

                {/* Botão de Forja */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={handleForge}
                    disabled={unstableSoulFragments < 10 || isAllMaxed}
                    className={`btn ${unstableSoulFragments >= 10 && !isAllMaxed ? 'btn-purple' : 'btn-secondary'} btn-sm`}
                    style={{
                      width: '100%',
                      background: unstableSoulFragments >= 10 && !isAllMaxed 
                        ? 'linear-gradient(135deg, #a78bfa, #7c3aed)' 
                        : undefined,
                      color: '#fff',
                      boxShadow: unstableSoulFragments >= 10 && !isAllMaxed 
                        ? '0 0 10px rgba(167, 139, 250, 0.4)' 
                        : undefined,
                      height: '2.2rem',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      cursor: unstableSoulFragments >= 10 && !isAllMaxed ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {isAllMaxed 
                      ? '✨ Todas as Relíquias no Nível Máximo' 
                      : unstableSoulFragments < 10 
                        ? 'Requer 10 Fragmentos'
                        : '🔮 Canalizar Alma'
                    }
                  </button>

                  {forgeResult && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.68rem',
                      color: '#34d399',
                      textAlign: 'center',
                      animation: 'fadeIn 0.3s ease-out'
                    }}>
                      {forgeResult}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Relíquias */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.values(relics).map((relic) => {
                  const isLocked = relic.level === 0;
                  const isMaxed = relic.level === relic.maxLevel;
                  
                  // Escolhe um ícone/emoji representativo
                  let icon = '🔮';
                  if (relic.id === 'luz_alma') icon = '⚔️';
                  if (relic.id === 'moeda_ciclo') icon = '🪙';
                  if (relic.id === 'simbolo_aprendizado') icon = '📚';
                  if (relic.id === 'gema_vontade') icon = '💎';
                  if (relic.id === 'nucleo_pensamento') icon = '🧠';
                  if (relic.id === 'foco_precisao') icon = '🎯';
                  if (relic.id === 'brasao_devoacao') icon = '🛡️';
                  if (relic.id === 'olho_sobrevivencia') icon = '👁️';

                  return (
                    <div
                      key={relic.id}
                      style={{
                        background: isLocked 
                          ? 'rgba(30, 41, 59, 0.2)' 
                          : 'linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
                        border: isLocked 
                          ? '1px solid rgba(255,255,255,0.05)' 
                          : isMaxed
                            ? '1px solid rgba(245, 158, 11, 0.35)'
                            : '1px solid rgba(167, 139, 250, 0.2)',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        opacity: isLocked ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.3s'
                      }}
                    >
                      {/* Ícone */}
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isLocked 
                          ? 'rgba(0,0,0,0.4)' 
                          : isMaxed
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))'
                            : 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(124, 58, 237, 0.2))',
                        border: isLocked
                          ? '1px solid rgba(255,255,255,0.1)'
                          : isMaxed
                            ? '1px solid rgba(245, 158, 11, 0.4)'
                            : '1px solid rgba(167, 139, 250, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        boxShadow: isLocked ? 'none' : isMaxed ? '0 0 8px rgba(245, 158, 11, 0.3)' : '0 0 8px rgba(167, 139, 250, 0.2)',
                      }}>
                        {icon}
                      </div>

                      {/* Conteúdo */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: isLocked ? '#94a3b8' : isMaxed ? 'var(--gold-400)' : '#fff'
                          }}>
                            {relic.name}
                          </span>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 'bold',
                            color: isLocked ? '#64748b' : isMaxed ? 'var(--gold-400)' : '#c4b5fd'
                          }}>
                            {isLocked ? 'Bloqueado' : isMaxed ? 'MÁXIMO' : `Nível ${relic.level}/${relic.maxLevel}`}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.65rem', color: '#cbd5e1', margin: 0 }}>
                          {relic.description}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                            Bônus Atual: <strong style={{ color: isLocked ? '#64748b' : '#34d399' }}>
                              {(() => {
                                const val = relic.level * relic.bonusValuePerLevel;
                                if (['luz_alma', 'moeda_ciclo', 'simbolo_aprendizado'].includes(relic.id)) {
                                  return `+${Math.round(val * 100)}%`;
                                }
                                return `+${val}`;
                              })()}
                            </strong>
                          </span>
                          
                          {/* Progresso visual (estrelas/bolinhas) */}
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            {Array.from({ length: relic.maxLevel || 5 }, (_, i) => i + 1).map((star) => {
                              const active = relic.level >= star;
                              return (
                                <span
                                  key={star}
                                  style={{
                                    fontSize: '0.65rem',
                                    color: active 
                                      ? isMaxed ? '#fbbf24' : '#c084fc' 
                                      : '#374151',
                                    textShadow: active 
                                      ? isMaxed ? '0 0 4px rgba(251,191,36,0.6)' : '0 0 4px rgba(192,132,252,0.6)' 
                                      : 'none'
                                  }}
                                >
                                  ★
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : (
        <>
          {/* Resumo de Bônus Ativos das Ascensões */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(76,29,149,0.05) 100%)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 className="font-heading" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Bônus de Alma ({ascensionCount} {ascensionCount === 1 ? 'Ascensão' : 'Ascensões'})</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.8rem', fontSize: '0.62rem', color: '#94a3b8' }}>
          <div className="flex justify-between">
            <span>Dano Geral:</span>
            <span className="font-semibold text-purple-300 font-mono">+{ascensionCount * 5}%</span>
          </div>
          <div className="flex justify-between">
            <span>Velocidade de Ataque:</span>
            <span className="font-semibold text-purple-300 font-mono">+{ascensionCount * 1}%</span>
          </div>
          <div className="flex justify-between">
            <span>Vida Máxima:</span>
            <span className="font-semibold text-purple-300 font-mono">+{ascensionCount * 2.5}%</span>
          </div>
          <div className="flex justify-between">
            <span>Mana Máxima:</span>
            <span className="font-semibold text-purple-300 font-mono">+{ascensionCount * 2.5}%</span>
          </div>
          <div className="flex justify-between">
            <span>Dano de Toque:</span>
            <span className="font-semibold text-purple-300 font-mono">+{ascensionCount * 5}</span>
          </div>
          <div className="flex justify-between">
            <span>Chance de Crítico:</span>
            <span className="font-semibold text-purple-300 font-mono">+{(ascensionCount * 0.1).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Dano Crítico:</span>
            <span className="font-semibold text-purple-300 font-mono">+{ascensionCount * 1}%</span>
          </div>
          <div className="flex justify-between">
            <span>Esquiva:</span>
            <span className="font-semibold text-purple-300 font-mono">+{(ascensionCount * 0.5).toFixed(1)}%</span>
          </div>
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
            {isInTowerOrChallenge
              ? 'Saia da Torre/Desafio Diário para Ascender'
              : !isProgressReqMet
                ? (ascensionCount === 0
                    ? 'Requer completar a Fase 5'
                    : 'Requer Nível 5+ para obter PP')
                : prestigeEarnedOnReset < requiredPP
                  ? `Requer +${requiredPP} PP nesta rodada (Ganho: ${prestigeEarnedOnReset})`
                  : `Ascender (+${prestigeEarnedOnReset} PP)`
            }
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
        <div className="tree-container" style={{ height: '470px' }}>
          <div className="tree-content-area">
            {/* Linhas SVG conectadas ao Hub central (Apenas atributos clássicos) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {Object.keys(PRESTIGE_UPGRADES_CATALOG)
                .filter((id) => !['perm_touch', 'perm_touch_crit', 'perm_touch_crit_dmg', 'perm_robot'].includes(id))
                .map((id) => {
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

            {/* Hub Central (Cristal de Almas / Pandemônio) */}
            <div 
              style={{ left: `calc(${hubPos.x}% - 28px)`, top: `calc(${hubPos.y}px - 28px)`, cursor: isBaseMaxed ? 'pointer' : 'default', zIndex: 10 }}
              className="absolute"
              onClick={() => {
                if (isBaseMaxed) {
                  AudioManager.getInstance().playClick();
                  setSelectedUpgradeId('alma_pandemonium');
                  setShowPrestigeModal(true);
                }
              }}
            >
              <div style={{ 
                width: 56, 
                height: 56, 
                background: character.pandemoniumUnlocked 
                  ? 'linear-gradient(135deg, #ef4444, #7f1d1d)' 
                  : isBaseMaxed 
                    ? 'linear-gradient(135deg, #ec4899, #7c3aed)' 
                    : 'linear-gradient(135deg, var(--prestige-from), #4338ca)', 
                borderRadius: '50%', 
                border: character.pandemoniumUnlocked 
                  ? '2px solid #f87171' 
                  : isBaseMaxed 
                    ? '2px solid #f472b6' 
                    : '2px solid #a78bfa', 
                boxShadow: character.pandemoniumUnlocked
                  ? '0 0 15px rgba(239, 68, 68, 0.8)'
                  : isBaseMaxed
                    ? '0 0 15px rgba(236, 72, 153, 0.8)'
                    : 'var(--shadow-glow-purple)', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                animation: 'float 3s ease-in-out infinite',
                transition: 'all 0.3s'
              }}>
                <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Alma</span>
                {isBaseMaxed && !character.pandemoniumUnlocked && (
                  <span className="font-mono text-pink-300" style={{ fontSize: '0.45rem', marginTop: '-1px', fontWeight: 'bold' }}>! UPGRADE</span>
                )}
                {character.pandemoniumUnlocked && (
                  <span className="font-mono text-red-200" style={{ fontSize: '0.45rem', marginTop: '-1px', fontWeight: 'bold' }}>PANDEMÔNIO</span>
                )}
              </div>
            </div>

            {/* Nós de Upgrade ao Redor (Estrela de Atributos) */}
            {Object.entries(PRESTIGE_UPGRADES_CATALOG)
              .filter(([id]) => !['perm_touch', 'perm_touch_crit', 'perm_touch_crit_dmg', 'perm_robot'].includes(id))
              .map(([id, upgrade]) => {
                const pos = getUpgradePos(id);
                const currentLevel = character.prestigeUpgrades[id] || 0;
                const isSelected = selectedUpgradeId === id;
                const isUpgraded = currentLevel > 0;

                const left = `calc(${pos.x}% - 60px)`;
                const top = `calc(${pos.y}px - 25px)`;

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
                    <span className="font-mono" style={{ fontSize: '0.5rem', color: '#a78bfa', marginTop: '0.15rem' }}>Lvl {currentLevel}/{character.pandemoniumUnlocked ? '∞' : upgrade.maxLevel}</span>
                  </button>
                );
              })}

            {/* Upgrades de Toque (Linha inferior centralizada e espaçada) */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              pointerEvents: 'none'
            }}>
              {Object.entries(PRESTIGE_UPGRADES_CATALOG)
                .filter(([id]) => ['perm_touch', 'perm_touch_crit', 'perm_touch_crit_dmg', 'perm_robot'].includes(id))
                .map(([id, upgrade]) => {
                  const currentLevel = character.prestigeUpgrades[id] || 0;
                  const isSelected = selectedUpgradeId === id;
                  const isUpgraded = currentLevel > 0;

                  return (
                    <button
                      key={id}
                      onClick={() => {
                        AudioManager.getInstance().playClick();
                        setSelectedUpgradeId(id);
                        setShowPrestigeModal(true);
                      }}
                      style={{ position: 'relative', pointerEvents: 'auto' }}
                      className={`skill-node prestige-node ${isSelected ? 'selected' : isUpgraded ? 'unlocked' : ''}`}
                    >
                      <span className="font-heading" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '105px' }}>{upgrade.name}</span>
                      <span className="font-mono" style={{ fontSize: '0.5rem', color: '#a78bfa', marginTop: '0.15rem' }}>Lvl {currentLevel}/{upgrade.maxLevel}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Modal de Detalhes da Ascensão (Desktop) */}
          {showPrestigeModal && (selectedUpgrade || selectedUpgradeId === 'alma_pandemonium') && (
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
              if (selectedUpgradeId === 'alma_pandemonium') {
                  const isUnlocked = character.pandemoniumUnlocked;
                  const cost = 100;
                  const isPurgatoryDone = character.purgatoryCompleted;
                  const hasPoints = availablePrestigePoints >= cost && isPurgatoryDone && !isInTowerOrChallenge;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '36rem', margin: '0 auto' }}>
                      <div>
                        <h3 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f87171', textShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
                          Modo Pandemônio (v4.0.0)
                        </h3>
                        <p style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.5rem', lineHeight: 1.6 }}>
                          {isUnlocked 
                            ? "O Modo Pandemônio está ativo! Seu progresso de estágio agora é infinito e todos os inimigos e chefes aparecem de forma aleatória a partir do estágio 31. Os atributos dos inimigos escalam com dificuldade 5x inicial. Fazer ascensões mantém seus equipamentos equipados."
                            : "Desbloqueie o poder supremo da Alma. Ao ativar o Modo Pandemônio por 100 PP, você iniciará uma Ascensão Especial imediatamente. O progresso de fases se tornará infinito a partir da Fase 31, com inimigos aleatórios, dificuldade 5x inicial e seus equipamentos equipados serão mantidos a cada ascensão."}
                        </p>
                        {!isUnlocked && !isPurgatoryDone && (
                          <p style={{ fontSize: '0.7rem', color: '#fb923c', marginTop: '0.5rem', fontWeight: 500 }}>
                            ⚠️ Requisito Adicional: Você precisa derrotar o Guardião dos Cacos no final do Purgatório (Fase 30) para poder ativar o Pandemônio.
                          </p>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.72rem', color: '#f472b6' }}>
                          Status: {isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 500 }}>
                          Multiplicador Inicial: 5x HP/Dano
                        </span>
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
                          {!isUnlocked && (
                            <button
                              onClick={() => {
                                AudioManager.getInstance().playClick();
                                useGameStore.getState().unlockPandemonium();
                                setShowPrestigeModal(false);
                              }}
                              disabled={!hasPoints}
                              className={`btn btn-sm ${hasPoints ? 'btn-purple' : 'btn-ghost'}`}
                              style={{
                                background: hasPoints ? 'linear-gradient(135deg, #ef4444, #7f1d1d)' : undefined,
                                border: hasPoints ? '1px solid #f87171' : undefined
                              }}
                            >
                              {isInTowerOrChallenge
                                ? 'Saia da Torre/Desafio Diário'
                                : isPurgatoryDone ? `Ativar Modo Pandemônio (${cost} PP)` : 'Requer Purgatório'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                const currentLevel = character.prestigeUpgrades[selectedUpgradeId] || 0;
                const isBaseStatUpgrade = ['perm_str', 'perm_mag', 'perm_dex', 'perm_con', 'perm_luk'].includes(selectedUpgradeId);
                const maxLevel = (isBaseStatUpgrade && character.pandemoniumUnlocked) ? Infinity : selectedUpgrade.maxLevel;
                const isMax = currentLevel >= maxLevel;
                const cost = selectedUpgrade.costPerLevel * (currentLevel + 1);
                const hasPoints = availablePrestigePoints >= cost;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '36rem', margin: '0 auto' }}>
                    <div>
                      <h3 className="font-heading" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{selectedUpgrade.name}</h3>
                      <p style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.5rem', lineHeight: 1.6 }}>{selectedUpgrade.description}</p>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.72rem', color: '#a78bfa' }}>Nível: {currentLevel} / {maxLevel === Infinity ? '∞' : selectedUpgrade.maxLevel}</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
          {isBaseMaxed && (
            <div
              className={`prestige-list-card ${selectedUpgradeId === 'alma_pandemonium' ? 'selected' : character.pandemoniumUnlocked ? 'unlocked' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '0.6rem 0.8rem',
                background: selectedUpgradeId === 'alma_pandemonium' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0,0,0,0.3)',
                border: selectedUpgradeId === 'alma_pandemonium' ? '1px solid #ef4444' : '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s'
              }}
            >
              {/* Cabeçalho do Card */}
              <div
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  if (selectedUpgradeId === 'alma_pandemonium') {
                    setSelectedUpgradeId('');
                  } else {
                    setSelectedUpgradeId('alma_pandemonium');
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
                  <span className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>
                    Alma - Modo Pandemônio (v3.0.0)
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                    {character.pandemoniumUnlocked ? 'Desbloqueado' : 'Pronto para Ativar'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {character.pandemoniumUnlocked && <span style={{ fontSize: '0.6rem', color: '#ef4444' }}>Ativo</span>}
                  <span style={{ fontSize: '0.5rem', color: '#64748b', marginLeft: '0.2rem' }}>
                    {selectedUpgradeId === 'alma_pandemonium' ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Conteúdo Expandido no Mobile */}
              {selectedUpgradeId === 'alma_pandemonium' && (
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
                    {character.pandemoniumUnlocked 
                      ? "O Modo Pandemônio está ativo! Seu progresso de estágio agora é infinito e todos os inimigos e chefes aparecem de forma aleatória a partir do estágio 31. Os atributos dos inimigos escalam com dificuldade 5x inicial. Fazer ascensões mantém seus equipamentos equipados."
                      : "Desbloqueie o poder supremo da Alma. Ao ativar o Modo Pandemônio por 100 PP, você iniciará uma Ascensão Especial imediatamente. O progresso de fases se tornará infinito a partir da Fase 31, com inimigos aleatórios, dificuldade 5x inicial e seus equipamentos equipados serão mantidos a cada ascensão."}
                  </p>
                  {!character.pandemoniumUnlocked && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {!character.purgatoryCompleted && (
                        <span style={{ fontSize: '0.6rem', color: '#fb923c', fontWeight: 500 }}>
                          ⚠️ Requer derrotar o Guardião dos Cacos (Fase 30).
                        </span>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6rem', color: '#f472b6', fontWeight: 500 }}>
                          Requer: 100 PP
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const cost = 100;
                            if (availablePrestigePoints >= cost && character.purgatoryCompleted && !isInTowerOrChallenge) {
                              AudioManager.getInstance().playClick();
                              useGameStore.getState().unlockPandemonium();
                              setSelectedUpgradeId('');
                            }
                          }}
                          disabled={availablePrestigePoints < 100 || !character.purgatoryCompleted || isInTowerOrChallenge}
                          className={`btn btn-sm ${(availablePrestigePoints >= 100 && character.purgatoryCompleted && !isInTowerOrChallenge) ? 'btn-purple' : 'btn-ghost'}`}
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.6rem',
                            background: (availablePrestigePoints >= 100 && character.purgatoryCompleted && !isInTowerOrChallenge) ? 'linear-gradient(135deg, #ef4444, #7f1d1d)' : undefined,
                            border: (availablePrestigePoints >= 100 && character.purgatoryCompleted && !isInTowerOrChallenge) ? '1px solid #f87171' : undefined
                          }}
                        >
                          {isInTowerOrChallenge ? 'Saia da Torre/Desafio' : character.purgatoryCompleted ? 'Ativar (100 PP)' : 'Requer Purgatório'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {Object.entries(PRESTIGE_UPGRADES_CATALOG).map(([id, upgrade]) => {
            const currentLevel = character.prestigeUpgrades[id] || 0;
            const isSelected = selectedUpgradeId === id;
            const isUpgraded = currentLevel > 0;
            const isBaseStatUpgrade = ['perm_str', 'perm_mag', 'perm_dex', 'perm_con', 'perm_luk'].includes(id);
            const maxLevel = (isBaseStatUpgrade && character.pandemoniumUnlocked) ? Infinity : upgrade.maxLevel;
            const isMax = currentLevel >= maxLevel;
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
                      Lv {currentLevel}/{maxLevel === Infinity ? '∞' : upgrade.maxLevel}
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
      </>
      )}
    </div>
  );
};

const GuidePanel: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('warrior');
  const [guideSubTab, setGuideSubTab] = useState<'classes' | 'codex'>('classes');
  const character = useGameStore((s) => s.character);

  // --- Dados para o Codex de Lendas ---
  const ascensionCount = character.ascensionCount || 0;
  const classLevels = character.classLevels || {};
  const globalClassLevels = getGlobalClassLevels();
  const getLevel = (id: string) => Math.max(classLevels[id] || 0, globalClassLevels[id] || 0);

  const isWarriorUnlocked = getLevel('warrior') >= 1;
  const isMageUnlocked = getLevel('mage') >= 1;
  const isRangerUnlocked = getLevel('ranger') >= 1;
  const isPaladinUnlocked = getLevel('warrior') >= 50;
  const isClericUnlocked = getLevel('mage') >= 50;
  const isRogueUnlocked = getLevel('ranger') >= 50;
  const isNecromancerUnlocked = getLevel('necromancer') >= 1;

  const killCount = character.killCount || {};
  const totalKills = Object.values(killCount).reduce((a, b) => a + b, 0);
  const bestiaryBonus = Math.round((StatEngine.calculateBestiaryDamageMultiplier(killCount) - 1.0) * 100);

  type CodexEntry = { id: string; icon: string; title: string; lore: string; hint: string; color: string; unlocked: boolean };
  const codexEntries: CodexEntry[] = [
    {
      id: 'first_breath',
      icon: '⚔️',
      title: 'Primeiro Fôlego',
      hint: 'Automaticamente desbloqueado ao iniciar sua jornada.',
      lore: 'A Alma acordou sem memória. Apenas a sensação de um combate inacabado, como se o mundo inteiro esperasse por um herói que ainda não sabia que era. Você deu o primeiro passo.',
      color: '#94a3b8',
      unlocked: true,
    },
    {
      id: 'first_ascension',
      icon: '🌀',
      title: 'O Primeiro Ciclo',
      hint: 'Realize sua primeira Ascênsão no painel de Ascênsão.',
      lore: 'A Alma-Mundo sussurrou ao ouvi-la romper o véu da primeira vida. Ascender não é morrer — é lembrar de uma versão de si mesma que ainda não existia. O ciclo começou.',
      color: '#a855f7',
      unlocked: ascensionCount >= 1,
    },
    {
      id: 'five_ascensions',
      icon: '🔁',
      title: 'Memória Repetida',
      hint: `Realize 5 Ascênsões (progresso atual: ${ascensionCount}/5).`,
      lore: 'Cinco vezes o véu foi rompido. O que parecia derrota tornou-se ritual. A Alma já não sente o frio do recomeço — ela o aguarda como uma porta antiga que, finalmente, aprendeu a abrir sozinha.',
      color: '#c084fc',
      unlocked: ascensionCount >= 5,
    },
    {
      id: 'paladin_unlocked',
      icon: '🛡️',
      title: 'A Armadura da Fé',
      hint: 'Atinja Nível 50 com o Guerreiro para desbloquear o Paladino.',
      lore: 'O Guerreiro que jurou proteger tornou-se algo mais. Não pela força dos braços, mas pelo peso de cada promessa cumprida em combate. O Paladino nasceu onde a espada encontrou a oração.',
      color: '#fbbf24',
      unlocked: isPaladinUnlocked,
    },
    {
      id: 'cleric_unlocked',
      icon: '✨',
      title: 'O Dom da Cura',
      hint: 'Atinja Nível 50 com o Mago para desbloquear o Clérigo.',
      lore: 'O Mago que escolheu curar em vez de destruir foi chamado de ingênuo. Mas foi ele quem ficou de pé quando os outros caíram. O Clérigo não nasceu de poder — nasceu de escolha.',
      color: '#38bdf8',
      unlocked: isClericUnlocked,
    },
    {
      id: 'rogue_unlocked',
      icon: '🗡️',
      title: 'A Lâmina nas Sombras',
      hint: 'Atinja Nível 50 com o Arqueiro para desbloquear o Ladrão.',
      lore: 'O Arqueiro aprendeu que a flecha mais letal não voa pelo ar — ela caminha silenciosa pelos becos onde a luz não alcança. O Ladrão é a resposta da Alma-Mundo às guerras que ninguém vê.',
      color: '#34d399',
      unlocked: isRogueUnlocked,
    },
    {
      id: 'necromancer_unlocked',
      icon: '💀',
      title: 'O Pactário da Morte',
      hint: 'Atinja Nível 50 com o Clérigo e o Ladrão (rastreado globalmente entre saves).',
      lore: 'Dicem que o Necromante nasceu quando a morte se cansou de esperar. Ele não ressuscita — ele lembra aos mortos que ainda têm dívidas com o mundo dos vivos. Uma classe proibida. Uma lenda cumprida.',
      color: '#f43f5e',
      unlocked: isNecromancerUnlocked,
    },
    {
      id: 'purgatory_cleared',
      icon: '🔮',
      title: 'O Guardião Quebrado',
      hint: 'Derrote o Guardião dos Cacos na Fase 30 do Purgatório.',
      lore: 'O Purgatório era onde as almas partidas esperavam ser esquecidas. O Guardião dos Cacos jurava que ninguém passaria. Mas a Alma-Mundo não aceita prisões — nem mesmo as construídas de seus próprios fragmentos.',
      color: '#818cf8',
      unlocked: !!character.purgatoryCompleted,
    },
    {
      id: 'pandemonium_unlocked',
      icon: '🌌',
      title: 'Além do Purgatório',
      hint: 'Conclua o Purgatório e ative o ritual no Altar da Alma para liberar o Modo Pandemônio.',
      lore: 'O Modo Pandemônio não é um lugar — é uma promessa quebrada. A promessa de que haveria um fim. Aqui, as fases não terminam. O vazio aprende com cada derrota sua. E você também.',
      color: '#ec4899',
      unlocked: !!character.pandemoniumUnlocked,
    },
    {
      id: 'bestiary_hunter',
      icon: '📖',
      title: 'Caçador de Memórias',
      hint: `Derrote 500 criaturas ao total no Bestiário (progresso atual: ${totalKills}/500).`,
      lore: 'Mais de 500 criaturas do vazio tombaram diante desta Alma. Cada abate é uma página do bestiário preenchida — não com tinta, mas com cicatrizes que o mundo inteiro pode ler.',
      color: '#f59e0b',
      unlocked: totalKills >= 500,
    },
    {
      id: 'stage_30',
      icon: '🏔️',
      title: 'O Topo de Algo',
      hint: `Alcance a Fase 30 na campanha (maior fase atingida: ${character.highestStageReached || 1}/30).`,
      lore: 'A Fase 30. Onde o Purgatório termina e o silêncio começa. Chegar aqui não é vitória — é a descoberta de que o mapa que você carregava era menor do que o território.',
      color: '#fb923c',
      unlocked: (character.highestStageReached || 0) >= 30,
    },
    {
      id: 'transcendence_first',
      icon: '✨',
      title: 'A Transcendência',
      hint: 'Realize sua primeira Transcendência na aba de Transcendência.',
      lore: 'Ao quebrar o ciclo infinito da alma mundana através da Transcendência, o herói não mais se limita a vidas mortais. Ele se eleva além da própria Ascensão, moldando uma nova essência transcendental que ressoa por todo o universo.',
      color: '#00e5ff',
      unlocked: (character.transcendenceCount || 0) >= 1,
    },
    {
      id: 'avatar_unlocked',
      icon: '🌟',
      title: 'O Avatar Pleno',
      hint: 'Desbloqueie a classe Suprema Avatar (exige acumular 10 PT ou obter o talento Avatar Pleno).',
      lore: 'O Avatar não é apenas um guerreiro, mago ou arqueiro; ele é a união perfeita de todos eles. Ao canalizar os cinco atributos cardinais da alma em perfeita harmonia, ele se torna a encarnação viva da própria Alma-Mundo.',
      color: '#f87171',
      unlocked: isClassUnlocked('avatar', classLevels),
    },
  ];

  const unlockedCount = codexEntries.filter(e => e.unlocked).length;

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Guia de Classes e Regras</h2>
      </div>

      {/* Sub-abas do Guia */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
        <button
          onClick={() => { AudioManager.getInstance().playClick(); setGuideSubTab('classes'); }}
          className={`tab-btn ${guideSubTab === 'classes' ? 'active' : ''}`}
          style={{ padding: '0.4rem', fontSize: '0.65rem' }}
        >
          ⚔️ Classes
        </button>
        <button
          onClick={() => { AudioManager.getInstance().playClick(); setGuideSubTab('codex'); }}
          className={`tab-btn ${guideSubTab === 'codex' ? 'active' : ''}`}
          style={{ padding: '0.4rem', fontSize: '0.65rem', position: 'relative' }}
        >
          📖 Crônicas
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#a855f7', color: '#fff', fontSize: '0.5rem', fontWeight: 700, borderRadius: '9999px', padding: '1px 4px', lineHeight: 1.2 }}>
            {unlockedCount}/{codexEntries.length}
          </span>
        </button>
      </div>

      {/* ---- ABA: CODEX DE LENDAS ---- */}
      {guideSubTab === 'codex' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="animate-tabFade">
          <div style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.65rem', color: '#a855f7', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
              "A Alma-Mundo não esquece. Cada marco que você atravessa fica gravado aqui, nas Crônicas — fragmentos de uma história que só pode ser contada por quem a viveu."
            </p>
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Entradas desbloqueadas</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a855f7' }}>{unlockedCount} / {codexEntries.length}</span>
            </div>
            <div style={{ marginTop: '0.35rem', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(unlockedCount / codexEntries.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)', borderRadius: '999px', transition: 'width 0.5s ease' }} />
            </div>
            {bestiaryBonus > 0 && (
              <p style={{ fontSize: '0.6rem', color: '#34d399', margin: '0.4rem 0 0', textAlign: 'right' }}>
                🗡️ Bônus do Bestiário ativo: +{bestiaryBonus}% de Dano Geral
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '480px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {codexEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: entry.unlocked ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${entry.unlocked ? entry.color + '40' : 'rgba(255,255,255,0.06)'}`,
                  borderLeft: `3px solid ${entry.unlocked ? entry.color : '#374151'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.75rem',
                  opacity: entry.unlocked ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: entry.unlocked ? '0.4rem' : 0 }}>
                  <span style={{ fontSize: '0.9rem' }}>{entry.unlocked ? entry.icon : '🔒'}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: entry.unlocked ? entry.color : '#4b5563' }}>
                    {entry.title}
                  </span>
                  {entry.unlocked && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.5rem', background: entry.color + '20', color: entry.color, border: `1px solid ${entry.color}40`, borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>
                      DESBLOQUEADO
                    </span>
                  )}
                </div>
                {entry.unlocked ? (
                  <p style={{ fontSize: '0.63rem', color: '#94a3b8', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>
                    {entry.lore}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.65rem', flexShrink: 0 }}>🔑</span>
                      <p style={{ fontSize: '0.61rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        {entry.hint}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- ABA: GUIA DE CLASSES ---- */}
      {guideSubTab === 'classes' && (
        <>
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
        if (selectedClass === 'paladin') promotionRequirement = 'Requer Guerreiro Nível 50';
        if (selectedClass === 'cleric') promotionRequirement = 'Requer Mago Nível 50';
        if (selectedClass === 'rogue') promotionRequirement = 'Requer Arqueiro Nível 50';
        if (selectedClass === 'necromancer') promotionRequirement = 'Requer Clérigo Nível 50 + Ladrão Nível 50';

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
                    {getDetailedStatusEffectInfo(id) && (
                      <div style={{ fontSize: '0.52rem', color: '#60a5fa', marginTop: '0.25rem', padding: '0.25rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                        {getDetailedStatusEffectInfo(id)}
                      </div>
                    )}
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
              <div className="text-[10px] space-y-3 leading-relaxed text-gray-300">
                <div>
                  <strong className="text-white block font-semibold">HP Máximo, Regeneração e Redução de Dano (Constituição)</strong>
                  <span className="text-gray-400 block text-[9px] mb-0.5">Escala a sobrevivência geral e a resistência do herói:</span>
                  <div className="pl-2 mt-0.5 space-y-1">
                    <div>
                      <span className="text-amber-300 font-bold">HP Máx e Regeneração (Paladino - Classe Primária):</span>
                      <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">HP Máx = Const × 8 | Regen = Const × 0.03 / s</code>
                    </div>
                    <div>
                      <span className="text-amber-300 font-bold">HP Máx e Regeneração (Outras Classes):</span>
                      <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">HP Máx = Const × 18 | Regen = Const × 0.08 / s</code>
                    </div>
                    <div>
                      <span className="text-emerald-300 font-bold">Redução de Dano Recebido (Todas as Classes):</span>
                      <code className="text-emerald-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Redução = Min(95%, Constituição × 0.05% de redução de dano)</code>
                    </div>
                  </div>
                </div>

                <div>
                  <strong className="text-white block font-semibold">Dano e Penetração de Armadura (Força)</strong>
                  <span className="text-gray-400 block text-[9px] mb-0.5">Aprimora o poder ofensivo do herói:</span>
                  <div className="pl-2 mt-0.5 space-y-1">
                    <div>
                      <span className="text-emerald-300 font-bold">Penetração de Armadura / Aumento de Dano (Todas as Classes):</span>
                      <code className="text-emerald-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Dano Amplificado = Dano Inicial × (1.0 + Força × 0.05%)</code>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px]">Guerreiro escala 100% de ataque direto com Força. Demais classes herdam um bônus secundário de Força × 0.25 no ataque básico.</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <strong className="text-white block font-semibold">Mana Máxima e Regeneração (Magia)</strong>
                  <span className="text-gray-400 block text-[9px] mb-0.5">Escala dinamicamente com base na classe:</span>
                  <div className="pl-2 mt-0.5 space-y-1">
                    <div>
                      <span className="text-amber-300 font-bold">Mago / Clérigo (Classes Primárias):</span>
                      <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Mana Máx = Magia × 6 | Regen = Magia × 0.02 / s</code>
                    </div>
                    <div>
                      <span className="text-amber-300 font-bold">Outras Classes (Bônus Secundário):</span>
                      <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Mana Máx = Magia × 18 | Regen = Magia × 0.09 / s</code>
                    </div>
                  </div>
                </div>

                <div>
                  <strong className="text-white block font-semibold">Velocidade de Ataque e Esquiva (Destreza)</strong>
                  <span className="text-gray-400 block text-[9px] mb-0.5">Escala a velocidade de ataque e adiciona chance de esquiva defensiva:</span>
                  <div className="pl-2 mt-0.5 space-y-1">
                    <div>
                      <span className="text-amber-300 font-bold">Arqueiro / Ladrão (Classes Primárias):</span>
                      <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Mult. Velocidade = 1.0 + (√Destreza × 0.15)</code>
                    </div>
                    <div>
                      <span className="text-amber-300 font-bold">Outras Classes (Bônus Secundário):</span>
                      <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Mult. Velocidade = 1.0 + (√Destreza × 0.40)</code>
                    </div>
                    <div>
                      <span className="text-amber-300 font-bold">Chance de Esquiva (Todas as Classes):</span>
                      <code className="text-emerald-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Dodge Chance = Min(75%, Destreza × 0.1%)</code>
                    </div>
                    <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Tempo de Recarga = Max(200ms, 3000ms / Mult. Velocidade) (Limite: 5 atq/s)</code>
                  </div>
                </div>

                <div>
                  <strong className="text-white block font-semibold">Drop, Ouro e Combate (Sorte)</strong>
                  <span className="text-gray-400 block text-[9px] mb-0.5">Aumenta a chance e raridade de drops, ouro obtido e aprimora os acertos críticos:</span>
                  <div className="pl-2 mt-0.5 space-y-1">
                    <div>
                      <span className="text-amber-300 font-bold">Chance de Drop (Monstros Normais):</span>
                      <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Chance = Min(50%, 5% + Sorte × 0.2%)</code>
                    </div>
                    <div>
                      <span className="text-amber-300 font-bold">Multiplicador de Ouro:</span>
                      <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Bônus = 1.0 + (√Sorte / 10)</code>
                    </div>
                    <div>
                      <span className="text-emerald-300 font-bold">Chance e Dano Crítico de Toque:</span>
                      <code className="text-emerald-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">Chance +0.05% e Dano Crítico +0.2% por ponto de Sorte</code>
                    </div>
                  </div>
                </div>

                <div>
                  <strong className="text-white block font-semibold">Dano de Clique (Toque)</strong>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Dano Base = (Toque × 0.5) + (DPS Passivo × (Toque × 0.5) × 0.0005)
                  </code>
                  <span className="text-gray-400 block text-[9px] mt-0.5">
                    * Multiplicador do Combo de Toque: <code className="text-amber-300 font-mono">1.0 + Min(1.0, Combo × 0.10)</code> (até +100% de dano com 10 combos).
                  </span>
                </div>

                <div>
                  <strong className="text-white block font-semibold">Ataque Básico da Classe ({config.name})</strong>
                  <code className="text-blue-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Dano Básico = (Atributo Principal + Bônus Secundário) × 1.0 + Random(0, 2)
                  </code>
                  <span className="text-gray-400 block text-[9px] mt-0.5">
                    * Bônus Secundário de Força para outras classes: <code className="text-amber-300 font-mono">Força × 0.25</code> (Guerreiro escala 100% com Força de forma direta).
                  </span>
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
                    As mesmas fases com tint avermelhado, maior agressividade e status maciçamente aumentados.
                  </p>
                  <code className="text-rose-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Status Pesadelo = Status Base × 2.0 (+100% de HP e Dano)
                  </code>
                </div>
                <div>
                  <strong className="text-white block font-semibold" style={{ color: '#fb923c' }}>Fases Inferno (11 a 15)</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    As mesmas 5 fases cicladas com tint laranja flamejante. Inimigos com poder avassalador.
                  </p>
                  <code className="text-orange-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Status Inferno = Status Base × 3.0 (+200% de HP e Dano)
                  </code>
                </div>
                <div>
                  <strong className="text-white block font-semibold" style={{ color: '#c084fc' }}>Fases Apocalipse (16 a 20)</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    O tier extremo original. Tint roxo sinistro e criaturas de poder quase divino.
                  </p>
                  <code className="text-purple-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Status Apocalipse = Status Base × 4.0 (+300% de HP e Dano)
                  </code>
                </div>
                <div>
                  <strong className="text-white block font-semibold" style={{ color: '#a78bfa' }}>Fases Purgatório (21 a 30)</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    Território dos cristais partidos. Inimigos têm HP e Dano escalados em 4.5x. Requer derrotar o Guardião dos Cacos na Fase 30 para desbloquear o Pandemônio.
                  </p>
                  <code className="text-purple-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Status Purgatório = Status Base × 4.5
                  </code>
                </div>
                <div>
                  <strong className="text-white block font-semibold" style={{ color: '#ec4899' }}>Modo Pandemônio (31+)</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    Dificuldade infinita desbloqueada via Altar da Alma no Prestígio. Monstros e chefes surgem de forma aleatória, com buffs que escalam a cada nível de fase.
                  </p>
                  <code className="text-rose-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Status Pandemônio = Status Base × 5.0 × (1.15 ^ (Fase - 31))
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
                      <span className="text-gray-400">O que é resetado:</span> Nível atual do personagem, Pontos de Atributos distribuídos pelo jogador, todas as Habilidades ativas/passivas aprendidas (e seus níveis), progresso atual das fases de combate (volta para a Fase 1), mana/HP, e todos os equipamentos e itens do inventário.
                    </li>
                    <li>
                      <span className="text-gray-400">O que é mantido (Permanente):</span> Classes desbloqueadas com seu progresso de maestria de nível, todas as melhorias de atributos compradas com Pontos de Prestígio (PP) na árvore, progresso do Bestiário e saves.
                    </li>
                    <li>
                      <span className="text-gray-400">Bônus Passivo de Alma (Acumulado):</span> Cada ascensão realizada concede bônus percentuais cumulativos de <strong>+5% de Dano Geral</strong>, <strong>+1% de Velocidade de Ataque</strong>, <strong>+2.5% de HP Máximo</strong>, <strong>+2.5% de Mana Máxima</strong>, <strong>+5 de Dano de Toque</strong>, <strong>+0.1% de Chance de Crítico de Toque</strong>, <strong>+1% de Dano Crítico de Toque</strong> e <strong>+0.5% de Esquiva</strong>.
                    </li>
                    <li>
                      <span className="text-gray-400">Fórmula de PP obtido:</span>
                      <code className="text-purple-300 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">PP Recebido = Floor(Floor((XP Acumulada / 1000) ^ 0.45) * 1.5)</code>
                      <span className="text-gray-500 text-[8px] block mt-0.5">(O ganho de PP foi triplicado para acelerar a progressão)</span>
                    </li>
                    <li>
                      <span className="text-gray-400">Requisito Crescente de PP:</span> A primeira ascensão requer apenas 1 PP. A segunda exige juntar pelo menos <strong>5 PP</strong> nesta rodada. A terceira exige <strong>7 PP</strong>, a quarta exige <strong>9 PP</strong>, e assim por diante (sempre aumentando em <strong>+2 PP</strong> de requisito a cada ascensão realizada).
                    </li>
                  </ul>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Melhorias Permanentes de Prestígio:</strong>
                  <p className="text-gray-400 mt-0.5">
                    Com os Pontos de Prestígio (PP) acumulados, você pode comprar melhorias na árvore de Ascensão que aumentam permanentemente seus atributos base (+12 Força, +12 Magia, +6 Destreza, +18 Constituição, +6 Sorte por nível), acelerando drasticamente o progresso nas próximas rodadas. Após desbloquear o Modo Pandemônio, o limite de nível 10 nessas melhorias é removido (torna-se infinito).
                  </p>
                </div>
              </div>
            </div>

            {/* Forja Mística */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-fuchsia-400 uppercase tracking-widest block">⚒️ Sistema de Forja Mística</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <p>
                  A Forja permite combinar dois equipamentos do <strong>mesmo slot</strong> (ex: Luva + Luva) e do <strong>mesmo conjunto</strong> (ex: Senhor da Guerra) para criar um item de raridade <strong className="text-fuchsia-300">Mística (Lilás)</strong> que preserva a identidade visual do conjunto original. Itens Místicos podem ser fundidos entre si para atingir até o nível <strong>+5</strong>.
                </p>
                <div>
                  <strong className="text-white block font-semibold">Regras de Fusão:</strong>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginTop: '0.2rem', gap: '0.2rem', display: 'flex', flexDirection: 'column' }}>
                    <li><span className="text-gray-400">Mesmo slot e conjunto obrigatórios</span> — os dois equipamentos devem ser do mesmo tipo (ex: arma + arma) e pertencer ao mesmo set (ex: ambos "Senhor da Guerra").</li>
                    <li><span className="text-gray-400">Mesma raridade/categoria</span> — dois normais (comuns a lendários) <em>ou</em> dois Místicos. Não é possível misturar.</li>
                    <li><span className="text-gray-400">Místicos do mesmo nível</span> — para fundir Místicos, ambos precisam ter exatamente o mesmo nível (ex: +2 com +2).</li>
                    <li><span className="text-gray-400">Nível máximo</span> — um item Místico só pode chegar até <strong>+5</strong>.</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Fórmula Normal (95% das fusões):</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    Para cada atributo presente nos dois itens, o <strong>maior valor é preservado 100%</strong> e o <strong>menor valor contribui com 50%</strong> (arredondado para cima). Atributos exclusivos de um item são copiados integralmente.
                  </p>
                  <code className="text-fuchsia-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Resultado = Maior + ⌈Menor × 0.5⌉
                  </code>
                  <code className="text-gray-500 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Ex: Força 50 + Força 5  →  50 + ⌈2.5⌉ = 53
                  </code>
                </div>
                <div>
                  <strong className="text-white block font-semibold" style={{ color: '#facc15' }}>⚡ Forja Lendária (5% de chance):</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    Há 5% de chance de a fusão ser uma Forja Lendária. Nesse caso, a fórmula é substituída por um bônus de +50% sobre a soma total de cada atributo.
                  </p>
                  <code className="text-yellow-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Resultado Lendário = ⌈(A + B) × 1.5⌉
                  </code>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Custo de Fusão (em Ouro 🪙):</strong>
                  <div className="mt-1 space-y-0.5">
                    {[
                      { origem: 'Convencional + Convencional', resultado: 'Místico +1', custo: '500' },
                      { origem: 'Místico +1 + Místico +1', resultado: 'Místico +2', custo: '1.000' },
                      { origem: 'Místico +2 + Místico +2', resultado: 'Místico +3', custo: '2.500' },
                      { origem: 'Místico +3 + Místico +3', resultado: 'Místico +4', custo: '12.500' },
                      { origem: 'Místico +4 + Místico +4', resultado: 'Místico +5', custo: '62.500' },
                    ].map((row) => (
                      <div key={row.resultado} className="flex justify-between items-center text-[9px] bg-black/20 rounded px-1.5 py-0.5">
                        <span className="text-gray-400">{row.origem} → <strong className="text-fuchsia-300">{row.resultado}</strong></span>
                        <span className="text-yellow-400 font-bold shrink-0 ml-2">{row.custo} Ouro</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Altar de Relíquias de Alma */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-violet-400 uppercase tracking-widest block">🔮 Altar de Relíquias de Alma</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <p>
                  As Relíquias são artefatos cósmicos permanentes que fortalecem todos os seus personagens, resistindo inteiramente aos resets de Ascensão. Elas podem ser forjadas e aprimoradas no **Altar de Relíquias** (Aba Ascensão) utilizando **Fragmentos de Alma Instáveis**.
                </p>
                <div>
                  <strong className="text-white block font-semibold">Como obter Fragmentos:</strong>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginTop: '0.2rem', gap: '0.2rem', display: 'flex', flexDirection: 'column' }}>
                    <li><span className="text-gray-400">Chefes de Campanha</span> — Derrotar qualquer chefe de fase (múltiplos de 5) tem 5% de chance de dropar um fragmento diretamente no inventário.</li>
                    <li><span className="text-gray-400">Desafio Diário</span> — Complete a fase espelho diária para receber 2x Fragmentos de Alma de recompensa.</li>
                    <li><span className="text-gray-400">Baú de Relíquias na Loja</span> — Compre o baú na Loja por 5.000 Ouro para obter instantaneamente 3 fragmentos garantidos ao consumi-lo.</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Efeitos de Capstone (Nível 5 Máximo):</strong>
                  <p className="text-gray-400 text-[9px] mt-0.5">
                    Cada uma das 8 relíquias pode atingir o nível máximo de 5. Ao atingir o ápice, um bônus passivo monumental (Capstone) é ativado permanentemente:
                  </p>
                  <div className="mt-1 space-y-1">
                    <div className="bg-black/20 rounded p-1.5 border border-violet-900/30">
                      <span className="text-violet-300 font-bold block">1. Luz da Alma Partida (+3% Dano Geral/nvl)</span>
                      <span className="text-gray-400 block text-[9px]">Capstone: +10% de Multiplicador de Dano Crítico global.</span>
                    </div>
                    <div className="bg-black/20 rounded p-1.5 border border-violet-900/30">
                      <span className="text-violet-300 font-bold block">2. Moeda do Ciclo Eterno (+4% Ouro Ganho/nvl)</span>
                      <span className="text-gray-400 block text-[9px]">Capstone: +5% de chance de monstros comuns droparem ouro dobrado.</span>
                    </div>
                    <div className="bg-black/20 rounded p-1.5 border border-violet-900/30">
                      <span className="text-violet-300 font-bold block">3. Símbolo do Aprendizado (+3% Chance de Drop/nvl)</span>
                      <span className="text-gray-400 block text-[9px]">Capstone: +10% de chance de qualquer item dropado ser Raro ou superior.</span>
                    </div>
                    <div className="bg-black/20 rounded p-1.5 border border-violet-900/30">
                      <span className="text-violet-300 font-bold block">4. Gema da Vontade (+4 Força/nvl)</span>
                      <span className="text-gray-400 block text-[9px]">Capstone: +10% de Penetração de Armadura (Aumento de Dano Final).</span>
                    </div>
                    <div className="bg-black/20 rounded p-1.5 border border-violet-900/30">
                      <span className="text-violet-300 font-bold block">5. Núcleo do Pensamento (+4 Magia/nvl)</span>
                      <span className="text-gray-400 block text-[9px]">Capstone: +15% de Regeneração de Mana ativa e passiva.</span>
                    </div>
                    <div className="bg-black/20 rounded p-1.5 border border-violet-900/30">
                      <span className="text-violet-300 font-bold block">6. Foco da Precisão (+4 Destreza/nvl)</span>
                      <span className="text-gray-400 block text-[9px]">Capstone: +5% de Velocidade de Ataque global.</span>
                    </div>
                    <div className="bg-black/20 rounded p-1.5 border border-violet-900/30">
                      <span className="text-violet-300 font-bold block">7. Brasão da Devoção (+6 Constituição/nvl)</span>
                      <span className="text-gray-400 block text-[9px]">Capstone: +2% da sua Vida Máxima como escudo protetor no início do combate.</span>
                    </div>
                    <div className="bg-black/20 rounded p-1.5 border border-violet-900/30">
                      <span className="text-violet-300 font-bold block">8. Olho da Sobrevivência (+4 Sorte/nvl)</span>
                      <span className="text-gray-400 block text-[9px]">Capstone: Reduz em 1.5s o tempo de recarga da sua habilidade de Cura.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Classe Avançada: Necromante */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-widest block">💀 Classe Avançada: Necromante</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <p>
                  O **Necromante** é uma classe lendária focada no controle de lacaios, dreno de recursos e feitiços sombrios. Ela requer uma dedicação maior para ser liberada e possui mecânicas exclusivas baseadas em Sorte.
                </p>
                <div>
                  <strong className="text-white block font-semibold">Como desbloquear:</strong>
                  <p className="text-gray-400">Requer atingir o <strong>Nível 50</strong> simultaneamente com o <strong>Clérigo</strong> e o <strong>Ladrão</strong> (as duas classes avançadas). O progresso é rastreado globalmente — não é necessário ter ambas no mesmo save.</p>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Mecânica de Sorte (Luck):</strong>
                  <p className="text-gray-400">Diferente das outras classes mágicas, os feitiços do Necromante escalam fortemente com Sorte. Cada ponto de Sorte adicionado ao personagem aumenta o dano de todas as suas habilidades mágicas de Necromancia em <strong>+0.1%</strong> de forma multiplicativa.</p>
                </div>
                <div>
                  <strong className="text-white block font-semibold">Habilidade Exclusiva - Toque da Morte:</strong>
                  <p className="text-gray-400 mb-1">A habilidade básica do Necromante causa 160% de dano mágico e cura o personagem drenando a energia do alvo. A cura é baseada no HP faltante do herói:</p>
                  <code className="text-rose-400 block font-mono bg-black/40 px-1.5 py-0.5 rounded mt-0.5">
                    Cura de Drenagem = (HP Máximo - HP Atual) × (20% + 5% por nível da habilidade)
                  </code>
                </div>
              </div>
            </div>

            {/* A Torre Infinita */}
            <div className="bg-black/30 p-3.5 rounded-lg border border-gray-800/80 flex flex-col gap-2">
              <span className="text-[9px] font-semibold text-sky-400 uppercase tracking-widest block">🏰 A Torre Infinita</span>
              <div className="text-[10px] space-y-2 leading-relaxed text-gray-300">
                <p>
                  A **Torre Infinita** é uma arena de desafios verticais onde o jogador testa seus limites contra hordas intermináveis de inimigos e chefes. Ao contrário da campanha, a Torre oferece batalhas estáticas, sem progressão lateral (sidescrolling), focando na superação rápida de andares.
                </p>
                <div>
                  <strong className="text-white block font-semibold">Funcionamento e Fluxo:</strong>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginTop: '0.2rem', gap: '0.2rem', display: 'flex', flexDirection: 'column' }}>
                    <li><span className="text-gray-400">Combates Estáticos:</span> O jogador aguarda em sua posição de batalha no centro da arena enquanto o inimigo entra caminhando. O combate inicia assim que ambos estão posicionados.</li>
                    <li><span className="text-gray-400">Transição de Andar:</span> Ao derrotar o inimigo, o jogador avança correndo para frente. O cenário escurece em uma rápida transição de fade-out e fade-in, posicionando o jogador no próximo andar pronto para o próximo oponente.</li>
                    <li><span className="text-gray-400">Escalonamento de Dificuldade:</span> Cada andar avançado aumenta a força dos oponentes de forma contínua. Caso o jogador seja derrotado, ele é automaticamente retirado da Torre e retornado ao modo de campanha.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
        </>
      )}
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
  boss_archdemon: "O soberano supremo das Ruínas Sombrias. Um ser titânico que empunha o fogo do inferno e busca consumir a alma de qualquer invasor.",

  purgatory_specter: "Uma silhueta distorcida feita de ressentimento e poeira estelar, vagando eternamente pelo purgatório em busca de vingança contra os vivos.",
  lost_soul: "Uma alma que perdeu seu caminho e sua forma após a quebra do mundo. Seu toque frio drena a energia vital.",
  crystal_shatterer: "Uma besta cristalina que se alimenta dos fragmentos da Alma-Mundo. Suas garras afiadas podem despedaçar a mais resistente das armaduras.",
  boss_crystal_guardian: "O terrível protetor das profundezas do purgatório, encarregado de reter os fragmentos perdidos. Ele não permitirá que ninguém cruze o limiar rumo ao Pandemônio."
};





const BIOME_NAMES = [
  "Floresta Antiga",
  "Deserto de Ouro",
  "Picos Glaciais",
  "Cemitério Maldito",
  "Ruínas Sombrias",
  "Purgatório"
];

interface TranscendencePanelProps {
  onPrestige: () => void;
}

const TranscendencePanel: React.FC<TranscendencePanelProps> = ({ onPrestige }) => {
  const character = useGameStore((state) => state.character);
  const performTranscendence = useGameStore((state) => state.performTranscendence);
  const upgradeTranscendenceStat = useGameStore((state) => state.upgradeTranscendenceStat);
  const resetTranscendenceUpgrades = useGameStore((state) => state.resetTranscendenceUpgrades);
  const toggleEcoterra = useGameStore((state) => state.toggleEcoterra);
  const buyTranscendenceConsumable = useGameStore((state) => state.buyTranscendenceConsumable);

  const [subTab, setSubTab] = useState<'talents' | 'shop'>('talents');

  const currentPP = character.prestigePoints || 0;
  const spentPP = Object.entries(character.prestigeUpgrades || {}).reduce((sum, [id, lvl]) => {
    const upgrade = PRESTIGE_UPGRADES_CATALOG[id];
    if (upgrade && lvl > 0) {
      for (let i = 1; i <= lvl; i++) {
        sum += upgrade.costPerLevel * i;
      }
    }
    return sum;
  }, 0);
  const totalPP = Math.max(character.lifetimePrestigePointsAccumulated || 0, currentPP + spentPP);
  const transcendenceEarnedOnReset = Math.floor(Math.pow(totalPP / 500, 0.75));
  const isInTowerOrChallenge = useTowerStore((state) => state.towerActive) || !!character.activeDailyChallenge;
  const canTranscend = character.pandemoniumUnlocked && character.highestStageReached >= 50 && transcendenceEarnedOnReset > 0 && !isInTowerOrChallenge;
  const transcendenceCount = character.transcendenceCount || 0;
  
  const currentPT = character.transcendencePoints || 0;
  const spentPT = Object.entries(character.transcendenceUpgrades || {}).reduce((sum, [upgradeId, lvl]) => {
    const upgrade = TRANSCENDENCE_UPGRADES_CATALOG[upgradeId];
    if (upgrade && lvl > 0) {
      sum += upgrade.costPerLevel * lvl;
    }
    return sum;
  }, 0);
  const totalPT = currentPT + spentPT;

  const shopItems = [
    {
      id: 'elixir_transcendental' as const,
      name: 'Elixir Transcendental',
      icon: '🧪',
      cost: 15,
      description: 'Eleva instantaneamente seu nível atual em +10. Concede +50 pontos de atributo e +10 pontos de habilidade correspondentes de forma permanente nesta rodada.',
      effectDesc: '+10 Níveis'
    },
    {
      id: 'cristal_forja_eterna' as const,
      name: 'Cristal de Forja Eterna',
      icon: '💎',
      cost: 25,
      description: 'Cristal repleto de poder cósmico concentrado. Ao ser quebrado, concede instantaneamente +25 Fragmentos de Forja.',
      effectDesc: '+25 Frag. Forja'
    },
    {
      id: 'chave_fenda_temporal' as const,
      name: 'Chave da Fenda Temporal',
      icon: '🔑',
      cost: 20,
      description: 'Dobra o tempo-espaço para materializar chaves. Concede imediatamente +2 Chaves da Torre Infinita ao seu inventário.',
      effectDesc: '+2 Chaves da Torre'
    }
  ];

  return (
    <div className="panel animate-tabFade" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Transcendência Cósmica</h2>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem' }}>
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <span style={{ color: '#94a3b8' }}>PT:</span>
            <span className="font-mono" style={{ fontWeight: 700, color: '#fbbf24', marginLeft: '0.25rem' }}>{currentPT}</span>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <span style={{ color: '#94a3b8' }}>ET:</span>
            <span className="font-mono" style={{ fontWeight: 700, color: '#22d3ee', marginLeft: '0.25rem' }}>{character.transcendenceEssence || 0}</span>
          </div>
        </div>
      </div>

      {/* Sub-abas */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            setSubTab('talents');
          }}
          className={`btn btn-sm ${subTab === 'talents' ? 'btn-purple' : 'btn-ghost'}`}
          style={{ flex: 1, fontSize: '0.65rem', padding: '0.4rem 0', fontWeight: 'bold' }}
        >
          🌌 Talentos & Ritual
        </button>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            setSubTab('shop');
          }}
          className={`btn btn-sm ${subTab === 'shop' ? 'btn-purple' : 'btn-ghost'}`}
          style={{ flex: 1, fontSize: '0.65rem', padding: '0.4rem 0', fontWeight: 'bold' }}
        >
          🛒 Loja Celestial
        </button>
      </div>

      {subTab === 'talents' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          {/* O Ritual de Transcendência */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🌌 Ritual de Transcendência
              </h3>
              <div style={{
                fontSize: '0.68rem',
                color: '#fbbf24',
                background: 'rgba(0,0,0,0.3)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>🌟 PT Disponíveis:</span>
                <strong className="font-mono text-amber-300" style={{ fontSize: '0.75rem' }}>{currentPT}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute',
                  width: '46px',
                  height: '46px',
                  background: 'radial-gradient(circle, #c084fc 0%, #7c3aed 70%, #4c1d95 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 15px rgba(124, 58, 237, 0.6)',
                  animation: 'pulse 2s infinite ease-in-out'
                }} />
                {transcendenceCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    width: '58px',
                    height: '58px',
                    border: '2px dashed #fbbf24',
                    borderRadius: '50%',
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)',
                    animation: 'spin 10s linear infinite'
                  }} />
                )}
                <span style={{ fontSize: '1.25rem', zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🌌</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#d1d5db', lineHeight: '1.3' }}>
                  Reseta todo o progresso da Ascensão (PP, ouro, equipamentos e upgrades de PP), mas concede Pontos de Transcendência (PT) permanentes com base nos seus PP acumulados ao longo do tempo.
                </p>
                <div style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 'bold' }}>
                  Requisitos: Modo Pandemônio Ativo + Alcançar Fase 50 no Loop Infinito.
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(251, 191, 36, 0.15)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9ca3af' }}>
                <span>PP Vitalícios Acumulados:</span>
                <span className="font-semibold text-white font-mono">{totalPP} PP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9ca3af' }}>
                <span>Transcendências Realizadas:</span>
                <span className="font-semibold text-white font-mono">{transcendenceCount}</span>
              </div>
              
              {canTranscend ? (
                <button
                  onClick={() => {
                    if (confirm(`Atenção: Ao Transcender, você resetará o progresso de Ascensão (PP, ouro, upgrades permanentes e inventário) em troca de ${transcendenceEarnedOnReset} PT permanentes. Deseja prosseguir?`)) {
                      AudioManager.getInstance().playClick();
                      performTranscendence();
                      onPrestige();
                    }
                  }}
                  className="btn btn-gold btn-sm"
                  style={{ 
                    width: '100%', 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', 
                    color: '#000', 
                    fontWeight: 'bold', 
                    fontSize: '0.7rem', 
                    padding: '0.45rem', 
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  🔮 Transcender Alma (+{transcendenceEarnedOnReset} PT)
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed', fontSize: '0.7rem', padding: '0.45rem' }}
                  disabled
                >
                  {isInTowerOrChallenge
                    ? '🔒 Saia da Torre/Desafio Diário para Transcender'
                    : !character.pandemoniumUnlocked || character.highestStageReached < 50
                      ? '🔒 Requer Pandemônio e Fase 50 no Loop Infinito'
                      : `🔒 Requer mais PP Vitalícios (Ganho atual: 0 PT)`
                  }
                </button>
              )}
            </div>
          </div>

          {/* Árvore de Upgrades de Transcendência */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                🌳 Talentos de Transcendência
              </h4>
              <div style={{ fontSize: '0.62rem', color: '#9ca3af' }}>
                Total PT Acumulados: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{totalPT}</span>/10 para Classe Avatar
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(TRANSCENDENCE_UPGRADES_CATALOG).map(([id, upgradeVal]) => {
                const upgrade = upgradeVal as {
                  name: string;
                  description: string;
                  costPerLevel: number;
                  maxLevel: number;
                  bonusPerLevel: number;
                };
                const currentLvl = character.transcendenceUpgrades?.[id] || 0;
                const maxLvl = upgrade.maxLevel;
                const cost = upgrade.costPerLevel;
                const canAfford = currentPT >= cost;
                const isMaxed = currentLvl >= maxLvl;

                let isLocked = false;
                if (id === 'avatar_pleno') {
                  const otherKeys = ['mana_suprema', 'dominio_vazio', 'foco_temporal', 'alma_avatar'];
                  const allAtLeast5 = otherKeys.every(k => (character.transcendenceUpgrades?.[k] || 0) >= 5);
                  isLocked = !allAtLeast5 && totalPT < 10;
                }

                return (
                  <div
                    key={id}
                    style={{
                      background: id === 'avatar_pleno' 
                        ? 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(124,58,237,0.05) 100%)' 
                        : 'rgba(0,0,0,0.25)',
                      border: id === 'avatar_pleno'
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : isMaxed 
                          ? '1px solid rgba(251, 191, 36, 0.3)' 
                          : '1px solid rgba(255,255,255,0.06)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: id === 'avatar_pleno' ? '#f87171' : '#f3f4f6' }}>
                          {upgrade.name}
                        </span>
                        <span style={{ fontSize: '0.58rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.05rem 0.3rem', borderRadius: '3px' }}>
                          Lvl {currentLvl}/{maxLvl}
                        </span>
                        {id === 'avatar_pleno' && totalPT >= 10 && (
                          <span style={{ fontSize: '0.52rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '0.05rem 0.3rem', borderRadius: '3px' }}>
                            Desbloqueado por PT
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.62rem', color: '#9ca3af', lineHeight: '1.2' }}>
                        {upgrade.description}
                      </span>
                    </div>

                    <div>
                      {isMaxed || (id === 'avatar_pleno' && totalPT >= 10) ? (
                        <span style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: 'bold', padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                          MÁXIMO
                        </span>
                      ) : isLocked ? (
                        <span style={{ fontSize: '0.55rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.4rem', borderRadius: '4px', textAlign: 'center', display: 'block', maxWidth: '100px', lineHeight: '1.1' }}>
                          🔒 Requer todos talentos Lvl 5
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            AudioManager.getInstance().playClick();
                            upgradeTranscendenceStat(id);
                          }}
                          className={`btn btn-sm ${canAfford ? 'btn-purple' : 'btn-ghost'}`}
                          style={{
                            fontSize: '0.62rem',
                            padding: '0.25rem 0.5rem',
                            fontWeight: 'bold',
                            border: '1px solid rgba(139,92,246,0.3)',
                            color: canAfford ? '#fff' : '#6b7280',
                            cursor: canAfford ? 'pointer' : 'not-allowed'
                          }}
                          disabled={!canAfford}
                        >
                          🌟 {cost} PT
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toggle da Ecoterra */}
          {(character.transcendenceCount || 0) >= 1 && (
            <div style={{
              background: character.activeEcoterra 
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.08) 100%)'
                : 'rgba(30, 41, 59, 0.2)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: character.activeEcoterra
                ? '1px solid rgba(6, 182, 212, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🌌 Espelho da Ecoterra
                </h4>
                <span className="font-mono" style={{ fontSize: '0.55rem', fontWeight: 'bold', color: character.activeEcoterra ? '#22d3ee' : '#9ca3af' }}>
                  {character.activeEcoterra ? 'ATIVADO' : 'DESATIVADO'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.62rem', color: '#9ca3af', lineHeight: '1.3' }}>
                Enfrente monstros espelhados e fortalecidos nas Fases 1 a 20 (<strong>+30% Vida</strong>, <strong>+20% Velocidade</strong>). Em troca, eles derrubam <strong>Essência de Transcendência</strong> ao morrer!
              </p>
              <button
                onClick={() => {
                  AudioManager.getInstance().playClick();
                  toggleEcoterra();
                }}
                className={`btn btn-sm ${character.activeEcoterra ? 'btn-cyan' : 'btn-purple'}`}
                style={{
                  width: '100%',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  padding: '0.45rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: character.activeEcoterra 
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(109, 40, 217, 0.08) 100%)',
                  color: character.activeEcoterra ? '#22d3ee' : '#c084fc',
                  boxShadow: character.activeEcoterra ? '0 0 10px rgba(6, 182, 212, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {character.activeEcoterra ? '🌌 Retornar ao Ciclo Normal' : '🌌 Entrar no Ciclo Ecoterra'}
              </button>
            </div>
          )}

          {/* Essência de Transcendência e Redefinição */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(124, 58, 237, 0.05) 100%)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                💎 Essência de Transcendência
              </h4>
              <span className="font-mono text-cyan-300" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                {character.transcendenceEssence || 0} ET
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.62rem', color: '#9ca3af', lineHeight: '1.3' }}>
              Monstros derrotados na <strong>Ecoterra</strong> possuem chance de derrubar Essência de Transcendência (ET). Use esta essência divina para comprar consumíveis especiais na Loja Celestial ou resetar seus talentos.
            </p>
            
            <button
              onClick={() => {
                const currentEssence = character.transcendenceEssence || 0;
                if (currentEssence < 10) return;
                if (confirm("Deseja resetar seus upgrades de Transcendência e recuperar todos os PT? Isso consumirá 10 Essências de Transcendência.")) {
                  AudioManager.getInstance().playClick();
                  resetTranscendenceUpgrades();
                }
              }}
              className={`btn btn-sm ${(character.transcendenceEssence || 0) >= 10 ? 'btn-purple' : 'btn-ghost'}`}
              style={{
                width: '100%',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                padding: '0.4rem',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: (character.transcendenceEssence || 0) >= 10 ? '#fff' : '#6b7280',
                cursor: (character.transcendenceEssence || 0) >= 10 ? 'pointer' : 'not-allowed'
              }}
              disabled={(character.transcendenceEssence || 0) < 10}
            >
              🔄 Redefinir Talentos (Custo: 10 ET)
            </button>
          </div>
        </div>
      ) : (
        /* Aba de Loja Celestial */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🌌 Loja de Transcendência
            </h3>
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              Troque suas <strong>Essências de Transcendência (ET)</strong> coletadas na Ecoterra por consumíveis especiais de alto poder para acelerar sua jornada divina.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {shopItems.map((item) => {
              const currentEssence = character.transcendenceEssence || 0;
              const canAfford = currentEssence >= item.cost;
              const isInventoryFull = character.inventory.length >= character.inventorySlots;
              
              let buttonText = `Adquirir por 💎 ${item.cost} ET`;
              let isBtnDisabled = !canAfford || isInventoryFull;

              if (isInventoryFull) {
                buttonText = 'Inventário Cheio';
              } else if (!canAfford) {
                buttonText = `Requer ${item.cost} ET`;
              }

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      fontSize: '1.75rem',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      width: '45px',
                      height: '45px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {item.icon}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
                          {item.name}
                        </span>
                        <span style={{
                          fontSize: '0.55rem',
                          background: 'rgba(34, 211, 238, 0.15)',
                          color: '#22d3ee',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '10px',
                          fontWeight: 'bold'
                        }}>
                          {item.effectDesc}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.62rem', color: '#94a3b8', lineHeight: '1.3' }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isBtnDisabled) return;
                      AudioManager.getInstance().playClick();
                      const res = buyTranscendenceConsumable(item.id);
                      alert(res.message);
                    }}
                    className={`btn btn-sm ${!isBtnDisabled ? 'btn-purple' : 'btn-ghost'}`}
                    style={{
                      width: '100%',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      padding: '0.45rem',
                      cursor: !isBtnDisabled ? 'pointer' : 'not-allowed',
                      border: !isBtnDisabled ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.06)',
                      background: !isBtnDisabled 
                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(76, 29, 149, 0.15) 100%)' 
                        : 'rgba(255,255,255,0.02)',
                      color: !isBtnDisabled ? '#e9d5ff' : '#6b7280',
                      boxShadow: !isBtnDisabled ? '0 0 12px rgba(124, 58, 237, 0.2)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    disabled={isBtnDisabled}
                  >
                    {buttonText}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface BestiaryPanelProps {
  selectedEnemy: any;
  setSelectedEnemy: (enemy: any) => void;
}

const BestiaryPanel: React.FC<BestiaryPanelProps> = ({
  selectedEnemy,
  setSelectedEnemy
}) => {
  const character = useGameStore((state) => state.character);
  const killCount = character.killCount || {};
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);

  // Agrupar inimigos por Fase (4 por fase)
  const phases = [];
  for (let i = 0; i < 6; i++) {
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

      {/* Resumo de Bônus do Bestiário */}
      <div style={{ 
        background: 'rgba(251, 191, 36, 0.05)', 
        border: '1px solid rgba(251, 191, 36, 0.15)', 
        padding: '0.75rem 1rem', 
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--gold-400)' }}>
            Efeito do Bestiário
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4ade80' }}>
            +{Math.round((StatEngine.calculateBestiaryDamageMultiplier(killCount) - 1.0) * 100)}% de Dano Geral
          </span>
        </div>
        <p style={{ fontSize: '0.52rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
          Cada monstro com 100+ abates (50+ para Chefes) concede <strong className="text-white">+1% de Dano Geral</strong> (Fases 1-5) e <strong className="text-white">+2%</strong> no Purgatório. 
          Concluir todos os 4 monstros de uma fase concede <strong className="text-white">+2% de Dano adicional</strong> (Fases 1-5) e <strong className="text-white">+7%</strong> no Purgatório. 
          Completar todo o Bestiário concede <strong className="text-white">+20% de Dano extra</strong> (Máx: +65% de Dano).
        </p>
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
                const reqKills = isBoss ? 50 : 100;
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

    </div>
  );
};

// Limites de atributos por tier de item
const TIER_LIMITS: Record<string, { base: number; special: Record<string, number> }> = {
  rustico: {
    base: 30,
    special: {
      damageMultiplierPct: 10,
      damageReductionPct: 5,
      lifesteal: 3,
      attackSpeedPct: 10,
      maxHpPct: 10,
      maxManaPct: 10,
      dropChancePct: 10,
      frenzyChancePct: 5,
      touchDamageMult: 50,
      robotClicks: 1
    }
  },
  ancestral: {
    base: 100,
    special: {
      damageMultiplierPct: 25,
      damageReductionPct: 10,
      lifesteal: 6,
      attackSpeedPct: 15,
      maxHpPct: 20,
      maxManaPct: 20,
      dropChancePct: 20,
      frenzyChancePct: 10,
      touchDamageMult: 100,
      robotClicks: 2
    }
  },
  pandemonio: {
    base: 250,
    special: {
      damageMultiplierPct: 60,
      damageReductionPct: 20,
      lifesteal: 15,
      attackSpeedPct: 30,
      maxHpPct: 50,
      maxManaPct: 50,
      dropChancePct: 50,
      frenzyChancePct: 20,
      touchDamageMult: 200,
      robotClicks: 3
    }
  },
  celestial: {
    base: 500,
    special: {
      damageMultiplierPct: 120,
      damageReductionPct: 40,
      lifesteal: 30,
      attackSpeedPct: 60,
      maxHpPct: 100,
      maxManaPct: 100,
      dropChancePct: 100,
      frenzyChancePct: 30,
      touchDamageMult: 400,
      robotClicks: 5
    }
  }
};

// Informações de exibição amigáveis dos atributos
const STAT_DISPLAY_INFO: Record<string, { label: string; isPct: boolean }> = {
  strength: { label: '💪 Força', isPct: false },
  magic: { label: '🔮 Magia', isPct: false },
  dexterity: { label: '🏹 Destreza', isPct: false },
  constitution: { label: '❤️ Constituição', isPct: false },
  luck: { label: '🍀 Sorte', isPct: false },
  damageMultiplierPct: { label: '⚔️ Dano Extra %', isPct: true },
  damageReductionPct: { label: '🛡️ Redução Dano %', isPct: true },
  lifesteal: { label: '🩸 Roubo de Vida %', isPct: true },
  attackSpeedPct: { label: '⚡ Vel. Ataque %', isPct: true },
  maxHpPct: { label: '➕ HP Máximo %', isPct: true },
  maxManaPct: { label: '🧪 Mana Máxima %', isPct: true },
  dropChancePct: { label: '💎 Chance Drop %', isPct: true },
  frenzyChancePct: { label: '🔥 Chance Frenesi %', isPct: true },
  touchDamageMult: { label: '👆 Dano do Toque %', isPct: true },
  robotClicks: { label: '🤖 Clicks do Robô', isPct: false }
};

// Helper para obter nome de item e conjunto reais do jogo
const getItemNameAndSet = (
  classId: string,
  slot: string,
  tier: 'rustico' | 'ancestral' | 'pandemonio' | 'celestial',
  misticLvl: number
) => {
  const slotNames: Record<string, Record<string, string>> = {
    warrior: { weapon: 'Espada', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas', necklace: 'Colar' },
    mage: { weapon: 'Cetro', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas', necklace: 'Amulet' },
    ranger: { weapon: 'Arco', head: 'Capuz', chest: 'Gibão', legs: 'Perneiras', gloves: 'Luvas', necklace: 'Amulet' },
    paladin: { weapon: 'Martelo', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas', necklace: 'Amulet' },
    cleric: { weapon: 'Maça', head: 'Mitra', chest: 'Túnica', legs: 'Calças', gloves: 'Luvas', necklace: 'Rosário' },
    rogue: { weapon: 'Adaga', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas', necklace: 'Colar' },
    necromancer: { weapon: 'Glaive', head: 'Capuz Sombrio', chest: 'Toga', legs: 'Calças', gloves: 'Manoplas', necklace: 'Amulet' },
    avatar: { weapon: 'Cetro Estelar', head: 'Coroa da Alma', chest: 'Túnica do Infinito', legs: 'Gamas da Totalidade', gloves: 'Manoplas Cósmicas', necklace: 'Colar' }
  };

  const setNames: Record<string, Record<string, string>> = {
    rustico: {
      warrior: 'Set do Senhor da Guerra',
      mage: 'Set do Mestre Arcano',
      ranger: 'Set do Rastreador das Sombras',
      paladin: 'Set do Guardião Divino',
      cleric: 'Set do Sumosacerdote',
      rogue: 'Set do Assassino Fantasma',
      necromancer: 'Set do Arauto da Ceifa',
      avatar: 'Set do Avatar Celestizado'
    },
    ancestral: {
      warrior: 'Set Ancestral do Conquistador',
      mage: 'Set Ancestral do Arquimago',
      ranger: 'Set Ancestral do Caçador Estelar',
      paladin: 'Set Ancestral do Sentinela Eterno',
      cleric: 'Set Ancestral do Sábio Divino',
      rogue: 'Set Ancestral do Ceifador de Almas',
      necromancer: 'Set Ancestral do Senhor dos Ecos Perdidos',
      avatar: 'Set Ancestral da Totalidade'
    },
    pandemonio: {
      warrior: 'Set Pandemoníaco do Destruidor',
      mage: 'Set Pandemoníaco do Feiticeiro do Vazio',
      ranger: 'Set Pandemoníaco do Franco-Atirador',
      paladin: 'Set Pandemoníaco do Vingador Sagrado',
      cleric: 'Set Pandemoníaco do Sumo-Inquisidor',
      rogue: 'Set Pandemoníaco do Executor',
      necromancer: 'Set Pandemoníaco do Devorador de Almas',
      avatar: 'Set Pandemoníaco do Eco Supremo'
    },
    celestial: {
      warrior: 'Set Celestial do Semideus',
      mage: 'Set Celestial do Senhor do Tempo',
      ranger: 'Set Celestial do Observador Estelar',
      paladin: 'Set Celestial do Arcanjo',
      cleric: 'Set Celestial do Serafim',
      rogue: 'Set Celestial do Espectro Astral',
      necromancer: 'Set Celestial do Ceifador de Estrelas',
      avatar: 'Set Celestial do Avatar Supremo'
    }
  };

  const baseName = slotNames[classId]?.[slot] || 'Equipamento';
  const setName = setNames[tier]?.[classId] || '';
  
  let cleanSetName = setName;
  let name = '';
  
  if (tier === 'celestial') {
    if (cleanSetName.startsWith('Set Celestial do ')) {
      cleanSetName = cleanSetName.replace('Set Celestial do ', '');
    } else if (cleanSetName.startsWith('Set Celestial de ')) {
      cleanSetName = cleanSetName.replace('Set Celestial de ', '');
    } else if (cleanSetName.startsWith('Set Celestial da ')) {
      cleanSetName = cleanSetName.replace('Set Celestial da ', '');
    }
    let suffix = 'Celestial';
    if (baseName.endsWith('as')) suffix = 'Celestiais';
    else if (baseName.endsWith('a')) suffix = 'Celestial';
    let prep = 'do';
    if (setName.includes(' da ')) prep = 'da';
    else if (setName.includes(' de ')) prep = 'de';
    name = `${baseName} ${suffix} ${prep} ${cleanSetName}`;
  } else if (tier === 'pandemonio') {
    if (cleanSetName.startsWith('Set Pandemoníaco do ')) {
      cleanSetName = cleanSetName.replace('Set Pandemoníaco do ', '');
    } else if (cleanSetName.startsWith('Set Pandemoníaco de ')) {
      cleanSetName = cleanSetName.replace('Set Pandemoníaco de ', '');
    } else if (cleanSetName.startsWith('Set Pandemoníaco da ')) {
      cleanSetName = cleanSetName.replace('Set Pandemoníaco da ', '');
    }
    let suffix = 'Pandemoníaco';
    if (baseName.endsWith('as')) suffix = 'Pandemoníacas';
    else if (baseName.endsWith('a')) suffix = 'Pandemoníaca';
    let prep = 'do';
    if (setName.includes(' da ')) prep = 'da';
    else if (setName.includes(' de ')) prep = 'de';
    name = `${baseName} ${suffix} ${prep} ${cleanSetName}`;
  } else if (tier === 'ancestral') {
    if (cleanSetName.startsWith('Set Ancestral do ')) {
      cleanSetName = cleanSetName.replace('Set Ancestral do ', '');
    } else if (cleanSetName.startsWith('Set Ancestral de ')) {
      cleanSetName = cleanSetName.replace('Set Ancestral de ', '');
    } else if (cleanSetName.startsWith('Set Ancestral da ')) {
      cleanSetName = cleanSetName.replace('Set Ancestral da ', '');
    }
    let suffix = 'Ancestral';
    if (baseName.endsWith('as')) suffix = 'Ancestrais';
    else if (baseName.endsWith('a')) suffix = 'Ancestral';
    let prep = 'do';
    if (setName.includes(' da ')) prep = 'da';
    else if (setName.includes(' de ')) prep = 'de';
    name = `${baseName} ${suffix} ${prep} ${cleanSetName}`;
  } else {
    // rustico
    if (cleanSetName.startsWith('Set do ')) {
      cleanSetName = cleanSetName.replace('Set do ', '');
    } else if (cleanSetName.startsWith('Set de ')) {
      cleanSetName = cleanSetName.replace('Set de ', '');
    } else if (cleanSetName.startsWith('Set da ')) {
      cleanSetName = cleanSetName.replace('Set da ', '');
    }
    let prep = 'do';
    if (setName.includes(' da ')) prep = 'da';
    else if (setName.includes(' de ')) prep = 'de';
    name = `${baseName} ${prep} ${cleanSetName}`;
  }

  if (misticLvl > 0) {
    name = `${name} +${misticLvl}`;
  }

  return { name, setName };
};

// Obter chaves de atributos válidos para o slot e classe do item
const getValidStatsForSlot = (slot: string, classId: string) => {
  if (slot === 'necklace') {
    return [
      'damageMultiplierPct',
      'maxHpPct',
      'maxManaPct',
      'attackSpeedPct',
      'robotClicks',
      'lifesteal',
      'touchDamageMult',
      'dropChancePct',
      'damageReductionPct',
      'frenzyChancePct'
    ];
  }

  // Atributos básicos aleatórios por classe para os outros slots
  if (classId === 'warrior') return ['strength', 'constitution', 'luck'];
  if (classId === 'mage' || classId === 'cleric' || classId === 'necromancer') return ['magic', 'constitution', 'luck'];
  if (classId === 'ranger') return ['dexterity', 'constitution', 'luck'];
  if (classId === 'paladin') return ['constitution', 'strength', 'luck'];
  if (classId === 'rogue') return ['dexterity', 'strength', 'luck'];
  if (classId === 'avatar') return ['strength', 'magic', 'dexterity', 'constitution', 'luck'];

  const mainStat = (classId === 'mage' || classId === 'necromancer' || classId === 'cleric') ? 'magic' :
                   (classId === 'ranger' || classId === 'rogue') ? 'dexterity' : 'strength';
  return [mainStat, 'constitution', 'luck'];
};

const OptionsPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const setCharacter = useGameStore((state) => state.setCharacter);

  const sfxEnabled = useGameStore((state) => state.sfxEnabled);
  const bgmEnabled = useGameStore((state) => state.bgmEnabled);
  const consoleEnabled = useGameStore((state) => state.consoleEnabled);
  const abbreviateNumbers = useGameStore((state) => state.abbreviateNumbers);
  const autoSellCommon = useGameStore((state) => state.autoSellCommon);
  const autoSellRare = useGameStore((state) => state.autoSellRare);
  const disableRobotTap = useGameStore((state) => state.disableRobotTap);

  const toggleSfx = useGameStore((state) => state.toggleSfx);
  const toggleBgm = useGameStore((state) => state.toggleBgm);
  const toggleConsole = useGameStore((state) => state.toggleConsole);
  const toggleAbbreviateNumbers = useGameStore((state) => state.toggleAbbreviateNumbers);
  const toggleAutoSellCommon = useGameStore((state) => state.toggleAutoSellCommon);
  const toggleAutoSellRare = useGameStore((state) => state.toggleAutoSellRare);
  const toggleDisableRobotTap = useGameStore((state) => state.toggleDisableRobotTap);

  const playClick = () => AudioManager.getInstance().playClick();

  // Estados da Área de Desenvolvedor (Sandbox)
  const [showDevInput, setShowDevInput] = useState(false);
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!!(window as any).isDevModeActive);
  const [devTab, setDevTab] = useState<'geral' | 'atributos' | 'equipamentos' | 'prestigio'>('geral');
  const [misticLevelGen, setMisticLevelGen] = useState<number>(8);

  // Estados para Criação de Item Customizado (sistema por tier)
  const [customItemSlot, setCustomItemSlot] = useState<'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace'>('weapon');
  const [customItemTier, setCustomItemTier] = useState<'rustico' | 'ancestral' | 'pandemonio' | 'celestial'>('celestial');
  const [customItemMistic, setCustomItemMistic] = useState<number>(8);
  const [customStats, setCustomStats] = useState<Record<string, number>>({});

  // Reseta stats ao trocar slot ou tier
  const handleCustomSlotChange = (slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace') => {
    setCustomItemSlot(slot);
    setCustomStats({});
  };
  const handleCustomTierChange = (tier: 'rustico' | 'ancestral' | 'pandemonio' | 'celestial') => {
    setCustomItemTier(tier);
    setCustomStats({});
  };

  const createCustomItem = () => {
    const tierLimits = TIER_LIMITS[customItemTier];
    const validStats = getValidStatsForSlot(customItemSlot, character.classId);
    const pctStats = ['damageMultiplierPct','damageReductionPct','lifesteal','attackSpeedPct','maxHpPct','maxManaPct','dropChancePct','frenzyChancePct'];

    const finalItemStats: Record<string, number> = {};
    validStats.forEach((key) => {
      const val = customStats[key] || 0;
      if (val === 0) return;
      const isPct = pctStats.includes(key);
      const maxAllowed = tierLimits.special[key] ?? tierLimits.base;
      const clamped = Math.min(val, maxAllowed);
      finalItemStats[key] = isPct ? clamped / 100 : clamped;
    });

    const { name: finalName, setName } = getItemNameAndSet(character.classId, customItemSlot, customItemTier, customItemMistic);
    const rarityMap: Record<string, EquipmentItem['rarity']> = {
      rustico: 'rare',
      ancestral: 'epic',
      pandemonio: 'legendary',
      celestial: customItemMistic > 0 ? 'mystic' : 'legendary'
    };

    const newItem: EquipmentItem = {
      id: `custom-${customItemSlot}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: finalName,
      slot: customItemSlot,
      rarity: customItemMistic > 0 ? 'mystic' : rarityMap[customItemTier],
      stats: finalItemStats,
      setName: setName || undefined,
      classId: character.classId,
      spriteName: `${character.classId}-${customItemSlot}`,
      stage: customItemTier === 'celestial' ? 50 : customItemTier === 'pandemonio' ? 31 : customItemTier === 'ancestral' ? 11 : 1,
      ...(customItemMistic > 0 ? { mysticLevel: customItemMistic } : {})
    };

    const newEquipment = {
      ...character.equipment,
      [customItemSlot]: newItem
    };

    setCharacter({
      ...character,
      equipment: newEquipment
    });

    playClick();
    alert(`Item "${finalName}" criado e equipado!\nSet: ${setName || 'nenhum'}`);
  };

  const enableDevMode = () => {
    setIsUnlocked(true);
    (window as any).isDevModeActive = true;
    if (!(window as any).isStorageIntercepted) {
      (window as any).isStorageIntercepted = true;
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if ((window as any).isDevModeActive && (key.startsWith('medieval_idle_') || key === 'global_class_levels')) {
          console.log('Salvamento interceptado e bloqueado no modo Sandbox:', key);
          return;
        }
        originalSetItem.call(this, key, value);
      };
    }
  };

  useEffect(() => {
    if ((window as any).isDevModeActive) {
      enableDevMode();
    }
  }, []);

  const equipSet = (setType: 'celestial' | 'pandemonium', misticLvl: number) => {
    const classId = character.classId;
    
    const slotNames: Record<string, Record<string, string>> = {
      warrior: { weapon: 'Espada', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas', necklace: 'Colar' },
      mage: { weapon: 'Cetro', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas', necklace: 'Amulet' },
      ranger: { weapon: 'Arco', head: 'Capuz', chest: 'Gibão', legs: 'Perneiras', gloves: 'Luvas', necklace: 'Amulet' },
      paladin: { weapon: 'Martelo', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas', necklace: 'Amulet' },
      cleric: { weapon: 'Maça', head: 'Mitra', chest: 'Túnica', legs: 'Calças', gloves: 'Luvas', necklace: 'Rosário' },
      rogue: { weapon: 'Adaga', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas', necklace: 'Colar' },
      necromancer: { weapon: 'Glaive', head: 'Capuz Sombrio', chest: 'Toga', legs: 'Calças', gloves: 'Manoplas', necklace: 'Amulet' },
      avatar: { weapon: 'Cetro Estelar', head: 'Coroa da Alma', chest: 'Túnica do Infinito', legs: 'Gamas da Totalidade', gloves: 'Manoplas Cósmicas', necklace: 'Colar' }
    };

    const celestialSetNames: Record<string, string> = {
      warrior: 'Set Celestial do Semideus',
      mage: 'Set Celestial do Senhor do Tempo',
      ranger: 'Set Celestial do Observador Estelar',
      paladin: 'Set Celestial do Arcanjo',
      cleric: 'Set Celestial do Serafim',
      rogue: 'Set Celestial do Espectro Astral',
      necromancer: 'Set Celestial do Ceifador de Estrelas',
      avatar: 'Set Celestial do Avatar Supremo'
    };

    const pandemoniumSetNames: Record<string, string> = {
      warrior: 'Set Pandemoníaco do Destruidor',
      mage: 'Set Pandemoníaco do Feiticeiro do Vazio',
      ranger: 'Set Pandemoníaco do Franco-Atirador',
      paladin: 'Set Pandemoníaco do Vingador Sagrado',
      cleric: 'Set Pandemoníaco do Sumo-Inquisidor',
      rogue: 'Set Pandemoníaco do Executor',
      necromancer: 'Set Pandemoníaco do Devorador de Almas',
      avatar: 'Set Pandemoníaco do Eco Supremo'
    };

    const setName = setType === 'celestial' ? celestialSetNames[classId] : pandemoniumSetNames[classId];
    if (!setName) return;

    const newEquipment: Record<string, any> = {};
    const slots = ['head', 'chest', 'legs', 'gloves', 'weapon', 'necklace'];
    
    slots.forEach(slot => {
      const baseName = slotNames[classId]?.[slot] || 'Equipamento';
      let cleanSetName = setName;
      let name = '';
      
      if (setType === 'celestial') {
        if (cleanSetName.startsWith('Set Celestial do ')) {
          cleanSetName = cleanSetName.replace('Set Celestial do ', '');
        } else if (cleanSetName.startsWith('Set Celestial de ')) {
          cleanSetName = cleanSetName.replace('Set Celestial de ', '');
        } else if (cleanSetName.startsWith('Set Celestial da ')) {
          cleanSetName = cleanSetName.replace('Set Celestial da ', '');
        }
        
        let suffix = 'Celestial';
        if (baseName.endsWith('as')) {
          suffix = 'Celestiais';
        } else if (baseName.endsWith('a')) {
          suffix = 'Celestial';
        }
        
        let prep = 'do';
        if (setName.includes(' da ')) {
          prep = 'da';
        } else if (setName.includes(' de ')) {
          prep = 'de';
        }
        name = `${baseName} ${suffix} ${prep} ${cleanSetName}`;
      } else {
        if (cleanSetName.startsWith('Set Pandemoníaco do ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco do ', '');
        } else if (cleanSetName.startsWith('Set Pandemoníaco de ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco de ', '');
        } else if (cleanSetName.startsWith('Set Pandemoníaco da ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco da ', '');
        }
        
        let suffix = 'Pandemoníaco';
        if (baseName.endsWith('as')) {
          suffix = 'Pandemoníacas';
        } else if (baseName.endsWith('a')) {
          suffix = 'Pandemoníaca';
        }
        
        let prep = 'do';
        if (setName.includes(' da ')) {
          prep = 'da';
        } else if (setName.includes(' de ')) {
          prep = 'de';
        }
        name = `${baseName} ${suffix} ${prep} ${cleanSetName}`;
      }

      if (misticLvl > 0) {
        name = `${name} +${misticLvl}`;
      }

      const itemStats: Record<string, number> = {};
      const mainStat = (classId === 'mage' || classId === 'necromancer' || classId === 'cleric') ? 'magic' :
                       (classId === 'ranger' || classId === 'rogue') ? 'dexterity' : 'strength';

      if (classId === 'avatar') {
        itemStats['strength'] = 200;
        itemStats['magic'] = 200;
        itemStats['dexterity'] = 200;
      } else {
        itemStats[mainStat] = 250;
        itemStats['constitution'] = 250;
        itemStats['luck'] = 150;
      }

      if (slot === 'weapon') {
        itemStats['damageMultiplierPct'] = 0.60;
      } else if (slot === 'necklace') {
        itemStats['damageReductionPct'] = 0.20;
        itemStats['lifesteal'] = 0.15;
      } else if (slot === 'gloves') {
        itemStats['attackSpeedPct'] = 0.30;
      } else {
        itemStats['maxHpPct'] = 0.50;
      }

      newEquipment[slot] = {
        id: `${classId}-${slot}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        slot,
        rarity: misticLvl > 0 ? 'mystic' : 'legendary',
        stats: itemStats,
        setName,
        classId,
        spriteName: `${classId}-${slot}`,
        stage: 50,
        ...(misticLvl > 0 ? { mysticLevel: misticLvl } : {})
      };
    });

    const newChar = {
      ...character,
      equipment: newEquipment
    };
    setCharacter(newChar);
    playClick();
  };

  const updateSingleItemMistic = (slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace', newLvl: number) => {
    const item = character.equipment[slot];
    if (!item) return;

    let cleanName = item.name.replace(/\s\+\d+$/, '');
    let updatedName = cleanName;
    if (newLvl > 0) {
      updatedName = `${cleanName} +${newLvl}`;
    }

    const updatedItem = {
      ...item,
      name: updatedName,
      rarity: newLvl > 0 ? 'mystic' : 'legendary',
      mysticLevel: newLvl > 0 ? newLvl : undefined
    };

    if (newLvl === 0) {
      delete updatedItem.mysticLevel;
    }

    const newChar = {
      ...character,
      equipment: {
        ...character.equipment,
        [slot]: updatedItem
      }
    };
    setCharacter(newChar);
  };

  const set20TowerKeys = () => {
    const cleanInventory = character.inventory.filter(item => item.consumableType !== 'tower_key');
    const keysToAdd = Array.from({ length: 20 }, (_, i) => ({
      id: `tower_key_dev_${Date.now()}_${i}`,
      name: "Chave da Torre",
      slot: "consumable" as const,
      rarity: "consumable" as const,
      consumableType: "tower_key" as const,
      stats: {},
      spriteName: "tower_key",
      classId: "common"
    }));
    setCharacter({
      ...character,
      inventory: [...cleanInventory, ...keysToAdd]
    });
    playClick();
  };

  const maxPrestigeUpgrades = () => {
    const maxUpgrades: Record<string, number> = {};
    Object.keys(PRESTIGE_UPGRADES_CATALOG).forEach(key => {
      maxUpgrades[key] = PRESTIGE_UPGRADES_CATALOG[key].maxLevel;
    });
    setCharacter({
      ...character,
      prestigeUpgrades: maxUpgrades
    });
    playClick();
  };

  const maxTranscendenceUpgrades = () => {
    const maxUpgrades: Record<string, number> = {};
    Object.keys(TRANSCENDENCE_UPGRADES_CATALOG).forEach(key => {
      maxUpgrades[key] = TRANSCENDENCE_UPGRADES_CATALOG[key].maxLevel;
    });
    setCharacter({
      ...character,
      transcendenceUpgrades: maxUpgrades
    });
    playClick();
  };

  const maxSkills = () => {
    const skillLevels = { ...character.skillLevels };
    const classSkills = CLASS_CONFIGS[character.classId]?.initialSkills || [];
    const unlockedSkills = Array.from(new Set([...character.unlockedSkills, ...classSkills]));
    unlockedSkills.forEach(skillId => {
      skillLevels[skillId] = 5;
    });
    setCharacter({
      ...character,
      unlockedSkills,
      skillLevels
    });
    playClick();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Opções do Jogo</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        
        {/* Seção de Áudio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configurações de Áudio</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => {
                toggleBgm();
                playClick();
              }}
              style={{
                flex: 1,
                background: bgmEnabled ? 'rgba(139, 92, 246, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                color: bgmEnabled ? '#c084fc' : '#f87171',
                border: bgmEnabled ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.5rem',
                borderRadius: '6px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease',
                fontWeight: 'bold'
              }}
            >
              <span>🎵</span> Música: {bgmEnabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => {
                toggleSfx();
                setTimeout(() => playClick(), 30);
              }}
              style={{
                flex: 1,
                background: sfxEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                color: sfxEnabled ? '#34d399' : '#f87171',
                border: sfxEnabled ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.5rem',
                borderRadius: '6px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease',
                fontWeight: 'bold'
              }}
            >
              <span>🔊</span> Efeitos Sonoros: {sfxEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Seção de Visual & Interface */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visual & Interface</span>
          
          {/* Toggle Console de Combate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Console de Combate</div>
              <div style={{ color: '#94a3b8', fontSize: '0.55rem' }}>Exibe o log de combate em tempo real abaixo das barras de status.</div>
            </div>
            <button
              onClick={() => {
                toggleConsole();
                playClick();
              }}
              className={`btn btn-sm ${consoleEnabled ? 'btn-success' : 'btn-secondary'}`}
              style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', minWidth: '70px' }}
            >
              {consoleEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border-dim)', margin: '0.2rem 0' }} />

          {/* Toggle Formatação de Números */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Abreviar Números Grandes</div>
              <div style={{ color: '#94a3b8', fontSize: '0.55rem' }}>Exibe números formatados como 10K, 1.5M em vez de 10000 ou 1500000.</div>
            </div>
            <button
              onClick={() => {
                toggleAbbreviateNumbers();
                playClick();
              }}
              className={`btn btn-sm ${abbreviateNumbers ? 'btn-success' : 'btn-secondary'}`}
              style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', minWidth: '70px' }}
            >
              {abbreviateNumbers ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Seção de Automação & QoL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automação & QoL</span>

          {/* Auto-venda Comuns */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Auto-venda: Equipamentos Comuns</div>
              <div style={{ color: '#94a3b8', fontSize: '0.55rem' }}>Vende instantaneamente itens comuns dropados por ouro.</div>
            </div>
            <button
              onClick={() => {
                toggleAutoSellCommon();
                playClick();
              }}
              className={`btn btn-sm ${autoSellCommon ? 'btn-success' : 'btn-secondary'}`}
              style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', minWidth: '70px' }}
            >
              {autoSellCommon ? 'On' : 'Off'}
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border-dim)', margin: '0.2rem 0' }} />

          {/* Auto-venda Raros */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Auto-venda: Equipamentos Raros</div>
              <div style={{ color: '#94a3b8', fontSize: '0.55rem' }}>Vende instantaneamente itens raros dropados por ouro.</div>
            </div>
            <button
              onClick={() => {
                toggleAutoSellRare();
                playClick();
              }}
              className={`btn btn-sm ${autoSellRare ? 'btn-success' : 'btn-secondary'}`}
              style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', minWidth: '70px' }}
            >
              {autoSellRare ? 'On' : 'Off'}
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border-dim)', margin: '0.2rem 0' }} />

          {/* Desativar Robô Assistente */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Desativar Robô Assistente</div>
              <div style={{ color: '#94a3b8', fontSize: '0.55rem' }}>Desativa a IA de toques automáticos (Frenesi) no combate sidescrolling.</div>
            </div>
            <button
              onClick={() => {
                toggleDisableRobotTap();
                playClick();
              }}
              className={`btn btn-sm ${disableRobotTap ? 'btn-danger' : 'btn-secondary'}`}
              style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', minWidth: '70px' }}
            >
              {disableRobotTap ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Área de Desenvolvedor Secreta (Sandbox) */}
        <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-dim)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
          {!isUnlocked ? (
            <>
              <span 
                onClick={() => {
                  setShowDevInput(!showDevInput);
                  playClick();
                }} 
                style={{ fontSize: '0.6rem', color: '#64748b', cursor: 'pointer', userSelect: 'none', textDecoration: 'underline' }}
              >
                {showDevInput ? 'Fechar Modo de Testes' : '⚙️ Painel do Desenvolvedor (Sandbox)'}
              </span>
              {showDevInput && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', width: '100%', maxWidth: '250px', justifyContent: 'center' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha..."
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      color: '#fff',
                      fontSize: '0.65rem',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (password === 'devmode' || password === 'amaro123' || password === 'antigravity') {
                          enableDevMode();
                          playClick();
                        } else {
                          alert('Senha incorreta!');
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (password === 'devmode' || password === 'amaro123' || password === 'antigravity') {
                        enableDevMode();
                        playClick();
                      } else {
                        alert('Senha incorreta!');
                      }
                    }}
                    className="btn btn-sm btn-gold"
                    style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem' }}
                  >
                    Desbloquear
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              width: '100%',
              background: 'rgba(15, 15, 20, 0.95)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '8px',
              padding: '0.85rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.8), inset 0 0 10px rgba(245, 158, 11, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {/* Header do Sandbox */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245, 158, 11, 0.25)', paddingBottom: '0.4rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚡ Painel Sandbox / Editor de Save
                  </span>
                  <span style={{ fontSize: '0.48rem', color: '#f87171', fontWeight: 'bold', textShadow: '0 0 2px rgba(239, 68, 68, 0.2)' }}>
                    ⚠️ Salvamento automático suspenso (reinicie o jogo para salvar de novo)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => {
                      try {
                        const dataStr = JSON.stringify(character);
                        const saveStr = btoa(dataStr);
                        navigator.clipboard.writeText(saveStr).then(() => {
                          alert("Save exportado e copiado para a área de transferência!");
                        }).catch(() => {
                          prompt("Copie o código do save abaixo:", saveStr);
                        });
                      } catch (err) {
                        alert("Erro ao exportar o save.");
                      }
                      playClick();
                    }}
                    className="btn btn-sm btn-gold"
                    style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem', color: '#000', fontWeight: 'bold' }}
                  >
                    💾 Exportar Save
                  </button>
                  <button
                    onClick={() => {
                      setIsUnlocked(false);
                      setPassword('');
                      playClick();
                    }}
                    className="btn btn-sm btn-danger"
                    style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem' }}
                  >
                    Bloquear
                  </button>
                </div>
              </div>

              {/* Tabs do Painel */}
              <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.4rem' }}>
                {(['geral', 'atributos', 'equipamentos', 'prestigio'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setDevTab(tab);
                      playClick();
                    }}
                    style={{
                      flex: 1,
                      background: devTab === tab ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                      color: devTab === tab ? '#fbbf24' : '#94a3b8',
                      border: devTab === tab ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                      padding: '0.25rem 0.1rem',
                      borderRadius: '4px',
                      fontSize: '0.58rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Conteudo Geral & Progresso */}
              {devTab === 'geral' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.62rem' }}>
                  
                  {/* Linha 1: Classe e Nivel */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Classe Ativa:</span>
                      <select
                        value={character.classId}
                        onChange={(e) => {
                          setCharacter({ ...character, classId: e.target.value });
                          playClick();
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.2rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none'
                        }}
                      >
                        <option value="warrior">Guerreiro</option>
                        <option value="mage">Mago</option>
                        <option value="ranger">Rastreador</option>
                        <option value="paladin">Paladino</option>
                        <option value="cleric">Clérigo</option>
                        <option value="rogue">Ladino</option>
                        <option value="necromancer">Necromante</option>
                        <option value="avatar">Avatar</option>
                      </select>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Nível ({character.level}):</span>
                      <input
                        type="number"
                        min="1"
                        value={character.level}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 1);
                          setCharacter({ ...character, level: val });
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.2rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Linha 2: Ouro */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Ouro Atual:</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="number"
                        value={character.gold}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({ ...character, gold: val });
                        }}
                        style={{
                          flex: 1,
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.2rem 0.4rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => {
                          setCharacter({ ...character, gold: Math.max(0, character.gold + 10000000) });
                          playClick();
                        }}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.55rem', padding: '0.2rem 0.4rem' }}
                      >
                        +10M
                      </button>
                      <button
                        onClick={() => {
                          setCharacter({ ...character, gold: 999999999 });
                          playClick();
                        }}
                        className="btn btn-sm btn-gold"
                        style={{ fontSize: '0.55rem', padding: '0.2rem 0.4rem', color: '#000', fontWeight: 'bold' }}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Linha 3: Fragmentos de Forja e Chaves */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Fragmentos Forja (🔩):</span>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <input
                          type="number"
                          value={character.forgeFragments || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setCharacter({ ...character, forgeFragments: val });
                          }}
                          style={{
                            width: '55px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid var(--border-dim)',
                            borderRadius: '4px',
                            padding: '0.2rem',
                            color: '#fff',
                            fontSize: '0.62rem',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                        <button
                          onClick={() => {
                            setCharacter({ ...character, forgeFragments: Math.max(0, (character.forgeFragments || 0) + 100) });
                            playClick();
                          }}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.52rem', padding: '0.1rem 0.25rem', flex: 1 }}
                        >
                          +100
                        </button>
                        <button
                          onClick={() => {
                            setCharacter({ ...character, forgeFragments: 999 });
                            playClick();
                          }}
                          className="btn btn-sm btn-gold"
                          style={{ fontSize: '0.52rem', padding: '0.1rem 0.25rem', color: '#000', fontWeight: 'bold' }}
                        >
                          999
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', justifyContent: 'flex-end' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Chaves da Torre (🔑):</span>
                      <button
                        onClick={set20TowerKeys}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.58rem', width: '100%', padding: '0.25rem' }}
                      >
                        Setar 20 Chaves
                      </button>
                    </div>
                  </div>

                  {/* Linha 4: Fase atual e maxima */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Fase Atual:</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={character.currentStage}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(200, Number(e.target.value) || 1));
                          setCharacter({ ...character, currentStage: val });
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.2rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Fase Máxima:</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={character.highestStageReached}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(200, Number(e.target.value) || 1));
                          setCharacter({ ...character, highestStageReached: val });
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.2rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Linha 5: Modos de Jogo */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={character.pandemoniumUnlocked || false}
                        onChange={(e) => {
                          setCharacter({ ...character, pandemoniumUnlocked: e.target.checked });
                          playClick();
                        }}
                      />
                      Pandemônio Lib.
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={character.activePandemonium || false}
                        onChange={(e) => {
                          setCharacter({ ...character, activePandemonium: e.target.checked });
                          playClick();
                        }}
                      />
                      Pandemônio Ativo
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={character.purgatoryCompleted || false}
                        onChange={(e) => {
                          setCharacter({ ...character, purgatoryCompleted: e.target.checked });
                          playClick();
                        }}
                      />
                      Purgatório Comp.
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={character.activeEcoterra || false}
                        onChange={(e) => {
                          setCharacter({ ...character, activeEcoterra: e.target.checked });
                          playClick();
                        }}
                      />
                      Ecoterra Ativo
                    </label>
                  </div>
                </div>
              )}

              {/* Conteudo Atributos */}
              {devTab === 'atributos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.62rem' }}>
                  
                  {/* Grid de Atributos Base */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                    {(['strength', 'magic', 'dexterity', 'constitution', 'luck'] as Array<keyof BaseStats>).map((stat) => (
                      <div key={stat} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#fbbf24', textTransform: 'capitalize' }}>
                          {stat === 'strength' ? 'Força' : stat === 'magic' ? 'Magia' : stat === 'dexterity' ? 'Destreza' : stat === 'constitution' ? 'Vigor' : 'Sorte'}:
                        </span>
                        <input
                          type="number"
                          value={character.baseStats[stat]}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setCharacter({
                              ...character,
                              baseStats: {
                                ...character.baseStats,
                                [stat]: val
                              }
                            });
                          }}
                          style={{
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid var(--border-dim)',
                            borderRadius: '4px',
                            padding: '0.15rem',
                            color: '#fff',
                            fontSize: '0.62rem',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Toque e Critico */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.4rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Dano Toque:</span>
                      <input
                        type="number"
                        value={character.baseStats.touch || 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({
                            ...character,
                            baseStats: { ...character.baseStats, touch: val }
                          });
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.15rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Chance Crit%:</span>
                      <input
                        type="number"
                        value={character.baseStats.touchCritChance || 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({
                            ...character,
                            baseStats: { ...character.baseStats, touchCritChance: val }
                          });
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.15rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Dano Crit%:</span>
                      <input
                        type="number"
                        value={character.baseStats.touchCritDamage || 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({
                            ...character,
                            baseStats: { ...character.baseStats, touchCritDamage: val }
                          });
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.15rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Pontos de Atributos e Skill Libres */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Pontos Atributo Livres:</span>
                      <input
                        type="number"
                        value={character.attributePoints}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({ ...character, attributePoints: val });
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.2rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Pontos Habilidade Livres:</span>
                      <input
                        type="number"
                        value={character.skillPoints}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({ ...character, skillPoints: val });
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.2rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Botões Rápidos */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button
                      onClick={maxSkills}
                      className="btn btn-sm btn-gold"
                      style={{ flex: 1, fontSize: '0.58rem', padding: '0.3rem', color: '#000', fontWeight: 'bold' }}
                    >
                      Maximizar Skills da Classe (+5)
                    </button>
                    <button
                      onClick={() => {
                        setCharacter({
                          ...character,
                          baseStats: {
                            strength: 15,
                            magic: 10,
                            dexterity: 10,
                            constitution: 15,
                            luck: 5,
                            touch: 10,
                            touchCritChance: 5,
                            touchCritDamage: 150,
                            robotClicks: 0
                          },
                          attributePoints: 2000
                        });
                        playClick();
                      }}
                      className="btn btn-sm btn-secondary"
                      style={{ flex: 1, fontSize: '0.58rem', padding: '0.3rem' }}
                    >
                      Resetar Atributos (2000 ptos)
                    </button>
                  </div>

                </div>
              )}

              {/* Conteudo Equipamentos */}
              {devTab === 'equipamentos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.62rem' }}>
                  
                  {/* Seletor de Mística */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '0.4rem', borderRadius: '6px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>Mística do Set Equipado:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        value={misticLevelGen}
                        onChange={(e) => {
                          setMisticLevelGen(Number(e.target.value));
                          playClick();
                        }}
                        style={{ width: '80px', accentColor: '#fbbf24' }}
                      />
                      <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center', color: '#a78bfa' }}>+{misticLevelGen}</span>
                    </div>
                  </div>

                  {/* Botoes rápidos de set completo */}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => equipSet('celestial', misticLevelGen)}
                      className="btn btn-sm btn-gold"
                      style={{ flex: 1, fontSize: '0.58rem', padding: '0.35rem', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                    >
                      👑 Equipar Celestial +{misticLevelGen}
                    </button>
                    <button
                      onClick={() => equipSet('pandemonium', misticLevelGen)}
                      className="btn btn-sm btn-secondary"
                      style={{ flex: 1, fontSize: '0.58rem', padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', background: 'rgba(220, 38, 38, 0.15)', color: '#f87171', border: '1px solid rgba(220, 38, 38, 0.35)' }}
                    >
                      🔥 Equipar Pandemônio +{misticLevelGen}
                    </button>
                  </div>

                  {/* Refinador de Equipamento Individual */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '130px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '0.58rem' }}>Mística de Itens Equipados:</span>
                    {(['head', 'chest', 'legs', 'gloves', 'weapon', 'necklace'] as const).map((slot) => {
                      const item = character.equipment[slot] as EquipmentItem | null;
                      const slotLabel = slot === 'head' ? 'Elmo' : slot === 'chest' ? 'Peito' : slot === 'legs' ? 'Pernas' : slot === 'gloves' ? 'Luvas' : slot === 'weapon' ? 'Arma' : 'Colar';
                      
                      return (
                        <div key={slot} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{slotLabel}:</span>
                          {item ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                color: item.rarity === 'mystic' ? '#c084fc' : item.rarity === 'legendary' ? '#f59e0b' : '#34d399',
                                fontSize: '0.58rem',
                                maxWidth: '100px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}>
                                {item.name}
                              </span>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                <button
                                  onClick={() => {
                                    const currentLvl = item.mysticLevel || 0;
                                    if (currentLvl > 0) updateSingleItemMistic(slot, currentLvl - 1);
                                  }}
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '0.05rem 0.2rem', fontSize: '0.5rem', minWidth: '15px' }}
                                >
                                  -
                                </button>
                                <span style={{ fontSize: '0.58rem', minWidth: '20px', textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>
                                  +{item.mysticLevel || 0}
                                </span>
                                <button
                                  onClick={() => {
                                    const currentLvl = item.mysticLevel || 0;
                                    if (currentLvl < 8) updateSingleItemMistic(slot, currentLvl + 1);
                                  }}
                                  className="btn btn-sm btn-secondary"
                                  style={{ padding: '0.05rem 0.2rem', fontSize: '0.5rem', minWidth: '15px' }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.55rem' }}>Vazio</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Criador de Item por Tier */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.1rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '0.62rem' }}>🔨 Criar Item do Jogo:</span>

                    {/* Linha 1: Peça + Tier + Mística */}
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.55rem' }}>Peça:</span>
                        <select
                          value={customItemSlot}
                          onChange={(e) => handleCustomSlotChange(e.target.value as any)}
                          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)', borderRadius: '4px', padding: '0.15rem', color: '#fff', fontSize: '0.55rem', outline: 'none' }}
                        >
                          <option value="weapon">⚔️ Arma</option>
                          <option value="head">🪖 Elmo</option>
                          <option value="chest">🛡️ Peito</option>
                          <option value="legs">👖 Pernas</option>
                          <option value="gloves">🧤 Luvas</option>
                          <option value="necklace">📿 Colar</option>
                        </select>
                      </div>

                      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.55rem' }}>Tier:</span>
                        <select
                          value={customItemTier}
                          onChange={(e) => handleCustomTierChange(e.target.value as any)}
                          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)', borderRadius: '4px', padding: '0.15rem', color: '#fff', fontSize: '0.55rem', outline: 'none' }}
                        >
                          <option value="rustico">⚒️ Rústico (Fase 1)</option>
                          <option value="ancestral">✨ Ancestral (Fase 11)</option>
                          <option value="pandemonio">🔥 Pandemônio (Fase 31)</option>
                          <option value="celestial">👑 Celestial (Fase 50)</option>
                        </select>
                      </div>

                      <div style={{ width: '42px', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.55rem' }}>+Míst:</span>
                        <input
                          type="number"
                          min="0"
                          max="8"
                          value={customItemMistic}
                          onChange={(e) => setCustomItemMistic(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
                          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)', borderRadius: '4px', padding: '0.15rem', color: '#c084fc', fontSize: '0.58rem', outline: 'none', textAlign: 'center', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>

                    {/* Preview do nome e set */}
                    {(() => {
                      const preview = getItemNameAndSet(character.classId, customItemSlot, customItemTier, customItemMistic);
                      const nameColor = customItemMistic > 0 ? '#c084fc' : customItemTier === 'celestial' ? '#f59e0b' : customItemTier === 'pandemonio' ? '#f87171' : customItemTier === 'ancestral' ? '#a855f7' : '#9ca3af';
                      return (
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.3rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ color: nameColor, fontSize: '0.58rem', fontWeight: 'bold' }}>
                            📜 {preview.name}
                          </div>
                          {preview.setName && (
                            <div style={{ color: '#34d399', fontSize: '0.5rem', marginTop: '0.1rem' }}>
                              Set: {preview.setName}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Atributos filtrados por slot+classe */}
                    <span style={{ color: '#fbbf24', fontSize: '0.55rem', fontWeight: 'bold' }}>
                      Atributos (limite: {TIER_LIMITS[customItemTier]?.base} base / especiais indicados):
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem 0.5rem', maxHeight: '120px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.02)' }}>
                      {getValidStatsForSlot(customItemSlot, character.classId).map((statKey) => {
                        const info = STAT_DISPLAY_INFO[statKey];
                        const tierLimits = TIER_LIMITS[customItemTier];
                        const maxVal = tierLimits?.special[statKey] ?? tierLimits?.base ?? 999;
                        if (!info) return null;
                        return (
                          <div key={statKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#cbd5e1', fontSize: '0.5rem', flex: 1 }}>{info.label}{info.isPct ? ` (máx ${maxVal}%)` : ` (máx ${maxVal})`}:</span>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max={maxVal}
                              value={customStats[statKey] || ''}
                              onChange={(e) => {
                                const val = Math.min(Number(e.target.value) || 0, maxVal);
                                setCustomStats({ ...customStats, [statKey]: val });
                              }}
                              style={{ width: '48px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', padding: '0.05rem 0.15rem', color: '#fff', fontSize: '0.52rem', outline: 'none', textAlign: 'center' }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={createCustomItem}
                      className="btn btn-sm btn-gold"
                      style={{ fontSize: '0.58rem', padding: '0.3rem', color: '#000', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.15)' }}
                    >
                      ✨ Criar &amp; Equipar Item
                    </button>
                  </div>

                </div>
              )}

              {/* Conteudo Prestigio & Transcendencia */}
              {devTab === 'prestigio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.62rem' }}>
                  
                  {/* Linha 1: Prestígio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      💫 Prestígio (Upgrade Roguelite)
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.1rem' }}>
                      <span style={{ color: '#94a3b8' }}>Pontos (PP):</span>
                      <input
                        type="number"
                        value={character.prestigePoints}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({ ...character, prestigePoints: val });
                        }}
                        style={{
                          flex: 1,
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.15rem 0.3rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={maxPrestigeUpgrades}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.55rem', padding: '0.2rem 0.4rem' }}
                      >
                        Maximizar Upgrades
                      </button>
                    </div>
                  </div>

                  {/* Linha 2: Transcendencia */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#a78bfa', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      🌀 Transcendência (Segundo Ciclo)
                    </span>
                    
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.1rem' }}>
                      <span style={{ color: '#94a3b8' }}>Pontos (PT):</span>
                      <input
                        type="number"
                        value={character.transcendencePoints || 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({ ...character, transcendencePoints: val });
                        }}
                        style={{
                          width: '60px',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.15rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />

                      <span style={{ color: '#94a3b8' }}>Resets:</span>
                      <input
                        type="number"
                        value={character.transcendenceCount || 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setCharacter({ ...character, transcendenceCount: val });
                        }}
                        style={{
                          width: '50px',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.15rem',
                          color: '#fff',
                          fontSize: '0.62rem',
                          outline: 'none',
                          textAlign: 'center'
                        }}
                      />

                      <button
                        onClick={maxTranscendenceUpgrades}
                        className="btn btn-sm btn-gold"
                        style={{ fontSize: '0.55rem', padding: '0.2rem 0.4rem', color: '#000', fontWeight: 'bold', flex: 1 }}
                      >
                        Maximizar Upgrades
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default function GameUI() {
  const character = useGameStore((state) => state.character);
  const equipItem = useGameStore((state) => state.equipItem);
  const unequipItem = useGameStore((state) => state.unequipItem);
  const discardItem = useGameStore((state) => state.discardItem);
  const useConsumable = useGameStore((state) => state.useConsumable);
  const sellItem = useGameStore((state) => state.sellItem);
  const dismantleItem = useGameStore((state) => state.dismantleItem);
  const abbreviateNumbers = useGameStore((state) => state.abbreviateNumbers);

  const towerKeyCount = character.inventory.filter(item => 
    item.slot === 'consumable' && item.consumableType === 'tower_key'
  ).length;

  const [activeTab, setActiveTab] = useState<'combat' | 'tower' | 'attributes' | 'skills' | 'equipment' | 'forge' | 'prestige' | 'transcendence' | 'shop' | 'bestiary' | 'guide' | 'saves' | 'options'>('combat');
  const [desktopStartIndex, setDesktopStartIndex] = useState(0);

  const [visibleParagraphs, setVisibleParagraphs] = useState<number>(1);
  const loreContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    if (character.introLoreShown === false) {
      const totalParagraphs = 7;
      const timer = setInterval(() => {
        setVisibleParagraphs((prev) => {
          if (prev < totalParagraphs) {
            return prev + 1;
          } else {
            clearInterval(timer);
            return prev;
          }
        });
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [character.introLoreShown]);

  useEffect(() => {
    if (loreContainerRef.current) {
      loreContainerRef.current.scrollTo({
        top: loreContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [visibleParagraphs]);
  const setScreen = useGameStore((state) => state.setScreen);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace' | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<any | null>(null);

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

  useEffect(() => {
    const activeIdx = tabs.findIndex(t => t.id === activeTab);
    if (activeIdx !== -1) {
      if (activeIdx < desktopStartIndex) {
        setDesktopStartIndex(activeIdx);
      } else if (activeIdx >= desktopStartIndex + 5) {
        setDesktopStartIndex(activeIdx - 4);
      }
    }
  }, [activeTab]);

  const tabs = [
    { id: 'combat' as const, label: 'Combate', icon: '⚔' },
    { id: 'attributes' as const, label: 'Atributos', icon: '◆' },
    { id: 'skills' as const, label: 'Habilidades', icon: '★' },
    { id: 'equipment' as const, label: 'Equipamento', icon: '🛡️' },
    { id: 'forge' as const, label: 'Forja', icon: '⚒️' },
    { id: 'tower' as const, label: 'Torre', icon: '🏰' },
    { id: 'prestige' as const, label: 'Ascensão', icon: '☾' },
    ...(((character.pandemoniumUnlocked && character.highestStageReached >= 50) || (character.transcendenceCount || 0) > 0) ? [
      { id: 'transcendence' as const, label: 'Transcendência', icon: '🌌' }
    ] : []),
    { id: 'shop' as const, label: 'Loja', icon: '🛒' },
    { id: 'bestiary' as const, label: 'Bestiário', icon: '🐉' },
    { id: 'guide' as const, label: 'Guia', icon: '▤' },
    { id: 'saves' as const, label: 'Saves', icon: '💾' },
    { id: 'options' as const, label: 'Opções', icon: '⚙️' },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const extendedTabs = [
    tabs[tabs.length - 1], // Guia no início
    ...tabs,
    tabs[0]                // Combate no final
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth > 840) return;

    const target = e.target as HTMLElement;
    // Ignora swipes em inputs de range (sliders), na árvore de talentos/prestígio ou no carrossel de abas móvel
    if (
      target.closest('input[type="range"]') || 
      target.closest('.tree-container') || 
      target.closest('.tabs-container-mobile')
    ) {
      return;
    }

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    const thresholdX = 60; // pixels mínimos de deslocamento horizontal

    // O movimento precisa ser predominantemente horizontal e maior que o limiar
    if (Math.abs(diffX) > thresholdX && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX < 0) {
        // Swipe para a esquerda (próxima aba à direita)
        AudioManager.getInstance().playClick();
        setActiveTab((prev) => {
          const idx = tabs.findIndex((t) => t.id === prev);
          const nextIdx = (idx + 1) % tabs.length;
          return tabs[nextIdx].id;
        });
      } else {
        // Swipe para a direita (aba anterior à esquerda)
        AudioManager.getInstance().playClick();
        setActiveTab((prev) => {
          const idx = tabs.findIndex((t) => t.id === prev);
          const prevIdx = (idx - 1 + tabs.length) % tabs.length;
          return tabs[prevIdx].id;
        });
      }
    }
  };

  return (
    <div 
      className="game-ui-root" 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', pointerEvents: 'auto', minHeight: 0 }}
    >
      {/* Cabeçalho do Painel com Botão Sair */}
      <div className="panel header-panel" style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, background: '#fbbf24', borderRadius: '50%', boxShadow: '0 0 8px rgba(251,191,36,0.5)', animation: 'glow-pulse 2s infinite' }} />
          <div className="font-mono" style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(251,191,36,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(251,191,36,0.18)' }}>
            <span>🪙</span>
            <span>{formatNumber(character.gold || 0, abbreviateNumbers)} Ouro</span>
          </div>
          <div className="font-mono" style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(168,85,247,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(168,85,247,0.18)' }}>
            <span>🔑</span>
            <span>{towerKeyCount} Chaves</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
      <div className="tabs-container-desktop-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', pointerEvents: 'auto' }}>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            setDesktopStartIndex(prev => (prev === 0 ? tabs.length - 5 : prev - 1));
          }}
          className="tab-carousel-arrow-btn"
          style={{
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--gold-400)',
            borderRadius: 'var(--radius-md)',
            width: '2.2rem',
            height: '2.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-button)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            flexShrink: 0
          }}
        >
          ◀
        </button>

        <div className="tabs-container tabs-container-desktop" style={{ flex: 1, display: 'flex', gap: '2px', overflow: 'hidden' }}>
          {tabs.slice(desktopStartIndex, desktopStartIndex + 5).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                AudioManager.getInstance().playClick();
                setActiveTab(tab.id);
              }}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', whiteSpace: 'nowrap', flex: 1 }}
            >
              <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            setDesktopStartIndex(prev => (prev >= tabs.length - 5 ? 0 : prev + 1));
          }}
          className="tab-carousel-arrow-btn"
          style={{
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--gold-400)',
            borderRadius: 'var(--radius-md)',
            width: '2.2rem',
            height: '2.2rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-button)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            flexShrink: 0
          }}
        >
          ▶
        </button>
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
  
      {/* Wrapper relativo para prender os modais locais e impedir que eles rolem junto com a página */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Conteúdo Dinâmico com rolagem */}
        <div ref={scrollContainerRef} className="animate-tabFade ui-scrollable-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {activeTab === 'combat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <GameHUD />
              <ActiveSkillsPanel />
            </div>
          )}
          {activeTab === 'tower' && <TowerPanel />}
          {activeTab === 'attributes' && <AttributePanel />}
          {activeTab === 'skills' && <SkillsTreePanel />}
          {activeTab === 'equipment' && (
            <EquipmentPanel 
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              showDiscardConfirm={showDiscardConfirm}
              setShowDiscardConfirm={setShowDiscardConfirm}
            />
          )}
          {activeTab === 'prestige' && <PrestigeTreePanel onPrestige={handlePrestigeWithTransition} />}
          {activeTab === 'transcendence' && <TranscendencePanel onPrestige={handlePrestigeWithTransition} />}
          {activeTab === 'shop' && <ShopPanel />}
          {activeTab === 'bestiary' && (
            <BestiaryPanel 
              selectedEnemy={selectedEnemy}
              setSelectedEnemy={setSelectedEnemy}
            />
          )}
          {activeTab === 'guide' && <GuidePanel />}
          {activeTab === 'forge' && <ForgeView />}
          {activeTab === 'saves' && <SavesMenu isInGame={true} onBackToCombat={() => setActiveTab('combat')} />}
          {activeTab === 'options' && <OptionsPanel />}
        </div>

        {/* Modais de Equipamento e Bestiário agora posicionados de forma absoluta no wrapper relativo */}
        {activeTab === 'equipment' && selectedItem && (() => {
          const isAncestral = !!(selectedItem.setName && selectedItem.setName.startsWith('Set Ancestral'));
          const isPandemonium = !!(selectedItem.setName && selectedItem.setName.startsWith('Set Pandemoníaco'));
          const isPandemoniumMystic = isPandemonium && selectedItem.rarity === 'mystic';
          const isPandemoniumBase = isPandemonium && selectedItem.rarity !== 'mystic';

          let itemBorder = `2px solid ${getRarityColor(selectedItem.rarity)}`;
          let itemNameColor = getRarityColor(selectedItem.rarity);
          let itemShadow = 'none';
          if (isAncestral) {
            itemBorder = '2px dashed #a78bfa';
            itemNameColor = '#c084fc';
            itemShadow = '0 0 10px rgba(167, 139, 250, 0.8)';
          } else if (isPandemonium) {
            itemBorder = '2px dashed #10b981';
            itemShadow = '0 0 10px rgba(16, 185, 129, 0.8)';
            if (isPandemoniumBase) {
              itemNameColor = '#10b981';
            } else if (isPandemoniumMystic) {
              itemNameColor = '#8b5cf6'; // Violeta escuro
            }
          }

          return (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99,
              padding: '1rem'
            }} onClick={() => { setSelectedItem(null); setShowDiscardConfirm(false); }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 10, 25, 0.98), rgba(6, 4, 10, 0.99))',
                border: itemBorder,
                boxShadow: itemShadow,
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
                  <span className="font-mono" style={{ fontSize: '0.5rem', color: itemNameColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {selectedItem.rarity} • {slotLabels[selectedItem.slot]}
                  </span>
                  <h4 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0.1rem 0 0.5rem 0', color: itemNameColor }}>
                    {selectedItem.name}
                  </h4>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {selectedItem.slot === 'consumable' ? (
                    <>
                      <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Efeito do Consumível</span>
                      <div style={{ fontSize: '0.65rem', color: '#22d3ee', marginTop: '0.2rem', lineHeight: 1.4 }}>
                        {selectedItem.consumableType === 'boost_touch' && '🔥 Ativa instantaneamente o Frenesi de Toques Críticos automáticos por 1 minuto.'}
                        {selectedItem.consumableType === 'boost_touch_x3' && '⚡3 Ativa instantaneamente o Frenesi de Toques Críticos automáticos por 3 minutos.'}
                        {selectedItem.consumableType === 'chest_legendary' && '🎁 Contém de 1 a 3 equipamentos Lendários aleatórios adequados para a sua classe atual.'}
                        {selectedItem.consumableType === 'chest_ancestral' && '✨ Contém de 1 a 3 equipamentos Ancestrais aleatórios de extremo poder para a sua classe atual.'}
                        {selectedItem.consumableType === 'relic_chest' && '💜 Ao abrir, concede +3 Fragmentos de Alma Instável diretamente no seu Altar de Relíquias.'}
                        {selectedItem.consumableType === 'unstable_soul_fragment' && '🔮 Fragmento de Alma absorvido no Altar de Relíquias: +1 Fragmento.'}
                        {selectedItem.consumableType === 'tower_key' && '🔑 Chave de acesso para a Torre Infinita. Consumida ao iniciar uma tentativa de subida a partir do painel da Torre.'}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Atributos do Item</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                        {Object.entries(selectedItem.stats).map(([stat, val]) => (
                          <span key={stat} className="font-mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                            {formatStatValue(stat, val)} {statLabels[stat] || stat}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {selectedItem.setName && (() => {
                  const setAncestral = selectedItem.setName.startsWith('Set Ancestral');
                  const setPandemonium = selectedItem.setName.startsWith('Set Pandemoníaco');
                  const setCelestial = selectedItem.setName.startsWith('Set Celestial');
                  const setTextColor = setPandemonium ? '#10b981' : (setAncestral ? '#c084fc' : (setCelestial ? '#38bdf8' : 'var(--gold-400)'));
                  const setShadow = setPandemonium ? '0 0 4px rgba(16, 185, 129, 0.4)' : (setAncestral ? '0 0 4px rgba(192, 132, 252, 0.4)' : (setCelestial ? '0 0 4px rgba(56, 189, 248, 0.4)' : 'none'));
                  const prefix = setPandemonium ? '🔥 Conjunto Pandemoníaco: ' : (setAncestral ? '✨ Conjunto Ancestral: ' : (setCelestial ? '🌌 Conjunto Celestial: ' : 'Conjunto: '));
                  return (
                    <div style={{ 
                      fontSize: '0.6rem', 
                      color: setTextColor, 
                      fontWeight: 600,
                      textShadow: setShadow
                    }}>
                      {prefix} {selectedItem.setName}
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {selectedItem.slot === 'consumable' ? (
                    selectedItem.consumableType !== 'tower_key' && (
                      <button 
                        onClick={() => {
                          AudioManager.getInstance().playClick();
                          const res = useConsumable(selectedItem.id);
                          if (res.success) {
                            setSelectedItem(null);
                          } else {
                            alert(res.message);
                          }
                        }}
                        className="btn btn-sm btn-gold" 
                        style={{ width: '100%', background: 'linear-gradient(to right, #0891b2, #06b6d4)', borderColor: '#06b6d4', color: '#fff' }}
                      >
                        Usar Item
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={() => {
                        AudioManager.getInstance().playClick();
                        equipItem(selectedItem.id);
                        setSelectedItem(null);
                      }}
                      className="btn btn-sm btn-gold" 
                      style={{ width: '100%' }}
                    >
                      Equipar Item
                    </button>
                  )}

                  {selectedItem.slot === 'consumable' ? (
                    showDiscardConfirm ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.55rem', color: '#f87171', textAlign: 'center' }}>Confirmar destruição permanente?</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => {
                            AudioManager.getInstance().playClick();
                            discardItem(selectedItem.id);
                            setSelectedItem(null);
                            setShowDiscardConfirm(false);
                          }} className="btn btn-sm btn-danger" style={{ flex: 1 }}>Sim, Descartar</button>
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
                    )
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          AudioManager.getInstance().playCoin();
                          sellItem(selectedItem.id);
                          setSelectedItem(null);
                        }}
                        className="btn btn-sm" 
                        style={{ 
                          width: '100%', 
                          background: 'linear-gradient(to right, #fbbf24, #d97706)', 
                          borderColor: '#d97706', 
                          color: '#000',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>🪙 Vender por {formatNumber(calculateItemSellValue(selectedItem), abbreviateNumbers)} Ouro</span>
                      </button>

                      <button 
                        onClick={() => {
                          AudioManager.getInstance().playClick();
                          dismantleItem(selectedItem.id);
                          setSelectedItem(null);
                        }}
                        className="btn btn-sm" 
                        style={{ 
                          width: '100%', 
                          background: 'linear-gradient(to right, #a855f7, #7c3aed)', 
                          borderColor: '#7c3aed', 
                          color: '#fff',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>🛠️ Desmontar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'equipment' && selectedSlot && character.equipment[selectedSlot] && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99,
            padding: '1rem'
          }} onClick={() => setSelectedSlot(null)}>
            {(() => {
              const item = character.equipment[selectedSlot]!;
              const isAncestral = !!(item.setName && item.setName.startsWith('Set Ancestral'));
              const isPandemonium = !!(item.setName && item.setName.startsWith('Set Pandemoníaco'));
              const isCelestial = !!(item.setName && item.setName.startsWith('Set Celestial'));
              const isPandemoniumMystic = isPandemonium && item.rarity === 'mystic';
              const isPandemoniumBase = isPandemonium && item.rarity !== 'mystic';

              let itemBorder = `2px solid ${getRarityColor(item.rarity)}`;
              let itemNameColor = getRarityColor(item.rarity);
              let itemShadow = 'none';
              if (isAncestral) {
                itemBorder = '2px dashed #a78bfa';
                itemNameColor = '#c084fc';
                itemShadow = '0 0 10px rgba(167, 139, 250, 0.8)';
              } else if (isPandemonium) {
                itemBorder = '2px dashed #10b981';
                itemShadow = '0 0 10px rgba(16, 185, 129, 0.8)';
                if (isPandemoniumBase) {
                  itemNameColor = '#10b981';
                } else if (isPandemoniumMystic) {
                  itemNameColor = '#8b5cf6'; // Violeta escuro
                }
              } else if (isCelestial) {
                itemBorder = '2px dashed #38bdf8';
                itemNameColor = '#38bdf8';
                itemShadow = '0 0 10px rgba(56, 189, 248, 0.8)';
              }

              return (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(15, 10, 25, 0.98), rgba(6, 4, 10, 0.99))',
                  border: itemBorder,
                  boxShadow: itemShadow,
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
                    <span className="font-mono" style={{ fontSize: '0.5rem', color: itemNameColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      EQUIPADO • {slotLabels[selectedSlot]}
                    </span>
                    <h4 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0.1rem 0 0.5rem 0', color: itemNameColor }}>
                      {item.name}
                    </h4>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="font-heading" style={{ fontSize: '0.52rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Atributos do Item</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                      {Object.entries(item.stats).map(([stat, val]) => (
                        <span key={stat} className="font-mono" style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                          {formatStatValue(stat, val)} {statLabels[stat] || stat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {item.setName && (() => {
                    const setAncestral = item.setName.startsWith('Set Ancestral');
                    const setPandemonium = item.setName.startsWith('Set Pandemoníaco');
                    const setCelestial = item.setName.startsWith('Set Celestial');
                    const setTextColor = setPandemonium ? '#10b981' : (setAncestral ? '#c084fc' : (setCelestial ? '#38bdf8' : 'var(--gold-400)'));
                    const setShadow = setPandemonium ? '0 0 4px rgba(16, 185, 129, 0.4)' : (setAncestral ? '0 0 4px rgba(192, 132, 252, 0.4)' : (setCelestial ? '0 0 4px rgba(56, 189, 248, 0.4)' : 'none'));
                    const prefix = setPandemonium ? '🔥 Conjunto Pandemoníaco: ' : (setAncestral ? '✨ Conjunto Ancestral: ' : (setCelestial ? '🌌 Conjunto Celestial: ' : 'Conjunto: '));
                    return (
                      <div style={{ 
                        fontSize: '0.6rem', 
                        color: setTextColor, 
                        fontWeight: 600,
                        textShadow: setShadow
                      }}>
                        {prefix} {item.setName}
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        AudioManager.getInstance().playClick();
                        unequipItem(selectedSlot);
                        setSelectedSlot(null);
                      }}
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

        {activeTab === 'bestiary' && selectedEnemy && (
          (() => {
            const kills = (character.killCount || {})[selectedEnemy.id] || 0;
            const isBoss = selectedEnemy.id.startsWith('boss_');
            const reqKills = isBoss ? 50 : 100;
            const isPurgatory = ['purgatory_specter', 'lost_soul', 'crystal_shatterer', 'boss_crystal_guardian'].includes(selectedEnemy.id);
            const enemyBonus = isPurgatory ? 2 : 1;

            return (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(5, 3, 10, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  zIndex: 99,
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
                        Registros de Derrota: <strong className="font-mono text-white" style={{ fontSize: '0.62rem' }}>{kills} / {reqKills}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Lore/Descrição */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '0.65rem', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.6, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      "{LORE_DATABASE[selectedEnemy.id] || 'Nenhum registro antigo recuperado para esta besta.'}"
                    </p>
                  </div>

                  {/* Bônus do Inimigo no Bestiário */}
                  <div style={{ 
                    background: kills >= reqKills ? 'rgba(34, 197, 94, 0.06)' : 'rgba(255, 255, 255, 0.02)', 
                    padding: '0.6rem 0.8rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: kills >= reqKills ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: kills >= reqKills ? '#4ade80' : '#94a3b8', textTransform: 'uppercase' }}>
                      Bônus de Abate
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>
                        {kills >= reqKills ? `✓ Registro de ${reqKills} Abates Concluído` : 'Progresso de Dano:'}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.7rem', fontWeight: 'bold', color: kills >= reqKills ? '#4ade80' : '#a1a1aa' }}>
                        +{enemyBonus}% Dano
                      </span>
                    </div>
                    {kills < reqKills && (
                      <span style={{ fontSize: '0.5rem', color: '#71717a' }}>
                        Faltam {reqKills - kills} abates para ativar este bônus.
                      </span>
                    )}
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
          })()
        )}
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

      {/* Modal de Abertura da Lore: O Ciclo da Alma Partida */}
      {character.introLoreShown === false && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 2, 6, 0.97)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            overflowY: 'auto'
          }}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(12, 8, 20, 0.99), rgba(24, 18, 36, 1))',
              border: '2px solid rgba(167, 139, 250, 0.5)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem 1.5rem',
              width: '100%',
              maxWidth: '520px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              animation: 'fade-in 0.4s ease-out',
              position: 'relative'
            }}
          >
            {/* Elemento Visual Decorativo Superior */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-0.5rem' }}>
              <div 
                style={{ 
                  width: '50px', 
                  height: '50px', 
                  background: 'radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0) 70%)', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  boxShadow: '0 0 15px rgba(167, 139, 250, 0.2)'
                }}
              >
                <span style={{ fontSize: '1.5rem', color: '#c4b5fd', textShadow: '0 0 8px rgba(196, 181, 253, 0.6)' }}>✧</span>
              </div>
            </div>

            {/* Cabeçalho */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.25em', textTransform: 'uppercase' }}>O Ciclo da Alma Partida</span>
              <h2 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-400)', margin: 0, letterSpacing: '0.05em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                AMARO RPG IDLE
              </h2>
            </div>

            {/* Texto da Lore */}
            <div 
              ref={loreContainerRef}
              style={{ 
                background: 'rgba(0, 0, 0, 0.4)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid rgba(167, 139, 250, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                maxHeight: '320px',
                overflowY: 'auto',
                fontSize: '0.68rem',
                lineHeight: 1.6,
                color: '#cbd5e1',
                textAlign: 'justify'
              }}
              className="ui-scrollable-content"
            >
              {visibleParagraphs >= 1 && (
                <p style={{ margin: 0, fontStyle: 'italic', animation: 'fade-in 0.6s ease-out' }}>
                  "Antes que houvesse reinos, havia uma única Alma — vasta, inteira, sonhando o mundo em existência.
                </p>
              )}
              {visibleParagraphs >= 2 && (
                <p style={{ margin: 0, fontStyle: 'italic', fontWeight: 600, color: '#a78bfa', textAlign: 'center', animation: 'fade-in 0.6s ease-out' }}>
                  Ela se partiu.
                </p>
              )}
              {visibleParagraphs >= 3 && (
                <p style={{ margin: 0, fontStyle: 'italic', animation: 'fade-in 0.6s ease-out' }}>
                  Ninguém sabe se foi guerra, acidente ou escolha. O que se sabe é que seus cacos caíram sobre a terra como estrelas, e cada um deles despertou como um herói: um Guerreiro de fúria inquebrantável, um Mago de fogo arcano, um Arqueiro de mira impossível — seis ecos de uma única vontade, cada um convencido de ser o único."
                </p>
              )}
              {visibleParagraphs >= 4 && (
                <p style={{ margin: 0, fontStyle: 'italic', animation: 'fade-in 0.6s ease-out' }}>
                  "Os monstros que você enfrenta não nasceram deste mundo. São o vazio entre os cacos, tentando preencher o espaço onde a Alma deveria estar inteira — e a cada fase que você atravessa, o vazio fica mais denso, mais faminto, mais forte."
                </p>
              )}
              {visibleParagraphs >= 5 && (
                <p style={{ margin: 0, fontStyle: 'italic', animation: 'fade-in 0.6s ease-out' }}>
                  "Você vai morrer. Muitas vezes. Mas cada morte é só um fragmento retornando à fonte por um instante — e cada retorno o torna mais do que era.
                </p>
              )}
              {visibleParagraphs >= 6 && (
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--gold-400)', animation: 'fade-in 0.6s ease-out' }}>
                  Chamam isso de Ascensão. Você chama de a única forma de continuar."
                </p>
              )}
              {visibleParagraphs >= 7 && (
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.62rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem', animation: 'fade-in 0.6s ease-out' }}>
                  *E em algum lugar, no fundo de tudo, algo mais antigo que os cacos está esperando você cavar fundo demais. Chamam isso de Pandemônio.*
                </p>
              )}
            </div>

            {/* Botão de Ação */}
            <button 
              onClick={() => {
                AudioManager.getInstance().playClick();
                useGameStore.getState().markIntroLoreAsShown();
              }} 
              className={`btn font-heading ${visibleParagraphs >= 7 ? 'btn-gold animate-pulse' : 'btn-secondary'}`}
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: visibleParagraphs >= 7 ? 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)' : 'rgba(255,255,255,0.05)',
                border: visibleParagraphs >= 7 ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                boxShadow: visibleParagraphs >= 7 ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {visibleParagraphs >= 7 ? 'Aceitar o Destino' : 'Pular Introdução'}
            </button>
          </div>
        </div>
      )}

      <ProgressNotifications />
    </div>
  );
}
