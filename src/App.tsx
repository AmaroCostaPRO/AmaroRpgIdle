import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { CombatScene } from './phaser/scenes/CombatScene';
import GameUI from './components/GameUI';
import { CombatDropToasts } from './components/CombatDropToasts';
import { MainMenu } from './components/MainMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { SavesMenu } from './components/SavesMenu';
import { useGameStore } from './store/useGameStore';
import { AudioManager } from './core/AudioManager';
import { bridge } from './bridge/GameBridge';
import { GameEvent } from './core/types';
import { CitadelSpriteStage } from './components/citadel/CitadelSpriteStage';
import { BUILDING_SPRITE_SRC } from './components/citadel/citadelBuildingSprites';
import { getTransparentImageUrl } from './core/imageBackgroundStrip';
import { WelcomeGuideModal } from './components/WelcomeGuideModal';
import { useWakeLock } from './hooks/useWakeLock';

const App: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const screen = useGameStore((state) => state.screen);
  const zoomLevel = useGameStore((state) => state.zoomLevel);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showOlderChangelog, setShowOlderChangelog] = useState(false);
  const [isGuideManuallyReopened, setIsGuideManuallyReopened] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [activeTab, setActiveTab] = useState('combat');
  const [citadelEntered, setCitadelEntered] = useState(false);

  useWakeLock(screen === 'playing');

  // Escuta a troca de aba da UI para saber quando sobrepor a tela de combate
  // com a visualização da Cidadela — só sobrepõe depois que o jogador confirma
  // a entrada no portão (citadelEntered), não apenas ao tocar na aba.
  useEffect(() => {
    const unsubscribeTab = bridge.subscribe(GameEvent.TAB_CHANGED, (payload: any) => {
      setActiveTab(payload?.tab ?? 'combat');
      setCitadelEntered(!!payload?.citadelEntered);
    });
    return () => {
      unsubscribeTab();
    };
  }, []);

  // Reseta o estado do carregador quando o jogador sai da tela de batalha
  useEffect(() => {
    if (screen !== 'playing') {
      setIsGameReady(false);
    }
  }, [screen]);

  // Escuta o evento que sinaliza que o Phaser renderizou a cena
  useEffect(() => {
    const unsubscribeReady = bridge.subscribe(GameEvent.ARENA_READY, () => {
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

  // Permite reabrir o Guia Rápido a qualquer momento pela aba Opções, mesmo
  // que o jogador já tenha marcado "não mostrar novamente" no primeiro acesso.
  useEffect(() => {
    const unsubscribeGuide = bridge.subscribe(GameEvent.SHOW_WELCOME_GUIDE, () => {
      setShowChangelog(false);
      setIsGuideManuallyReopened(true);
      setShowWelcome(true);
    });
    return () => {
      unsubscribeGuide();
    };
  }, []);

  const handleCloseWelcome = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('medieval_idle_hide_welcome', 'true');
    }
    setShowWelcome(false);
    // Se o guia foi reaberto manualmente pela aba Opções (não no primeiro acesso),
    // não reexibe o changelog de novidades ao fechar.
    if (isGuideManuallyReopened) {
      setIsGuideManuallyReopened(false);
      return;
    }
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

  // Pré-processa (remove fundo via canvas) os sprites das construções da Cidadela assim
  // que o App monta, bem antes do jogador entrar na aba pela primeira vez — sem isso, o
  // primeiro acesso à Cidadela mostrava rapidamente os ícones de emoji de fallback antes
  // da arte real (processamento assíncrono) ficar pronta.
  useEffect(() => {
    Object.values(BUILDING_SPRITE_SRC).forEach((src) => {
      getTransparentImageUrl(src).catch(() => {});
    });
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
    const destroyPhaserGame = () => {
      if (phaserGameRef.current) {
        try {
          phaserGameRef.current.destroy(true);
        } catch (e) {
          console.error("Error during Phaser game destruction:", e);
        }
        phaserGameRef.current = null;
      }
    };

    const initPhaserGame = () => {
      if (!gameContainerRef.current || phaserGameRef.current) return;

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
        // Sinal definitivo de que o contexto WebGL foi perdido (ex.: tela do
        // celular apagou/bloqueou e o SO reclamou a GPU). O Phaser não
        // recria texturas/render state sozinho nesse caso, então o canvas
        // fica preto até recarregarmos a cena do zero.
        phaserGameRef.current.events.once(Phaser.Core.Events.CONTEXT_LOST, () => {
          console.warn("[App] WebGL context lost — recreating Phaser Game to recover.");
          setIsGameReady(false);
          destroyPhaserGame();
          initPhaserGame();
        });
      } catch (error) {
        console.error("CRITICAL ERROR: Failed to initialize Phaser:", error);
      }
    };

    if (screen === 'playing') {
      initPhaserGame();
    }

    // Em mobile, apagar/bloquear a tela por tempo suficiente costuma matar o
    // contexto WebGL sem sempre disparar CONTEXT_LOST de forma confiável em
    // todos os navegadores. Como fallback, se a aba ficou oculta por mais de
    // alguns segundos, recriamos o jogo ao voltar — equivalente a recarregar,
    // mas sem perder progresso (o CombatFSM reconstrói tudo a partir do
    // useGameStore/useTowerStore).
    let hiddenAt = 0;
    const HIDDEN_RECOVERY_THRESHOLD_MS = 3000;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (
        screen === 'playing' &&
        hiddenAt > 0 &&
        Date.now() - hiddenAt > HIDDEN_RECOVERY_THRESHOLD_MS
      ) {
        setIsGameReady(false);
        destroyPhaserGame();
        initPhaserGame();
      }
      hiddenAt = 0;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      destroyPhaserGame();
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
              <CombatDropToasts />

              {/* Sobrepõe a tela de combate com a visualização da Cidadela enquanto essa aba está ativa */}
              {activeTab === 'citadel' && citadelEntered && <CitadelSpriteStage />}
            </div>

            {/* UI Component Container */}
            <div className="ui-container">
              <GameUI />
            </div>
          </div>
        )}

      {/* Modal 1: Boas-vindas / Tutorial (Guia Rápido paginado) */}
      {showWelcome && (
        <WelcomeGuideModal onClose={handleCloseWelcome} />
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
            <h3 className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a855f7', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', textShadow: '0 0 10px rgba(168,85,247,0.3)' }}>
              🔔 Atualização v6.1.0 — Ajustes de Balanceamento Pós-Cidadela!
            </h3>

            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p>
                Com a Cidadela Astral completa desde a v6.0.0, chegou a hora de recalibrar a economia do jogo: chaves da Torre, materiais, Ouro, Fragmentos de Forja e a própria Torre Infinita recebem ajustes de equilíbrio nesta versão.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>

                {/* v6.1.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 6.1.0 (Atual) — Ajustes de Balanceamento Pós-Cidadela:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a855f7', fontSize: '0.72rem' }}>
                        🔑 Chaves da Torre e Materiais na Ascensão
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Chaves da Torre Evoluídas agora sobrevivem à Ascensão, ao Pandemônio e à Transcendência (só a Chave comum continua sendo zerada). A retenção de Madeira/Pedra/Carne/Insígnia de Estudo na Ascensão caiu de 10% para 2%, reduzindo o acúmulo excessivo entre runs.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem' }}>
                        📊 Indicador de Bônus Total na Academia Militar
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Cada pesquisa agora mostra o bônus total já acumulado no nível atual, além do valor por nível, facilitando ver o efeito real de cada investimento.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#facc15', fontSize: '0.72rem' }}>
                        💰 Ouro em Combate e Custo da Grande Forja
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A escala de Ouro por abate caiu mais 50% para conter o acúmulo em fases avançadas. Em compensação, a fusão inicial da Grande Forja subiu de 100 para 250 Fragmentos de Forja, com toda a tabela de níveis seguintes escalada na mesma proporção.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#34d399', fontSize: '0.72rem' }}>
                        🗼 Torre Infinita Reformulada
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O XP por inimigo na Torre deixou de escalar com a fase/nível fora da torre e passou a ser fixo em 1% do XP necessário para o próximo nível (mantendo os bônus de Chefe, Elite e Chave Evoluída). Equipamentos, consumíveis e materiais deixaram de dropar na Torre — a recompensa de combate ali agora é exclusivamente Fragmentos de Forja.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f472b6', fontSize: '0.72rem' }}>
                        💾 Exportar/Importar Save agora por Arquivo
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Exportar um slot agora baixa um arquivo <code>.sav</code> em vez de copiar um código de letras para a área de transferência. Importar abre o seletor de arquivos do sistema para escolher esse arquivo, no lugar de colar o código manualmente.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v6.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 6.0.0 — O Despertar da Cidadela:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a855f7', fontSize: '0.72rem' }}>
                        🏰 Cidadela Astral — Lançamento Completo
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        As 8 construções (Depósito, Quartel de Expedições, Academia Militar, Torre de Vigia Astral, Oficina da Forja, Sifão Cósmico, Altar de Sincronia e Laboratório de Relíquias) estão completas, com arte definitiva e economia de materiais (Madeira, Pedra, Carne e Insígnias de Estudo) totalmente ativa. O combate continua avançando em segundo plano enquanto você gerencia a base.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem' }}>
                        🛠️ Ajustes e Melhorias Gerais
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Recalibragem do início de jogo, pressionar-e-segurar nos botões de Atributos/Habilidades, tela sempre ativa durante o combate, nome de personagem, Modo de Economia, fases agora exigem 20 monstros antes do Chefe, nova passiva infinita e teto de nível 25 para o Avatar, e a Aba Guia revisada com uma nova sub-aba de Sistemas.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v5.4.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 5.4.0 — O Despertar Cósmico:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem' }}>
                        🌫️ Sifão de Essência Cósmica
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova construção da Cidadela que mitiga a drenagem de mana e a erosão de recarga da Ecoterra por nível, até neutralizá-las completamente no Nível 5 (Sincronia Perfeita).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        🔯 Altar de Sincronia Elemental
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Eleva o teto de dano do Avatar injetando até +15% da soma dos atributos secundários no Maior Atributo Ativo no Nível 5.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🧪 Laboratório de Relíquias Místicas
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Permite Superaquecer relíquias já no Nível 5, amplificando seus efeitos Capstone em ~2.5× (ex: Luz da Alma Partida sobe de +10% para +25% de Dano Crítico).
                      </div>
                    </div>
                  </div>
                </div>

                {/* v5.3.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 5.3.0 — Automação Industrial e Logística da Torre:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0ea5e9', fontSize: '0.72rem' }}>
                        🗼 Torre de Vigia Astral
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Fabrica Chaves da Torre Infinita passivamente, mesmo offline, com taxa e capacidade interna escalando por nível.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.72rem' }}>
                        🛠️ Oficina de Automação da Forja
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Converte Ouro e Madeira em Fragmentos de Forja via ordens de serviço automáticas. No Nível 5 (Mestre Forjador), ativa o Desmonte Automatizado: drops Comuns/Raros viram Fragmento de Forja direto, sem passar pelo inventário.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v5.2.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 5.2.0 — O Hub de Expedições e a Moeda do Conhecimento:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                        🎖️ Quartel de Expedições
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Aloque classes inativas em missões automáticas que geram Madeira, Pedra, Carne e a nova moeda Insígnias de Estudo, com bônus por grupo de atributo (Força/Destreza/Magia).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#818cf8', fontSize: '0.72rem' }}>
                        🎓 Academia Militar
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Invista Insígnias de Estudo em pesquisas permanentes e universais de Dano Geral, Vida Máxima e Velocidade de Ataque, com teto de nível expansível.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v5.1.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 5.1.0 — O Despertar da Cidadela e Coleta de Insumos:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#06b6d4', fontSize: '0.72rem' }}>
                        🌌 Liberação da Cidadela Astral
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova aba de tela cheia desbloqueada na primeira Ascensão. O combate continua avançando em segundo plano enquanto você gerencia a Cidadela.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#84cc16', fontSize: '0.72rem' }}>
                        🪵 Três Novos Materiais
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Madeira, Pedra e Carne agora são dropadas por monstros da campanha, sem influência da Sorte.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        📦 Depósito (Almoxarifado)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Protege até 10 equipamentos Comuns/Raros/Épicos/Lendários do reset de inventário da Ascensão.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alternador de updates antigos (v5.0.0 e anteriores ficam ocultos por padrão) */}
                <button
                  onClick={() => setShowOlderChangelog((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    width: '100%',
                    background: 'rgba(168, 85, 247, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem',
                    color: '#c084fc',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: '0.2rem'
                  }}
                >
                  <span style={{ display: 'inline-block', transition: 'transform 0.2s ease', transform: showOlderChangelog ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  {showOlderChangelog ? 'Ocultar atualizações antigas' : 'Ver atualizações antigas'}
                </button>

                {showOlderChangelog && (
                <>
                {/* v5.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 5.0.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#06b6d4', fontSize: '0.72rem' }}>
                        🌌 Aba Dedicada de Transcendência (🌌)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A interface de Transcendência ganhou uma aba própria no menu superior, separada do Altar de Ascensão. Realize o Ritual de Transcendência (requer Modo Pandemônio liberado, alcançar a Fase 50 no Loop Infinito e acumular pelo menos 500 PP Vitalícios).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        🌟 Classe Transcendental: Avatar
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Desbloqueie a classe Avatar comprando o talento Avatar Pleno na árvore de Transcendência (exige Nível 5 em Mana Suprema, Domínio do Vazio, Foco Temporal e Alma do Avatar primeiro). O Avatar desfere Dano Cósmico escalado com o maior atributo e a ultimate "Coro da Alma Inteira" escala com a soma de todos eles!
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e0f2fe', fontSize: '0.72rem' }}>
                        🛒 Nova Loja Celestial
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Use suas Essências de Transcendência (ET) coletadas na Ecoterra na nova Loja Celestial para comprar consumíveis especiais: Elixir Transcendental (+10 Níveis, +50 atributos e +10 pontos de habilidade), Cristal de Forja Eterna (+25 Fragmentos de Forja) e Chaves da Fenda Temporal (+2 Chaves da Torre Infinita).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                        🍃 Espelho da Ecoterra e Segundo Ciclo
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Ative o Espelho da Ecoterra no painel correspondente para enfrentar monstros fortalecidos (+30% HP, +20% Velocidade de Ataque) nas fases 1 a 20 e coletar Essência de Transcendência sob as penalidades ambientais arcanas.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        📿 Novo Equipamento: Colar Místico e Ajuste de Recompensas da Torre
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Introduzido o slot de Colar, posicionado no topo direito do painel de equipamentos. Ele fornece de 1 a 3 passivos utilitários aleatórios (como redução de dano físico e de explosões, chance de frenesi no clique, roubo de vida e chance de drop). O colar possui uma taxa de drop fixa de 5% (independente da Sorte), e funciona como peça de conjunto de set, permitindo ativar até dois bônus de 3 peças distintos simultaneamente! Além disso, a quantidade de Fragmentos de Forja dropados ao avançar andares na Torre Infinita foi quadruplicada para facilitar o reforge místico, e a Grande Forja Arcana foi aprimorada para dar suporte a fusões de colar com prévias de atributos e formatação percentual precisa.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v4.4.5 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 4.4.5:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🦂 Sprite do Rei Escorpião de Ouro
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O boss "Rei Escorpião de Ouro" agora possui uma arte em pixel art própria em tom ocre/bronze com sombra sólida 512-bit, separando-o visualmente do escorpião de fogo comum.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        🌋 Background Exclusivo do Pandemônio (Fases 31+)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Cenário vulcânico caótico com obsidiana e correntes arcanas sob medida. Possui rolagem lateral infinita impecável e horizonte físico travado a 9% da borda inferior.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v4.4.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 4.4.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🎒 Expansão do Inventário (Até 100 Slots)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Compre upgrades permanentes de espaço no inventário na Loja por 100.000 de Ouro cada, aumentando o limite em +1 até atingir o teto de 100 slots.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                        🐉 Integração do Purgatório ao Bestiário
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adicionados os monstros do Purgatório ao Bestiário com bônus de +2% de dano geral por monstro completo e +7% por fase concluída (teto de bônus global do Bestiário elevado para +65%).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f43f5e', fontSize: '0.72rem' }}>
                        ⚖️ Balanceamento do Escudo de Espinhos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O dano refletido pelo modificador Escudo de Espinhos no Desafio Diário agora é limitado a no máximo 5% do HP Máximo do jogador por hit, prevenindo mortes instantâneas injustas.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        🔑 Ajuste de Drops das Chaves da Torre
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        As chances de drop das Chaves da Torre no modo de combate normal foram reduzidas em 50% (Chefes: 15%, Elites: 7.5%, Comuns: 2.5%) para calibrar a progressão.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v4.3.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 4.3.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        🔔 Notificações de Progressão
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Desbloqueio de classes, conclusão de registros do Bestiário e disponibilidade de Ascensão agora aparecem como notificações toast na parte inferior da tela, com animações e sons exclusivos.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.72rem' }}>
                        ⚔️ Toasts de Drops em Combate
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Ao dropar uma Chave da Torre ou Fragmento de Alma Instável em combate, um toast surge no canto superior direito da arena — sem interromper o combate ou seus toques na tela.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem' }}>
                        📖 Codex de Lendas (Protótipo)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Base para o registro histórico da sua jornada. Cada marco desbloqueado (classes, Pandemônio, Ascensões) futuramente revelará fragmentos de lore exclusivos sobre o Ciclo da Alma Partida.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v4.2.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 4.2.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#818cf8', fontSize: '0.72rem' }}>
                        🌌 Sets Celestiais (Tier Supremo)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Novo tier de equipamentos com multiplicador 6.0×, desbloqueado após derrotar o Guardião dos Cacos pela segunda vez. O equipamento mais poderoso da campanha antes do Pandemônio.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        ⚒️ Forja Mística Expandida (+6 a +8)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O limite da Forja Mística sobe de +5 para +8. Cada nível adicional exige Fragmentos de Forja progressivos (5.000 → 10.000 → 20.000) e Ouro com fórmula exponencial.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#06b6d4', fontSize: '0.72rem' }}>
                        🔧 Comparação Lado a Lado na Forja
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Novo painel de pré-visualização em 3 colunas mostra em tempo real os dois itens sacrificados e o resultado estimado da fusão, com badges de ganho líquido de atributos em verde.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fb923c', fontSize: '0.72rem' }}>
                        📱 Modal de Seleção Responsivo
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O modal de seleção de peças da Forja agora se adapta dinamicamente à altura da tela em qualquer celular, nunca ultrapassando os limites visíveis e mantendo rolagem interna fluida.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v4.1.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 4.1.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0ea5e9', fontSize: '0.72rem' }}>
                        🏰 Modo Torre Infinita
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Desafie seus limites subindo andares sem deslocamento lateral (scroll). Batalhas estáticas rápidas contra hordas intermináveis.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                        🎨 Background Exclusivo e Calibração de Chão
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova arte para o cenário interno da Torre que coincide perfeitamente com os pés dos personagens. Renderização limpa sem escalas dinâmicas de cenário.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fb923c', fontSize: '0.72rem' }}>
                        ⚡ Transição Fluida com Fade
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Trocas rápidas de andar utilizando efeitos de fade-out e fade-in de tela. O jogador corre em direção ao próximo desafio de forma natural e ritmada.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        ⚙️ Correções de Animação e HUD
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Corrigidos bugs de UI fantasma nos inimigos mortos, acompanhamento correto de textos/barras de vida na corrida do herói e ajuste na direção de retorno após mortes na Torre.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.72rem' }}>
                        🔑 Chaves da Torre & Drop da Campanha
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Inimigos derrotados na campanha normal agora dropam Chaves da Torre com taxas fixas baseadas no tipo de monstro (sem influência da Sorte). Chaves são guardadas com segurança na aba de consumíveis.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#e9d5ff', fontSize: '0.72rem' }}>
                        🎒 Inventário em Abas (Equipamentos vs. Consumíveis)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova interface com abas de separação para organizar o inventário de forma limpa, mantendo consumíveis (chaves, baús, etc.) organizados à parte, protegidos de vendas rápidas acidentais.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        🛠️ Desmonte de Equipamentos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Equipamentos agora podem ser desmontados no inventário para gerar 1 Fragmento de Forja por peça, oferecendo uma nova fonte sustentável para obter essa moeda.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#06b6d4', fontSize: '0.72rem' }}>
                        ⚒️ Economia de Fragmentos de Forja
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A Torre Infinita agora recompensa os jogadores com Fragmentos de Forja a cada andar superado. Use a nova moeda junto ao Ouro na Forja para fundir e aprimorar equipamentos Místicos.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v4.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 4.0.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f43f5e', fontSize: '0.72rem' }}>
                        💀 Classe Avançada: Necromante
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Desbloqueie ao atingir <strong>Nível 50 com o Clérigo e o Ladrão</strong> (rastreado globalmente entre saves). Use o dreno de HP de <i>Toque da Morte</i> e tire vantagem do escalonamento de dano mágico baseado em Sorte.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        🌌 A Zona do Purgatório (Fases 21-30)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Enfrente novas ameaças na campanha e encare o <b>Guardião dos Cacos</b> em uma batalha épica de duas fases no estágio 30 para liberar o Modo Pandemônio.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🔮 Expansão de Relíquias e Efeitos Capstone
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Expandido para 8 relíquias únicas. Atingir o nível 5 desbloqueia um poderoso efeito <b>Capstone</b> passivo (como aumento de regeneração de mana, crítico ou barreira de vida).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#3b82f6', fontSize: '0.72rem' }}>
                        🪙 Novos itens na Loja & Ajustes na Forja
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adquira o <i>Baú de Relíquias</i> por 50.000 Ouro para obter 3 Fragmentos de Alma Instável. Ajustado filtro da Forja para impedir fusão acidental de itens consumíveis.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fb923c', fontSize: '0.72rem' }}>
                        ⚖️ Rebalanceamento Econômico & de Progressão
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Ajustado o bônus de ouro obtido pela Sorte para uma curva de raiz quadrada (<code>1.0 + √Sorte / 10</code>) para controlar a hiperinflação no endgame. A curva de ganho de Pontos de Prestígio (PP) na Ascensão foi atenuada (expoente reduzido de 0.85 para 0.45) para estender o desafio no final do jogo.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.7.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 3.7.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a855f7', fontSize: '0.72rem' }}>
                        🔮 Altar de Relíquias e Forja de Alma
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Canalize Fragmentos de Alma Instáveis no Altar de Relíquias para forjar e aprimorar três relíquias com bônus poderosos acumulativos.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        💀 Drops em Chefes de Fase
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Derrotar chefes de fase (estágios múltiplos de 5) agora tem uma chance rara de 5% de dropar um <i>Fragmento de Alma Instável</i>.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#3b82f6', fontSize: '0.72rem' }}>
                        🌀 Preservação Permanente na Ascensão
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Consuma os fragmentos do inventário para adicioná-los à forja. Todo o progresso e bônus das relíquias são mantidos nas Ascensões!
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.6.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 3.6.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        🏆 Desafio Diário e 5 Afixos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Enfrente um estágio espelho diário baseado em seed de data com um dos 5 afixos ativos: <b>Drenagem de Alma</b>, <b>Escudo de Espinhos</b>, <b>Frenesi Sombrio</b>, <b>Vento Cortante</b> ou <b>Veneno Rastejante</b>.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        ✨ Moeda Fragmentos de Alma Instáveis
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Complete o desafio diário para receber ouro e Fragmentos de Alma Instáveis, essenciais para a forja e a evolução do seu equipamento.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#3b82f6', fontSize: '0.72rem' }}>
                        📊 Recordes e Estatísticas Pessoais
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Acompanhe seus recordes de maior fase alcançada, total de resets, maior ganho de PP e o tempo recorde de speedrun até a fase 20.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.5.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 3.5.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                        👾 Inimigos Elite e 5 Afixos do Vazio
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Monstros comuns a partir da fase 11 têm 8% de chance de spawnar como Elites com HP/Dano triplicados, drop garantido de item e afixos únicos: <b>Enfurecido</b>, <b>Blindado</b>, <b>Vampírico</b>, <b>Volátil</b> e <b>Regenerador</b>.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a855f7', fontSize: '0.72rem' }}>
                        🎨 Efeitos Visuais & Pulsação no Phaser
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Monstros Elite são 15% maiores, possuem uma pulsação dinâmica de escala, colorização prateada e nome prateado com a identificação do afixo no HUD.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        📜 Lore Imersiva "Ciclo da Alma Partida"
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Apresenta a introdução oficial da história através de um modal cinemático e responsivo ao iniciar uma aventura em um novo slot de save.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.4.5 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 3.4.5:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                        ⚖️ Utilidade dos Atributos Força e Constituição
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Cada ponto de <b>Força</b> agora concede 0,05% de penetração de armadura (aumento de dano final do jogador), e cada ponto de <b>Constituição</b> reduz em 0,05% o dano recebido de monstros (redução máxima limitada a 95%).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a855f7', fontSize: '0.72rem' }}>
                        🛡️ Hierarquia Visual do Set Pandemoníaco
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Itens do Set Pandemônio agora possuem bordas tracejadas verdes e indicador de conjunto. A versão <b>Mística</b> conta com fundo violeta escuro e efeitos adicionais de brilho pulsante.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        ⚔️ Raridade Fixa dos Sets Iniciais
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Todos os itens de sets iniciais (ex: Senhor da Guerra) passam a dropar obrigatoriamente com a raridade <b>Lendária</b> (cor dourada), unificando seu valor.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.4.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 3.4.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        ⚖️ Suavização de Dificuldade no Endgame
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        As curvas de HP e Dano exponencial dos monstros no final do jogo foram atenuadas (HP de 1.85x para 1.50x; Dano de 1.45x para 1.25x por estágio) e o multiplicador de dano dos atributos principais do jogador foi elevado de 1.0x para 3.0x para mitigar mortes instantâneas ("hitkill") e equilibrar o combate.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.72rem' }}>
                        ⚡ Unificação do Crítico Global
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Os acertos críticos deixaram de ser exclusivos do Toque manual. Ataques básicos e habilidades automáticas agora compartilham das mesmas chances e multiplicadores críticos globais do jogador, fornecendo feedback flutuante (ícone ⚡ e cor vermelha).
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                        🏷️ Ajuste Visual de Atributos e Upgrades
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Os upgrades permanentes da Ascensão foram renomeados para "Foco Crítico" (+3% Chance de Crítico global por nível) e "Poder Devastador" (+15% Dano Crítico global por nível). Rótulos de UI atualizados para "Chance de Crítico" e "Dano Crítico".
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.3.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#fbbf24', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 3.3.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        ⚡ Habilidades Ultimates de Classe (Inferno+)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Desbloqueie uma habilidade Ultimate única e devastadora por classe ao alcançar o nível 15 na dificuldade Inferno ou superior (como a <i>Cólera dos Titãs</i> do Guerreiro ou a <i>Supernova</i> do Mago). Elas possuem custos de mana substanciais e cooldowns estratégicos de 50s a 80s.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.72rem' }}>
                        💀 Nível Máximo 15 no Modo Pandemônio
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O limite de evolução das habilidades comuns foi aumentado do nível 10 para o nível 15 na dificuldade Pandemônio (Fases 21+), expandindo o teto de dano e permitindo que a Cura restaure até 100% do HP.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10b981', fontSize: '0.72rem' }}>
                        🧬 Escalonamento Dinâmico de Debuffs e Efeitos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Agora, os aprimoramentos de habilidades aumentam os efeitos de seus debuffs em +15% por nível: debuffs de dano/cura contínua (como Veneno ou Queimadura) recebem aumento no dano causado, enquanto efeitos de controle (como Atordoamento ou Lentidão) recebem aumento na duração.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fb7185', fontSize: '0.72rem' }}>
                        🔊 Usabilidade, Confirmações e Efeitos Sonoros
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adicionadas janelas de confirmação de transação ao comprar itens na Loja e ao vender equipamentos em massa no Inventário. Agora, transações bem-sucedidas emitem feedbacks sonoros táteis.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.2.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#fb923c', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 3.2.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fb923c', fontSize: '0.72rem' }}>
                        🪙 Venda de Equipamentos por Ouro
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A opção de destruir equipamentos foi substituída pela venda por ouro. O valor obtido escala de acordo com a raridade do item e a dificuldade/estágio em que ele foi gerado.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f97316', fontSize: '0.72rem' }}>
                        🎒 Botões de Venda Rápida em Lote
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adicionados novos botões no rodapé do inventário para vender instantaneamente todos os itens comuns/mágicos ou todos os itens lendários de uma única vez.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.1.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 3.1.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        ⚖️ Overhaul de Ascensão & Pontos Triplicados
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Aceleração da progressão com pontos de prestígio triplicados (multiplicador final de PP ajustado de 0.5x para 1.5x) e remoção do limite de nível 10 nos 5 atributos de prestígio base ao ativar o Modo Pandemônio.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem' }}>
                        💪 Bônus de Atributos Dobrados
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Melhorias permanentes de atributos base na árvore de ascensão agora concedem o dobro de atributos por nível (+12 Força, +12 Magia, +6 Destreza, +18 Constituição e +6 Sorte).
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c4b5fd', fontSize: '0.72rem' }}>
                        🛡️ Rebalanceamento & Novos Bônus de Alma
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Ajuste nos bônus antigos de ascensão (+5% Dano geral, +1% Atk Speed, +2.5% HP/Mana) e novos bônus adicionados por nível: +5 Dano de Toque, +0.1% Chance Crítica de Toque, +1% Dano Crítico de Toque e +0.5% de Esquiva.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#f87171', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 3.0.0:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f87171', fontSize: '0.72rem' }}>
                        💀 Modo Pandemônio (Dificuldade Suprema & Estágio Infinito)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Ao maximizar os 5 atributos base da ascensão (Lvl 10) e pagar 100 PP no Altar da Alma, você ativará o Modo Pandemônio. Ao passar do Apocalipse (Fase 20), você entrará em um modo de fases infinito com chefes e monstros aleatórios, dificuldade 5x inicial e escala contínua.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f472b6', fontSize: '0.72rem' }}>
                        🎒 Preservação de Itens Equipados
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Uma vez desbloqueado o Modo Pandemônio, realizar ascensões não apagará mais os equipamentos equipados do personagem, apenas os itens do inventário, acelerando drasticamente o avanço.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fca5a5', fontSize: '0.72rem' }}>
                        ⚔️ Novos Sets de Equipamento Pandemoníaco
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Introduzidos novos conjuntos de itens Pandemoníacos exclusivos para cada classe, com 15% de chance de drop na fase 21+ e multiplicador inicial de 7.0x nos atributos base.
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🛒 Nova Aba Loja & Suprimentos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Adicionada a Aba Loja! Compre suprimentos essenciais por ouro: Baús Lendários (500 gold), Baús Ancestrais (3000 gold), Boosters de Toque (1000 gold) e o potente Boost de Toque x3 (5000 gold).
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#06b6d4', fontSize: '0.72rem' }}>
                        ⚡ Sistema de Consumíveis & Frenesi Instantâneo
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Os itens comprados vão para o seu inventário na aba Equipamentos. Ao abrir baús, você recebe de 1 a 3 equipamentos aleatórios para sua classe. Ao consumir o Boost de Toque, ativa instantaneamente o modo Frenesi (críticos e auto-toques) por 1 minuto (ou 3 minutos na versão x3) inteiro!
                      </div>
                    </div>
                  </div>
                </div>

                {/* v2.4.4 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#c084fc', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 2.4.4:</span>
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
                </>
                )}
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
