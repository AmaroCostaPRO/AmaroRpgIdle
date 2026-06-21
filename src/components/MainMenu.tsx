import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export const MainMenu: React.FC = () => {
  const setScreen = useGameStore((state) => state.setScreen);
  const loadSavedGame = useGameStore((state) => state.loadSavedGame);
  const resetAllData = useGameStore((state) => state.resetAllData);
  const zoomLevel = useGameStore((state) => state.zoomLevel);
  const setZoomLevel = useGameStore((state) => state.setZoomLevel);
  const [showOptions, setShowOptions] = useState(false);

  // Verifica se existe algum save válido no localStorage
  const hasSave = (() => {
    try {
      return !!localStorage.getItem('medieval_idle_save');
    } catch {
      return false;
    }
  })();

  const handleContinue = () => {
    if (hasSave) {
      loadSavedGame();
    }
  };

  if (showOptions) {
    return (
      <div className="panel animate-fadeIn" style={{ padding: '2.5rem', minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glows de fundo */}
        <div style={{ position: 'absolute', top: '-10rem', left: '-10rem', width: '24rem', height: '24rem', background: 'rgba(59, 130, 246, 0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10rem', right: '-10rem', width: '24rem', height: '24rem', background: 'rgba(139, 92, 246, 0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <h2 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '2rem' }}>
          Opções de Jogo
        </h2>

        <div style={{ width: '100%', maxWidth: '22rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.35)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
            <span className="font-heading" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>Configurações Gerais</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Efeitos de Som</span>
              <span className="badge badge-unlocked">Ativado</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Salvamento Automático</span>
              <span className="badge badge-unlocked">Ativado</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Zoom da Página</span>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-dim)' }}>
                {[1.0, 1.15, 1.3, 1.5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setZoomLevel(level)}
                    className={`zoom-btn ${zoomLevel === level ? 'active' : ''}`}
                    style={{ fontSize: '0.55rem', padding: '0.2rem 0.4rem', border: 'none', cursor: 'pointer' }}
                  >
                    {Math.round(level * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-dim)' }}>
            <h3 className="font-heading" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Zona de Perigo
            </h3>
            <p style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.6 }}>
              Esta ação apagará permanentemente todos os seus níveis, upgrades de prestígio e progresso. Não há como reverter.
            </p>
            <button
              onClick={() => {
                if (confirm('Tem certeza absoluta que deseja resetar TODOS os seus dados? Isso inclui pontos de Prestígio e upgrades permanentes.')) {
                  resetAllData();
                  setShowOptions(false);
                }
              }}
              className="btn btn-danger"
              style={{ width: '100%' }}
            >
              Resetar Todos os Dados
            </button>
          </div>
        </div>

        <button onClick={() => setShowOptions(false)} className="btn btn-ghost" style={{ marginTop: '2rem' }}>
          Voltar ao Menu
        </button>
      </div>
    );
  }

  return (
    <div className="panel animate-slideUp" style={{ padding: '3rem 2rem', minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Luzes de fundo mágicas */}
      <div style={{ position: 'absolute', top: '-8rem', width: '22rem', height: '22rem', background: 'rgba(245, 158, 11, 0.04)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-8rem', width: '22rem', height: '22rem', background: 'rgba(139, 92, 246, 0.04)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Partículas flutuantes decorativas */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 4, height: 4, background: 'var(--gold-400)', borderRadius: '50%', opacity: 0.3, animation: 'float 3s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '40%', right: '20%', width: 3, height: 3, background: 'var(--gold-300)', borderRadius: '50%', opacity: 0.25, animation: 'float 4s ease-in-out infinite 1s' }} />
      <div style={{ position: 'absolute', bottom: '30%', left: '25%', width: 3, height: 3, background: 'var(--prestige-from)', borderRadius: '50%', opacity: 0.2, animation: 'float 5s ease-in-out infinite 2s' }} />

      {/* Título Principal Estilo RPG */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', zIndex: 10 }}>
        <span className="game-subtitle">Idle Roguelite</span>
        <h1 className="game-title" style={{ marginTop: '0.5rem' }}>Amaro RPG Idle</h1>
        <div className="ornament" style={{ marginTop: '1.25rem' }} />
      </div>

      {/* Botões do Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '18rem', zIndex: 10 }}>
        <button
          onClick={handleContinue}
          disabled={!hasSave}
          className="btn btn-emerald"
          style={{ width: '100%', padding: '0.85rem', fontSize: '0.72rem' }}
        >
          {hasSave ? '⚔ Continuar Jornada' : 'Sem Jogo Salvo'}
        </button>

        <button
          onClick={() => setScreen('character_select')}
          className="btn btn-gold"
          style={{ width: '100%', padding: '0.85rem', fontSize: '0.72rem' }}
        >
          ✦ Novo Jogo
        </button>

        <button
          onClick={() => setShowOptions(true)}
          className="btn btn-ghost"
          style={{ width: '100%', padding: '0.85rem', fontSize: '0.72rem' }}
        >
          ⚙ Opções
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: '1rem', textAlign: 'center', fontSize: '0.6rem', color: '#475569', zIndex: 10, letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-mono)' }}>
        v1.0.0 • Amaro Costa
      </div>
    </div>
  );
};
