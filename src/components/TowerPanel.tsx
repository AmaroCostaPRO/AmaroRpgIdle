import React, { useState, useEffect } from 'react';
import { useTowerStore } from '../store/useTowerStore';
import { useGameStore } from '../store/useGameStore';
import { AudioManager } from '../core/AudioManager';

export const TowerPanel: React.FC = () => {
  const {
    towerActive,
    currentFloor,
    weeklyHighestFloor,
    historicalHighestFloor,
    unlockedTitles,
    selectedTitle,
    weeklySeed,
    startTowerAttempt,
    exitTower,
    selectTitle,
    checkWeeklyReset,
  } = useTowerStore();

  const character = useGameStore((state) => state.character);
  const activeKeyType = useTowerStore((state) => state.activeKeyType);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const towerKeys = character.inventory.filter(item =>
    item.slot === 'consumable' && item.consumableType === 'tower_key'
  ).length;
  const evolvedTowerKeys = character.inventory.filter(item =>
    item.slot === 'consumable' && item.consumableType === 'tower_key_evolved'
  ).length;

  // Títulos disponíveis e seus andares de desbloqueio
  const titlesConfig = [
    { name: 'Iniciante da Torre', floorRequired: 5, description: 'Desbloqueado ao vencer o Andar 5' },
    { name: 'Desbravador da Torre', floorRequired: 10, description: 'Desbloqueado ao vencer o Andar 10' },
    { name: 'Conquistador das Alturas', floorRequired: 20, description: 'Desbloqueado ao vencer o Andar 20' },
    { name: 'Guardião da Torre', floorRequired: 30, description: 'Desbloqueado ao vencer o Andar 30' },
    { name: 'Mestre do Infinito', floorRequired: 50, description: 'Desbloqueado ao vencer o Andar 50' },
    { name: 'Lenda Eterna', floorRequired: 100, description: 'Desbloqueado ao vencer o Andar 100' },
  ];

  // Verifica reset semanal na inicialização do painel
  useEffect(() => {
    checkWeeklyReset();
    
    // Calcula tempo até o reset da semana (próximo domingo às 23:59:59)
    const updateCountdown = () => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
      nextSunday.setHours(23, 59, 59, 999);
      
      const diffMs = nextSunday.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeRemaining('Reset iminente');
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let timeStr = '';
      if (days > 0) timeStr += `${days}d `;
      timeStr += `${hours}h ${minutes}m`;
      setTimeRemaining(timeStr);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [checkWeeklyReset]);

  const handleStartAttempt = (keyType: 'normal' | 'evolved') => {
    AudioManager.getInstance().playClick();
    startTowerAttempt(keyType);
  };

  const handleExitAttempt = () => {
    AudioManager.getInstance().playClick();
    exitTower(true);
  };

  const handleSelectTitle = (title: string) => {
    AudioManager.getInstance().playClick();
    selectTitle(title);
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Cabeçalho do Painel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏰 Torre Infinita
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
            Suba andares gerados deterministicamente com base na semente semanal. A regeneração entre andares está desativada!
          </p>
        </div>
        
        {/* Info da Seed e Tempo Restante */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.62rem', color: '#94a3b8', gap: '2px' }}>
          <div>Semente Semanal: <span className="font-mono" style={{ color: '#c084fc', fontWeight: 'bold' }}>#{weeklySeed}</span></div>
          <div>Próximo Reset: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{timeRemaining}</span></div>
        </div>
      </div>

      {/* Estatísticas e Progresso */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
        
        {/* Card do Andar Atual se ativo */}
        {towerActive && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(59, 130, 246, 0.12))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem',
            textAlign: 'center',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.1)',
          }}>
            <div style={{ fontSize: '0.6rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Andar Ativo</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0' }}>{currentFloor}</div>
            <div style={{ fontSize: '0.55rem', color: '#94a3b8' }}>
              {activeKeyType === 'evolved' ? '🗝️ Chave Evoluída (3x Ouro/XP)' : 'Combate em Progresso'}
            </div>
          </div>
        )}

        {/* Recorde Semanal */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid var(--border-dim)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Máximo da Semana</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', margin: '0.2rem 0' }}>{weeklyHighestFloor}</div>
          <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Reset aos Domingos</div>
        </div>

        {/* Recorde Histórico */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid var(--border-dim)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recorde Histórico</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', margin: '0.2rem 0' }}>{historicalHighestFloor}</div>
          <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Melhor marca de sempre</div>
        </div>
      </div>

      {/* Box de Título Honorífico Ativo */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Título Honorífico Equipado</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedTitle ? '#c084fc' : '#64748b', marginTop: '0.15rem' }}>
            {selectedTitle ? `👑 ${selectedTitle}` : 'Nenhum Título Equipado'}
          </div>
        </div>
        {selectedTitle && (
          <button
            onClick={() => handleSelectTitle('')}
            className="btn btn-xs btn-ghost"
            style={{ fontSize: '0.6rem', color: '#ef4444' }}
          >
            Remover
          </button>
        )}
      </div>

      {/* Botão de Ação Principal e Alertas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.25rem 0' }}>
        {!towerActive ? (
          <>
            <button
              onClick={() => handleStartAttempt('normal')}
              disabled={towerKeys === 0}
              className={`btn ${towerKeys > 0 ? 'btn-gold' : 'btn-disabled'}`}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                fontWeight: 800,
                background: towerKeys > 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.05)',
                boxShadow: towerKeys > 0 ? '0 4px 15px rgba(245, 158, 11, 0.25)' : 'none',
                border: 'none',
                color: towerKeys > 0 ? '#fff' : '#64748b',
                cursor: towerKeys > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.15rem',
                lineHeight: 1.2
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>⚔️ INICIAR SUBIDA DA TORRE</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: towerKeys > 0 ? '#fef08a' : '#64748b', opacity: 0.85 }}>(Consome 1 🔑)</span>
            </button>

            <button
              onClick={() => handleStartAttempt('evolved')}
              disabled={evolvedTowerKeys === 0}
              className={`btn ${evolvedTowerKeys > 0 ? 'btn-gold' : 'btn-disabled'}`}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                fontWeight: 800,
                background: evolvedTowerKeys > 0 ? 'linear-gradient(135deg, #a855f7, #6d28d9)' : 'rgba(255,255,255,0.05)',
                boxShadow: evolvedTowerKeys > 0 ? '0 4px 15px rgba(168, 85, 247, 0.3)' : 'none',
                border: 'none',
                color: evolvedTowerKeys > 0 ? '#fff' : '#64748b',
                cursor: evolvedTowerKeys > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.15rem',
                lineHeight: 1.2
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>🗝️ SUBIDA COM CHAVE EVOLUÍDA (3x Ouro/XP)</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: evolvedTowerKeys > 0 ? '#e9d5ff' : '#64748b', opacity: 0.85 }}>(Consome 1 🗝️)</span>
            </button>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.4rem 0.6rem',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-dim)',
              fontSize: '0.65rem',
              flexWrap: 'wrap',
              gap: '0.4rem'
            }}>
              <span style={{ color: '#94a3b8' }}>Chaves Disponíveis:</span>
              <span style={{ display: 'flex', gap: '0.75rem' }}>
                <span className="font-mono" style={{ fontWeight: 700, color: towerKeys > 0 ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  🔑 {towerKeys}
                </span>
                <span className="font-mono" style={{ fontWeight: 700, color: evolvedTowerKeys > 0 ? '#c084fc' : '#f87171', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  🗝️ {evolvedTowerKeys}
                </span>
              </span>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.8rem',
              fontSize: '0.62rem',
              color: '#f87171',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              lineHeight: 1.4
            }}>
              <span>⚠️</span>
              <div>
                <strong>Aviso de Sobrevivência:</strong> A vida e mana do seu herói NÃO se recuperam automaticamente entre os andares. Cuide da sua mana e traga habilidades de cura para resistir!
              </div>
            </div>

            <div style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.8rem',
              fontSize: '0.62rem',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              lineHeight: 1.4
            }}>
              <span>🎁</span>
              <div>
                <strong>Prêmios da Torre:</strong> Cada andar vencido concede <strong>🔩 Fragmentos de Forja</strong> (escala com o andar). A cada 5 andares concluídos, você ganha adicionalmente <strong>✨ 1 Fragmento de Alma Instável</strong>! Subidas com a <strong>🗝️ Chave da Torre Evoluída</strong> (produzida pela Torre de Vigia Astral da Cidadela) concedem <strong>3x Ouro e XP</strong> durante toda a subida.
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={handleExitAttempt}
              className="btn btn-disabled"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                color: '#fff',
                opacity: 1,
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.25)',
              }}
            >
              🚪 CONCLUIR SUBIDA & SAIR
            </button>
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.8rem',
              fontSize: '0.62rem',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              lineHeight: 1.4
            }}>
              <span>ℹ️</span>
              <div>
                Você pode sair da torre a qualquer momento clicando no botão acima para salvar seu progresso e retornar para a jornada principal da campanha.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Galeria de Títulos e Prêmios */}
      <div>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.35rem', margin: '0 0 0.65rem 0' }}>
          🏷️ Títulos Honoríficos da Torre
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {titlesConfig.map((title) => {
            const isUnlocked = unlockedTitles.includes(title.name);
            const isEquipped = selectedTitle === title.name;
            const progressPct = Math.min(100, (historicalHighestFloor / title.floorRequired) * 100);

            return (
              <div
                key={title.name}
                style={{
                  background: isEquipped 
                    ? 'rgba(168, 85, 247, 0.08)' 
                    : isUnlocked 
                      ? 'rgba(30, 41, 59, 0.3)' 
                      : 'rgba(15, 23, 42, 0.5)',
                  border: isEquipped
                    ? '1px solid rgba(168, 85, 247, 0.4)'
                    : isUnlocked
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : '1px solid rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                  opacity: isUnlocked ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isUnlocked ? '#fff' : '#64748b' }}>
                      {isUnlocked ? '🔓' : '🔒'} {title.name}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '2px' }}>
                      {title.description}
                    </div>
                  </div>
                </div>

                {/* Progresso ou Botão Equipar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.2rem' }}>
                  {!isUnlocked ? (
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', color: '#64748b', marginBottom: '2px' }}>
                        <span>Progresso: {historicalHighestFloor}/{title.floorRequired}</span>
                        <span>{Math.floor(progressPct)}%</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', background: '#64748b', borderRadius: '2px' }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectTitle(title.name)}
                      disabled={isEquipped}
                      className={`btn btn-xs ${isEquipped ? 'btn-gold' : 'btn-ghost'}`}
                      style={{
                        width: '100%',
                        fontSize: '0.58rem',
                        padding: '0.2rem',
                        height: 'auto',
                        background: isEquipped ? 'rgba(168, 85, 247, 0.25)' : undefined,
                        borderColor: isEquipped ? '#c084fc' : undefined,
                        color: isEquipped ? '#fff' : '#c084fc',
                        cursor: isEquipped ? 'default' : 'pointer'
                      }}
                    >
                      {isEquipped ? '🏷️ Equipado' : 'Equipar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
