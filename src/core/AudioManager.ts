import { useGameStore } from '../store/useGameStore';
import { BGM_THEMES, BgmPhase, getPhaseForStage } from './bgmThemes';

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

    // Escuta mudanças no Zustand store para atualizar configurações e tocar efeitos reativos
    useGameStore.subscribe((state) => {
      if (!state) return;

      // Atualiza volumes dinamicamente
      this.sfxVolume = (state.sfxVolume ?? 0.5) * 0.5;
      this.bgmVolume = (state.bgmVolume ?? 0.5) * 0.25;

      this.updateSettings(state.sfxEnabled ?? true, state.bgmEnabled ?? true);

      if (!state.character) return;

      // Troca de tema de BGM quando a fase (estágio de combate) muda — a Torre Infinita e a
      // Cidadela não têm trilha própria, então herdam automaticamente a música da fase atual.
      const newPhase = getPhaseForStage(state.character.currentStage);
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

      // Adiciona uma nota melódica aguda decorativa de vez em quando
      if (this.bgmBeat % 4 === 2) {
        const leadFreq = currentChord[currentChord.length - 1] * (this.bgmBeat % 8 === 2 ? 1 : 1.2);
        this.playSynthNote(leadFreq, theme.leadOscType, theme.leadDuration, this.bgmVolume * 0.25, now);
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

    osc.connect(gain);
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
