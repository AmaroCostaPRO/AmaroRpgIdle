import React, { useState } from 'react';
import { useGameStore, CLASS_CONFIGS, isClassUnlocked, getGlobalClassLevels } from '../store/useGameStore';
import { BaseStats } from '../core/types';
import { AudioManager } from '../core/AudioManager';

export const CharacterSelect: React.FC = () => {
  const setScreen = useGameStore((state) => state.setScreen);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const classLevels = useGameStore((state) => state.character.classLevels || {});
  
  const [selectedClass, setSelectedClass] = useState<string>('warrior');

  const classes = Object.entries(CLASS_CONFIGS);
  const activeIndex = classes.findIndex(([classId]) => classId === selectedClass);
  const extendedClasses = [
    classes[classes.length - 1], // Último no início
    ...classes,
    classes[0]                  // Primeiro no fim
  ];

  const prevClassId = classes[(activeIndex - 1 + classes.length) % classes.length][0];
  const nextClassId = classes[(activeIndex + 1) % classes.length][0];

  const handleStartGame = () => {
    AudioManager.getInstance().playClick();
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
    necromancer: '💀',
  };

  // Levels globais (histórico de todas as runs)
  const globalLevels = getGlobalClassLevels();

  return (
    <div className="panel animate-slideUp class-select-panel" style={{ minHeight: '550px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'visible', position: 'relative' }}>
      {/* Glow de fundo */}
      <div style={{ position: 'absolute', top: '-6rem', width: '20rem', height: '20rem', background: 'rgba(245, 158, 11, 0.04)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <h2 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '0.5rem' }}>
        Selecione Sua Classe
      </h2>
      <div className="ornament" style={{ marginBottom: '1.5rem' }} />

      {/* Conteúdo Principal de Seleção (Desktop lado a lado, Mobile empilhado) */}
      <div className="class-selection-layout">
        {/* Lado Esquerdo / Topo: Grid de Botões ou Carrossel Mobile */}
        <div className="class-selection-left">
          {/* Grid de Classes (Desktop) */}
          <div className="class-grid-desktop" style={{ width: '100%', marginBottom: 0 }}>
            {classes.map(([classId, config]) => {
              const unlocked = isClassUnlocked(classId, classLevels);
              const isSelected = selectedClass === classId;

              let requirementText = '';
              if (classId === 'paladin') requirementText = 'Req: Guerreiro Nvl 50';
              if (classId === 'cleric') requirementText = 'Req: Mago Nvl 50';
              if (classId === 'rogue') requirementText = 'Req: Arqueiro Nvl 50';
              if (classId === 'necromancer') requirementText = 'Req: Clérigo + Ladrão Nvl 50';

              // Para classes com 1 pré-requisito
              let parentClass = '';
              if (classId === 'paladin') parentClass = 'warrior';
              if (classId === 'cleric') parentClass = 'mage';
              if (classId === 'rogue') parentClass = 'ranger';
              const getEffectiveLevel = (id: string) => Math.max(classLevels[id] || 0, globalLevels[id] || 0);
              const currentParentLevel = parentClass ? getEffectiveLevel(parentClass) : 0;
              // Para Necromante (2 pré-requisitos)
              const clericLevel = classId === 'necromancer' ? getEffectiveLevel('cleric') : 0;
              const rogueLevel = classId === 'necromancer' ? getEffectiveLevel('rogue') : 0;

              return (
                <button
                  key={classId}
                  onClick={() => {
                    AudioManager.getInstance().playClick();
                    setSelectedClass(classId);
                  }}
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
                        {classId === 'necromancer' ? (
                          <>
                            <span className="font-mono" style={{ fontSize: '0.42rem', color: '#64748b' }}>Clérigo: {Math.min(clericLevel, 50)}/50 | Ladrão: {Math.min(rogueLevel, 50)}/50</span>
                          </>
                        ) : (
                          <span className="font-mono" style={{ fontSize: '0.45rem', color: '#64748b' }}>Progresso: {Math.min(currentParentLevel, 50)}/50</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Carrossel de Classes (Mobile) */}
          <div className="class-carousel-mobile">
            {/* Seta Esquerda */}
            <button 
              onClick={() => {
                AudioManager.getInstance().playClick();
                setSelectedClass(prevClassId);
              }}
              className="class-carousel-arrow left"
              aria-label="Classe anterior"
            >
              ‹
            </button>

            <div 
              className="class-carousel-inner"
              style={{
                transform: `translateX(calc(20% - ${(activeIndex + 1) * 60}%))`
              }}
            >
              {extendedClasses.map(([classId, config], idx) => {
                const unlocked = isClassUnlocked(classId, classLevels);
                const isSelected = selectedClass === classId;

                let requirementText = '';
                if (classId === 'paladin') requirementText = 'Req: Guerreiro Nvl 50';
                if (classId === 'cleric') requirementText = 'Req: Mago Nvl 50';
                if (classId === 'rogue') requirementText = 'Req: Arqueiro Nvl 50';
                if (classId === 'necromancer') requirementText = 'Req: Clérigo + Ladrão Nvl 50';

                let parentClass = '';
                if (classId === 'paladin') parentClass = 'warrior';
                if (classId === 'cleric') parentClass = 'mage';
                if (classId === 'rogue') parentClass = 'ranger';
                const getEffectiveLevelM = (id: string) => Math.max(classLevels[id] || 0, globalLevels[id] || 0);
                const currentParentLevel = parentClass ? getEffectiveLevelM(parentClass) : 0;
                const clericLevelM = classId === 'necromancer' ? getEffectiveLevelM('cleric') : 0;
                const rogueLevelM = classId === 'necromancer' ? getEffectiveLevelM('rogue') : 0;

                return (
                  <button
                    key={`${classId}-${idx}`}
                    onClick={() => {
                      AudioManager.getInstance().playClick();
                      setSelectedClass(classId);
                    }}
                    className={`class-carousel-card ${isSelected ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                    style={{
                      flex: '0 0 60%',
                      width: '60%'
                    }}
                  >
                    {!unlocked && (
                      <div style={{ position: 'absolute', top: '0.4rem', right: '0.4rem' }}>
                        <span className="badge badge-locked" style={{ fontSize: '0.58rem', padding: '0.15rem 0.4rem' }}>Bloq.</span>
                      </div>
                    )}
                    {unlocked && isSelected && (
                      <div style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', color: 'var(--gold-400)', fontSize: '0.6rem', animation: 'glow-pulse 2s infinite' }}>
                        ●
                      </div>
                    )}

                    {/* Ícone da classe */}
                    <span style={{ fontSize: '1.7rem', marginBottom: '0.3rem', filter: !unlocked ? 'grayscale(1)' : 'none' }}>
                      {classIcons[classId] || '⚔'}
                    </span>

                    <span className="font-heading" style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em', color: '#fff' }}>
                      {config.name}
                    </span>
                    
                    <div style={{ marginTop: '0.35rem' }}>
                      {unlocked ? (
                        <span style={{ fontSize: '0.65rem', color: 'var(--gold-400)', fontFamily: 'var(--font-mono)', fontWeight: 500, padding: '0.15rem 0.5rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 'var(--radius-pill)' }}>
                          {getPrimaryStatName(config.primaryStat)}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.62rem', color: '#f87171', fontWeight: 600 }}>{requirementText}</span>
                          {classId === 'necromancer' ? (
                            <span className="font-mono" style={{ fontSize: '0.52rem', color: '#64748b' }}>Clérigo: {Math.min(clericLevelM, 50)}/50 | Ladrão: {Math.min(rogueLevelM, 50)}/50</span>
                          ) : (
                            <span className="font-mono" style={{ fontSize: '0.58rem', color: '#64748b' }}>Progresso: {Math.min(currentParentLevel, 50)}/50</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Seta Direita */}
            <button 
              onClick={() => {
                AudioManager.getInstance().playClick();
                setSelectedClass(nextClassId);
              }}
              className="class-carousel-arrow right"
              aria-label="Próxima classe"
            >
              ›
            </button>
          </div>
        </div>

        {/* Lado Direito / Base: Detalhes da Classe Selecionada */}
        <div className="class-selection-right">
          {(() => {
            const config = CLASS_CONFIGS[selectedClass];
            const unlocked = isClassUnlocked(selectedClass, classLevels);
            if (!config) return null;

            return (
              <div className="animate-fadeIn class-details-box">
                {/* Bloco de descrição (em cima) */}
                <div className="panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{config.name}</h3>
                    <span className={`badge ${unlocked ? 'badge-unlocked' : 'badge-locked'}`}>
                      {unlocked ? 'Liberado' : 'Bloqueado'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '0.75rem' }}>{config.description}</p>
                  <div style={{ fontSize: '0.7rem' }}>
                    <span style={{ color: '#94a3b8' }}>Atributo Principal: </span>
                    <strong className="font-heading" style={{ color: 'var(--gold-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{getPrimaryStatName(config.primaryStat)}</strong>
                  </div>
                  {!unlocked && (() => {
                    const getEL = (id: string) => Math.max(classLevels[id] || 0, globalLevels[id] || 0);
                    const reqMap: Record<string, string> = {
                      paladin: 'Req: Guerreiro Nvl 50',
                      cleric: 'Req: Mago Nvl 50',
                      rogue: 'Req: Arqueiro Nvl 50',
                      necromancer: 'Req: Clérigo + Ladrão Nvl 50',
                    };
                    const reqText = reqMap[selectedClass] || '';
                    let progressText = '';
                    if (selectedClass === 'paladin') progressText = `Guerreiro: ${Math.min(getEL('warrior'), 50)}/50`;
                    if (selectedClass === 'cleric') progressText = `Mago: ${Math.min(getEL('mage'), 50)}/50`;
                    if (selectedClass === 'rogue') progressText = `Arqueiro: ${Math.min(getEL('ranger'), 50)}/50`;
                    if (selectedClass === 'necromancer') progressText = `Clérigo: ${Math.min(getEL('cleric'), 50)}/50 | Ladrão: ${Math.min(getEL('rogue'), 50)}/50`;
                    return (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 600, marginBottom: '0.2rem' }}>{reqText}</div>
                        <div className="font-mono" style={{ fontSize: '0.6rem', color: '#64748b' }}>{progressText}</div>
                      </div>
                    );
                  })()}
                </div>

                {/* Bloco de status (embaixo) */}
                <div className="panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 className="section-title" style={{ fontSize: '0.6rem', paddingBottom: '0.4rem', marginBottom: '0.4rem' }}>Status Iniciais</h4>
                  {[
                    { label: 'Força (Str)', value: config.baseStats.strength },
                    { label: 'Magia (Mag)', value: config.baseStats.magic },
                    { label: 'Destreza (Dex)', value: config.baseStats.dexterity },
                    { label: 'Constituição (Con)', value: config.baseStats.constitution },
                    { label: 'Sorte (Lck)', value: config.baseStats.luck },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <span style={{ color: '#94a3b8' }}>{label}</span>
                      <span className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Botões de Ação */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '100%', maxWidth: '22rem' }}>
        <button onClick={() => { AudioManager.getInstance().playClick(); setScreen('menu'); }} className="btn btn-ghost" style={{ flex: 1 }}>
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
