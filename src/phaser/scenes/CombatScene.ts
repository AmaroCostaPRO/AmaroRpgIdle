import Phaser from 'phaser';
import { CombatFSM, CombatState, isBloodMoonActive } from '../../core/CombatFSM';
import { bridge } from '../../bridge/GameBridge';
import { GameEvent, ENEMIES_PER_STAGE, PET_POOL } from '../../core/types';
import { useGameStore, CLASS_CONFIGS, formatNumber } from '../../store/useGameStore';
import { useTowerStore } from '../../store/useTowerStore';
import { AudioManager } from '../../core/AudioManager';
import { getXpNeededForLevel } from '../../core/XpEngine';

export const ZOOM_FACTOR = 1.35;

// Cache do resultado do processamento de transparência de textura, guardado fora do ciclo de
// vida da Scene/Game. O Phaser.Game é destruído e recriado em perda de contexto WebGL e ao
// voltar de aba oculta (ver App.tsx), o que recriava um TextureManager vazio e forçava o scan
// de pixels (custoso) a rodar de novo a cada vez. Como ImageData é um buffer de dados simples
// (não preso a um canvas/contexto), pode ser reaproveitado entre instâncias do Game.
const transparentImageDataCache = new Map<string, ImageData>();

export class CombatScene extends Phaser.Scene {
  private fsm!: CombatFSM;
  private background!: Phaser.GameObjects.TileSprite;
  private playerBody!: Phaser.GameObjects.Image;
  private enemyBody!: Phaser.GameObjects.Image;
  private playerNameText!: Phaser.GameObjects.Text;
  private playerTitleText!: Phaser.GameObjects.Text;
  private enemyLevelText!: Phaser.GameObjects.Text;
  private enemyStatusText!: Phaser.GameObjects.Text;
  private playerStatusText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private enemyHPBar!: Phaser.GameObjects.Graphics;
  private playerHPBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private unsubscribeSkill?: () => void;
  private unsubscribeActiveRelic?: () => void;
  private unsubscribeFrenzyBoost?: () => void;
  private unsubscribeElixirActivated?: () => void;
  private unsubscribeAlchemyPotionActivated?: () => void;
  private currentBgTexture: string = 'background';
  private accumulatedTime: number = 0;
  private skeletonMinion!: Phaser.GameObjects.Image;
  private lastSkeletonTickTimer: number = 1000;
  private isSkeletonAttacking: boolean = false;
  private citadelActive: boolean = false;
  private lastEconomyModeEnabled: boolean = false;
  private unsubscribeTabChanged?: () => void;
  private unsubscribeEconomyMode?: () => void;
  private unsubscribePetSync?: () => void;
  // Companheiro/Pet capturável (v7.0.0 "Ecos que Despertam") — placeholder visual até a arte final
  private petSprite?: Phaser.GameObjects.Image;
  private petTween?: Phaser.Tweens.Tween;
  private currentPetId?: string;
  
  public readonly PLAYER_START_X = 200;
  public readonly PLAYER_START_Y = Math.round((600 - 50 * ZOOM_FACTOR) - (165 * ZOOM_FACTOR) / 2);
  public readonly ENEMY_START_X = 900;
  public readonly ENEMY_START_Y = Math.round((600 - 50 * ZOOM_FACTOR) - (165 * ZOOM_FACTOR) / 2);

  constructor() {
    super('CombatScene');
  }

  preload(): void {
    // Carrega os assets originais e as novas texturas de classe
    this.load.image('background', 'assets/medieval_background.png');
    // Bosque Sussurrante (v7.0.0 "Ecos que Despertam"): carregamento da arte final do background
    this.load.image('whispering_woods_background', 'assets/whispering_woods_background.png');
    this.load.image('tower_background', 'assets/tower_background.png');
    this.load.image('desert_background', 'assets/desert_background.png');
    this.load.image('snow_background', 'assets/snow_background.png');
    this.load.image('cemetery_background', 'assets/cemetery_background.png');
    this.load.image('ruins_background', 'assets/ruins_background.png');
    this.load.image('purgatory_background', 'assets/purgatory_background.png');
    this.load.image('pandemonium_background', 'assets/pandemonium_background.png');
    this.load.image('hero', 'assets/hero_sprite.png');
    this.load.image('mage_sprite', 'assets/mage_sprite.png');
    this.load.image('ranger_sprite', 'assets/ranger_sprite.png');
    this.load.image('paladin_sprite', 'assets/paladin_sprite.png');
    this.load.image('cleric_sprite', 'assets/cleric_sprite.png');
    this.load.image('rogue_sprite', 'assets/rogue_sprite.png');
    this.load.image('necromancer_sprite', 'assets/necromancer_sprite.png');
    this.load.image('avatar_sprite', 'assets/avatar_sprite.png');

    // Inimigos - Fase 1 (Floresta)
    this.load.image('enemy_goblin', 'assets/enemy_goblin.png');
    this.load.image('enemy_wolf', 'assets/enemy_wolf.png');
    this.load.image('enemy_orc', 'assets/enemy_orc.png');
    this.load.image('boss_forest_golem', 'assets/boss_forest_golem.png');

    // Inimigos - Fase 2 (Deserto)
    this.load.image('enemy_sand_serpent', 'assets/enemy_sand_serpent.png');
    this.load.image('enemy_desert_bandit', 'assets/enemy_desert_bandit.png');
    this.load.image('enemy_scorpion', 'assets/enemy_scorpion.png');
    this.load.image('boss_sand_scorpion', 'assets/boss_sand_scorpion.png');

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
    this.load.image('boss_crystal_guardian', 'assets/boss_crystal_guardian.png');
    this.load.image('boss_mirror_guardian', 'assets/boss_mirror_guardian.png');
    this.load.image('enemy_glass_shard', 'assets/enemy_glass_shard.png');
    this.load.image('enemy_mirror_illusion', 'assets/enemy_mirror_illusion.png');
    this.load.image('enemy_shadow_reflection', 'assets/enemy_shadow_reflection.png');
    this.load.image('skeleton_minion', 'assets/skeleton_minion.png');

    // Inimigos - Bosque Sussurrante (v7.0.0 "Ecos que Despertam")
    this.load.image('enemy_whisper_sprite', 'assets/enemy_whisper_sprite.png');
    this.load.image('enemy_thorned_treant', 'assets/enemy_thorned_treant.png');
    this.load.image('enemy_fae_rabbit', 'assets/enemy_fae_rabbit.png');
    this.load.image('boss_whispering_warden', 'assets/boss_whispering_warden.png');

    // Companheiros/Pets (v7.0.0 "Ecos que Despertam")
    this.load.image('pet_sprite_lumen', 'assets/pet_sprite_lumen.png');
    this.load.image('pet_moeda_alada', 'assets/pet_moeda_alada.png');

    // NPC - Mercador Ambulante (v7.0.0 "Ecos que Despertam")
    this.load.image('merchant_traveling', 'assets/merchant_traveling.png');

    // World Bosses - Convergência (v9.0.0 "O Que Espera no Pandemônio")
    this.load.image('boss_what_still_dreams', 'assets/boss_what_still_dreams.png');
    this.load.image('boss_reflection_reaper', 'assets/boss_reflection_reaper.png');
    this.load.image('boss_nameless_hunger', 'assets/boss_nameless_hunger.png');
    this.load.image('boss_empty_throne', 'assets/boss_empty_throne.png');
  }

