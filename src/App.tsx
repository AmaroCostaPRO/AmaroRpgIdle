import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { CombatScene } from './phaser/scenes/CombatScene';
import GameUI from './components/GameUI';
import { MainMenu } from './components/MainMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { SavesMenu } from './components/SavesMenu';
import { useGameStore } from './store/useGameStore';
import { AudioManager } from './core/AudioManager';

const App: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const screen = useGameStore((state) => state.screen);
  const zoomLevel = useGameStore((state) => state.zoomLevel);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [welcomeCheckbox, setWelcomeCheckbox] = useState(false);

  useEffect(() => {
    const hideWelcome = localStorage.getItem('medieval_idle_hide_welcome') === 'true';
    if (!hideWelcome) {
      setShowWelcome(true);
    } else {
      setShowChangelog(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    AudioManager.getInstance().playClick();
    if (welcomeCheckbox) {
      localStorage.setItem('medieval_idle_hide_welcome', 'true');
    }
    setShowWelcome(false);
    setShowChangelog(true);
  };

  const handleCloseChangelog = () => {
    AudioManager.getInstance().playClick();
    setShowChangelog(false);
  };

  // Inicializa o gerenciador de áudio na montagem do App
  useEffect(() => {
    AudioManager.getInstance();
  }, []);

  // Controla o overflow e a altura do body para permitir scroll nativo nas telas de menu
  // e bloquear scroll na gameplay (playing) no mobile
  useEffect(() => {
    if (screen === 'playing') {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
  }, [screen]);

  useEffect(() => {
    if (screen === 'playing' && gameContainerRef.current && !phaserGameRef.current) {
      console.log("Initializing Phaser Game...");

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.CANVAS,
        parent: 'game-container',
        width: 800,
        height: 600,
        physics: {
          default: 'arcade',
          arcade: { debug: false },
        },
        scene: [CombatScene],
        backgroundColor: '#2c3e50',
      };

      try {
        phaserGameRef.current = new Phaser.Game(config);
        console.log("Phaser Game Instance successfully attached");
      } catch (error) {
        console.error("CRITICAL ERROR: Failed to initialize Phaser:", error);
      }
    }

    return () => {
      if (phaserGameRef.current) {
        console.log("Destroying Phaser Game...");
        try {
          phaserGameRef.current.destroy(true);
        } catch (e) {
          console.error("Error during Phaser game destruction:", e);
        }
        phaserGameRef.current = null;
      }
    };
  }, [screen]);

  return (
    <div className={`game-root screen-${screen} ${screen === 'playing' ? 'is-playing' : ''}`}>


      {/* Conteúdo escalado dinamicamente com base no zoom */}
      <div
        className={`game-wrapper ${screen === 'playing' ? 'is-playing' : ''}`}
        style={{
          '--zoom-level': zoomLevel,
        } as React.CSSProperties}
      >
        {screen === 'menu' && (
          <div style={{ width: '100%', maxWidth: '28rem' }} className="animate-fadeIn">
            <MainMenu />
          </div>
        )}

        {screen === 'character_select' && (
          <div style={{ width: '100%', maxWidth: '52rem' }} className="animate-fadeIn">
            <CharacterSelect />
          </div>
        )}

        {screen === 'saves' && (
          <div style={{ width: '100%', maxWidth: '52rem' }} className="animate-fadeIn">
            <SavesMenu />
          </div>
        )}

        {screen === 'playing' && (
          <div className="game-layout-container animate-fadeIn">
            {/* Phaser Game Container */}
            <div
              id="game-container"
              ref={gameContainerRef}
              className="phaser-container"
            />

            {/* UI Component Container */}
            <div className="ui-container">
              <GameUI />
            </div>
          </div>
        )}

      {/* Modal 1: Boas-vindas / Tutorial */}
      {showWelcome && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 8, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem',
          pointerEvents: 'all'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1d1f1f 0%, #161717 100%)',
            border: '2px solid var(--gold-400)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '450px',
            maxHeight: '85vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
          }}>
            <h3 className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🛡️ Bem-vindo ao Amaro RPG Idle!
            </h3>
            
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p>
                <strong>Amaro RPG Idle</strong> é um RPG incremental onde seu herói avança por estágios de combate automático, derrota inimigos e chefes e acumula riquezas e poder.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(0,0,0,0.15)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontWeight: 700, color: 'var(--gold-300)' }}>Como Jogar:</span>
                <span style={{ display: 'flex', gap: '0.3rem' }}>• ⚔️ <strong>Combate:</strong> Seu herói luta de forma automática. Você pode conjurar habilidades manualmente ou ligar o <i>Auto-Cast</i>.</span>
                <span style={{ display: 'flex', gap: '0.3rem' }}>• ◆ <strong>Atributos:</strong> Distribua pontos obtidos ao passar de nível para especializar seu herói.</span>
                <span style={{ display: 'flex', gap: '0.3rem' }}>• ★ <strong>Habilidades:</strong> Desbloqueie talentos ativos e passivos na árvore de habilidades da sua classe.</span>
                <span style={{ display: 'flex', gap: '0.3rem' }}>• 🎒 <strong>Equipamentos (Novo!):</strong> Colete itens raros ou lendários e monte o conjunto perfeito para sua classe!</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.68rem', color: '#94a3b8', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={welcomeCheckbox} 
                  onChange={(e) => setWelcomeCheckbox(e.target.checked)} 
                  style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--gold-500)' }} 
                />
                Não mostrar esta mensagem novamente
              </label>

              <button 
                onClick={handleCloseWelcome}
                className="btn btn-sm btn-gold" 
                style={{ width: '100%', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Começar Aventura!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Changelog / Notas de Atualização */}
      {showChangelog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 8, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem',
          pointerEvents: 'all'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1d1f1f 0%, #161717 100%)',
            border: '2px solid #3b82f6',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '450px',
            maxHeight: '85vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
          }}>
            <h3 className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ✨ Atualização v1.1.5 — Escala, Velocidade e Correções!
            </h3>
            
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p>
                A nova versão traz otimizações gráficas, aceleração da simulação de combate e correções estruturais críticas na persistência de dados:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a78bfa', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>🌟 Novidades da Versão 1.1.5:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        🛡️ Correção de Estado nos Saves
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A criação de novos heróis em slots limpos agora é 100% isolada, impedindo o vazamento de bônus de prestígio, upgrades e abates do personagem anterior.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        ⚡ Velocidade de Simulação
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adicionados atalhos rápidos de velocidade (1x, 2x, 3x) no topo da tela de batalha para acelerar o ritmo dos combates e progressões.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        🔍 Arena de Combate com Zoom 1.5x
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Personagens, monstros e efeitos visuais foram redimensionados para maior nitidez, com o cenário alinhado para evitar cortes na tela.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        🎨 Transparência Real no Bestiário
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Os monstros agora contam com remoção dinâmica via Canvas dos fundos sólidos, integrando-se elegantemente à temática escura do jogo.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        📊 Separação Visual de Atributos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A aba de Equipamentos agora detalha atributos exibindo o valor base puro (em branco), bônus de itens (em verde) e bônus de Ascensão (em roxo).
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        📱 Modais Locais e Transições Suaves
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Modais de itens e detalhes no bestiário agora se posicionam de forma absoluta local, acompanhados de transições de fade estáticas nas abas.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#60a5fa', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>🛡️ Versão 1.1.4:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#dbeafe', fontSize: '0.72rem' }}>
                        🔥 Efeitos de Combate e Atordoamento Inteligente
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#94a3b8', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Habilidades aplicam Veneno, Queimadura, Lentidão e Atordoamento, o qual posterga devidamente o carregamento de ataque dos inimigos.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#dbeafe', fontSize: '0.72rem' }}>
                        ✨ Bônus de Alma e Árvore Triplicada
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#94a3b8', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Upgrades permanentes de prestígio triplicados (+6 For, +9 Con por nível) e bônus passivo cumulativo por contagem de ascensão.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span style={{ fontWeight: 700, color: '#60a5fa', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>🛡️ Versão 1.1.2:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#dbeafe', fontSize: '0.72rem' }}>
                        🎒 Sistema de Equipamentos e Conjuntos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#94a3b8', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Equipamentos divididos em 5 categorias com bônus poderosos ao combinar conjuntos (2, 3 e 5 peças).
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button 
                onClick={handleCloseChangelog}
                className="btn btn-sm btn-gold" 
                style={{ width: '100%', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', border: '1px solid #60a5fa' }}
              >
                Entendido!
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default App;
