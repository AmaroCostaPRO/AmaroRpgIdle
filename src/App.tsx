import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { CombatScene } from './phaser/scenes/CombatScene';
import GameUI from './components/GameUI';
import { MainMenu } from './components/MainMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { SavesMenu } from './components/SavesMenu';
import { useGameStore } from './store/useGameStore';
import { AudioManager } from './core/AudioManager';
import { bridge } from './bridge/GameBridge';
import { GameEvent } from './core/types';

const App: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const screen = useGameStore((state) => state.screen);
  const zoomLevel = useGameStore((state) => state.zoomLevel);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [welcomeCheckbox, setWelcomeCheckbox] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);

  // Reseta o estado do carregador quando o jogador sai da tela de batalha
  useEffect(() => {
    if (screen !== 'playing') {
      setIsGameReady(false);
    }
  }, [screen]);

  // Escuta o evento que sinaliza que o Phaser renderizou a cena
  useEffect(() => {
    const unsubscribeReady = bridge.subscribe(GameEvent.ARENA_READY, () => {
      console.log("[App] Combat Arena is ready! Hiding loading screen.");
      setIsGameReady(true);
    });
    return () => {
      unsubscribeReady();
    };
  }, []);

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
        type: Phaser.AUTO,
        parent: 'game-container',
        width: 800,
        height: 600,
        physics: {
          default: 'arcade',
          arcade: { debug: false },
        },
        scene: [CombatScene],
        backgroundColor: '#2c3e50',
        roundPixels: true,
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
              className={`phaser-container relative overflow-hidden bg-[#161717] ${isGameReady ? 'ready' : 'not-ready'}`}
            >
              {/* Tela de Carregamento da Batalha (Visível até o Canvas do Phaser renderizar) */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center bg-[#161717] z-20 text-center p-6 phaser-loader ${isGameReady ? 'fade-out' : ''}`}>
                {/* Imagem de Fundo de Carregamento */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                  style={{ backgroundImage: 'url("/assets/battle_loading_bg.png")' }}
                />
                
                {/* Conteúdo do Carregador */}
                <div className="relative z-30 flex flex-col items-center gap-4">
                  {/* Spinner de Carregamento Estilizado */}
                  <div className="w-12 h-12 border-4 border-t-purple-500 border-r-purple-500/20 border-b-purple-500/20 border-l-purple-500/20 rounded-full animate-spin shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                  
                  {/* Textos Informativos */}
                  <div className="space-y-1">
                    <h3 className="font-heading text-xs font-bold text-purple-400 tracking-widest uppercase animate-pulse">Carregando Arena de Batalha...</h3>
                    <p className="text-[10px] text-gray-400 max-w-[240px] leading-relaxed">
                      Sincronizando sprites e heróis. Prepare suas espadas e feitiços!
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
              🛡️ Guia Rápido & Tutorial Inicial
            </h3>
            
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p>
                Bem-vindo ao <strong>Amaro RPG Idle</strong>! Prepare-se para enfrentar hordas de monstros e ascender sua alma. Siga este guia rápido para iniciar sua jornada de poder:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚔️</span>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.72rem' }}>Combate Automático e Toques Ativos</strong>
                    <p style={{ color: '#94a3b8', fontSize: '0.68rem', margin: '0.1rem 0 0 0', lineHeight: 1.35 }}>
                      Seu herói ataca automaticamente. Mas você pode ajudar clicando ou tocando ativamente na tela de combate para desferir danos de clique adicionais e ativar combos de Frenesi!
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>◆</span>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.72rem' }}>Evolução e Atributos</strong>
                    <p style={{ color: '#94a3b8', fontSize: '0.68rem', margin: '0.1rem 0 0 0', lineHeight: 1.35 }}>
                      Suba de nível para ganhar pontos e distribuí-los. O Atributo Principal da sua classe ativa escala seu dano básico. Atributos secundários concedem vida, mana e esquiva de forma aprimorada.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚙️</span>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.72rem' }}>Habilidades e Auto-Cast</strong>
                    <p style={{ color: '#94a3b8', fontSize: '0.68rem', margin: '0.1rem 0 0 0', lineHeight: 1.35 }}>
                      Compre novas habilidades ativas e passivas. Ative o <i>Auto-Cast</i> para conjuração automática e clique na engrenagem ao lado para definir o limite de vida para a Cura e selecionar quais habilidades usar.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🎒</span>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.72rem' }}>Equipamentos e a Grande Forja</strong>
                    <p style={{ color: '#94a3b8', fontSize: '0.68rem', margin: '0.1rem 0 0 0', lineHeight: 1.35 }}>
                      Derrote monstros para coletar itens e formar bônus de conjunto. Na Forja, você pode fundir peças idênticas de um mesmo conjunto pagando taxas em ouro para criar e evoluir itens de raridade <strong>Mística</strong>.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>👑</span>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.72rem' }}>Ascensão da Alma (Roguelite)</strong>
                    <p style={{ color: '#94a3b8', fontSize: '0.68rem', margin: '0.1rem 0 0 0', lineHeight: 1.35 }}>
                      Quando o avanço ficar difícil, Ascenda sua Alma. Você resetará o progresso temporário, mas ganhará bônus permanentes acumulados e Pontos de Prestígio (PP) para evoluir sua árvore de talentos de Alma.
                    </p>
                  </div>
                </div>

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
            border: '2px solid #a855f7',
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
            <h3 className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c084fc', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔥 Atualização v2.4.4 — Configurações de Auto-Cast e Balanceamento de Atributos!
            </h3>
            
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p>
                Esta atualização introduz o controle de IA de Auto-Cast customizável por habilidade, slider dinâmico de HP de Cura, correção de layout nos Atributos, balanceamento refinado de atributos e preservação de sets na Forja:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>

                {/* v2.4.4 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#c084fc', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 2.4.4 (Atual):</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        ⚙️ IA de Auto-Cast Customizável e Slider de Cura
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adicionado modal integrado de configurações ao lado do botão de Auto-Cast (ícone de engrenagem). Agora você pode selecionar individualmente quais habilidades ativas serão conjuradas de forma automática e ajustar um slider para definir o limite de HP (entre 10% e 90%) para o uso da Cura.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#cbd5e1', fontSize: '0.72rem' }}>
                        ⚖️ Balanceamento e Ajuste de Atributos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Ajustado o balanceamento dos atributos: Toque agora requer 2 pontos para conceder 1 de Dano Base; Destreza passa a adicionar +0.1% de chance de esquiva defensiva por ponto (limite de 75%); Força concede bônus secundário de +0.25 de Dano Geral por ponto para as classes não físicas; e o atributo <strong>Sorte (Luck)</strong> agora concede +0.05% de Chance de Crítico de Toque e +0.2% de Dano Crítico de Toque por ponto.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#cbd5e1', fontSize: '0.72rem' }}>
                        🎨 Melhorias Visuais nos Atributos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Removidos conflitos de estilos na aba de Atributos, restaurando as margens internas e bordas das linhas de estatísticas para evitar que botões fiquem colados nas laterais das caixas.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v2.4.1 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#c084fc', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 2.4.1:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        ⚒️ Preservação e Validação de Sets na Forja
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A Forja agora valida estritamente a compatibilidade de conjuntos de itens (sets), impedindo a fusão de peças de conjuntos diferentes. Além disso, o nome dos itens místicos resultantes agora incorpora dinamicamente a identidade do set de origem (ex: <i>Luva Mística do Senhor da Guerra +1</i>).
                      </div>
                    </div>
                  </div>
                </div>

                {/* v2.4.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#c084fc', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 2.4.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        ⚖️ Escalonamento de Atributos por Classe
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A progressão de atributos agora é dinâmica e dependente da classe do personagem. Atributos não-primários oferecem bônus de utilidade amplificados (como mana extra para guerreiros via Magia), resolvendo a escassez de recursos sem comprometer a identidade das classes de nicho.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#eab308', fontSize: '0.72rem' }}>
                        📊 Transparência Visual e Tooltips Dinâmicos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adicionados tooltips explicativos na tela de Atributos e fórmulas detalhadas no painel de Guia, garantindo que você compreenda exatamente o impacto de cada ponto investido no seu herói.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v2.3.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#c084fc', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 2.3.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        👑 Sets Ancestrais (Pós-Ascensão)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Desbloqueie equipamentos ancestrais com multiplicador de 4.5x nos atributos iniciais. Exclusivo para personagens com pelo menos 1 Ascensão. Cada classe possui seu próprio conjunto de prestígio com bônus acumulativos massivos.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#eab308', fontSize: '0.72rem' }}>
                        ⚒️ Ajuste de Custos da Forja
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A primeira fusão (de itens normais para criar um Místico +1) agora custa 500 Ouro. A segunda fusão (de dois Místicos +1 para um Místico +2) agora custa 1.000 Ouro.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem' }}>
                        📱 Melhorias de Navegação & Ocultação
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adicionada a funcionalidade de fechar o Console de Combate tanto no celular quanto no computador. Removidos scrolls duplos indesejados nas abas Habilidades e Ascensão no modo mobile. Agora o painel de Atributos Totais pode ser recolhido de forma persistente!
                      </div>
                    </div>
                  </div>
                </div>

                {/* v2.2.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a78bfa', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>👆 Novidades da Versão 2.2.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        ⚔️ Combate Híbrido (Tap Combat)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Dê toques/cliques na tela de combate para desferir dano imediato. O dano escala de forma híbrida: dano base do toque + porcentagem do seu DPS passivo.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        ⚡ Frenesi & Limitador de Cliques
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Acumule combos rápidos para entrar no modo Frenesi e aumentar drasticamente seu dano por clique. Cliques limitados a 20/s para manter o desempenho.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        ✨ Upgrades Permanentes de Toque
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Aproveite 4 novos upgrades na árvore de Ascensão: Toque Divino, Chance de Crítico, Dano Crítico e o Robô Assistente que clica automaticamente.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.72rem' }}>
                        🎨 Árvore de Ascensão no Desktop
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Design aprimorado e limpo no painel desktop, posicionando os botões de toque no rodapé com ótimo espaçamento e sem fios conectores poluindo o visual.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v2.1.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#fb923c', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>🔥 Novidades da Versão 2.1.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fb923c', fontSize: '0.72rem' }}>
                        🌋 Dificuldade Inferno (Fases 11–15)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Novo tier com tint laranja flamejante. Inimigos com <strong>5× o HP e Dano</strong> das fases normais (+400%). Usando os mesmos 5 mapas e criaturas em ciclo.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        💀 Dificuldade Apocalipse (Fases 16–20)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O tier supremo com tint roxo sinistro. Criaturas com <strong>10× o HP e Dano</strong> das fases normais (+900%). Apenas para os heróis mais Ascendidos.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🎨 Identidade Visual por Tier
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Cada dificuldade possui cor exclusiva no HUD: <span style={{ color: '#f59e0b' }}>Fase</span> → <span style={{ color: '#f43f5e' }}>Pesadelo</span> → <span style={{ color: '#fb923c' }}>Inferno</span> → <span style={{ color: '#c084fc' }}>Apocalipse</span>. Inimigos e cenários ganham tints únicos por tier.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v2.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#c084fc', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 2.0.0 — A Forja Mística:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.72rem' }}>
                        🪙 Economia de Ouro (Gold)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Moedas de ouro agora são derrubadas ao derrotar inimigos e chefes. O ouro acumulado é exibido no topo da tela do seu herói.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#d8b4fe', fontSize: '0.72rem' }}>
                        🌋 Altar da Forja Mística
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Funda dois equipamentos do mesmo tipo em um item de raridade Mística (Lilás). Atributos repetidos são somados e novos atributos são combinados.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        ✨ Itens Místicos com Níveis (+1, +2, ...)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A cada nova fusão, o item ganha um nível místico incremental, permitindo criar equipamentos lendários com status infinitos.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        ⏳ Carregamento de Arena
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova tela de carregamento animada com plano de fundo em pixel art e indicador de progresso para a arena de batalha Phaser.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a78bfa', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>🌟 Versão 1.1.5:</span>
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
                style={{ width: '100%', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', border: '1px solid #c084fc' }}
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