  // Função avançada para mapear e remover fundo quadriculado (xadrez) ou sólido em tempo de execução
  private makeTextureTransparent(textureKey: string, outputKey: string): void {
    if (this.textures.exists(outputKey)) {
      return;
    }

    // Se já processamos essa textura numa instância anterior do Game, reaproveita o resultado
    // em vez de escanear os pixels de novo.
    const cached = transparentImageDataCache.get(outputKey);
    if (cached) {
      const canvas = document.createElement('canvas');
      canvas.width = cached.width;
      canvas.height = cached.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(cached, 0, 0);
        this.textures.addCanvas(outputKey, canvas);
        return;
      }
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
    transparentImageDataCache.set(outputKey, imageData);
  }

  create(): void {
    // Processar texturas para aplicar a transparência inteligente
    this.makeTextureTransparent('hero', 'hero_transparent');
    this.makeTextureTransparent('mage_sprite', 'mage_transparent');
    this.makeTextureTransparent('ranger_sprite', 'ranger_transparent');
    this.makeTextureTransparent('paladin_sprite', 'paladin_transparent');
    this.makeTextureTransparent('cleric_sprite', 'cleric_transparent');
    this.makeTextureTransparent('rogue_sprite', 'rogue_transparent');
    this.makeTextureTransparent('necromancer_sprite', 'necromancer_transparent');
    this.makeTextureTransparent('avatar_sprite', 'avatar_transparent');

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
    this.makeTextureTransparent('boss_sand_scorpion', 'boss_sand_scorpion_transparent');
    this.makeTextureTransparent('enemy_ice_elemental', 'enemy_ice_elemental_transparent');
    this.makeTextureTransparent('enemy_yeti', 'enemy_yeti_transparent');
    this.makeTextureTransparent('boss_frost_dragon', 'boss_frost_dragon_transparent');
    this.makeTextureTransparent('enemy_zombie', 'enemy_zombie_transparent');
    this.makeTextureTransparent('enemy_ghost', 'enemy_ghost_transparent');
    this.makeTextureTransparent('enemy_gargoyle', 'enemy_gargoyle_transparent');
    this.makeTextureTransparent('enemy_living_armor', 'enemy_living_armor_transparent');
    this.makeTextureTransparent('enemy_imp', 'enemy_imp_transparent');
    this.makeTextureTransparent('boss_archdemon', 'boss_archdemon_transparent');
    this.makeTextureTransparent('boss_crystal_guardian', 'boss_crystal_guardian_transparent');
    this.makeTextureTransparent('boss_mirror_guardian', 'boss_mirror_guardian_transparent');
    this.makeTextureTransparent('enemy_glass_shard', 'enemy_glass_shard_transparent');
    this.makeTextureTransparent('enemy_mirror_illusion', 'enemy_mirror_illusion_transparent');
    this.makeTextureTransparent('enemy_shadow_reflection', 'enemy_shadow_reflection_transparent');
    this.makeTextureTransparent('skeleton_minion', 'skeleton_minion_transparent');

    // Transparências - Bosque Sussurrante, Pets e Mercador Ambulante (v7.0.0)
    this.makeTextureTransparent('enemy_whisper_sprite', 'enemy_whisper_sprite_transparent');
    this.makeTextureTransparent('enemy_thorned_treant', 'enemy_thorned_treant_transparent');
    this.makeTextureTransparent('enemy_fae_rabbit', 'enemy_fae_rabbit_transparent');
    this.makeTextureTransparent('boss_whispering_warden', 'boss_whispering_warden_transparent');
    this.makeTextureTransparent('pet_sprite_lumen', 'pet_sprite_lumen_transparent');
    this.makeTextureTransparent('pet_moeda_alada', 'pet_moeda_alada_transparent');
    this.makeTextureTransparent('merchant_traveling', 'merchant_traveling_transparent');

    // World Bosses - Convergência (v9.0.0 "O Que Espera no Pandemônio")
    this.makeTextureTransparent('boss_what_still_dreams', 'boss_what_still_dreams_transparent');
    this.makeTextureTransparent('boss_reflection_reaper', 'boss_reflection_reaper_transparent');
    this.makeTextureTransparent('boss_nameless_hunger', 'boss_nameless_hunger_transparent');
    this.makeTextureTransparent('boss_empty_throne', 'boss_empty_throne_transparent');

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
    else if (classId === 'necromancer') playerTexture = 'necromancer_transparent';
    else if (classId === 'avatar') playerTexture = 'avatar_transparent';

    // Player (Herói) usando a textura da classe atualizada
    this.playerBody = this.add.image(this.PLAYER_START_X, this.PLAYER_START_Y, playerTexture);
    this.playerBody.setDisplaySize(165 * ZOOM_FACTOR, 165 * ZOOM_FACTOR);
    this.playerBody.setFlipX(false);

    // Inicializar FSM de combate antes de criar os inimigos para pegar informações corretas
    this.fsm = new CombatFSM(this, null);

    // Inimigo usando a textura do tipo de inimigo ativo
    this.enemyBody = this.add.image(this.ENEMY_START_X, this.ENEMY_START_Y, this.fsm.currentEnemy.texture + '_transparent');
    
    // Minion esqueleto do Exército de Esqueletos (Necromante)
    this.skeletonMinion = this.add.image(0, 0, 'skeleton_minion_transparent');
    this.skeletonMinion.setDisplaySize(110 * ZOOM_FACTOR, 110 * ZOOM_FACTOR); // um pouco menor que os 165 do Necromante
    this.skeletonMinion.setFlipX(false); // virado para a direita por padrão
    this.skeletonMinion.setVisible(false);
    this.skeletonMinion.setDepth(this.enemyBody.depth + 1); // na frente do inimigo

    // Atualiza o target do FSM
    this.fsm['target'] = this.enemyBody;

    // Textos informativos
    const classConfig = useGameStore.getState().character;
    const friendlyName = (classConfig.name || CLASS_CONFIGS[classConfig.classId]?.name || classConfig.classId).toUpperCase();

    this.playerNameText = this.add.text(this.PLAYER_START_X, this.PLAYER_START_Y - 105 * ZOOM_FACTOR, friendlyName, { 
      fontSize: '19px', 
      color: '#60a5fa', 
      fontStyle: 'bold', 
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5,
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5);

    const selectedTitle = useTowerStore.getState().selectedTitle;
    this.playerTitleText = this.add.text(this.PLAYER_START_X, this.PLAYER_START_Y - 128 * ZOOM_FACTOR, selectedTitle ? `👑 ${selectedTitle}` : '', { 
      fontSize: '18px', 
      color: '#e9d5ff', 
      fontStyle: 'bold', 
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5,
      padding: { left: 8, right: 8, top: 3, bottom: 3 }
    }).setOrigin(0.5);

    // Inicializa o texto vazio; a posição correta, cor e conteúdo serão atribuídos imediatamente pela chamada do respawnEnemyAt abaixo
    this.enemyLevelText = this.add.text(this.enemyBody.x, this.ENEMY_START_Y - 80 * ZOOM_FACTOR, '', { 
      fontSize: '19px', 
      color: '#ffffff', 
      fontStyle: 'bold', 
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
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
      fontSize: '20px',
      color: '#f59e0b',
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    // Ouvir comandos de skill
    this.unsubscribeSkill = bridge.subscribe(GameEvent.EQUIP_SKILL, (payload) => {
      this.fsm.triggerSkill(payload.skillId);
    });

    this.unsubscribeActiveRelic = bridge.subscribe(GameEvent.TRIGGER_ACTIVE_RELIC, () => {
      this.fsm.triggerActiveRelic();
    });

    this.unsubscribeFrenzyBoost = bridge.subscribe('ACTIVATE_FRENZY_BOOST' as any, (payload) => {
      this.fsm.activateFrenzyBoost(payload.duration || 60000);
    });

    // Elixires exclusivos do Mercador Ambulante (v7.0.0) — ativados na hora após a compra bem-sucedida
    this.unsubscribeElixirActivated = bridge.subscribe(GameEvent.ELIXIR_ACTIVATED, (payload: any) => {
      this.fsm.activateElixir(payload.elixirType);
    });

    // Poções do Laboratório de Alquimia (v8.0.0) — ativadas na hora após o uso via useConsumable
    this.unsubscribeAlchemyPotionActivated = bridge.subscribe(GameEvent.ALCHEMY_POTION_ACTIVATED, (payload: any) => {
      this.fsm.activateAlchemyPotion(payload.potionType);
    });

    // Reduz o custo gráfico quando o jogador está gerenciando a Cidadela em tela cheia,
    // sem pausar a lógica de combate (o herói continua lutando/dropando em background)
    const applyTargetFps = () => {
      const economyModeEnabled = useGameStore.getState().economyModeEnabled;
      this.game.loop.targetFps = this.citadelActive ? 15 : (economyModeEnabled ? 15 : 60);
    };
    this.unsubscribeTabChanged = bridge.subscribe(GameEvent.TAB_CHANGED, (payload) => {
      this.citadelActive = payload.tab === 'citadel' && !!payload.citadelEntered;
      applyTargetFps();
    });
    this.unsubscribeEconomyMode = useGameStore.subscribe((state) => {
      if (state.economyModeEnabled !== this.lastEconomyModeEnabled) {
        this.lastEconomyModeEnabled = state.economyModeEnabled;
        applyTargetFps();
      }
    });
    this.lastEconomyModeEnabled = useGameStore.getState().economyModeEnabled;
    applyTargetFps();

    // Companheiro/Pet capturável (v7.0.0): cria/remove o sprite placeholder ao capturar/perder o pet
    this.syncPetSprite();
    this.unsubscribePetSync = useGameStore.subscribe((state) => {
      if (state.character.activePet?.id !== this.currentPetId) {
        this.syncPetSprite();
      }
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
  }

  // Companheiro/Pet capturável (v7.0.0 "Ecos que Despertam"): cria ou remove o sprite placeholder
  // conforme `character.activePet` muda (captura, Ascensão/Transcendência zerando o pet, etc).
  private syncPetSprite(): void {
    const activePet = useGameStore.getState().character.activePet;
    this.currentPetId = activePet?.id;

    if (this.petTween) {
      this.petTween.stop();
      this.petTween = undefined;
    }
    if (this.petSprite) {
      this.petSprite.destroy();
      this.petSprite = undefined;
    }

    if (!activePet) return;

    const petDef = PET_POOL.find(p => p.id === activePet.id);
    if (!petDef) return;

    const petTextureKey = `${petDef.texture}_transparent`;
    if (!this.textures.exists(petTextureKey)) return;

    this.petSprite = this.add.image(this.PLAYER_START_X + 55 * ZOOM_FACTOR, this.PLAYER_START_Y - 90 * ZOOM_FACTOR, petTextureKey);
    this.petSprite.setDisplaySize(55 * ZOOM_FACTOR, 55 * ZOOM_FACTOR);
    this.petSprite.setDepth((this.playerBody?.depth || 0) + 1);

    // Efeito de flutuação: sobe e desce lentamente, em loop (sprite ainda sem animação própria)
    this.petTween = this.tweens.add({
      targets: this.petSprite,
      y: '+=14',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update(time: number, delta: number): void {
    if (this.petSprite && this.playerBody) {
      this.petSprite.x = this.playerBody.x + 55 * ZOOM_FACTOR;
    }

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

      if (this.playerNameText && this.playerBody) {
        const isTransition = this.fsm.getCurrentState() === CombatState.TRANSITION;
        this.playerNameText.x = isTransition ? this.playerBody.x : this.PLAYER_START_X;
        this.playerNameText.y = this.PLAYER_START_Y - 105 * ZOOM_FACTOR;
      }

      if (this.playerTitleText && this.playerBody) {
        const isTransition = this.fsm.getCurrentState() === CombatState.TRANSITION;
        const selectedTitle = useTowerStore.getState().selectedTitle;
        this.playerTitleText.setText(selectedTitle ? `👑 ${selectedTitle}` : '');
        this.playerTitleText.x = isTransition ? this.playerBody.x : this.PLAYER_START_X;
        this.playerTitleText.y = this.PLAYER_START_Y - 128 * ZOOM_FACTOR;
      }

      if (this.enemyLevelText && this.enemyBody) {
        const isMoving = this.fsm.getCurrentState() === CombatState.MOVING;
        this.enemyLevelText.x = isMoving ? this.enemyBody.x : 600;
        const enemyAlpha = this.fsm.enemyHP <= 0 ? this.enemyBody.alpha : 1;
        this.enemyLevelText.setAlpha(enemyAlpha);
      }

      // Atualiza posição do texto de status do inimigo
      if (this.enemyStatusText && this.enemyBody && this.enemyLevelText) {
        const isMoving = this.fsm.getCurrentState() === CombatState.MOVING;
        this.enemyStatusText.x = isMoving ? this.enemyBody.x : 600;
        const isElite = this.enemyLevelText.text.includes('\n');
        this.enemyStatusText.y = this.enemyLevelText.y - (isElite ? 35 : 20) * ZOOM_FACTOR;
        const enemyAlpha = this.fsm.enemyHP <= 0 ? this.enemyBody.alpha : 1;
        this.enemyStatusText.setAlpha(enemyAlpha);

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
        const isTransition = this.fsm.getCurrentState() === CombatState.TRANSITION;
        this.playerStatusText.x = isTransition ? this.playerBody.x : this.PLAYER_START_X;
        const selectedTitle = useTowerStore.getState().selectedTitle;
        this.playerStatusText.y = selectedTitle 
          ? this.PLAYER_START_Y - 148 * ZOOM_FACTOR 
          : this.PLAYER_START_Y - 125 * ZOOM_FACTOR;

        const pEffects = this.fsm.playerEffects;
        if (pEffects.some(e => e.id === 'consecration')) {
          this.playerStatusText.setText('[SANTIFICADO]');
          this.playerStatusText.setColor('#fef08a');
        } else {
          this.playerStatusText.setText('');
        }
      }

      if (this.stageText) {
        const isTowerActive = useTowerStore.getState().towerActive;
        if (isTowerActive) {
          const currentFloor = useTowerStore.getState().currentFloor;
          const isTowerBoss = currentFloor % 5 === 0;
          if (isTowerBoss) {
            this.stageText.setText(`TORRE INFINITA - Andar ${currentFloor} (CHEFE)`);
            this.stageText.setColor('#c084fc'); // Roxo brilhante
          } else {
            this.stageText.setText(`TORRE INFINITA - Andar ${currentFloor}`);
            this.stageText.setColor('#d8b4fe'); // Lilás claro
          }
        } else {
          const char = this.fsm.characterData;
          if (char) {
            const isBoss = char.enemiesDefeatedInStage === ENEMIES_PER_STAGE;
            const isEcoterra = char.activeEcoterra && char.currentStage <= 20;
            // Labels e cores por dificuldade
            const modeLabel = isEcoterra ? 'ECOTERRA'
              : char.currentStage >= 31 ? 'PANDEMÔNIO'
              : (char.currentStage >= 21 && char.currentStage <= 30) ? 'PURGATÓRIO'
              : char.currentStage >= 16 ? 'APOCALIPSE'
              : char.currentStage >= 11 ? 'INFERNO'
              : char.currentStage >= 6 ? 'PESADELO' : 'FASE';
            const modeColor = isEcoterra ? '#00e5ff'
              : char.currentStage >= 31 ? '#f43f5e'
              : (char.currentStage >= 21 && char.currentStage <= 30) ? '#d8b4fe'
              : char.currentStage >= 16 ? '#c084fc'
              : char.currentStage >= 11 ? '#fb923c'
              : char.currentStage >= 6 ? '#f43f5e' : '#f59e0b';
            if (isBoss) {
              this.stageText.setText(`${modeLabel} ${char.currentStage} - CHEFE FINAL`);
              this.stageText.setColor(isEcoterra ? '#00e5ff' : char.currentStage >= 31 ? '#f43f5e' : char.currentStage >= 21 ? '#d8b4fe' : '#c084fc');
            } else {
              this.stageText.setText(`${modeLabel} ${char.currentStage} - Progresso: ${char.enemiesDefeatedInStage}/${ENEMIES_PER_STAGE}`);
              this.stageText.setColor(modeColor);
            }
          }
        }
      }

      // Atualiza o background e o tint maligno dependendo do estágio
      this.updateBackgroundForStage();

      // Desenhar barra de vida acima do inimigo e do jogador, e barra de XP
      this.drawEnemyHPBar();
      this.drawPlayerHPBar();
      this.drawXPBar();

      const isTowerActive = useTowerStore.getState().towerActive;
      if (this.fsm.getCurrentState() === CombatState.MOVING && !isTowerActive) {
        this.playerBody.y = this.PLAYER_START_Y + Math.sin(this.accumulatedTime * 0.015) * 4;
      } else {
        this.playerBody.y = this.PLAYER_START_Y;
      }

      // Aplicar colorização (tint) e pulsação de tamanho de Elites nos sprites dependendo de status efeitos ativos
      if (this.fsm.enemyHP > 0 && this.enemyBody) {
        // Pulsação suave de tamanho para Elites
        const isBoss = this.fsm.currentEnemy?.id.startsWith('boss_');
        let baseSize = (isBoss ? 215 : 165) * ZOOM_FACTOR;
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
        } else if (this.fsm.isElite) {
          // Onda senoidal de 0.6 a 1.0 para pulso prateado metálico
          const pulse = 0.7 + Math.sin(this.accumulatedTime * 0.007) * 0.3;
          const component = Math.floor(160 + pulse * 95);
          const tintVal = (component << 16) + (component << 8) + component;
          this.enemyBody.setTint(tintVal);
        } else {
          // O tint temático de fase/dificuldade (Pesadelo/Inferno/Apocalipse/Ecoterra/Lua de
          // Sangue/etc.) é aplicado só no background em `updateBackgroundForStage()` — o sprite do
          // inimigo não deve ser recolorido por tema, só por efeitos de status (acima) ou Elite.
          this.enemyBody.clearTint();
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

      // Controle do minion de esqueleto do Necromante (habilidade skeleton_army)
      const skeletonEffect = this.fsm.enemyEffects.find(e => e.id === 'skeleton_army');
      if (skeletonEffect && this.skeletonMinion) {
        if (!this.skeletonMinion.visible) {
          this.tweens.killTweensOf(this.skeletonMinion);
          this.skeletonMinion.setVisible(true);
          this.skeletonMinion.setAlpha(0);
          this.tweens.add({
            targets: this.skeletonMinion,
            alpha: 1,
            duration: 300
          });
          this.lastSkeletonTickTimer = skeletonEffect.tickTimer;
        }

        // Posiciona em frente ao inimigo (um pouco à esquerda, virado para a direita)
        const targetX = this.enemyBody.x - 90 * ZOOM_FACTOR;
        // Fixa a altura do esqueleto na mesma linha do solo (chão) que o jogador
        const targetY = (600 - 50 * ZOOM_FACTOR) - (110 * ZOOM_FACTOR) / 2;
        
        if (!this.isSkeletonAttacking) {
          this.skeletonMinion.x = targetX;
          this.skeletonMinion.y = targetY;
        }

        // Detecta o reset do tickTimer para saber que houve um tick de dano do exército
        if (skeletonEffect.tickTimer > this.lastSkeletonTickTimer) {
          this.animateSkeletonAttack();
        }
        this.lastSkeletonTickTimer = skeletonEffect.tickTimer;
      } else if (this.skeletonMinion && this.skeletonMinion.visible && !this.isSkeletonAttacking) {
        // Se a habilidade expirou, desfaz suavemente
        const isTweening = this.tweens.isTweening(this.skeletonMinion);
        if (!isTweening && this.skeletonMinion.alpha > 0) {
          this.tweens.add({
            targets: this.skeletonMinion,
            alpha: 0,
            duration: 250,
            onComplete: () => {
              this.skeletonMinion.setVisible(false);
            }
          });
        }
      }
    }
  }

  private updateBackgroundForStage(): void {
    const isTower = useTowerStore.getState().towerActive;
    if (isTower) {
      if (this.currentBgTexture !== 'tower_background') {
        this.background.setTexture('tower_background');
        this.currentBgTexture = 'tower_background';
        // Exibe a imagem de 1024x1024 inteira adaptada exatamente para os 800x600 do canvas,
        // eliminando qualquer corte vertical, zoom dinâmico da campanha ou repetições.
        this.background.setTileScale(800 / 1024, 600 / 1024);
        this.background.tilePositionY = 0;
        this.background.tilePositionX = 0;
        this.background.clearTint();
        if (this.enemyBody) this.enemyBody.clearTint();
      }
      return;
    }

    const char = useGameStore.getState().character;
    if (!char) return;

    const stage = char.currentStage;
    let textureKey = 'background'; // Default: Floresta
    
    if (stage >= 31) {
      textureKey = 'pandemonium_background';
    } else if (stage >= 21 && stage <= 30) {
      textureKey = 'purgatory_background';
    } else if (stage <= 5) {
      // Bosque Sussurrante (v7.0.0 "Ecos que Despertam"): bioma inicial fixo, isolado do ciclo abaixo
      textureKey = 'whispering_woods_background';
    } else {
      // Mapeamento de fase para background (ciclos de 1-5, agora começando na Fase 6)
      const stageTheme = ((stage - 6) % 5) + 1;
      if (stageTheme === 2) textureKey = 'desert_background';
      else if (stageTheme === 3) textureKey = 'snow_background';
      else if (stageTheme === 4) textureKey = 'cemetery_background';
      else if (stageTheme === 5) textureKey = 'ruins_background';
    }

    if (this.currentBgTexture !== textureKey) {
      this.background.setTexture(textureKey);
      this.currentBgTexture = textureKey;
      const baseBgScale = 600 / 1024;
      const currentBgScale = baseBgScale * ZOOM_FACTOR;
      this.background.setTileScale(currentBgScale, currentBgScale);
      
      this.background.tilePositionY = 1024 - (600 / currentBgScale);
    }

    const isEcoterra = char && !isTower && char.activeEcoterra && stage <= 20;
    // Lua de Sangue (v8.0.0): reskin vermelho da fase atual enquanto o evento sazonal está ativo,
    // exceto em Pandemônio/Purgatório/Ecoterra, que já têm identidade visual própria fixa.
    const isBloodMoon = !isTower && !isEcoterra && stage < 21 && isBloodMoonActive();

    // Aplicar tint de acordo com a dificuldade — só no background. O sprite do inimigo é colorido
    // separadamente (e só por efeito de status/Elite), no bloco de `update()` que lida com
    // `enemyEffects` — ver comentário lá para o motivo dessa separação.
    if (stage >= 31) {
      // Pandemônio: Agora possui background sob medida, removemos o tint do fundo para exibir a arte linda gerada
      this.background.clearTint();
    } else if (stage >= 21 && stage <= 30) {
      // Purgatório: Sem distorções para preservar a identidade visual cristalina gerada
      this.background.clearTint();
    } else if (isEcoterra) {
      // Ecoterra: Tingimento azul-neon / ciano espectral
      this.background.setTint(0x00e5ff);
    } else if (isBloodMoon) {
      // Lua de Sangue: vermelho intenso sobrepondo o tint normal da dificuldade
      this.background.setTint(0x8b0000);
    } else if (stage >= 16) {
      // Apocalipse: Roxo sinistro
      this.background.setTint(0x440066);
    } else if (stage >= 11) {
      // Inferno: Laranja queimado
      this.background.setTint(0x661100);
    } else if (stage >= 6) {
      // Pesadelo: Vermelho escuro
      this.background.setTint(0x773333);
    } else {
      this.background.clearTint();
    }
  }

  private drawPlayerHPBar(): void {
    if (!this.playerHPBar || !this.playerBody || !this.fsm) return;
    
    this.playerHPBar.clear();
    
    // Só desenha se o jogador estiver vivo e visível
    if (this.fsm.playerHP > 0 && this.playerBody.alpha > 0.1) {
      const barWidth = 70 * ZOOM_FACTOR;
      const barHeight = 7 * ZOOM_FACTOR;
      
      // Se estiver na transição da torre, acompanha o corpo. Senão fica fixo
      const isTransition = this.fsm.getCurrentState() === CombatState.TRANSITION;
      const targetX = isTransition ? this.playerBody.x : this.PLAYER_START_X;
      
      const x = targetX - barWidth / 2;
      const y = this.PLAYER_START_Y - 85 * ZOOM_FACTOR; // Posição estática segura abaixo do nome

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
    const xpNeeded = getXpNeededForLevel(level, char.currentStage || 1);
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
    const useAbbrev = useGameStore.getState().abbreviateNumbers;
    const formattedXp = formatNumber(xp, useAbbrev);
    const formattedNeeded = formatNumber(xpNeeded, useAbbrev);
    const pctString = (xpPct * 100).toFixed(1);
    this.xpText.setText(`Nv. ${level} • XP: ${formattedXp} / ${formattedNeeded} (${pctString}%)`);
  }

  public getPlayerX(): number { return this.playerBody.x; }
  public getPlayerY(): number { return this.playerBody.y; }
  public getEnemyX(): number { return this.enemyBody.x; }
  public getEnemyY(): number { return this.enemyBody.y; }

  public scrollWorld(delta: number): void {
    const isTower = useTowerStore.getState().towerActive;
    // O scroll visual do fundo é pausado enquanto a Cidadela ocupa a tela (otimização gráfica),
    // mas a aproximação do inimigo abaixo continua para não travar a lógica de combate em background
    if (!isTower && !this.citadelActive) {
      const scrollSpeed = 0.22;
      this.background.tilePositionX += scrollSpeed * delta;
    }
    
    // O inimigo se aproxima (+20% velocidade na Ecoterra)
    const char = useGameStore.getState().character;
    const isEcoterra = char && !isTower && char.activeEcoterra && (char.currentStage || 1) <= 20;
    const approachSpeed = isEcoterra ? 0.18 * 1.20 : 0.18;
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
    if (useGameStore.getState().economyModeEnabled) return;
    const roundedX = Math.round(x);
    const roundedY = Math.round(y) + 65; // Posiciona o dano 65 pixels mais para baixo do Y original
    
    // Abreviar números no texto se a opção estiver ativa
    const useAbbrev = useGameStore.getState().abbreviateNumbers;
    let formattedText = text;
    if (useAbbrev) {
      formattedText = text.replace(/\d+/g, (match) => {
        return formatNumber(parseInt(match, 10), true);
      });
    }

    const dmgText = this.add.text(roundedX, roundedY, formattedText, {
      fontSize: '28px', // Fonte aumentada de 18px para 28px
      color: color,
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgText,
      y: roundedY - 60, // Sobe 60 pixels
      alpha: 0,
      duration: 1500, // Demora 1.5s para sumir (antes 800ms)
      onComplete: () => {
        dmgText.destroy();
      }
    });
  }

  public spawnTouchEffect(isCrit: boolean, damage: number, clickX?: number, clickY?: number): void {
    if (useGameStore.getState().economyModeEnabled) return;
    const targetX = Math.round(clickX ?? (this.enemyBody.x + (Math.random() * 80 - 40)));
    const targetY = Math.round(clickY ?? (this.enemyBody.y + (Math.random() * 80 - 40))) + 65; // Posiciona 65 pixels mais para baixo

    const useAbbrev = useGameStore.getState().abbreviateNumbers;
    const formattedDamage = formatNumber(damage, useAbbrev);
    const color = isCrit ? '#facc15' : '#38bdf8';
    const text = isCrit ? `💥 ${formattedDamage}!` : `${formattedDamage}`;
    const fontSize = isCrit ? '32px' : '28px'; // Reduzido para ficar no tamanho dos demais números de dano

    const dmgText = this.add.text(targetX, targetY, text, {
      fontSize: fontSize,
      color: color,
      fontStyle: 'bold',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: isCrit ? 4 : 3,
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5);

    const gameSpeed = useGameStore.getState().gameSpeed;
    const speedMultiplier = gameSpeed === 0 ? 0 : (gameSpeed || 1);
    const scaleFactor = speedMultiplier > 0 ? 1 / speedMultiplier : 1;

    const textTween = this.tweens.add({
      targets: dmgText,
      y: targetY - 100, // Sobe 100 pixels
      scale: isCrit ? 1.5 : 1.2,
      alpha: 0,
      duration: 1400, // Demora 1.4s para sumir (antes 750ms)
      onComplete: () => {
        dmgText.destroy();
      }
    });
    textTween.setTimeScale(scaleFactor);

    const clickCircle = this.add.circle(targetX, targetY - 65, 5, isCrit ? 0xfacc15 : 0x38bdf8, 0.8);
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

  public animateTowerTransition(onTransitionHalf: () => void): void {
    const gameSpeed = useGameStore.getState().gameSpeed;
    const speedLimit = gameSpeed > 0 ? gameSpeed : 1;

    // 1. Tocar efeito de derrota e fazer o monstro desaparecer
    this.animateEnemyDeath();

    // 2. Fazer o fade out da câmera começar de forma proporcional à velocidade
    const fadeOutDelay = Math.round(800 / speedLimit);
    const fadeOutDuration = Math.round(600 / speedLimit);
    const fadeInDuration = Math.round(600 / speedLimit);

    this.time.delayedCall(fadeOutDelay, () => {
      this.cameras.main.fadeOut(fadeOutDuration, 0, 0, 0);
    });

    // 3. Fazer o jogador correr para a direita (avançar) de forma mais gradual
    this.tweens.add({
      targets: this.playerBody,
      x: this.PLAYER_START_X + 250 * ZOOM_FACTOR,
      duration: 1400,
      ease: 'Power1.easeIn',
      onComplete: () => {
        // Garante que matamos qualquer tween residual no playerBody
        this.tweens.killTweensOf(this.playerBody);
        
        // Reposiciona o jogador de volta na posição inicial sob a tela preta
        this.playerBody.x = this.PLAYER_START_X;

        // Executa a lógica de troca de andar na FSM
        onTransitionHalf();

        // Faz fade in da câmera de volta com a duração escalada
        this.cameras.main.fadeIn(fadeInDuration, 0, 0, 0);
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
      this.tweens.killTweensOf(this.enemyBody);
      let flipX = !!enemyType.flipX;
      
      if (this.fsm && this.fsm.isMerchantEncounter) {
        if (this.textures.exists('merchant_traveling_transparent')) {
          this.enemyBody.setTexture('merchant_traveling_transparent');
          flipX = false; // O próprio usuário já virou a imagem física do mercador para a esquerda
        } else {
          // Fallback defensivo: se por algum motivo a textura do Mercador não foi carregada/gerada
          // (asset ausente, falha de load, etc.), evita ficar com o sprite "invisível" — reaproveita
          // a textura do inimigo comum por trás do encontro, como no placeholder original da v7.0.0.
          console.warn('[Mercador Ambulante] Textura "merchant_traveling_transparent" não encontrada — usando fallback.');
          this.enemyBody.setTexture(enemyType.texture + '_transparent');
        }
      } else {
        this.enemyBody.setTexture(enemyType.texture + '_transparent');
      }
      
      const isBoss = enemyType.id.startsWith('boss_');
      let size = (isBoss ? 215 : 165) * ZOOM_FACTOR;
      if (this.fsm.isElite) {
        size *= 1.15; // 15% de aumento de tamanho para Elites
      }
      
      const targetY = Math.round((600 - 50 * ZOOM_FACTOR) - size / 2 + (enemyType.yOffset || 0) * ZOOM_FACTOR);

      // Mercador Ambulante: como o combate fica pausado (CombatState.MERCHANT_ENCOUNTER), o inimigo
      // nunca chega a "andar" até a área de combate (isso só acontece em handleMoving -> scrollWorld,
      // que não roda com o combate pausado). Por isso ele precisa nascer já na posição final de combate
      // (~400px de distância do jogador, o mesmo raio que dispara CombatState.ATTACKING) em vez do
      // `startX` de spawn (900px), que fica fora da área visível do canvas de 800px de largura.
      const spawnX = (this.fsm && this.fsm.isMerchantEncounter) ? (this.PLAYER_START_X + 400) : startX;
      this.enemyBody.setPosition(spawnX, targetY);
      this.enemyBody.setDisplaySize(size, size);
      this.enemyBody.setAlpha(1);
      this.enemyBody.angle = 0;
      this.enemyBody.setFlipX(flipX);
    }
    if (this.enemyLevelText && this.enemyBody) {
      const isBoss = this.fsm.characterData?.enemiesDefeatedInStage === ENEMIES_PER_STAGE || enemyType.id.startsWith('boss_');
      let enemyName = isBoss ? `CHEFE ${enemyType.name}` : enemyType.name;
      if (this.fsm.isMerchantEncounter) {
        enemyName = 'Mercador Ambulante';
      } else if (this.fsm.isConvergenceEncounter) {
        enemyName = `☄️ CONVERGÊNCIA\n${enemyType.name}`;
      } else if (this.fsm.isElite) {
        const afixLabel = this.fsm.eliteAfix ? `ELITE ${this.fsm.eliteAfix.toUpperCase()}` : 'ELITE';
        enemyName = `${afixLabel}\n${enemyType.name}`;
      }
      this.enemyLevelText.setText(enemyName);

      if (this.fsm.isMerchantEncounter) {
        this.enemyLevelText.setColor('#fbbf24'); // Cor dourada para o Mercador
      } else if (this.fsm.isConvergenceEncounter) {
        this.enemyLevelText.setColor('#a78bfa'); // Roxo cósmico para a Convergência
      } else if (this.fsm.isElite) {
        this.enemyLevelText.setColor('#e2e8f0'); // Prateado metálico para nome de Elites
      } else {
        this.enemyLevelText.setColor(enemyType.color);
      }
      
      this.enemyLevelText.y = this.enemyBody.y - (this.enemyBody.displayHeight / 2) - 35 * ZOOM_FACTOR;
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
    this.tweens.killTweensOf(this.playerBody);
    this.playerBody.setPosition(this.PLAYER_START_X, this.PLAYER_START_Y);
    this.playerBody.angle = 0;
    this.playerBody.setAlpha(1);

    this.tweens.add({
      targets: this.playerBody,
      alpha: { from: 0, to: 1 },
      duration: 300
    });
  }

  public animateSkeletonAttack(): void {
    if (!this.skeletonMinion) return;
    this.isSkeletonAttacking = true;

    AudioManager.getInstance().playSlash();

    const targetX = this.enemyBody.x - 90 * ZOOM_FACTOR;

    // Movimento rápido em direção ao inimigo (direita) para simular o ataque físico
    this.tweens.add({
      targets: this.skeletonMinion,
      x: targetX + 30 * ZOOM_FACTOR,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isSkeletonAttacking = false;
        // Restaura a posição padrão do minion em relação ao inimigo
        this.skeletonMinion.x = this.enemyBody.x - 90 * ZOOM_FACTOR;
      }
    });

    // Cria um pequeno efeito visual roxo (corte mágico de sombras) no inimigo
    const slashSize = 35 * ZOOM_FACTOR;
    const slash = this.add.line(
      this.enemyBody.x, this.enemyBody.y,
      -slashSize, -slashSize, slashSize, slashSize,
      0x8b5cf6, 1.0 // Cor roxa sombria
    );
    slash.setLineWidth(4 * ZOOM_FACTOR);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 200,
      onComplete: () => slash.destroy()
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
    if (this.unsubscribeActiveRelic) {
      this.unsubscribeActiveRelic();
      this.unsubscribeActiveRelic = undefined;
    }
    if (this.unsubscribeFrenzyBoost) {
      this.unsubscribeFrenzyBoost();
      this.unsubscribeFrenzyBoost = undefined;
    }
    if (this.unsubscribeElixirActivated) {
      this.unsubscribeElixirActivated();
      this.unsubscribeElixirActivated = undefined;
    }
    if (this.unsubscribeAlchemyPotionActivated) {
      this.unsubscribeAlchemyPotionActivated();
      this.unsubscribeAlchemyPotionActivated = undefined;
    }
    if (this.unsubscribeTabChanged) {
      this.unsubscribeTabChanged();
      this.unsubscribeTabChanged = undefined;
    }
    if (this.unsubscribeEconomyMode) {
      this.unsubscribeEconomyMode();
      this.unsubscribeEconomyMode = undefined;
    }
    if (this.unsubscribePetSync) {
      this.unsubscribePetSync();
      this.unsubscribePetSync = undefined;
    }
    if (this.petTween) {
      this.petTween.stop();
      this.petTween = undefined;
    }
    if (this.fsm) {
      this.fsm.cleanup();
    }
  }
}
