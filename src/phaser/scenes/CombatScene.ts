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
  private stageText!: Phaser.GameObjects.Text;
  private enemyHPBar!: Phaser.GameObjects.Graphics;
  private unsubscribeSkill?: () => void;
  private currentBgTexture: string = 'background';

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
    this.load.image('enemy_goblin', 'assets/goblin_sprite.png');
    this.load.image('enemy_wolf', 'assets/enemy_wolf.png');
    this.load.image('enemy_orc', 'assets/enemy_sprite.png');
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
    this.load.image('enemy_skeleton', 'assets/skeleton_sprite.png');
    this.load.image('enemy_zombie', 'assets/enemy_zombie.png');
    this.load.image('enemy_ghost', 'assets/enemy_ghost.png');
    this.load.image('enemy_necromancer', 'assets/necromancer_sprite.png');

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

    // Barra de vida flutuante do inimigo
    this.enemyHPBar = this.add.graphics();

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

    this.add.text(this.PLAYER_START_X, this.PLAYER_START_Y - 65 * ZOOM_FACTOR, friendlyName, { 
      fontSize: '19px', 
      color: '#60a5fa', 
      fontStyle: 'bold', 
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    // Inicializa o texto vazio; a posição correta, cor e conteúdo serão atribuídos imediatamente pela chamada do respawnEnemyAt abaixo
    this.enemyLevelText = this.add.text(this.enemyBody.x, this.ENEMY_START_Y - 65 * ZOOM_FACTOR, '', { 
      fontSize: '19px', 
      color: '#ffffff', 
      fontStyle: 'bold', 
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5
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
      strokeThickness: 4
    }).setOrigin(0.5);

    // Ouvir comandos de skill
    this.unsubscribeSkill = bridge.subscribe(GameEvent.EQUIP_SKILL, (payload) => {
      this.fsm.triggerSkill(payload.skillId);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanup();
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.cleanup();
    });

    console.log(`[Phaser] CombatScene configurada para classe ${classId}!`);
  }

  update(time: number, delta: number): void {
    if (this.fsm) {
      this.fsm.update(delta);

      if (this.enemyLevelText && this.enemyBody) {
        this.enemyLevelText.x = this.enemyBody.x;
      }

      if (this.stageText) {
        const char = this.fsm.characterData;
        if (char) {
          const isBoss = char.enemiesDefeatedInStage === ENEMIES_PER_STAGE;
          const isNightmare = char.currentStage >= 6;
          const modeLabel = isNightmare ? 'PESADELO' : 'FASE';
          const modeColor = isNightmare ? '#f43f5e' : '#f59e0b';
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

      // Desenhar barra de vida acima do inimigo
      this.drawEnemyHPBar();

      if (this.fsm.getCurrentState() === CombatState.MOVING) {
        this.playerBody.y = this.PLAYER_START_Y + Math.sin(time * 0.015) * 4;
      } else {
        this.playerBody.y = this.PLAYER_START_Y;
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

    // Se estágio >= 6, aplicar tint maligno/sombrio
    if (stage >= 6) {
      this.background.setTint(0x773333); // Vermelho escuro
      if (this.enemyBody) {
        this.enemyBody.setTint(0xff9999); // Inimigo com tom corrompido
      }
    } else {
      this.background.clearTint();
      if (this.enemyBody) {
        this.enemyBody.clearTint();
      }
    }
  }

  private drawEnemyHPBar(): void {
    if (!this.enemyHPBar || !this.enemyBody || !this.fsm) return;
    
    this.enemyHPBar.clear();
    
    // Só desenha se o inimigo estiver vivo e visível
    if (this.fsm.enemyHP > 0 && this.fsm.getCurrentState() !== CombatState.DEAD && this.enemyBody.alpha > 0.1) {
      const barWidth = 70 * ZOOM_FACTOR;
      const barHeight = 7 * ZOOM_FACTOR;
      const x = this.enemyBody.x - barWidth / 2;
      const y = this.enemyBody.y - (this.enemyBody.displayHeight / 2) - 10 * ZOOM_FACTOR; // Posição dinâmica acima da cabeça do sprite

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
    const dmgText = this.add.text(x, y, text, {
      fontSize: '18px',
      color: color,
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgText,
      y: y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        dmgText.destroy();
      }
    });
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
      const size = (isBoss ? 165 : 125) * ZOOM_FACTOR;
      const targetY = Math.round((600 - 50 * ZOOM_FACTOR) - size / 2 + (enemyType.yOffset || 0) * ZOOM_FACTOR);
      
      this.enemyBody.setPosition(startX, targetY);
      this.enemyBody.setDisplaySize(size, size);
      this.enemyBody.setAlpha(1);
      this.enemyBody.angle = 0;
      this.enemyBody.setFlipX(!!enemyType.flipX);
    }
    if (this.enemyLevelText && this.enemyBody) {
      const isBoss = this.fsm.characterData?.enemiesDefeatedInStage === ENEMIES_PER_STAGE || enemyType.id.startsWith('boss_');
      const enemyName = isBoss ? `CHEFE ${enemyType.name}` : enemyType.name;
      const isNightmare = this.fsm.enemyLevel >= 6;
      const prefix = isNightmare ? '[Pesadelo] ' : '';
      this.enemyLevelText.setText(`${prefix}${enemyName} (Lv. ${this.fsm.enemyLevel})`);
      this.enemyLevelText.setColor(enemyType.color);
      this.enemyLevelText.y = this.enemyBody.y - (this.enemyBody.displayHeight / 2) - 25 * ZOOM_FACTOR;
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

  private cleanup(): void {
    if (this.unsubscribeSkill) {
      this.unsubscribeSkill();
      this.unsubscribeSkill = undefined;
    }
    if (this.fsm) {
      this.fsm.cleanup();
    }
    console.log('[CombatScene] Cleaned up subscriptions.');
  }
}
