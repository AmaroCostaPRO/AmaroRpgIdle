import React, { useState, useEffect, useMemo } from 'react';
import { useTowerStore, NORMAL_TITLE_MILESTONES, CURSE_TITLE_MILESTONES, CURSE_STAT_LABELS, CURSE_BUFF_PCT, CURSE_DEBUFF_PCT, applyCursesToStats } from '../store/useTowerStore';
import { useGameStore } from '../store/useGameStore';
import { StatEngine } from '../core/StatEngine';
import { AudioManager } from '../core/AudioManager';
import { EquippedTitleBox } from './tower/EquippedTitleBox';

// Deriva a galeria de títulos diretamente dos pools da store (fonte única de verdade), evitando
// que a lista exibida aqui fique dessincronizada dos nomes realmente concedidos em `advanceTowerFloor`.
const buildTitlesConfig = (milestones: Record<number, string>, floorLabel: string) =>
  Object.entries(milestones)
    .map(([floor, name]) => ({ name, floorRequired: Number(floor), description: `Desbloqueado ao vencer o ${floorLabel} ${floor}` }))
    .sort((a, b) => a.floorRequired - b.floorRequired);

const NORMAL_TITLES_CONFIG = buildTitlesConfig(NORMAL_TITLE_MILESTONES, 'Andar');
const CURSE_TITLES_CONFIG = buildTitlesConfig(CURSE_TITLE_MILESTONES, 'Andar amaldiçoado');

