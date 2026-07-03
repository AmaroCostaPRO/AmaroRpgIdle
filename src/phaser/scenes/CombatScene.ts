import Phaser from 'phaser';
import { CombatFSM, CombatState } from '../../core/CombatFSM';
import { bridge } from '../../bridge/GameBridge';
import { GameEvent, ENEMIES_PER_STAGE } from '../../core/types';
import { useGameStore, CLASS_CONFIGS } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';

export const ZOOM_FACTOR = 1.35;

export class CombatScene extends Phaser.Scene {
  private fsm!: CombatFSM;
  private background!: Phaser.GameObjects.TileSprite;
  private playerBody!: Phaser.GameObjects.Image;
  private enemyBody!: Phaser.GameObjects.Image;
  private enemyLevelText!: Phaser.GameObjects.Text;
  private enemyStatusText!: Phaser.GameObjects.Text;
  private playerStatusText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private enemyHPBar!: Phaser.GameObjects.Graphics;
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private unsubscribeSkill?: () => void;
  private unsubscribeFrenzyBoost?: () => void;
  private currentBgTexture: string = 'background';
  private accumulatedTime: number = 0;

  public readonly PLAYER_START_X = 200;
  public readonly PLAYER_START_Y = Math.round((600 - 50 * ZOOM_FACTOR) - (125 * ZOOM_FACTOR) / 2);
  public readonly ENEMY_START_X = 900;
  public readonly ENEMY_START_Y = Math.round((600 - 50 * ZOOM_FACTOR) - (125 * ZOOM_FACTOR) / 2);

  constructor() {
    super('CombatScene');
  }

  preload(): void {
    // Carrega os assets originais e as novas texturas de classe
    this.load.image('background', 'assets/medieval_background.png');
    this.load.image('desert_background', 'assets/desert_background.png');
    this.load.image('snow_background', 'assets/snow_background.png');
    this.load.image('cemetery_background', 'assets/cemetery_background.png');
    this.load.image('ruins_background', 'assets/ruins_background.png');
    this.load.image('hero', 'assets/hero_sprite.png');
    this.load.image('mage_sprite', 'assets/mage_sprite.png');
    this.load.image('ranger_sprite', 'assets/ranger_sprite.png');
    this.load.image('paladin_sprite', 'assets/paladin_sprite.png');
    this.load.image('cleric_sprite', 'assets/cleric_sprite.png');
    this.load.image('rogue_sprite', 'assets/rogue_sprite.png');

    // Inimigos - Fase 1 (Floresta)
    this.load.image('enemy_goblin', 'assets/enemy_goblin.png');
    this.load.image('enemy_wolf', 'assets/enemy_wolf.png');
    this.load.image('enemy_orc', 'assets/enemy_orc.png');
    this.load.image('boss_forest_golem', 'assets/boss_forest_golem.png');

    // Inimigos - Fase 2 (Deserto)
    this.load.image('enemy_sand_serpent', 'assets/enemy_sand_serpent.png');
    this.load.image('enemy_desert_bandit', 'assets/enemy_desert_bandit.png');
    this.load.image('enemy_scorpion', 'assets/enemy_scorpion.png');

    // Inimigos - Fase 3 (Neve)
    this.load.image('enemy_ice_elemental', 'assets/enemy_ice_elemental.png');
    this.load.image('enemy_yeti', 'assets/enemy_yeti.png');
    this.load.image('boss_frost_dragon', 'assets/boss_frost_dragon.png');

    // Inimigos - Fase 4 (Cemitério)
    this.load.image('enemy_skeleton', 'assets/enemy_skeleton.png');
    this.load.image('enemy_zombie', 'assets/enemy_zombie.png');
    this.load.image('enemy_ghost', 'assets/enemy_ghost.png');
    this.load.image('enemy_necromancer', 'assets/enemy_necromancer.png');

    // Inimigos - Fase 5 (Ruínas)
    this.load.image('enemy_gargoyle', 'assets/enemy_gargoyle.png');
    this.load.image('enemy_living_armor', 'assets/enemy_living_armor.png');
    this.load.image('enemy_imp', 'assets/enemy_imp.png');
    this.load.image('boss_archdemon', 'assets/boss_archdemon.png');
  }

  // Função avançada para mapear e remover fundo quadriculado (xadrez) ou sólido em tempo de execução
  private makeTextureTransparent(textureKey: string, outputKey: string): void {
    if (this.textures.exists(outputKey)) {
      return;
    }
    const texture = this.textures.get(textureKey);
    if (!texture) return;
    
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!source) return;

    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Coleta as cores exclusivas que aparecem na primeira linha de pixels (y = 0)
    const backgroundColors: { r: number; g: number; b: number }[] = [];
    
    for (let x = 0; x < canvas.width; x++) {
      const idx = x * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const exists = backgroundColors.some(c => Math.abs(c.r - r) + Math.abs(c.g - g) + Math.abs(c.b - b) < 10);
      if (!exists) {
        backgroundColors.push({ r, g, b });
      }
    }

