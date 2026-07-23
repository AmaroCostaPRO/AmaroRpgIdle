import { useGameStore } from '../store/useGameStore';
import { BGM_THEMES, BgmPhase, getPhaseForStage } from './bgmThemes';
import { bridge } from '../bridge/GameBridge';
import { GameEvent } from './types';
import { getZoneForDepth } from './abyssFormulas';

// v10.1.0: cada zona das Profundezas tem seu próprio tema (Assets §1.7) — substitui o antigo
// override único 'abyss' fixo para toda a descida.
const getAbyssPhaseForDepth = (depth: number): BgmPhase => {
  const zone = getZoneForDepth(depth);
  if (zone === 4) return 'abyss_z4';
  if (zone === 3) return 'abyss_z3';
  if (zone === 2) return 'abyss_z2';
  return 'abyss';
};

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;

  // Volumes padrão
  private sfxVolume = 0.25;
  private bgmVolume = 0.12;

  // Estado da música de fundo algorítmica
  private bgmIntervalId: any = null;
  private currentBgmNodes: Set<AudioNode> = new Set();
  private bgmBeat = 0;
  private bgmChordIdx = 0;
  // Fase atual do BGM (Normal/Pesadelo/Inferno/Apocalipse/Purgatório/Pandemônio), definida pelo
  // estágio de combate atual do personagem. Torre Infinita e Cidadela herdam a mesma trilha da
  // fase vigente, já que a seleção depende apenas de `character.currentStage`, não da tela ativa.
  private currentPhase: BgmPhase = 'normal';
  // v10.0.0 "A Cidadela Submersa": enquanto um mergulho está ativo, a BGM "Luz Coada" (abyss)
  // sobrepõe a trilha por fase — controlada pelos eventos DIVE_STARTED/DIVE_ENDED, não por estágio.
  private diveOverrideActive = false;
  // v10.4.0: override de BGM da luta do Leviatã, ligado/desligado pelo `mode` do GameEvent.START_COMBAT
  // (o mesmo evento que já sinaliza entrada/saída de campanha/torre/mergulho).
  private leviathanOverrideActive = false;
  private lastBreathWarningAt = 0;

  private constructor() {
    let prevLevel = 1;
    let prevAttrPoints = 5;
    let prevSkillPoints = 1;
    let prevPrestigePoints = 0;
    let prevPrestigeUpgrades: Record<string, number> = {};
    let initialized = false;

    // Inicializa volumes e configurações com o estado atual do store no momento da criação
    const initialState = useGameStore.getState();
    this.sfxVolume = (initialState.sfxVolume ?? 0.5) * 0.5;
    this.bgmVolume = (initialState.bgmVolume ?? 0.5) * 0.25;
    this.currentPhase = getPhaseForStage(initialState.character?.currentStage ?? 1);
    this.updateSettings(initialState.sfxEnabled ?? true, initialState.bgmEnabled ?? true);

    // Ouvintes globais para resumir o contexto de áudio no primeiro clique ou interação na página (Autoplay Policy)
    const resumeAudio = () => {
      if (this.initCtx()) {
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
      }
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    // v10.0.0 "A Cidadela Submersa": override de BGM + SFX reativos do mergulho.
    // O AudioManager é um singleton vitalício — estas inscrições nunca precisam de cleanup.
    bridge.subscribe(GameEvent.DIVE_STARTED, (payload: any) => {
      this.diveOverrideActive = true;
      this.playDiveSplash();
      const phase = getAbyssPhaseForDepth(payload?.depth ?? 1);
      if (this.currentPhase !== phase) {
        this.currentPhase = phase;
        if (this.bgmIntervalId) {
          this.stopBGM();
          this.startBGM();
        }
      }
    });
    // v10.1.0: troca de tema ao cruzar de zona durante a descida (não a cada profundidade — só
    // quando a fase calculada realmente muda, mesmo padrão dos overrides acima).
    bridge.subscribe(GameEvent.DEPTH_CHANGED, (payload: any) => {
      if (!this.diveOverrideActive || this.leviathanOverrideActive) return;
      const phase = getAbyssPhaseForDepth(payload?.depth ?? 1);
      if (phase !== this.currentPhase) {
        this.currentPhase = phase;
        if (this.bgmIntervalId) { this.stopBGM(); this.startBGM(); }
      }
    });
    bridge.subscribe(GameEvent.DIVE_ENDED, () => {
      this.diveOverrideActive = false;
      const phase = getPhaseForStage(useGameStore.getState().character?.currentStage ?? 1);
      if (phase !== this.currentPhase) {
        this.currentPhase = phase;
        if (this.bgmIntervalId) {
          this.stopBGM();
          this.startBGM();
        }
      }
    });
    // v10.4.0: override "O Coro e a Fera" enquanto a luta do Leviatã durar.
    bridge.subscribe(GameEvent.START_COMBAT, (payload: any) => {
      if (payload?.mode === 'leviathan') {
        this.leviathanOverrideActive = true;
        if (this.currentPhase !== 'leviathan') {
          this.currentPhase = 'leviathan';
          if (this.bgmIntervalId) { this.stopBGM(); this.startBGM(); }
        }
      } else if (this.leviathanOverrideActive) {
        this.leviathanOverrideActive = false;
        const phase = this.diveOverrideActive
          ? getAbyssPhaseForDepth(useGameStore.getState().character?.abyss?.currentDepth ?? 1)
          : getPhaseForStage(useGameStore.getState().character?.currentStage ?? 1);
        if (phase !== this.currentPhase) {
          this.currentPhase = phase;
          if (this.bgmIntervalId) { this.stopBGM(); this.startBGM(); }
        }
      }
    });
    // v10.4.0: SFX dedicados do Leviatã — sweep grave enquanto o Vagalhão canaliza, impacto+silêncio
    // na troca de fase (antes caíam nos fallbacks genéricos de clique/upgrade).
    bridge.subscribe(GameEvent.LEVIATHAN_CHANNEL_STARTED, (payload: any) => {
      if (payload?.type === 'vagalhao') this.playVagalhaoCharging();
    });
    bridge.subscribe(GameEvent.LEVIATHAN_PHASE_CHANGED, () => {
      this.playLeviathanPhaseChange();
    });
    // v10.2.0: canto de Eco Afogado resgatado.
    bridge.subscribe(GameEvent.ECHO_RESCUED, () => {
      this.playEchoRescued();
    });
    // Convergência: aviso sonoro temático ao manifestar o world boss de quarta-feira.
    bridge.subscribe(GameEvent.CONVERGENCE_ENCOUNTERED, () => {
      this.playConvergenceEncounter();
    });
    // Blip de Fôlego crítico (<25%), com debounce de 4s para não virar metrônomo
    bridge.subscribe(GameEvent.BREATH_CHANGED, (payload: any) => {
      const breath = payload?.breath;
      if (typeof breath === 'number' && breath > 0 && breath <= 25 && Date.now() - this.lastBreathWarningAt > 4000) {
        this.lastBreathWarningAt = Date.now();
        this.playBreathWarning();
      }
    });

    // Escuta mudanças no Zustand store para atualizar configurações e tocar efeitos reativos.
    // Ignora mutações que não afetam áudio/personagem (ex: ouro/inventário mudando durante o
    // combate) comparando a referência do personagem e as configurações de áudio com a última
    // execução, em vez de reprocessar tudo a cada mutação do store.
    let lastCharacterRef = useGameStore.getState().character;
    let lastSfxVolume = initialState.sfxVolume;
    let lastBgmVolume = initialState.bgmVolume;
    let lastSfxEnabled = initialState.sfxEnabled;
    let lastBgmEnabled = initialState.bgmEnabled;
    useGameStore.subscribe((state) => {
      const settingsChanged =
        state.sfxVolume !== lastSfxVolume ||
        state.bgmVolume !== lastBgmVolume ||
        state.sfxEnabled !== lastSfxEnabled ||
        state.bgmEnabled !== lastBgmEnabled;
      const characterChanged = state.character !== lastCharacterRef;
      if (!settingsChanged && !characterChanged) return;

      lastSfxVolume = state.sfxVolume;
      lastBgmVolume = state.bgmVolume;
      lastSfxEnabled = state.sfxEnabled;
      lastBgmEnabled = state.bgmEnabled;
      lastCharacterRef = state.character;

      // Atualiza volumes dinamicamente
      this.sfxVolume = (state.sfxVolume ?? 0.5) * 0.5;
      this.bgmVolume = (state.bgmVolume ?? 0.5) * 0.25;

      this.updateSettings(state.sfxEnabled ?? true, state.bgmEnabled ?? true);

      if (!state.character) return;

      // Troca de tema de BGM quando a fase (estágio de combate) muda — a Torre Infinita e a
      // Cidadela não têm trilha própria, então herdam automaticamente a música da fase atual.
      // v10.0.0: durante um mergulho, o override abyss_* vence (não trocar por estágio) — o tema
      // específico da zona já é mantido por DEPTH_CHANGED, então aqui só preserva o que já está
      // tocando (recalcular por profundidade a cada tick de estado sobrescreveria a zona certa).
      // v10.4.0: durante a luta do Leviatã, 'leviathan' vence sobre os dois.
      const isAbyssPhase = this.currentPhase === 'abyss' || this.currentPhase === 'abyss_z2' || this.currentPhase === 'abyss_z3' || this.currentPhase === 'abyss_z4';
      const newPhase = this.leviathanOverrideActive
        ? 'leviathan'
        : (this.diveOverrideActive ? (isAbyssPhase ? this.currentPhase : 'abyss') : getPhaseForStage(state.character.currentStage));
      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        if (this.bgmIntervalId) {
          this.stopBGM();
          this.startBGM();
        }
      }

      const currentLevel = state.character.level;
      const currentAttrPoints = state.character.attributePoints;
      const currentSkillPoints = state.character.skillPoints;
      const currentPrestigePoints = state.character.prestigePoints || 0;
      const currentPrestigeUpgrades = state.character.prestigeUpgrades || {};

      if (!initialized) {
        prevLevel = currentLevel;
        prevAttrPoints = currentAttrPoints;
        prevSkillPoints = currentSkillPoints;
        prevPrestigePoints = currentPrestigePoints;
        prevPrestigeUpgrades = { ...currentPrestigeUpgrades };
        initialized = true;
        return;
      }

      // 1. Detectar Level Up
      if (currentLevel > prevLevel) {
        this.playLevelUp();
      }
      // 2. Detectar Prestígio (level resetou para 1 e prestigePoints subiram)
      else if (currentLevel === 1 && prevLevel > 1 && currentPrestigePoints > prevPrestigePoints) {
        this.playPrestige();
      }
      // 3. Detectar upgrade de atributo
      else if (currentAttrPoints < prevAttrPoints && currentLevel === prevLevel) {
        this.playUpgrade();
      }
      // 4. Detectar upgrade de skill
      else if (currentSkillPoints < prevSkillPoints && currentLevel === prevLevel) {
        this.playUpgrade();
      }
      // 5. Detectar upgrade de prestígio
      else {
        let upgradeBought = false;
        for (const [key, val] of Object.entries(currentPrestigeUpgrades)) {
          const prevVal = prevPrestigeUpgrades[key] || 0;
          if (val > prevVal) {
            upgradeBought = true;
            break;
          }
        }
        if (upgradeBought && currentPrestigePoints < prevPrestigePoints) {
          this.playUpgrade();
        }
      }

      // Salva estados anteriores para a próxima comparação
      prevLevel = currentLevel;
      prevAttrPoints = currentAttrPoints;
      prevSkillPoints = currentSkillPoints;
      prevPrestigePoints = currentPrestigePoints;
      prevPrestigeUpgrades = { ...currentPrestigeUpgrades };
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Inicializa ou resume o AudioContext do navegador.
   * Precisa ser disparado por um gesto/clique do usuário devido a políticas de autoplay.
   */
  private initCtx(): boolean {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.error('[AudioManager] Falha ao criar AudioContext:', e);
        return false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn('[AudioManager] Erro ao resumir contexto:', e));
    }
    return true;
  }

  /**
   * Atualiza as configurações de áudio com base no estado global.
   */
  private updateSettings(sfxEnabled: boolean, bgmEnabled: boolean) {
    if (bgmEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
  }

  /**
   * Som de Clique de Botão
   */
  public playClick() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Som de Moeda (Compra / Venda de itens)
   * Sintetiza duas notas agudas e curtas simulando o tilintar de moedas.
   */
  public playCoin() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [987.77, 1318.51]; // B5 -> E6

    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.07);

      gain.gain.setValueAtTime(0, now + index * 0.07);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + index * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.18);
    });
  }

  /**
   * v10.0.0 — Splash de mergulho: ruído branco filtrado com varredura descendente (a batisfera
   * rompendo a superfície), padrão do playSlash.
   */
  public playDiveSplash() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.5;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + duration);
    filter.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * v10.0.0 — Blip de Fôlego crítico: `sine` agudo curto, disparado sob 25% (debounce no construtor).
   */
  public playBreathWarning() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1244.51, now); // D#6
    osc.frequency.setValueAtTime(1244.51, now + 0.12);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * v10.0.0 — Coleta de Pérola Abissal: díade cintilante (padrão playCoin, um degrau acima).
   */
  public playPearlCollect() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [1046.50, 1567.98]; // C6 -> G6 (quinta cintilante)

    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + index * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.25);
    });
  }

  /**
   * v10.0.0 — Engaste de runa: clique grave + harmônico (a runa "assentando" no soquete).
   */
  public playRuneSocket() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(180, now);
    clickOsc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
    clickGain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.12);

    const harmOsc = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harmOsc.type = 'sine';
    harmOsc.frequency.setValueAtTime(880, now + 0.06); // A5
    harmGain.gain.setValueAtTime(0, now + 0.06);
    harmGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.08);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    harmOsc.connect(harmGain);
    harmGain.connect(this.ctx.destination);
    harmOsc.start(now + 0.06);
    harmOsc.stop(now + 0.38);
  }

  /**
   * v10.3.0 — Palavra Rúnica completa: acorde ascendente de 4 notas (a gravação "se fechando").
   */
  public playRunewordComplete() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4-E4-G4-C5, arpejo ascendente
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + i * 0.09 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.55);
    });
  }

  /**
   * v10.4.0 — Vagalhão carregando: sweep grave de 3s (áudio-telégrafo além do visual da canalização).
   */
  public playVagalhaoCharging() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 3.0;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + duration);
    gain.gain.setValueAtTime(this.sfxVolume * 0.12, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.45, now + duration * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  /**
   * v10.4.0 — Troca de fase do Leviatã: impacto grave seguido de 0.5s de silêncio (o "respiro"
   * entre fases).
   */
  public playLeviathanPhaseChange() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(48, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.4);
    gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5); // + 0.5s de silêncio depois é só a ausência de novo som, não precisa de nó extra
  }

  /**
   * Convergência — aviso de world boss: rumble grave contínuo por baixo de dois "stabs"
   * dissonantes (trítono, G2→C#3), telegrafando perigo antes do modal de Enfrentar/Fugir.
   */
  public playConvergenceEncounter() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;

    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(40, now);
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + 0.15);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);
    rumble.start(now);
    rumble.stop(now + 1.35);

    const notes = [98.0, 138.59]; // G2, trítono acima (C#3)
    notes.forEach((freq, i) => {
      const delay = i * 0.28;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.65);
    });
  }

  /**
   * v10.2.0 — Canto de Eco resgatado: voz `sine` breve e serena.
   */
  public playEchoRescued() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.linearRampToValueAtTime(523.25, now + 0.3); // -> C5
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  /**
   * Som de Ataque Físico / Corte (Slash)
   * Sintetiza ruído branco com filtro passa-altas para simular o vento/corte da espada.
   */
  public playSlash() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.12; // Um pouco mais rápido e responsivo

    // Criar Buffer de Ruído Branco
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filtro Bandpass para focar no som de deslocamento de ar (corte) e remover agudos estridentes
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + duration);
    filter.Q.setValueAtTime(2.0, now); // Controla a largura de banda para um som limpo

    // Controle de volume (reduzido de 0.8 para 0.32)
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Som de Bola de Fogo (Fireball)
   * Sintetiza uma frequência decrescente áspera com filtro passa-baixas para dar a sensação de chama pesada.
   */
  public playFireball() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.35;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(80, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Som de Cura (Heal)
   * Gera uma bela cascata harmônica e brilhante com arpejos senoidais rápidos.
   */
  public playHeal() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Arpejo de Dó Maior (C Major Chord)
    
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.06);

      // Volume suave para cada nota do chime
      gain.gain.setValueAtTime(0, now + index * 0.06);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + index * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + index * 0.06);
      osc.stop(now + index * 0.06 + 0.3);
    });
  }

  /**
   * Som de Upgrade (Melhoria de atributo ou habilidade)
   * Duas notas rápidas e harmoniosas em tom ascendente.
   */
  public playUpgrade() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 783.99]; // C5 -> G5

    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.09);

      gain.gain.setValueAtTime(0.01, now + index * 0.09);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, now + index * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.005, now + index * 0.09 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + index * 0.09);
      osc.stop(now + index * 0.09 + 0.25);
    });
  }

  /**
   * Som de Level Up (Vitória / Subir de nível)
   * Um arpejo triunfal clássico estilo 8-bits.
   */
  public playLevelUp() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    // C5 -> E5 -> G5 -> C6
    const melody = [523.25, 659.25, 783.99, 1046.50];

    melody.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = index === melody.length - 1 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0.01, now + index * 0.12);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.45, now + index * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.002, now + index * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.4);
    });
  }

  /**
   * Som de Prestígio / Ascensão
   * Uma espiral cósmica e majestosa com modulação de frequência.
   */
  public playPrestige() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 1.0;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(900, now + duration);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(300, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + duration);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Som de Derrota do Inimigo
   */
  public playEnemyDefeat(isBoss = false) {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    
    if (isBoss) {
      this.playBossDefeatMelody();
      return;
    }
    
    if (!this.initCtx() || !this.ctx) return;

    // Som de derrota de monstro comum: impacto grave de 8-bits
    const now = this.ctx.currentTime;
    const duration = 0.22;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + duration);

    gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Som de Vitória do Chefe
   */
  private playBossDefeatMelody() {
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    // Pequena fanfarra heróica acelerada
    const melody = [587.33, 587.33, 587.33, 783.99, 987.77]; // D5, D5, D5, G5, B5
    const durations = [0.12, 0.12, 0.12, 0.24, 0.48];
    let timeOffset = 0;

    melody.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + timeOffset);

      gain.gain.setValueAtTime(0, now + timeOffset);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.002, now + timeOffset + durations[idx] - 0.02);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + durations[idx]);

      timeOffset += durations[idx] * 0.85; // overlap das notas
    });
  }

  /**
   * Som de Derrota do Jogador (Morte)
   */
  public playPlayerDefeat() {
    const sfxEnabled = useGameStore.getState().sfxEnabled ?? true;
    if (!sfxEnabled) return;
    if (!this.initCtx() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.7;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(60, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);

    gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Inicializa o Arpejador BGM Algorítmico em loop
   */
  private startBGM() {
    const bgmEnabled = useGameStore.getState().bgmEnabled ?? true;
    if (!bgmEnabled) return;
    
    // Se o loop já estiver rodando, não duplica
    if (this.bgmIntervalId) return;

    // Inicializa o contexto caso ainda não tenha sido
    this.initCtx();

    // Progressão de acordes do tema da fase atual (Normal/Pesadelo/Inferno/Apocalipse/Purgatório/Pandemônio)
    const theme = BGM_THEMES[this.currentPhase];
    const chords = theme.chords;

    const playBgmStep = () => {
      if (!this.ctx || this.ctx.state === 'suspended') return;

      const enabled = useGameStore.getState().bgmEnabled ?? true;
      if (!enabled) {
        this.stopBGM();
        return;
      }

      const now = this.ctx.currentTime;
      const currentChord = chords[this.bgmChordIdx];

      // A cada 8 batidas, mudamos de acorde
      if (this.bgmBeat % 8 === 0) {
        // Tocar a nota base grave (sub-bass) sustentada no início de cada acorde
        const bassFreq = currentChord[0];
        this.playSynthNote(bassFreq, theme.bassOscType, theme.bassDuration, this.bgmVolume * 0.65, now);
      }

      // Arpejo melódico suave (toca notas individuais do acorde atual)
      // Usamos posições pseudo-aleatórias/sequenciais das notas harmônicas
      const noteIdx = (this.bgmBeat * 2) % (currentChord.length - 1) + 1;
      const noteFreq = currentChord[noteIdx];

      // Notas do arpejo com o timbre definido pelo tema da fase atual
      this.playSynthNote(noteFreq, theme.arpOscType, theme.arpDuration, this.bgmVolume * 0.45, now);

      // Adiciona uma nota melódica aguda decorativa de vez em quando (o multiplicador é limitado
      // a um teto absoluto para nenhum tema produzir uma nota excessivamente aguda/estridente)
      if (this.bgmBeat % 4 === 2) {
        const rawLeadFreq = currentChord[currentChord.length - 1] * (this.bgmBeat % 8 === 2 ? 1 : 1.1);
        const leadFreq = Math.min(rawLeadFreq, 780);
        this.playSynthNote(leadFreq, theme.leadOscType, theme.leadDuration, this.bgmVolume * 0.22, now);
      }

      // Incrementar batida
      this.bgmBeat++;
      if (this.bgmBeat % 8 === 0) {
        this.bgmChordIdx = (this.bgmChordIdx + 1) % chords.length;
      }
    };

    // Andamento (batida) definido pelo tema da fase atual
    this.bgmIntervalId = setInterval(playBgmStep, theme.beatMs);
  }

  /**
   * Helper para tocar notas sintéticas da música de fundo e gerenciar referências para interrupção rápida
   */
  private playSynthNote(freq: number, type: OscillatorType, duration: number, volume: number, startTime: number) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelopes de volume suaves para evitar cliques audíveis (Pops)
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Osciladores 'square'/'sawtooth' têm harmônicos agudos muito ricos, que soam estridentes
    // em temas de BGM mais densos (Apocalipse, Pandemônio, Inferno). Um filtro passa-baixas suave
    // corta esses harmônicos mais altos sem perder o timbre "áspero" característico do tema.
    if (type === 'square' || type === 'sawtooth') {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(3200, Math.max(1600, freq * 3.5)), startTime);
      filter.Q.setValueAtTime(0.6, startTime);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);

    // Salva referências para se o jogador mutar a música no meio do arpejo
    this.currentBgmNodes.add(osc);
    this.currentBgmNodes.add(gain);

    setTimeout(() => {
      this.currentBgmNodes.delete(osc);
      this.currentBgmNodes.delete(gain);
    }, (duration + 0.2) * 1000);
  }

  /**
   * Para a música de fundo e limpa osciladores ativos
   */
  private stopBGM() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }

    // Mutar/desconectar todos os nós de BGM ativados no momento
    this.currentBgmNodes.forEach((node) => {
      try {
        if (node instanceof GainNode) {
          node.gain.cancelScheduledValues(0);
          node.gain.setValueAtTime(0, 0);
        } else if (node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch (e) {}
    });
    this.currentBgmNodes.clear();
    this.bgmBeat = 0;
    this.bgmChordIdx = 0;
  }
}
