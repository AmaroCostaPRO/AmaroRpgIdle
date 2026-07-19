import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { CombatScene } from './phaser/scenes/CombatScene';
import GameUI from './components/GameUI';
import { CombatDropToasts } from './components/CombatDropToasts';
import { ActiveBuffsTray } from './components/ActiveBuffsTray';
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
              <ActiveBuffsTray />

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
              🔔 Atualização v9.0.0 — O Que Espera no Pandemônio!
            </h3>

            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p>
                A v9.0.0 traz o Santuário de Contratos de Caça (evolução do Bestiário), a Relíquia Ativa como novo slot de equipamento, o modo infinito Provações do Vácuo (pós-Transcendência) e a Convergência — o world boss semanal endgame.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>

                {/* v9.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 9.0.0 (Atual) — O Que Espera no Pandemônio:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#2dd4bf', fontSize: '0.72rem' }}>
                        📜 Santuário de Contratos de Caça
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova construção da Cidadela: gera contratos rotativos ("derrote N do inimigo X") em janelas de 8h, com recompensas em materiais/ouro escalando com a dificuldade do alvo e um bônus extra ao completar toda a rotação. O bônus passivo por marco de mortes do Bestiário continua funcionando normalmente.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        🔱 Novo Slot de Equipamento: Relíquia Ativa
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        6 relíquias com habilidade ativa própria e recarga: dano burst, cura contínua (% de HP máximo por segundo, diferente da Cura padrão instantânea), redução de cooldown, foco em Elites/Chefes, invulnerabilidade temporária e bônus de ouro. Não passam por fusão mística — a potência (dano, duração, %) varia por um roll min/máx conforme a raridade do drop.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#818cf8', fontSize: '0.72rem' }}>
                        ♾️ Provações do Vácuo
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        3ª ramificação da Torre Infinita, liberada só após a 1ª Transcendência: sem teto de dificuldade, sem títulos, sem leaderboard — só o seu recorde pessoal. Concede Pontos de Transcendência de forma bem limitada (até 3 por semana, escalando com o andar batido), para nunca virar uma fonte de farm.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f87171', fontSize: '0.72rem' }}>
                        ☄️ Convergência (World Boss Semanal)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Todo quarta-feira, 1% de chance por encontro (uma única vez no dia) de enfrentar um dos 4 world bosses rotativos — O Que Ainda Sonha, O Ceifador de Reflexos, A Fome sem Nome ou O Trono Vazio, escolhido pela semana. Cada um dropa, de forma garantida, uma relíquia ativa exclusiva mais forte que as do catálogo normal.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#2dd4bf', fontSize: '0.72rem' }}>
                        🎯 Bandeja de Buffs Ativos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Novo indicador no canto superior esquerdo da tela de combate: mostra ícones de todo Elixir, Poção de Alquimia e buff da Relíquia Ativa em duração, cada um com contagem regressiva e um efeito de "relógio" que cobre o ícone até o buff acabar. O indicador de Lua de Sangue/Convergência também foi corrigido para aparecer no modo mobile (antes só era visível no desktop).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🌕 Lua de Sangue Ajustada (correção)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O evento agora ativa apenas aos Domingos, e não mais durante o fim de semana inteiro.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        🔱 Correções na Relíquia Ativa (correção)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A habilidade e a descrição da Relíquia Ativa equipada agora aparecem corretamente ao abrir o item no slot de equipamento (antes só apareciam quando o item estava no inventário). Relíquias Ativas também deixaram de poder ser fundidas na Forja Mística.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f87171', fontSize: '0.72rem' }}>
                        🩸 Bônus do Set Sanguinário (correção)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O Set da Lua de Sangue (item "Sanguinário", drop exclusivo do evento) agora concede corretamente seus bônus de 2/3/5 peças, incluindo roubo de vida e bônus de dano/vida — antes o conjunto equipado não tinha nenhum efeito.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem' }}>
                        💠 Ajustes de Combate
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Fonte do dano de toque reduzida para o mesmo tamanho dos demais números de dano em tela. O texto de roubo de vida agora mostra só o valor curado, sem o rótulo extra.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#34d399', fontSize: '0.72rem' }}>
                        💧 Custo de Mana Agora Escala com Sua Mana Máxima
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O custo de mana das habilidades passou a ser uma porcentagem da sua mana máxima (em vez de um valor fixo), então ele nunca mais fica irrisório conforme você fica mais forte — habilidades comuns custam de ~1.3% a ~7.5% da mana máxima, e Ultimates de 7.5% a 13.75% (valores reduzidos em duas rodadas após feedback de que ficaram altos demais). A habilidade Cura continua totalmente gratuita. O custo real de cada habilidade agora também aparece na barra de combate e na Árvore de Habilidades (com o custo do próximo nível já visível ao lado). A regeneração de mana por ponto de Magia também aumentou (de 0.05 para 0.20/s nas classes não-mágicas, e de 0.02 para 0.10/s em Mago/Clérigo), para acompanhar os novos custos.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#818cf8', fontSize: '0.72rem' }}>
                        👆 Botões de Prestígio
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Os botões de distribuição de pontos de Prestígio na aba Ascensão agora suportam segurar para repetir, como os botões de Atributos e Habilidades.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v8.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 8.0.0 — O Espelho Faminto:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#2dd4bf', fontSize: '0.72rem' }}>
                        💍 Novo Slot de Equipamento: Anel
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Sétimo slot de equipamento, com itens "pesados" completos (atributos primários por classe, participa de Sets e da Fusão Mística) — igual a Elmo, Peito, Pernas, Mãos e Arma, ao contrário do Amuleto/Colar.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a855f7', fontSize: '0.72rem' }}>
                        👑 Expansão dos Inimigos de Elite
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        4 novos afixos de Elite: <strong>Refletor</strong> (devolve parte do dano recebido), <strong>Errante</strong> (velocidade de ataque imprevisível), <strong>Replicante</strong> (invoca escudos de "réplica fantasma" periódicos) e <strong>Vulnerável</strong> (janelas de dano aumentado).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        ⚗️ Laboratório de Alquimia
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova construção da Cidadela: destila Madeira, Pedra e Carne em Poções de Fúria Alquímica (+25% de Dano, 3min) e de Regeneração Alquímica (regeneração de HP acelerada, 2min), preparadas sob demanda.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f87171', fontSize: '0.72rem' }}>
                        🌕 Lua de Sangue (Evento Sazonal)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Todo fim de semana, os inimigos da fase atual ficam com +50% de HP/Dano, ganham um reskin vermelho e uma tabela de drop exclusiva do Set da Lua de Sangue passa a valer.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f472b6', fontSize: '0.72rem' }}>
                        🌀 Ramificação de Maldições da Torre Infinita
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Variante roguelike opcional: cada andar concluído acumula uma maldição temporária (+20% em 1 atributo, -10% em 2 outros — resultado bem aleatório), em troca de +50% de Ouro e Fragmentos de Forja. Recordes e títulos honoríficos são separados da Torre Normal. A lista agora mostra só a maldição do andar atual e o valor real dos atributos afetados.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem' }}>
                        🏯 Pátio da Cidadela em 2 Páginas
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O pátio clicável da Cidadela ganhou um carrossel de 2 páginas (com animação de deslize) para abrigar o Laboratório de Alquimia e futuras construções, sem perder nenhuma posição existente.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🛒 Reajustes de Preço na Loja
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Baú de Relíquias subiu de 500.000 para 2.000.000 de Ouro. Espaço no Inventário deixou de ter preço fixo: agora começa em 100.000 Ouro e sobe +100.000 a cada compra, tornando os últimos slots uma meta de longo prazo real.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v7.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#cbd5e1', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 7.0.0 — Bosque Sussurrante:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#2dd4bf', fontSize: '0.72rem' }}>
                        🌲 Novo Bioma: Bosque Sussurrante (Fases 1-5)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A jornada agora se inicia nas profundezas do Bosque Sussurrante, com background pixel art rolável exclusivo. As dificuldades Nightmare, Hell e Apocalypse passam a vigorar a partir da Fase 6, isolando o início de jogo tematicamente.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a855f7', fontSize: '0.72rem' }}>
                        👾 Novos Inimigos Exclusivos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Enfrente o Sprite Sussurrante, o Treantulho Espinhoso e o Coelho Feérico. Derrote o solene Chefe "Guardião do Sussurro" na Fase 5 para liberar a progressão à Floresta! Todos contam com artes pixel art de alta fidelidade.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        🛒 Mercador Ambulante no Combate
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nas fases normais (3+), há 2% de chance de encontrar o Mercador Ambulante. O combate é suspenso temporariamente e sua arte e nome dourado especial são exibidos na arena enquanto você navega pelas ofertas do Mercador.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f472b6', fontSize: '0.72rem' }}>
                        🧪 Elixires Exclusivos do Mercador
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O Mercador sorteia 2 elixires aleatórios entre 5 tipos a cada encontro, todos por 50.000 Ouro e ativados na hora (só 1 compra por encontro): <strong>Combatente</strong> (+30% Dano e +20% Vida Máxima, 2min), <strong>Defensor</strong> (imunidade total a dano, 1min), <strong>Acumulador</strong> (+50% Drop e Ouro, 1min), <strong>Velocista</strong> (+25% Vel. Ataque e +20% Esquiva, 1min) e <strong>Ilusionista</strong> (recarga de habilidades 2x mais rápida, 2min).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem' }}>
                        🧚 Companheiros/Pets (Lumen e Moeda Alada)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Sprites e artes reais integradas para os dois pets iniciais que acompanham o herói: Sprite Lumen (+5% de XP) e Moeda Alada (+5% de Ouro).
                      </div>
                    </div>
                  </div>
                </div>

                {/* v6.1.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#cbd5e1', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Notas da Versão 6.1.0 — Ajustes de Balanceamento Pós-Cidadela:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#2dd4bf', fontSize: '0.72rem' }}>
                        📊 Nova Aba de Estatísticas Completas
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova sub-aba "Estatísticas" dentro de Opções reúne tudo que você já alcançou: recordes de combate (maior dano em um golpe, Vida, Crítico, chance de Drop, Redução de Dano, Velocidade de Ataque e Esquiva, sempre com o valor atual ao lado do recorde), marcos de progressão (ascensões, transcendências, fase mais alta, inimigos abatidos, equipamentos/fragmentos/Chaves da Torre dropados, ascensão mais rápida) e totais econômicos vitalícios (Ouro e XP ganhos, gasto na Forja, materiais farmados pela Cidadela).
                      </div>
                    </div>
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
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        🐛 Set Celestial Corrigido (estava mais fraco que o Pandemoníaco)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Itens do Set Celestial dropavam com status base e bônus de conjunto menores que o Set Pandemoníaco, mesmo sendo o tier acima. Corrigido para o Celestial voltar a superar o Pandemoníaco em atributos e bônus de conjunto completo, em todas as classes.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fbbf24', fontSize: '0.72rem' }}>
                        💰 Teto de 5.000 Ouro na Venda de Equipamentos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Equipamentos de fases avançadas estavam vendendo por valores exagerados de Ouro. Nenhum item agora vende por mais de 5.000 Ouro, independente de raridade, fase ou set.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#22d3ee', fontSize: '0.72rem' }}>
                        🔋 Correção do Wake Lock (Tela Apagando em Combate)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Em alguns celulares a tela voltava a apagar durante o combate mesmo com a função de Tela Sempre Ativa ligada. Corrigido um caso em que o jogo não percebia quando o sistema liberava o bloqueio sozinho e deixava de tentar religá-lo.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f87171', fontSize: '0.72rem' }}>
                        🩸 Roubo de Vida Rebalanceado
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O Set Celestial (3 peças) agora também concede +5% de Roubo de Vida, além dos +2 Cliques do Robô. A cura do Roubo de Vida deixou de ser só baseada no dano causado — em fases avançadas, dano altíssimo estava gerando curas de milhões de vida por acerto. Agora a cura por acerto fica limitada à porcentagem de Roubo de Vida sobre a sua própria vida máxima, evitando curas desproporcionais.
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
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 5.0.0 — Transcendência:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova aba dedicada de Transcendência com a classe Avatar, a Loja Celestial de consumíveis especiais, o Espelho da Ecoterra (segundo ciclo com monstros fortalecidos) e o novo slot de equipamento Colar Místico, além de ajustes nas recompensas da Torre e da Forja.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v4.0.0 (condensado: 4.0.0 a 4.4.5) */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 4.0.0 — Purgatório e Torre Infinita:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova classe avançada Necromante, a Zona do Purgatório (fases 21-30) com o chefe Guardião dos Cacos liberando o Modo Pandemônio, expansão das Relíquias com efeitos Capstone, o Modo Torre Infinita, os Sets Celestiais, Forja Mística expandida até +8, desmontagem de equipamentos em Fragmentos de Forja, inventário organizado em abas com até 100 slots, integração do Purgatório ao Bestiário, notificações de progressão e toasts de drops, além de diversos ajustes visuais e de balanceamento.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v3.0.0 (condensado: 3.0.0 a 3.7.0) */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#f87171', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 3.0.0 — Modo Pandemônio:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Lançamento do Modo Pandemônio (dificuldade suprema com fases infinitas), overhaul da Ascensão com pontos triplicados, Ultimates exclusivas por classe, a Aba Loja com suprimentos e consumíveis, venda de equipamentos por ouro, o Altar de Relíquias e a Forja de Alma (Fragmentos de Alma Instável), o Desafio Diário com afixos, inimigos Elite, a lore "Ciclo da Alma Partida" e diversos balanceamentos de atributos, crítico e dificuldade no final de jogo.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v2.0.0 (condensado: 2.0.0 a 2.4.4) */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#c084fc', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 2.0.0 — A Forja Mística:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Introdução da economia de Ouro e da Forja Mística (fusão de equipamentos em itens Místicos evolutivos), as dificuldades Inferno e Apocalipse, o combate híbrido por toque (Tap Combat) com Frenesi e upgrades permanentes de Toque, os Sets Ancestrais pós-Ascensão, a IA de Auto-Cast customizável e diversos ajustes de atributos, navegação e forja.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v1.1.2 (condensado: 1.1.2 a 1.1.5) */}
                <div>
                  <span style={{ fontWeight: 700, color: '#60a5fa', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>🛡️ Versão 1.0.0 — Fundações:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#94a3b8', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Primeiras versões do jogo: sistema de Equipamentos e Conjuntos, efeitos de combate (Veneno, Queimadura, Lentidão, Atordoamento), a árvore de prestígio triplicada, correções de estado dos saves, atalhos de velocidade de simulação, zoom na arena de combate e melhorias visuais gerais.
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
