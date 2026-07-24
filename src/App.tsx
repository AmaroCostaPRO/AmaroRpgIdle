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
import { SunkenCitadelSpriteStage } from './components/abyss/SunkenCitadelSpriteStage';
import { BUILDING_SPRITE_SRC } from './components/citadel/citadelBuildingSprites';
import { SUNKEN_BUILDING_SPRITE_SRC } from './components/citadel/sunkenBuildingSprites';
import { getTransparentImageUrl } from './core/imageBackgroundStrip';
import { RUNE_SHEET_BASE, RUNE_SHEET_PRIMORDIAL } from './components/shared/itemVisuals';
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
  const [sunkenEntered, setSunkenEntered] = useState(false);

  useWakeLock(screen === 'playing');

  // Escuta a troca de aba da UI para saber quando sobrepor a tela de combate
  // com a visualização da Cidadela — só sobrepõe depois que o jogador confirma
  // a entrada no portão (citadelEntered), não apenas ao tocar na aba.
  useEffect(() => {
    const unsubscribeTab = bridge.subscribe(GameEvent.TAB_CHANGED, (payload: any) => {
      setActiveTab(payload?.tab ?? 'combat');
      setCitadelEntered(!!payload?.citadelEntered);
      setSunkenEntered(!!payload?.sunkenEntered);
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

  // Mesmo pré-processamento acima, para os sprites dos distritos da Cidadela Submersa — sem
  // isso, o primeiro acesso a ela no início da sessão mostrava rapidamente o placeholder escuro
  // (fallback) antes da arte real ficar pronta, igual ao problema já corrigido na Cidadela normal.
  useEffect(() => {
    Object.values(SUNKEN_BUILDING_SPRITE_SRC).forEach((src) => {
      getTransparentImageUrl(src).catch(() => {});
    });
  }, []);

  // Mesmo pré-processamento acima, mas para as 2 spritesheets de Runas Abissais — evita o
  // flash do glifo de fallback ao abrir detalhes de item/soquete com runa engastada.
  useEffect(() => {
    [RUNE_SHEET_BASE, RUNE_SHEET_PRIMORDIAL].forEach((src) => {
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
              {/* Mesmo padrão para a Cidadela Submersa, aberta por um botão dentro da aba Abismo */}
              {activeTab === 'abyss' && sunkenEntered && <SunkenCitadelSpriteStage />}
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
              🔔 Atualização v10.0.0 — A Cidadela Submersa!
            </h3>

            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p>
                A maior atualização de conteúdo do jogo até hoje: um Litoral inteiro para pescar, uma descida vertical infinita nas Profundezas do mar com seu próprio ritmo de risco, uma segunda Cidadela — afundada — para restaurar distrito por distrito, uma simulação de população dos Ecos Afogados, Palavras Rúnicas e o Set Abissal, e um chefe mundial semanal com direito a cutscene de encerramento.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>

                {/* v10.0.0 */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Novidades da Versão 10.0.0 (Atual) — A Cidadela Submersa:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0891b2', fontSize: '0.72rem' }}>
                        🎣 O Litoral Naufragado
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova aba 🌊 Abismo, desbloqueada ao completar a Fase 2. A Doca de Pesca gera capturas passivas (rede com buffer, coleta manual) e ativa (minigame de timing "Puxar a Linha", com acerto perfeito alimentando a Runa Primordial Faro). Três iscas craftáveis mudam o viés das capturas; um indicador de Maré e o log das últimas capturas completam o painel. Inimigos e o miniboss Eco Afogado passam a aparecer como spawns alternativos nas Fases 1-10.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#22d3ee', fontSize: '0.72rem' }}>
                        🤿 As Profundezas: Mergulho Vertical Infinito
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Um modo push-your-luck totalmente à parte da campanha: desça o quanto conseguir gastando Chaves de Mergulho, com o Fôlego como único relógio da sessão (nunca escala com a profundidade — é risco de sessão, não de poder). Quatro zonas temáticas (Recife Partido, Bosque de Algas Negras, Ruínas da Cidadela, Fossa do Caco) com Pressão crescente mitigada pelo Traje de Mergulho, Bolsões de Ar a cada 5 profundidades (respirar, saquear ou subir com tudo), e 3 Guardiões de Zona guardando as profundidades 25/50/80. Morrer "limpo" mantém 75% do acumulado; afogar mantém 50%; subir num Bolsão banca 100%. A recompensa é 100% separada da campanha: só Pérolas, Coral e Runas — nunca XP, Ouro ou equipamento normal.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0e7490', fontSize: '0.72rem' }}>
                        🔱 A Cidadela Submersa (6 distritos)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        A cidade-irmã afundada da Cidadela Astral, restaurada distrito por distrito (Doca Batial, Salão dos Ecos, Forja Encharcada, Arquivo Submerso, Templo da Maré, Trono Afundado) num pátio 2×3 clicável — drenar custa Pérolas/Coral e leva horas reais; cada distrito Restaurado abre slots de Eco e sua própria função. Desbloqueada ao alcançar a Fase 50.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#5eead4', fontSize: '0.72rem' }}>
                        🎭 Os Ecos Afogados (simulação de população)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Resgate cidadãos afogados nas Profundezas (Zona 3+) ou ao concluir drenagens, cada um com uma vocação (Pescador/Mergulhador/Escriba/Guardião) e um traço único que afeta a eficácia. Aloque-os nos distritos certos — a fórmula de eficácia (Base × Afinidade × Traço × Vizinhos × Salão) é mostrada em decomposição completa na gaveta de Ecos. O traço Coração Partido pede 7 dias de descanso antes de voltar a render, e realocá-lo reinicia o prazo (com aviso explícito antes de confirmar). Cap do elenco escala com a Restauração do Salão dos Ecos.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#eab308', fontSize: '0.72rem' }}>
                        🪬 Runas Abissais e Palavras Rúnicas
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova Câmara de Gravação na Cidadela Astral: perfure soquetes no equipamento pesado e engaste runas de 9 famílias (3 tiers cada) dropadas nas Profundezas, mais 9 Runas Primordiais únicas com efeitos especiais. A partir do Nível 5 da Câmara, gravar a sequência exata de runas certa num item forma uma Palavra Rúnica — um efeito fixo e nomeado (9 receitas), substituindo a soma individual das runas. Desfazer devolve tudo ao cofre intacto.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#a855f7', fontSize: '0.72rem' }}>
                        💠 Set Abissal e Ciclo de Marés
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Novo teto de multiplicador de status (8.0×, acima do Celestial), exclusivo de drops na Fossa do Caco e do Leviatã. Um relógio de Maré (6h, acelerado para 1h nas sextas-feiras via Maré Viva) alterna Maré Baixa (+pesca, -custo de drenagem, -Pressão) e Maré Alta (+Coral, Bênçãos do Templo), completando o calendário semanal ao lado da Lua de Sangue (domingo) e da Convergência (quarta).
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0c4a6e', fontSize: '0.72rem' }}>
                        🐋 O Leviatã do Ciclo (chefe mundial semanal)
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        No Trono Afundado restaurado, desafie um chefe de 5 fases (cada uma com seu próprio pool de HP e mecânica: Escudo de Prole, Correnteza, Ciclo Bioluminescente, Fúria do Ciclo, e canalizações de Vagalhão/Canto Abissal interrompíveis por Atordoamento) escalando com seu recorde de profundidade. Progresso persiste durante a semana — perder só custa a fase atual. Primeira morte revela a Palavra Rúnica exclusiva e concede um título honorífico; mortes seguintes garantem peças do Set Abissal.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fde047', fontSize: '0.72rem' }}>
                        🎬 "O Coro e o Caco" — a primeira cutscene do jogo
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Ao derrotar o Leviatã pela 1ª vez, uma sequência de painéis narrados revela a tragédia por trás do chefe — um guardião que engoliu a luz do Caco da Alma e virou a própria tranca. Rejogável a qualquer momento em "Memórias" no Codex. Mortes repetidas pulam direto para um resumo, respeitando seu tempo de farm semanal.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#c084fc', fontSize: '0.72rem' }}>
                        📖 Codex e Bestiário Completos
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        21 novas entradas de Bestiário (todos os inimigos e chefes do Abismo) e mais de 20 entradas novas de Cosmologia, Facções, Personagens, Eventos e Locais, contando a história da cidade-irmã afundada e a lore completa dos 3 Guardiões e do Leviatã.
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#f87171', fontSize: '0.72rem' }}>
                        🐛 Correções Pós-Lançamento
                      </div>
                      <div style={{ marginLeft: '1.25rem', marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Corrigido o Coral sendo zerado ao pescar com Expedições da Cidadela alocadas; o Bestiário só mostrava 2 das 6 novas zonas do Abismo (agrupamento por ID substituiu o recorte fixo antigo, e o bônus de dano do Bestiário passou a contar os abates do Abismo); inimigos exclusivos do Abismo vazando para os sorteios da Torre Infinita e do Pandemônio; layout dos cartões de isca no Litoral desalinhado no mobile. Além disso, foram feitos diversos ajustes de interface e algumas mudanças no sistema de Runas (layout, ícones, novas abas de consulta e regras de obtenção das Runas Primordiais).
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alternador de updates antigos (v9.0.0 e anteriores ficam ocultos por padrão) */}
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
                {/* v9.0.0 (condensado: 9.0.0 a 9.7.0) */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 9.0.0 — O Que Espera no Pandemônio:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Santuário de Contratos de Caça (nova construção da Cidadela), o slot de Relíquia Ativa (6 habilidades com recarga própria), as Provações do Vácuo (3ª ramificação sem teto da Torre, pós-Transcendência) e a Convergência (world boss semanal de quarta-feira, 4 rostos rotativos com drop exclusivo garantido). Passivas reformuladas de todas as 8 classes com mecânicas de verdade (barreiras, reflexão de dano, esquiva, crítico garantido), custo de mana passou a escalar com a mana máxima, e a Oficina/Alquimia/Contratos da Cidadela receberam ajustes de economia e correções de bugs de produção ao longo das versões 9.5-9.7.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v8.0.0 (condensado) */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 8.0.0 — O Espelho Faminto:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Novo slot de equipamento Anel (item pesado completo), 4 novos afixos de Elite (Refletor, Errante, Replicante, Vulnerável), o Laboratório de Alquimia, o evento sazonal Lua de Sangue (fins de semana, +50% HP/Dano nos inimigos e Set exclusivo) e a Ramificação de Maldições da Torre Infinita (roguelike opcional com recompensas maiores).
                      </div>
                    </div>
                  </div>
                </div>

                {/* v7.0.0 (condensado) */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#cbd5e1', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 7.0.0 — Ecos que Despertam:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        O bioma inicial Bosque Sussurrante (Fases 1-5, com seus próprios monstros e chefe), o Mercador Ambulante em combate com 5 Elixires exclusivos de uso único por encontro, o novo slot de equipamento Amuleto e os pets iniciais Sprite Lumen e Moeda Alada.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v6.0.0 (condensado: 6.0.0 a 6.1.0) */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#06b6d4', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 6.0.0 — O Despertar da Cidadela:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Marco de lançamento da Cidadela Astral completa (8 construções, arte definitiva), a aba de Estatísticas Completas, e uma rodada de balanceamento pós-lançamento: XP fixo e sem drops de item na Torre Infinita, correção do Set Celestial mais fraco que o Pandemoníaco, teto de 5.000 Ouro na venda de equipamentos, Roubo de Vida rebalanceado, e exportação/importação de save por arquivo.
                      </div>
                    </div>
                  </div>
                </div>

                {/* v5.0.0 (condensado: 5.0.0 a 5.9.0) */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.78rem', marginBottom: '0.5rem' }}>✨ Versão 5.0.0 — Transcendência e o Despertar da Cidadela:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <div style={{ marginTop: '0.1rem', color: '#cbd5e1', fontSize: '0.68rem', lineHeight: 1.4 }}>
                        Nova aba de Transcendência com a classe Avatar, a Loja Celestial, o Espelho da Ecoterra (segundo ciclo com monstros fortalecidos) e o slot de equipamento Colar Místico. Na sequência, a fundação completa da Cidadela Astral: Depósito, Quartel de Expedições, Academia Militar, Torre de Vigia Astral (produção passiva de Chaves), Oficina de Automação da Forja, Sifão de Essência Cósmica, Altar de Sincronia Elemental e Laboratório de Relíquias Místicas, todas com arte definitiva integrada. Recalibragem do início de jogo (curva de XP, meta de abates do Bestiário, drop de Chaves da Torre), ergonomia (pressionar-e-segurar nos botões, tela sempre ativa, nome de personagem, Modo de Economia) e balanceamento do Avatar (passiva infinita, teto de nível estendido).
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
