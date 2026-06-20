import React, { useState } from 'react';
import { useGameStore, CLASS_CONFIGS, isClassUnlocked } from '../store/useGameStore';
import { BaseStats } from '../core/types';

export const CharacterSelect: React.FC = () => {
  const setScreen = useGameStore((state) => state.setScreen);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const classLevels = useGameStore((state) => state.character.classLevels || {});
  
  const [selectedClass, setSelectedClass] = useState<string>('warrior');

  const handleStartGame = () => {
    if (isClassUnlocked(selectedClass, classLevels)) {
      startNewGame(selectedClass);
    }
  };

  const getPrimaryStatName = (stat: keyof BaseStats): string => {
    switch (stat) {
      case 'strength': return 'Força';
      case 'magic': return 'Magia';
      case 'dexterity': return 'Destreza';
      case 'constitution': return 'Constituição';
      default: return stat;
    }
  };

  // Ícones temáticos para cada classe
  const classIcons: Record<string, string> = {
    warrior: '⚔',
    mage: '🔮',
    ranger: '🏹',
    paladin: '🛡',
    cleric: '✝',
    rogue: '🗡',
  };

  return (
    <div className="panel animate-slideUp" style={{ padding: '2rem', minHeight: '550px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'auto', position: 'relative' }}>
      {/* Glow de fundo */}
      <div style={{ position: 'absolute', top: '-6rem', width: '20rem', height: '20rem', background: 'rgba(245, 158, 11, 0.04)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '0.5rem' }}>
        Selecione Sua Classe
      </h2>
      <div className="ornament" style={{ marginBottom: '1.5rem' }} />

      {/* Grid de Classes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', width: '100%', maxWidth: '42rem', marginBottom: '1.5rem' }}>
        {Object.entries(CLASS_CONFIGS).map(([classId, config]) => {
          const unlocked = isClassUnlocked(classId, classLevels);
          const isSelected = selectedClass === classId;

          let requirementText = '';
          if (classId === 'paladin') requirementText = 'Req: Guerreiro Nvl 10';
          if (classId === 'cleric') requirementText = 'Req: Mago Nvl 10';
          if (classId === 'rogue') requirementText = 'Req: Arqueiro Nvl 10';

          let parentClass = '';
          if (classId === 'paladin') parentClass = 'warrior';
          if (classId === 'cleric') parentClass = 'mage';
          if (classId === 'rogue') parentClass = 'ranger';
          const currentParentLevel = parentClass ? (classLevels[parentClass] || 1) : 0;

          return (
            <button
              key={classId}
              onClick={() => setSelectedClass(classId)}
              className={`class-card ${isSelected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
            >
              {!unlocked && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                  <span className="badge badge-locked">Bloq.</span>
                </div>
              )}
              {unlocked && isSelected && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--gold-400)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', animation: 'glow-pulse 2s infinite' }}>
                  ●
                </div>
              )}

              {/* Ícone da classe */}
              <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem', filter: !unlocked ? 'grayscale(1)' : 'none' }}>
                {classIcons[classId] || '⚔'}
              </span>

              <span className="font-heading" style={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em', color: '#fff' }}>
                {config.name}
              </span>
              
              <div style={{ marginTop: '0.35rem' }}>
                {unlocked ? (
                  <span style={{ fontSize: '0.55rem', color: 'var(--gold-400)', fontFamily: 'var(--font-mono)', fontWeight: 500, padding: '0.15rem 0.5rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 'var(--radius-pill)' }}>
                    {getPrimaryStatName(config.primaryStat)}
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.5rem', color: '#f87171', fontWeight: 600 }}>{requirementText}</span>
                    <span className="font-mono" style={{ fontSize: '0.45rem', color: '#64748b' }}>Progresso: {currentParentLevel}/10</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalhes da Classe Selecionada */}
      {(() => {
        const config = CLASS_CONFIGS[selectedClass];
        const unlocked = isClassUnlocked(selectedClass, classLevels);
        if (!config) return null;

        return (
          <div className="animate-fadeIn" style={{ width: '100%', maxWidth: '42rem', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h3 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{config.name}</h3>
                <span className={`badge ${unlocked ? 'badge-unlocked' : 'badge-locked'}`}>
                  {unlocked ? 'Liberado' : 'Bloqueado'}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1rem' }}>{config.description}</p>
              <div style={{ fontSize: '0.72rem' }}>
                <span style={{ color: '#94a3b8' }}>Atributo Principal: </span>
                <strong className="font-heading" style={{ color: 'var(--gold-400)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{getPrimaryStatName(config.primaryStat)}</strong>
              </div>
            </div>

            {/* Atributos Iniciais */}
            <div style={{ width: '14rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 className="section-title" style={{ fontSize: '0.6rem' }}>Status Iniciais</h4>
              {[
                { label: 'Força (Str)', value: config.baseStats.strength },
                { label: 'Magia (Mag)', value: config.baseStats.magic },
                { label: 'Destreza (Dex)', value: config.baseStats.dexterity },
                { label: 'Constituição (Con)', value: config.baseStats.constitution },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: '#94a3b8' }}>{label}</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Botões de Ação */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '100%', maxWidth: '22rem' }}>
        <button onClick={() => setScreen('menu')} className="btn btn-ghost" style={{ flex: 1 }}>
          Voltar
        </button>
        <button
          onClick={handleStartGame}
          disabled={!isClassUnlocked(selectedClass, classLevels)}
          className="btn btn-gold"
          style={{ flex: 1 }}
        >
          Iniciar Jornada
        </button>
      </div>
    </div>
  );
};