    const tolerance = 30;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const isBackground = backgroundColors.some(c => {
        return Math.abs(c.r - r) + Math.abs(c.g - g) + Math.abs(c.b - b) < tolerance;
      });

      if (isBackground) {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    this.textures.addCanvas(outputKey, canvas);
  }

  create(): void {
    // Processar texturas para aplicar a transparência inteligente
    this.makeTextureTransparent('hero', 'hero_transparent');
    this.makeTextureTransparent('mage_sprite', 'mage_transparent');
    this.makeTextureTransparent('ranger_sprite', 'ranger_transparent');
    this.makeTextureTransparent('paladin_sprite', 'paladin_transparent');
    this.makeTextureTransparent('cleric_sprite', 'cleric_transparent');
    this.makeTextureTransparent('rogue_sprite', 'rogue_transparent');

    this.makeTextureTransparent('enemy_orc', 'enemy_orc_transparent');
    this.makeTextureTransparent('enemy_goblin', 'enemy_goblin_transparent');
    this.makeTextureTransparent('enemy_skeleton', 'enemy_skeleton_transparent');
    this.makeTextureTransparent('enemy_necromancer', 'enemy_necromancer_transparent');
    
    // Novas Transparências
    this.makeTextureTransparent('enemy_wolf', 'enemy_wolf_transparent');
    this.makeTextureTransparent('boss_forest_golem', 'boss_forest_golem_transparent');
    this.makeTextureTransparent('enemy_sand_serpent', 'enemy_sand_serpent_transparent');
    this.makeTextureTransparent('enemy_desert_bandit', 'enemy_desert_bandit_transparent');
    this.makeTextureTransparent('enemy_scorpion', 'enemy_scorpion_transparent');
    this.makeTextureTransparent('enemy_ice_elemental', 'enemy_ice_elemental_transparent');
    this.makeTextureTransparent('enemy_yeti', 'enemy_yeti_transparent');
    this.makeTextureTransparent('boss_frost_dragon', 'boss_frost_dragon_transparent');
    this.makeTextureTransparent('enemy_zombie', 'enemy_zombie_transparent');
    this.makeTextureTransparent('enemy_ghost', 'enemy_ghost_transparent');
    this.makeTextureTransparent('enemy_gargoyle', 'enemy_gargoyle_transparent');
    this.makeTextureTransparent('enemy_living_armor', 'enemy_living_armor_transparent');
    this.makeTextureTransparent('enemy_imp', 'enemy_imp_transparent');
    this.makeTextureTransparent('boss_archdemon', 'boss_archdemon_transparent');

    // Fundo medieval com TileSprite
    this.background = this.add.tileSprite(400, 300, 800, 600, 'background');
    const baseBgScale = 600 / 1024;
    const currentBgScale = baseBgScale * ZOOM_FACTOR;
    this.background.setTileScale(currentBgScale, currentBgScale);
    this.background.tilePositionY = 1024 - (600 / currentBgScale);

    // Barra de vida flutuante do inimigo e do jogador, e a barra de XP do canvas
    this.enemyHPBar = this.add.graphics();
    this.playerHPBar = this.add.graphics();
    this.xpBar = this.add.graphics();

    // Mapeamento da classe ativa para textura
    const classId = useGameStore.getState().character.classId || 'warrior';
    let playerTexture = 'hero_transparent';
    if (classId === 'mage') playerTexture = 'mage_transparent';
    else if (classId === 'ranger') playerTexture = 'ranger_transparent';
    else if (classId === 'paladin') playerTexture = 'paladin_transparent';
    else if (classId === 'cleric') playerTexture = 'cleric_transparent';
    else if (classId === 'rogue') playerTexture = 'rogue_transparent';

    // Player (Herói) usando a textura da classe atualizada
    this.playerBody = this.add.image(this.PLAYER_START_X, this.PLAYER_START_Y, playerTexture);
    this.playerBody.setDisplaySize(125 * ZOOM_FACTOR, 125 * ZOOM_FACTOR);
    this.playerBody.setFlipX(false);

    // Inicializar FSM de combate antes de criar os inimigos para pegar informações corretas
    this.fsm = new CombatFSM(this, null);

    // Inimigo usando a textura do tipo de inimigo ativo
    this.enemyBody = this.add.image(this.ENEMY_START_X, this.ENEMY_START_Y, this.fsm.currentEnemy.texture + '_transparent');
    
    // Atualiza o target do FSM
    this.fsm['target'] = this.enemyBody;

    // Textos informativos
    const classConfig = useGameStore.getState().character;
    const friendlyName = (CLASS_CONFIGS[classConfig.classId]?.name || classConfig.classId).toUpperCase();

    this.add.text(this.PLAYER_START_X, this.PLAYER_START_Y - 80 * ZOOM_FACTOR, friendlyName, { 
      fontSize: '19px', 
      color: '#60a5fa', 
      fontStyle: 'bold', 
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5,
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5);

    // Inicializa o texto vazio; a posição correta, cor e conteúdo serão atribuídos imediatamente pela chamada do respawnEnemyAt abaixo
    this.enemyLevelText = this.add.text(this.enemyBody.x, this.ENEMY_START_Y - 80 * ZOOM_FACTOR, '', { 
      fontSize: '19px', 
      color: '#ffffff', 
      fontStyle: 'bold', 
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5,
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5);

    this.enemyStatusText = this.add.text(this.enemyBody.x, this.ENEMY_START_Y - 95 * ZOOM_FACTOR, '', {
      fontSize: '14px',
      color: '#facc15',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    this.playerStatusText = this.add.text(this.playerBody.x, this.PLAYER_START_Y - 95 * ZOOM_FACTOR, '', {
      fontSize: '14px',
      color: '#fef08a',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    this.xpText = this.add.text(400, 552, '', {
      fontSize: '16px',
      color: '#fbbf24',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    // Faz o spawn inicial do primeiro inimigo, o que configurará o enemyLevelText perfeitamente
    this.respawnEnemyAt(this.ENEMY_START_X, this.fsm.currentEnemy);

    // Painel de Progresso do Estágio
    this.stageText = this.add.text(400, 35, 'Fase 1 - Progresso: 0/10', {
      fontSize: '16px',
      color: '#f59e0b',
      fontStyle: 'bold',
      fontFamily: 'serif',
      stroke: '#000000',
      strokeThickness: 4,
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    // Ouvir comandos de skill
    this.unsubscribeSkill = bridge.subscribe(GameEvent.EQUIP_SKILL, (payload) => {
      this.fsm.triggerSkill(payload.skillId);
    });

    this.unsubscribeFrenzyBoost = bridge.subscribe('ACTIVATE_FRENZY_BOOST' as any, (payload) => {
      this.fsm.activateFrenzyBoost(payload.duration || 60000);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanup();
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.cleanup();
    });

    // Captura cliques/toques no canvas para desferir dano de toque
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.fsm && useGameStore.getState().character.introLoreShown !== false) {
        this.fsm.handlePlayerTap(pointer.x, pointer.y);
      }
    });

    // Notifica o React que a arena de combate foi carregada e inicializada com sucesso
    bridge.emit(GameEvent.ARENA_READY, {});

    console.log(`[Phaser] CombatScene configurada para classe ${classId}!`);
  }

  update(time: number, delta: number): void {
    if (this.fsm) {
      const isLoreOpen = useGameStore.getState().character.introLoreShown === false;
      const gameSpeed = isLoreOpen ? 0 : useGameStore.getState().gameSpeed;
      const speedMultiplier = gameSpeed === 0 ? 0 : (gameSpeed || 1);
      this.accumulatedTime += delta * speedMultiplier;

      // Ajusta o timeScale dos tweens para acelerar animações visuais e danos flutuantes
      if (this.tweens.timeScale !== speedMultiplier) {
        this.tweens.timeScale = speedMultiplier;
      }

      this.fsm.update(delta * speedMultiplier);

      if (this.enemyLevelText && this.enemyBody) {
        const isMoving = this.fsm.getCurrentState() === CombatState.MOVING;
        this.enemyLevelText.x = isMoving ? this.enemyBody.x : 600;
      }

      // Atualiza posição do texto de status do inimigo
      if (this.enemyStatusText && this.enemyBody && this.enemyLevelText) {
        const isMoving = this.fsm.getCurrentState() === CombatState.MOVING;
        this.enemyStatusText.x = isMoving ? this.enemyBody.x : 600;
        this.enemyStatusText.y = this.enemyLevelText.y - 18 * ZOOM_FACTOR;

        // Determina qual texto de status exibir baseado nos efeitos ativos
        const effects = this.fsm.enemyEffects;
        if (effects.some(e => e.id === 'stun')) {
          this.enemyStatusText.setText('[ATORDADO]');
          this.enemyStatusText.setColor('#facc15');
        } else if (effects.some(e => e.id === 'poison')) {
          this.enemyStatusText.setText('[ENVENENADO]');
          this.enemyStatusText.setColor('#22c55e');
        } else if (effects.some(e => e.id === 'slow')) {
          this.enemyStatusText.setText('[LENTO]');
          this.enemyStatusText.setColor('#60a5fa');
        } else if (effects.some(e => e.id === 'burn')) {
          this.enemyStatusText.setText('[QUEIMANDO]');
          this.enemyStatusText.setColor('#f97316');
        } else if (effects.some(e => e.id === 'weakness')) {
          this.enemyStatusText.setText('[ENFRAQUECIDO]');
          this.enemyStatusText.setColor('#f87171');
        } else if (effects.some(e => e.id === 'exposed')) {
          this.enemyStatusText.setText('[EXPOSTO]');
          this.enemyStatusText.setColor('#c084fc');
        } else {
          this.enemyStatusText.setText('');
        }
      }

      // Atualiza posição do texto de status do jogador
      if (this.playerStatusText && this.playerBody) {
        this.playerStatusText.x = this.PLAYER_START_X;
        this.playerStatusText.y = this.PLAYER_START_Y - (125 * ZOOM_FACTOR / 2) - 38 * ZOOM_FACTOR;

        const pEffects = this.fsm.playerEffects;
        if (pEffects.some(e => e.id === 'consecration')) {
          this.playerStatusText.setText('[SANTIFICADO]');
          this.playerStatusText.setColor('#fef08a');
        } else {
          this.playerStatusText.setText('');
        }
      }

      if (this.stageText) {
        const char = this.fsm.characterData;
        if (char) {
          const isBoss = char.enemiesDefeatedInStage === ENEMIES_PER_STAGE;
          // Labels e cores por dificuldade
          const modeLabel = char.currentStage >= 16 ? 'APOCALIPSE'
            : char.currentStage >= 11 ? 'INFERNO'
            : char.currentStage >= 6 ? 'PESADELO' : 'FASE';
          const modeColor = char.currentStage >= 16 ? '#c084fc'
            : char.currentStage >= 11 ? '#fb923c'
            : char.currentStage >= 6 ? '#f43f5e' : '#f59e0b';
          if (isBoss) {
            this.stageText.setText(`${modeLabel} ${char.currentStage} - CHEFE FINAL`);
            this.stageText.setColor('#c084fc');
          } else {
            this.stageText.setText(`${modeLabel} ${char.currentStage} - Progresso: ${char.enemiesDefeatedInStage}/${ENEMIES_PER_STAGE}`);
            this.stageText.setColor(modeColor);
          }
        }
      }

      // Atualiza o background e o tint maligno dependendo do estágio
      this.updateBackgroundForStage();

      // Desenhar barra de vida acima do inimigo e do jogador, e barra de XP
      this.drawEnemyHPBar();
      this.drawPlayerHPBar();
      this.drawXPBar();

      if (this.fsm.getCurrentState() === CombatState.MOVING) {
        this.playerBody.y = this.PLAYER_START_Y + Math.sin(this.accumulatedTime * 0.015) * 4;
      } else {
        this.playerBody.y = this.PLAYER_START_Y;
      }

      // Aplicar colorização (tint) e pulsação de tamanho de Elites nos sprites dependendo de status efeitos ativos
      if (this.fsm.enemyHP > 0 && this.enemyBody) {
        // Pulsação suave de tamanho para Elites
        const isBoss = this.fsm.currentEnemy?.id.startsWith('boss_');
        let baseSize = (isBoss ? 165 : 125) * ZOOM_FACTOR;
        if (this.fsm.isElite && this.fsm.getCurrentState() !== CombatState.DEAD) {
          const pulseScale = 1.15 + Math.sin(this.accumulatedTime * 0.005) * 0.03;
          this.enemyBody.setDisplaySize(baseSize * pulseScale, baseSize * pulseScale);
        }

        const effects = this.fsm.enemyEffects;
        if (effects.some(e => e.id === 'stun')) {
          this.enemyBody.setTint(0xfacc15); // Amarelo/Dourado se atordoado
        } else if (effects.some(e => e.id === 'poison')) {
          this.enemyBody.setTint(0x22c55e); // Verde se envenenado
        } else if (effects.some(e => e.id === 'slow')) {
          this.enemyBody.setTint(0x60a5fa); // Azul claro se lento
        } else if (effects.some(e => e.id === 'burn')) {
          this.enemyBody.setTint(0xf97316); // Laranja se queimando
        } else if (effects.some(e => e.id === 'weakness')) {
          this.enemyBody.setTint(0xf87171); // Vermelho fraco se enfraquecido
        } else if (effects.some(e => e.id === 'exposed')) {
          this.enemyBody.setTint(0xc084fc); // Roxo se exposto
        } else {
          // Aplicar tint de dificuldade ao inimigo se não houver efeito ativo
          const char = useGameStore.getState().character;
          if (this.fsm.isElite) {
            // Onda senoidal de 0.6 a 1.0 para pulso prateado metálico
            const pulse = 0.7 + Math.sin(this.accumulatedTime * 0.007) * 0.3;
            const component = Math.floor(160 + pulse * 95);
            const tintVal = (component << 16) + (component << 8) + component;
            this.enemyBody.setTint(tintVal);
          } else if (char && char.currentStage >= 16) {
            this.enemyBody.setTint(0xdd88ff); // Apocalipse: roxo
          } else if (char && char.currentStage >= 11) {
            this.enemyBody.setTint(0xff8844); // Inferno: laranja
          } else if (char && char.currentStage >= 6) {
            this.enemyBody.setTint(0xff9999); // Pesadelo: vermelho
          } else {
            this.enemyBody.clearTint();
          }
        }
      }

      if (this.fsm.playerHP > 0 && this.playerBody) {
        const pEffects = this.fsm.playerEffects;
        if (pEffects.some(e => e.id === 'consecration')) {
          this.playerBody.setTint(0xfef08a); // Tint dourado brilhante se consagrado
        } else {
          this.playerBody.clearTint();
        }
      }
    }
  }

  private updateBackgroundForStage(): void {
    const char = useGameStore.getState().character;
    if (!char) return;

    const stage = char.currentStage;
    let textureKey = 'background'; // Default: Floresta
    
    // Mapeamento de fase para background (ciclos de 1-5)
    const stageTheme = ((stage - 1) % 5) + 1;
    if (stageTheme === 2) textureKey = 'desert_background';
    else if (stageTheme === 3) textureKey = 'snow_background';
    else if (stageTheme === 4) textureKey = 'cemetery_background';
    else if (stageTheme === 5) textureKey = 'ruins_background';

    if (this.currentBgTexture !== textureKey) {
      console.log(`[CombatScene] Atualizando background para: ${textureKey}`);
      this.background.setTexture(textureKey);
      this.currentBgTexture = textureKey;
      const baseBgScale = 600 / 1024;
      const currentBgScale = baseBgScale * ZOOM_FACTOR;
      this.background.setTileScale(currentBgScale, currentBgScale);
      this.background.tilePositionY = 1024 - (600 / currentBgScale);
    }

    // Aplicar tint de acordo com a dificuldade
    if (stage >= 16) {
      // Apocalipse: roxo sinistro
      this.background.setTint(0x440066);
      if (this.enemyBody) this.enemyBody.setTint(0xdd88ff);
    } else if (stage >= 11) {
      // Inferno: laranja queimado
      this.background.setTint(0x661100);
      if (this.enemyBody) this.enemyBody.setTint(0xff8844);
    } else if (stage >= 6) {
      // Pesadelo: vermelho escuro
      this.background.setTint(0x773333);
      if (this.enemyBody) this.enemyBody.setTint(0xff9999);
    } else {
      this.background.clearTint();
      if (this.enemyBody) this.enemyBody.clearTint();
    }
  }

  private drawPlayerHPBar(): void {
    if (!this.playerHPBar || !this.playerBody || !this.fsm) return;
    
    this.playerHPBar.clear();
    
    // Só desenha se o jogador estiver vivo e visível
    if (this.fsm.playerHP > 0 && this.playerBody.alpha > 0.1) {
      const barWidth = 70 * ZOOM_FACTOR;
      const barHeight = 7 * ZOOM_FACTOR;
      // Posiciona de forma estática baseada no PLAYER_START_X / Y para não oscilar/tremer no ataque/caminhada
      const x = this.PLAYER_START_X - barWidth / 2;
      const y = this.PLAYER_START_Y - (125 * ZOOM_FACTOR) / 2 - 5 * ZOOM_FACTOR; // Posição estática segura abaixo do nome

      // Fundo preto translúcido da barra
      this.playerHPBar.fillStyle(0x000000, 0.7);
      this.playerHPBar.fillRect(x, y, barWidth, barHeight);

      // Progresso da vida em verde brilhante
      const hpRatio = Math.max(0, Math.min(1, this.fsm.playerHP / this.fsm.playerMaxHP));
      this.playerHPBar.fillStyle(0x22c55e, 1.0);
      this.playerHPBar.fillRect(x, y, barWidth * hpRatio, barHeight);

      // Borda da barra de vida
      this.playerHPBar.lineStyle(1.5, 0x1f2937, 1);
      this.playerHPBar.strokeRect(x, y, barWidth, barHeight);
    }
  }

  private drawEnemyHPBar(): void {
    if (!this.enemyHPBar || !this.enemyBody || !this.fsm) return;
    
    this.enemyHPBar.clear();
    
    // Só desenha se o inimigo estiver vivo e visível
    if (this.fsm.enemyHP > 0 && this.fsm.getCurrentState() !== CombatState.DEAD && this.enemyBody.alpha > 0.1) {
      const barWidth = 70 * ZOOM_FACTOR;
      const barHeight = 7 * ZOOM_FACTOR;
      
      // Se estiver na transição de aproximação, acompanha o sprite. Se estiver fixo em combate, usa a posição estática (X = 600)
      const isMoving = this.fsm.getCurrentState() === CombatState.MOVING;
      const targetX = isMoving ? this.enemyBody.x : 600;
      
      const x = targetX - barWidth / 2;
      const y = this.enemyBody.y - (this.enemyBody.displayHeight / 2) - 15 * ZOOM_FACTOR; // Fica abaixo do nome do inimigo

      // Fundo preto translúcido da barra
      this.enemyHPBar.fillStyle(0x000000, 0.7);
      this.enemyHPBar.fillRect(x, y, barWidth, barHeight);

      // Progresso da vida em vermelho brilhante
      const hpRatio = Math.max(0, Math.min(1, this.fsm.enemyHP / this.fsm.enemyMaxHP));
      this.enemyHPBar.fillStyle(0xef4444, 1.0);
      this.enemyHPBar.fillRect(x, y, barWidth * hpRatio, barHeight);

      // Borda da barra de vida
      this.enemyHPBar.lineStyle(1.5, 0x1f2937, 1);
      this.enemyHPBar.strokeRect(x, y, barWidth, barHeight);
    }
  }

  private drawXPBar(): void {
    if (!this.xpBar || !this.xpText) return;

    this.xpBar.clear();

    const char = useGameStore.getState().character;
    if (!char) return;

    const level = char.level || 1;
    const xp = char.xp || 0;
    const xpNeeded = level * 100;
    const xpPct = Math.max(0, Math.min(1, xp / xpNeeded));

    // Dimensões da barra de XP (tamanho fixo harmonioso no canvas de 800x600)
    const barWidth = 680;
    const barHeight = 8;
    const x = 400 - barWidth / 2; // 60
    const y = 572; // Posição abaixo dos personagens (próxima à borda inferior)

    // Fundo preto translúcido da barra
    this.xpBar.fillStyle(0x000000, 0.65);
    this.xpBar.fillRect(x, y, barWidth, barHeight);

    // Progresso da XP em amarelo/dourado brilhante (#fbbf24 = 0xfbbf24)
    if (xpPct > 0) {
      this.xpBar.fillStyle(0xfbbf24, 1.0);
      this.xpBar.fillRect(x, y, barWidth * xpPct, barHeight);
    }

    // Borda da barra de XP
    this.xpBar.lineStyle(1.5, 0x1f2937, 0.95);
    this.xpBar.strokeRect(x, y, barWidth, barHeight);

    // Atualizar o texto informativo centralizado
    const formattedXp = xp.toLocaleString();
    const formattedNeeded = xpNeeded.toLocaleString();
    const pctString = (xpPct * 100).toFixed(1);
    this.xpText.setText(`Nv. ${level} • XP: ${formattedXp} / ${formattedNeeded} (${pctString}%)`);
  }

  public getPlayerX(): number { return this.playerBody.x; }
  public getPlayerY(): number { return this.playerBody.y; }
  public getEnemyX(): number { return this.enemyBody.x; }
  public getEnemyY(): number { return this.enemyBody.y; }

  public scrollWorld(delta: number): void {
   const scrollSpeed = 0.22; 
    this.background.tilePositionX += scrollSpeed * delta;
    
    // O inimigo se aproxima
    const approachSpeed = 0.18;
    this.enemyBody.x -= approachSpeed * delta;
  }

  public resetPlayerPosition(): void {
    this.playerBody.setPosition(this.PLAYER_START_X, this.PLAYER_START_Y);
  }

  public animatePlayerAttack(): void {
    AudioManager.getInstance().playSlash();
    this.tweens.add({
      targets: this.playerBody,
      x: this.PLAYER_START_X + 45 * ZOOM_FACTOR,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.playerBody.x = this.PLAYER_START_X;
      }
    });
  }

  public animateEnemyAttack(): void {
    this.tweens.add({
      targets: this.enemyBody,
      x: this.enemyBody.x - 45 * ZOOM_FACTOR,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  public spawnDamageText(x: number, y: number, text: string, color: string): void {
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const dmgText = this.add.text(roundedX, roundedY, text, {
      fontSize: '18px',
      color: color,
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgText,
      y: roundedY - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        dmgText.destroy();
      }
    });
  }

  public spawnTouchEffect(isCrit: boolean, damage: number, clickX?: number, clickY?: number): void {
    const targetX = Math.round(clickX ?? (this.enemyBody.x + (Math.random() * 80 - 40)));
    const targetY = Math.round(clickY ?? (this.enemyBody.y + (Math.random() * 80 - 40)));

    const color = isCrit ? '#facc15' : '#38bdf8';
    const text = isCrit ? `💥 ${damage}!` : `${damage}`;
    const fontSize = isCrit ? '52px' : '36px';

    const dmgText = this.add.text(targetX, targetY, text, {
      fontSize: fontSize,
      color: color,
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: isCrit ? 8 : 5,
      padding: { left: 25, right: 25, top: 15, bottom: 15 }
    }).setOrigin(0.5);

    const gameSpeed = useGameStore.getState().gameSpeed;
    const speedMultiplier = gameSpeed === 0 ? 0 : (gameSpeed || 1);
    const scaleFactor = speedMultiplier > 0 ? 1 / speedMultiplier : 1;

    const textTween = this.tweens.add({
      targets: dmgText,
      y: targetY - 90,
      scale: isCrit ? 1.5 : 1.2,
      alpha: 0,
      duration: 750,
      onComplete: () => {
        dmgText.destroy();
      }
    });
    textTween.setTimeScale(scaleFactor);

    const clickCircle = this.add.circle(targetX, targetY, 5, isCrit ? 0xfacc15 : 0x38bdf8, 0.8);
    const circleTween = this.tweens.add({
      targets: clickCircle,
      radius: isCrit ? 50 : 32,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        clickCircle.destroy();
      }
    });
    circleTween.setTimeScale(scaleFactor);
  }

  public animateEnemyDeath(): void {
    const isBoss = this.fsm.currentEnemy?.id.startsWith('boss_') || false;
    AudioManager.getInstance().playEnemyDefeat(isBoss);
    this.tweens.add({
      targets: this.enemyBody,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: 180,
      duration: 450,
      ease: 'Power2'
    });
  }

  public respawnEnemyAt(startX: number, enemyType: any): void {
    if (this.enemyBody) {
      this.enemyBody.setTexture(enemyType.texture + '_transparent');
      
      const isBoss = enemyType.id.startsWith('boss_');
      let size = (isBoss ? 165 : 125) * ZOOM_FACTOR;
      if (this.fsm.isElite) {
        size *= 1.15; // 15% de aumento de tamanho para Elites
      }
      
      const targetY = Math.round((600 - 50 * ZOOM_FACTOR) - size / 2 + (enemyType.yOffset || 0) * ZOOM_FACTOR);
      
      this.enemyBody.setPosition(startX, targetY);
      this.enemyBody.setDisplaySize(size, size);
      this.enemyBody.setAlpha(1);
      this.enemyBody.angle = 0;
      this.enemyBody.setFlipX(!!enemyType.flipX);
    }
    if (this.enemyLevelText && this.enemyBody) {
      const isBoss = this.fsm.characterData?.enemiesDefeatedInStage === ENEMIES_PER_STAGE || enemyType.id.startsWith('boss_');
      let enemyName = isBoss ? `CHEFE ${enemyType.name}` : enemyType.name;
      if (this.fsm.isElite) {
        const afixLabel = this.fsm.eliteAfix ? ` [Elite ${this.fsm.eliteAfix.toUpperCase()}]` : ' [Elite]';
        enemyName = `${enemyType.name}${afixLabel}`;
      }
      const level = this.fsm.enemyLevel;
      this.enemyLevelText.setText(`${enemyName} (Lv. ${level})`);
      
      if (this.fsm.isElite) {
        this.enemyLevelText.setColor('#e2e8f0'); // Prateado metálico para nome de Elites
      } else {
        this.enemyLevelText.setColor(enemyType.color);
      }
      
      this.enemyLevelText.y = this.enemyBody.y - (this.enemyBody.displayHeight / 2) - 30 * ZOOM_FACTOR;
    }

    this.tweens.add({
      targets: this.enemyBody,
      alpha: { from: 0, to: 1 },
      duration: 300
    });
  }

  public animatePlayerDeath(): void {
    AudioManager.getInstance().playPlayerDefeat();
    this.tweens.add({
      targets: this.playerBody,
      angle: -90,
      alpha: 0.5,
      y: this.PLAYER_START_Y + 15 * ZOOM_FACTOR,
      duration: 400
    });
  }

  public respawnPlayer(): void {
    this.playerBody.setPosition(this.PLAYER_START_X, this.PLAYER_START_Y);
    this.playerBody.angle = 0;
    this.playerBody.setAlpha(1);

    this.tweens.add({
      targets: this.playerBody,
      alpha: { from: 0, to: 1 },
      duration: 300
    });
  }

  public animateSlashEffect(): void {
    AudioManager.getInstance().playSlash();
    const slashSize = 45 * ZOOM_FACTOR;
    const slash = this.add.line(
      this.enemyBody.x, this.enemyBody.y,
      -slashSize, -slashSize, slashSize, slashSize,
      0xf43f5e, 1.0
    );
    slash.setLineWidth(5 * ZOOM_FACTOR);

    this.cameras.main.shake(120, 0.01);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 200,
      onComplete: () => slash.destroy()
    });
  }

  public animateFireballEffect(): void {
    AudioManager.getInstance().playFireball();
    const fireball = this.add.circle(this.playerBody.x, this.playerBody.y, 12 * ZOOM_FACTOR, 0xf97316);
    fireball.setStrokeStyle(2 * ZOOM_FACTOR, 0xfebd29);

    this.tweens.add({
      targets: fireball,
      x: this.enemyBody.x,
      y: this.enemyBody.y,
      duration: 250,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        fireball.destroy();
        
        const explosion = this.add.circle(this.enemyBody.x, this.enemyBody.y, 40 * ZOOM_FACTOR, 0xfebd29, 0.7);
        this.tweens.add({
          targets: explosion,
          scaleX: 1.6,
          scaleY: 1.6,
          alpha: 0,
          duration: 250,
          onComplete: () => explosion.destroy()
        });
        this.cameras.main.shake(100, 0.007);
      }
    });
  }

  public animateHealEffect(): void {
    AudioManager.getInstance().playHeal();
    const healRing = this.add.circle(this.playerBody.x, this.playerBody.y + 10 * ZOOM_FACTOR, 30 * ZOOM_FACTOR, 0x10b981, 0.0);
    healRing.setStrokeStyle(3 * ZOOM_FACTOR, 0x34d399);

    this.tweens.add({
      targets: healRing,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: { from: 1.0, to: 0.0 },
      y: this.playerBody.y - 25 * ZOOM_FACTOR,
      duration: 500,
      onComplete: () => healRing.destroy()
    });
  }

  public animateFrostboltEffect(): void {
    AudioManager.getInstance().playFireball();
    const bolt = this.add.circle(this.playerBody.x, this.playerBody.y, 8 * ZOOM_FACTOR, 0x38bdf8);
    bolt.setStrokeStyle(2 * ZOOM_FACTOR, 0x93c5fd);

    this.tweens.add({
      targets: bolt,
      x: this.enemyBody.x,
      y: this.enemyBody.y,
      duration: 250,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        bolt.destroy();
        const splash = this.add.circle(this.enemyBody.x, this.enemyBody.y, 25 * ZOOM_FACTOR, 0x93c5fd, 0.6);
        this.tweens.add({
          targets: splash,
          scaleX: 1.4,
          scaleY: 1.4,
          alpha: 0,
          duration: 200,
          onComplete: () => splash.destroy()
        });
      }
    });
  }

  public animateLightningEffect(): void {
    AudioManager.getInstance().playFireball();
    const startX = this.enemyBody.x;
    const startY = this.enemyBody.y - 150 * ZOOM_FACTOR;
    const endX = this.enemyBody.x;
    const endY = this.enemyBody.y;

    const points = [
      new Phaser.Math.Vector2(startX, startY),
      new Phaser.Math.Vector2(startX + 15, startY + 40),
      new Phaser.Math.Vector2(startX - 10, startY + 80),
      new Phaser.Math.Vector2(startX + 10, startY + 120),
      new Phaser.Math.Vector2(endX, endY)
    ];

    const rt = this.add.graphics();
    rt.lineStyle(4 * ZOOM_FACTOR, 0xfacc15, 1.0);
    rt.beginPath();
    rt.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      rt.lineTo(points[i].x, points[i].y);
    }
    rt.strokePath();

    this.cameras.main.shake(120, 0.012);

    this.tweens.add({
      targets: rt,
      alpha: 0,
      duration: 150,
      onComplete: () => rt.destroy()
    });
  }

  public animateMeteorEffect(): void {
    AudioManager.getInstance().playFireball();
    const meteor = this.add.circle(this.enemyBody.x - 120 * ZOOM_FACTOR, this.enemyBody.y - 200 * ZOOM_FACTOR, 20 * ZOOM_FACTOR, 0xe11d48);
    meteor.setStrokeStyle(4 * ZOOM_FACTOR, 0xf97316);

    this.tweens.add({
      targets: meteor,
      x: this.enemyBody.x,
      y: this.enemyBody.y,
      duration: 350,
      ease: 'Quad.easeIn',
      onComplete: () => {
        meteor.destroy();
        const blast = this.add.circle(this.enemyBody.x, this.enemyBody.y, 60 * ZOOM_FACTOR, 0xf97316, 0.8);
        this.tweens.add({
          targets: blast,
          scaleX: 1.8,
          scaleY: 1.8,
          alpha: 0,
          duration: 300,
          onComplete: () => blast.destroy()
        });
        this.cameras.main.shake(180, 0.015);
      }
    });
  }

  public animatePoisonArrowEffect(): void {
    AudioManager.getInstance().playSlash();
    const arrow = this.add.line(
      this.playerBody.x, this.playerBody.y,
      0, 0, 25 * ZOOM_FACTOR, 0,
      0x22c55e, 1.0
    );
    arrow.setLineWidth(3 * ZOOM_FACTOR);

    this.tweens.add({
      targets: arrow,
      x: this.enemyBody.x,
      y: this.enemyBody.y,
      duration: 200,
      onComplete: () => {
        arrow.destroy();
        const cloud = this.add.circle(this.enemyBody.x, this.enemyBody.y, 25 * ZOOM_FACTOR, 0x22c55e, 0.5);
        this.tweens.add({
          targets: cloud,
          scaleX: 1.3,
          scaleY: 1.3,
          alpha: 0,
          duration: 250,
          onComplete: () => cloud.destroy()
        });
      }
    });
  }

  public animateConsecrationEffect(): void {
    AudioManager.getInstance().playHeal();
    const circle = this.add.circle(this.playerBody.x, this.playerBody.y + 40 * ZOOM_FACTOR, 55 * ZOOM_FACTOR, 0xfef08a, 0.15);
    circle.setStrokeStyle(3 * ZOOM_FACTOR, 0xfacc15, 0.8);

    this.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1200,
      onComplete: () => circle.destroy()
    });
  }

  private cleanup(): void {
    if (this.unsubscribeSkill) {
      this.unsubscribeSkill();
      this.unsubscribeSkill = undefined;
    }
    if (this.unsubscribeFrenzyBoost) {
      this.unsubscribeFrenzyBoost();
      this.unsubscribeFrenzyBoost = undefined;
    }
    if (this.fsm) {
      this.fsm.cleanup();
    }
    console.log('[CombatScene] Cleaned up subscriptions.');
  }
}