export const TowerPanel: React.FC = () => {
  const {
    towerActive,
    currentFloor,
    weeklyHighestFloor,
    historicalHighestFloor,
    unlockedTitles,
    selectedTitle,
    curseWeeklyHighestFloor,
    curseHistoricalHighestFloor,
    curseUnlockedTitles,
    curseSelectedTitle,
    weeklySeed,
    startTowerAttempt,
    exitTower,
    selectTitle,
    checkWeeklyReset,
  } = useTowerStore();

  const character = useGameStore((state) => state.character);
  const activeKeyType = useTowerStore((state) => state.activeKeyType);
  const towerBranch = useTowerStore((state) => state.towerBranch);
  const activeCurses = useTowerStore((state) => state.activeCurses);
  const [selectedBranch, setSelectedBranch] = useState<'normal' | 'curse'>('normal');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // O tema/dados exibidos seguem o seletor de UI (`selectedBranch`), não o `towerBranch` do
  // store (que só é relevante durante uma subida ativa) — assim o jogador pode navegar pelos
  // recordes/títulos de qualquer ramificação mesmo fora de uma subida. Durante uma subida ativa,
  // sincroniza para a ramificação realmente em andamento, para o tema não "destoar" do combate.
  useEffect(() => {
    if (towerActive) setSelectedBranch(towerBranch);
  }, [towerActive, towerBranch]);

  const isCurseTheme = selectedBranch === 'curse';
  const theme = {
    accent: isCurseTheme ? '#f87171' : '#fbbf24',
    accentStrong: isCurseTheme ? '#dc2626' : '#f59e0b',
    border: isCurseTheme ? 'rgba(220, 38, 38, 0.25)' : 'var(--border-dim)',
    surfaceTint: isCurseTheme ? 'rgba(127, 29, 29, 0.10)' : 'var(--surface-2)',
    gradient: isCurseTheme ? 'linear-gradient(135deg, #7f1d1d, #dc2626)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
  };

  const displayWeeklyHighest = isCurseTheme ? curseWeeklyHighestFloor : weeklyHighestFloor;
  const displayHistoricalHighest = isCurseTheme ? curseHistoricalHighestFloor : historicalHighestFloor;
  const displayUnlockedTitles = isCurseTheme ? curseUnlockedTitles : unlockedTitles;
  const displaySelectedTitle = isCurseTheme ? curseSelectedTitle : selectedTitle;
  const titlesConfig = isCurseTheme ? CURSE_TITLES_CONFIG : NORMAL_TITLES_CONFIG;

  // Maldição do andar atual (a mais recente) e o valor REAL (pós-maldições) de cada atributo
  // afetado por alguma maldição acumulada — em vez de listar o histórico inteiro de andar em
  // andar, que fica ilegível depois de poucos andares.
  const latestCurse = activeCurses.length > 0 ? activeCurses[activeCurses.length - 1] : null;
  const affectedCurseStats = useMemo(() => {
    if (activeCurses.length === 0) return [];
    const baseStats = StatEngine.calculateFinalStats(character);
    const finalStats = applyCursesToStats(baseStats, activeCurses);
    const attrs = new Set<string>();
    activeCurses.forEach((curse) => {
      attrs.add(curse.buffStat);
      curse.debuffStats.forEach((stat) => attrs.add(stat));
    });
    return Array.from(attrs).map((attr) => ({
      label: CURSE_STAT_LABELS[attr] || attr,
      value: Math.round(finalStats[attr as keyof typeof finalStats] as number),
    }));
  }, [activeCurses, character]);

  const { towerKeys, evolvedTowerKeys } = useMemo(() => {
    let towerKeysCount = 0;
    let evolvedTowerKeysCount = 0;
    for (const item of character.inventory) {
      if (item.slot !== 'consumable') continue;
      if (item.consumableType === 'tower_key') towerKeysCount++;
      else if (item.consumableType === 'tower_key_evolved') evolvedTowerKeysCount++;
    }
    return { towerKeys: towerKeysCount, evolvedTowerKeys: evolvedTowerKeysCount };
  }, [character.inventory]);

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
    startTowerAttempt(keyType, selectedBranch);
  };

  const handleExitAttempt = () => {
    AudioManager.getInstance().playClick();
    exitTower(true);
  };

  const handleSelectTitle = (title: string) => {
    AudioManager.getInstance().playClick();
    selectTitle(title, selectedBranch);
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Cabeçalho do Painel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏰 Torre Infinita
        </h2>

        {/* Info da Seed e Tempo Restante */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.62rem', color: '#94a3b8', gap: '2px' }}>
          <div>Semente Semanal: <span className="font-mono" style={{ color: '#c084fc', fontWeight: 'bold' }}>#{weeklySeed}</span></div>
          <div>Próximo Reset: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{timeRemaining}</span></div>
        </div>
      </div>

      {/* Seletor de Ramificação — logo abaixo do cabeçalho, só faz sentido trocar fora de uma subida ativa */}
      {!towerActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            padding: '0.5rem',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${theme.border}`,
          }}>
            <button
              onClick={() => { AudioManager.getInstance().playClick(); setSelectedBranch('normal'); }}
              className={`btn btn-xs ${selectedBranch === 'normal' ? 'btn-gold' : 'btn-ghost'}`}
              style={{ flex: 1, fontSize: '0.62rem', padding: '0.4rem' }}
            >
              🏰 Torre Normal
            </button>
            <button
              onClick={() => { AudioManager.getInstance().playClick(); setSelectedBranch('curse'); }}
              className="btn btn-xs"
              style={{
                flex: 1,
                fontSize: '0.62rem',
                padding: '0.4rem',
                background: selectedBranch === 'curse' ? theme.gradient : undefined,
                border: selectedBranch === 'curse' ? 'none' : undefined,
                color: selectedBranch === 'curse' ? '#fff' : '#f87171',
              }}
            >
              🌀 Ramificação de Maldições
            </button>
          </div>
          <div style={{ fontSize: '0.6rem', color: theme.accent, lineHeight: 1.4, padding: '0 0.2rem' }}>
            {isCurseTheme
              ? '🌀 Cada andar acumula uma maldição: +20% em 1 atributo, -10% em 2 outros (temporário, só durante a subida). Em troca, +50% de Ouro e Fragmentos de Forja.'
              : 'Suba andares determinísticos baseados na semente semanal. A regeneração entre andares está desativada!'}
          </div>
        </div>
      )}

      {/* Estatísticas e Progresso */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>

        {/* Card do Andar Atual se ativo */}
        {towerActive && (
          <div style={{
            background: isCurseTheme
              ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.18), rgba(220, 38, 38, 0.12))'
              : 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(59, 130, 246, 0.12))',
            border: `1px solid ${isCurseTheme ? 'rgba(220, 38, 38, 0.35)' : 'rgba(168, 85, 247, 0.3)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem',
            textAlign: 'center',
            boxShadow: isCurseTheme ? '0 0 10px rgba(220, 38, 38, 0.15)' : '0 0 10px rgba(168, 85, 247, 0.1)',
          }}>
            <div style={{ fontSize: '0.6rem', color: isCurseTheme ? '#f87171' : '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Andar Ativo</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0' }}>{currentFloor}</div>
            <div style={{ fontSize: '0.55rem', color: '#94a3b8' }}>
              {activeKeyType === 'evolved' ? '🗝️ Chave Evoluída (3x Ouro/XP)' : 'Combate em Progresso'}
            </div>
            {towerBranch === 'curse' && (
              <div style={{ fontSize: '0.55rem', color: '#f87171', marginTop: '0.15rem' }}>🌀 Ramificação de Maldições (+50% Ouro/Fragmentos)</div>
            )}
          </div>
        )}

        {/* Recorde Semanal */}
        <div style={{
          background: theme.surfaceTint,
          border: `1px solid ${theme.border}`,
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Máximo da Semana</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.accent, margin: '0.2rem 0' }}>{displayWeeklyHighest}</div>
          <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Reset aos Domingos</div>
        </div>

        {/* Recorde Histórico */}
        <div style={{
          background: theme.surfaceTint,
          border: `1px solid ${theme.border}`,
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recorde Histórico</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.accentStrong, margin: '0.2rem 0' }}>{displayHistoricalHighest}</div>
          <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Melhor marca de sempre</div>
        </div>
      </div>

      {/* Box de Título Honorífico Ativo — compartilhado entre as duas ramificações */}
      <EquippedTitleBox
        selectedTitle={displaySelectedTitle}
        onRemove={() => handleSelectTitle('')}
        accentColor={theme.accent}
        borderColor={theme.border}
      />

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
                background: towerKeys > 0 && isCurseTheme ? theme.gradient : undefined,
                boxShadow: towerKeys > 0 ? (isCurseTheme ? '0 4px 15px rgba(220, 38, 38, 0.3)' : '0 4px 15px rgba(180, 83, 9, 0.25)') : 'none',
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
                background: evolvedTowerKeys > 0 ? (isCurseTheme ? theme.gradient : 'linear-gradient(135deg, #a855f7, #6d28d9)') : 'rgba(255,255,255,0.05)',
                boxShadow: evolvedTowerKeys > 0 ? (isCurseTheme ? '0 4px 15px rgba(220, 38, 38, 0.3)' : '0 4px 15px rgba(168, 85, 247, 0.3)') : 'none',
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
              <span style={{ fontSize: '0.85rem' }}>🗝️ SUBIDA COM CHAVE EVOLUÍDA (3x)</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: evolvedTowerKeys > 0 ? '#e9d5ff' : '#64748b', opacity: 0.85 }}>(Consome 1 🗝️)</span>
            </button>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.4rem 0.6rem',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${theme.border}`,
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
              background: isCurseTheme ? 'rgba(220, 38, 38, 0.08)' : 'rgba(168, 85, 247, 0.08)',
              border: `1px solid ${isCurseTheme ? 'rgba(220, 38, 38, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.8rem',
              fontSize: '0.62rem',
              color: isCurseTheme ? '#f87171' : '#c084fc',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              lineHeight: 1.4
            }}>
              <span>🎁</span>
              <div>
                <strong>Prêmios da Torre:</strong> Cada andar vencido concede <strong>🔩 Fragmentos de Forja</strong> (escala com o andar). A cada 5 andares concluídos, você ganha adicionalmente <strong>✨ 1 Fragmento de Alma Instável</strong>! Subidas com a <strong>🗝️ Chave da Torre Evoluída</strong> (produzida pela Torre de Vigia Astral da Cidadela) concedem <strong>3x Ouro, XP e Fragmentos de Forja</strong> durante toda a subida.
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
                background: theme.gradient,
                color: '#fff',
                opacity: 1,
                cursor: 'pointer',
                border: 'none',
                boxShadow: isCurseTheme ? '0 4px 15px rgba(220, 38, 38, 0.3)' : '0 4px 15px rgba(168, 85, 247, 0.25)',
              }}
            >
              🚪 CONCLUIR SUBIDA & SAIR
            </button>
            {towerBranch === 'curse' && latestCurse && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.8rem',
                fontSize: '0.62rem',
                color: '#f87171',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}>
                <div>
                  <strong>🌀 Maldição do Andar {latestCurse.floor}</strong> ({activeCurses.length} acumulada{activeCurses.length > 1 ? 's' : ''}):
                  <div style={{ marginTop: '2px' }}>
                    +{Math.round(CURSE_BUFF_PCT * 100)}% {CURSE_STAT_LABELS[latestCurse.buffStat] || latestCurse.buffStat} / -{Math.round(CURSE_DEBUFF_PCT * 100)}% {latestCurse.debuffStats.map((s) => CURSE_STAT_LABELS[s] || s).join(' e ')}
                  </div>
                </div>
                {affectedCurseStats.length > 0 && (
                  <div>
                    <strong>Atributos Afetados (valor atual):</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '2px' }}>
                      {affectedCurseStats.map((stat) => (
                        <span key={stat.label} className="font-mono" style={{ color: '#fca5a5' }}>{stat.label}: {stat.value}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.8rem',
              fontSize: '0.62rem',
              color: '#fbbf24',
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
        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.35rem', margin: '0 0 0.65rem 0' }}>
          🏷️ Títulos Honoríficos da Torre
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {titlesConfig.map((title) => {
            const isUnlocked = displayUnlockedTitles.includes(title.name);
            const isEquipped = displaySelectedTitle === title.name;
            const progressPct = Math.min(100, (displayHistoricalHighest / title.floorRequired) * 100);

            return (
              <div
                key={title.name}
                style={{
                  background: isEquipped
                    ? (isCurseTheme ? 'rgba(220, 38, 38, 0.12)' : 'rgba(168, 85, 247, 0.08)')
                    : isUnlocked
                      ? 'var(--surface-2)'
                      : 'var(--surface-1)',
                  border: isEquipped
                    ? `1px solid ${isCurseTheme ? 'rgba(220, 38, 38, 0.5)' : 'rgba(168, 85, 247, 0.4)'}`
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
                        <span>Progresso: {displayHistoricalHighest}/{title.floorRequired}</span>
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
                        background: isEquipped ? (isCurseTheme ? 'rgba(220, 38, 38, 0.3)' : 'rgba(168, 85, 247, 0.25)') : undefined,
                        borderColor: isEquipped ? theme.accent : undefined,
                        color: isEquipped ? '#fff' : theme.accent,
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
