// Temas de música de fundo (BGM) algorítmica por fase de dificuldade.
// Cada tema é uma progressão de acordes sintetizada via Web Audio API (osciladores),
// no mesmo estilo já usado pelo AudioManager — sem arquivos de áudio externos.

export type BgmPhase = 'normal' | 'nightmare' | 'inferno' | 'apocalypse' | 'purgatory' | 'pandemonium';

export interface BgmTheme {
  name: string;
  // Cada acorde é um array de frequências (Hz); a progressão toca em loop.
  chords: number[][];
  bassOscType: OscillatorType;
  arpOscType: OscillatorType;
  leadOscType: OscillatorType;
  beatMs: number; // duração de cada "batida" do arpejador (andamento)
  bassDuration: number;
  arpDuration: number;
  leadDuration: number;
}

export const BGM_THEMES: Record<BgmPhase, BgmTheme> = {
  // Normal (Fases 1-5): fantasia serena, tema original do jogo.
  normal: {
    name: 'Fantasia Sombria (Lá Menor)',
    chords: [
      [110.00, 220.00, 261.63, 329.63, 440.00], // Am
      [87.31, 174.61, 261.63, 349.23, 440.00],  // Fmaj
      [130.81, 261.63, 329.63, 392.00, 523.25], // Cmaj
      [98.00, 196.00, 246.94, 293.66, 392.00],  // Gmaj
    ],
    bassOscType: 'sine',
    arpOscType: 'triangle',
    leadOscType: 'sine',
    beatMs: 450,
    bassDuration: 1.8,
    arpDuration: 0.8,
    leadDuration: 1.2,
  },
  // Pesadelo (Fases 6-10): progressão diminuta e dissonante, tensão crescente.
  nightmare: {
    name: 'Vigília Amaldiçoada (Lá Menor Diminuta)',
    chords: [
      [110.00, 220.00, 261.63, 311.13, 440.00],  // Am(add b6)
      [116.54, 233.08, 277.18, 349.23, 466.16],  // Bdim
      [164.81, 220.00, 293.66, 349.23, 440.00],  // Em(sus)
      [92.50, 185.00, 220.00, 277.18, 369.99],   // F#dim
    ],
    bassOscType: 'sine',
    arpOscType: 'sawtooth',
    leadOscType: 'triangle',
    beatMs: 380,
    bassDuration: 1.6,
    arpDuration: 0.65,
    leadDuration: 1.0,
  },
  // Inferno (Fases 11-15): acordes graves e pesados, sub-bass reforçado.
  inferno: {
    name: 'Fornalha Abissal (Mi Menor Grave)',
    chords: [
      [55.00, 110.00, 164.81, 207.65, 293.66],  // Em grave
      [61.74, 123.47, 185.00, 233.08, 311.13],  // F#dim grave
      [65.41, 130.81, 196.00, 246.94, 349.23],  // Cmaj grave (relativo)
      [49.00, 98.00, 146.83, 185.00, 261.63],   // Gm grave
    ],
    bassOscType: 'sine',
    arpOscType: 'square',
    leadOscType: 'sawtooth',
    beatMs: 520,
    bassDuration: 2.2,
    arpDuration: 1.0,
    leadDuration: 1.4,
  },
  // Apocalipse (Fases 16-20): staccato urgente, ritmo acelerado e caótico.
  apocalypse: {
    name: 'Corrida do Juízo Final (Ré Menor Urgente)',
    chords: [
      [73.42, 146.83, 174.61, 220.00, 293.66],  // Dm
      [77.78, 155.56, 207.65, 233.08, 311.13],  // Ebdim
      [82.41, 164.81, 220.00, 246.94, 329.63],  // Em(b5)
      [69.30, 138.59, 185.00, 220.00, 277.18],  // C#dim
    ],
    bassOscType: 'sawtooth',
    arpOscType: 'square',
    leadOscType: 'square',
    beatMs: 260,
    bassDuration: 1.0,
    arpDuration: 0.4,
    leadDuration: 0.6,
  },
  // Purgatório (Fases 21-30): intervalos abertos e suspensos, atmosfera etérea e melancólica.
  purgatory: {
    name: 'Véu Suspenso (Sol Sus Etéreo)',
    chords: [
      [98.00, 196.00, 293.66, 392.00, 587.33],   // Gsus4
      [110.00, 220.00, 293.66, 440.00, 659.25],  // Asus2
      [87.31, 174.61, 261.63, 349.23, 523.25],   // Fsus2
      [82.41, 164.81, 246.94, 329.63, 493.88],   // Esus4
    ],
    bassOscType: 'sine',
    arpOscType: 'sine',
    leadOscType: 'triangle',
    beatMs: 620,
    bassDuration: 2.6,
    arpDuration: 1.6,
    leadDuration: 2.0,
  },
  // Pandemônio (Fases 31+): dissonância máxima, cluster de semitons, caos extremo.
  pandemonium: {
    name: 'Caos Primordial (Cluster Dissonante)',
    chords: [
      [55.00, 58.27, 110.00, 116.54, 220.00],   // Cluster A/Bb
      [61.74, 65.41, 123.47, 130.81, 246.94],   // Cluster B/C
      [58.27, 61.74, 116.54, 123.47, 233.08],   // Cluster Bb/B
      [65.41, 69.30, 130.81, 138.59, 261.63],   // Cluster C/C#
    ],
    bassOscType: 'sawtooth',
    arpOscType: 'sawtooth',
    leadOscType: 'square',
    beatMs: 200,
    bassDuration: 0.9,
    arpDuration: 0.35,
    leadDuration: 0.5,
  },
};

// Mapeamento de fase por estágio de combate atual, alinhado ao escalonamento do CombatFSM:
// Normal (1-5), Pesadelo (6-10), Inferno (11-15), Apocalipse (16-20), Purgatório (21-30), Pandemônio (31+).
export const getPhaseForStage = (stage: number): BgmPhase => {
  if (stage >= 31) return 'pandemonium';
  if (stage >= 21) return 'purgatory';
  if (stage >= 16) return 'apocalypse';
  if (stage >= 11) return 'inferno';
  if (stage >= 6) return 'nightmare';
  return 'normal';
};
