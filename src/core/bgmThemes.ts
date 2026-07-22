// Temas de música de fundo (BGM) algorítmica por fase de dificuldade.
// Cada tema é uma progressão de acordes sintetizada via Web Audio API (osciladores),
// no mesmo estilo já usado pelo AudioManager — sem arquivos de áudio externos.

// v10.0.0 "A Cidadela Submersa": 'abyss' não é mapeada por estágio (getPhaseForStage) — é um
// OVERRIDE ativado pelos eventos DIVE_STARTED/DIVE_ENDED no AudioManager, enquanto durar o mergulho.
// v10.4.0 "O Leviatã do Ciclo": 'leviathan' é outro OVERRIDE (como 'abyss'), ativado pelo mode
// 'leviathan' do GameEvent.START_COMBAT enquanto a luta do chefe mundial durar.
export type BgmPhase = 'normal' | 'nightmare' | 'inferno' | 'apocalypse' | 'purgatory' | 'pandemonium' | 'abyss' | 'abyss_z2' | 'abyss_z3' | 'abyss_z4' | 'leviathan';

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
    leadOscType: 'triangle',
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
    leadOscType: 'triangle',
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
    leadOscType: 'triangle',
    beatMs: 200,
    bassDuration: 0.9,
    arpDuration: 0.35,
    leadDuration: 0.5,
  },
  // v10.0.0: Mergulhos Rasos — Zona 1 (Recife Partido). "Luz Coada": a ÚNICA BGM em tom MAIOR do
  // jogo (Dó Maior aquoso), quebrando o padrão sombrio de propósito — a luz filtrada do recife é o
  // contraste que fará as zonas fundas pesarem nas versões futuras. Baixo `sine` + arpejo
  // `triangle` borbulhante, andamento calmo.
  abyss: {
    name: 'Luz Coada (Dó Maior Aquoso)',
    chords: [
      [65.41, 130.81, 261.63, 329.63, 392.00],  // Cmaj (Dó Maior)
      [87.31, 174.61, 261.63, 349.23, 440.00],  // Fmaj
      [110.00, 220.00, 261.63, 329.63, 523.25], // Am7 (cor aquosa)
      [98.00, 196.00, 293.66, 392.00, 493.88],  // Gsus→G
    ],
    bassOscType: 'sine',
    arpOscType: 'triangle',
    leadOscType: 'sine',
    beatMs: 560,
    bassDuration: 2.4,
    arpDuration: 1.2,
    leadDuration: 1.8,
  },
  // v10.1.0 "As Profundezas": Zona 2 — Bosque de Algas Negras. "Sussurro das Algas": Mi Frígio,
  // intervalos rastejantes — `triangle` + `sine` levemente detunado simulando o batimento lento da
  // correnteza (Assets §1.7). Andamento lento, mais grave que a Zona 1.
  abyss_z2: {
    name: 'Sussurro das Algas (Mi Frígio)',
    chords: [
      [82.41, 98.00, 123.47, 164.81, 196.00],   // Em(b2)
      [87.31, 103.83, 130.81, 174.61, 207.65],  // Fmaj7 rastejante
      [77.78, 92.50, 116.54, 155.56, 185.00],   // Ebmaj(#11)
      [82.41, 98.00, 123.47, 164.81, 220.00],   // Em(add9)
    ],
    bassOscType: 'triangle',
    arpOscType: 'sine',
    leadOscType: 'triangle',
    beatMs: 640,
    bassDuration: 2.6,
    arpDuration: 1.4,
    leadDuration: 2.0,
  },
  // v10.1.0: Zona 3 — Ruínas da Cidadela. "Coro Afogado": Lá menor, vozes em quintas paralelas
  // (coral de igreja submerso) — 3 camadas `sine` defasadas, andamento solene (Assets §1.7). Base
  // reaproveitada pelo tema do Leviatã (leviathan), que alterna isso com o cluster do Pandemônio.
  abyss_z3: {
    name: 'Coro Afogado (Lá Menor Solene)',
    chords: [
      [110.00, 164.81, 220.00, 329.63, 440.00],  // Am7 em quintas
      [98.00, 146.83, 196.00, 293.66, 392.00],   // Gm7
      [87.31, 130.81, 174.61, 261.63, 349.23],   // Fmaj7
      [103.83, 155.56, 207.65, 311.13, 415.30],  // G#dim (tensão solene)
    ],
    bassOscType: 'sine',
    arpOscType: 'sine',
    leadOscType: 'sine',
    beatMs: 700,
    bassDuration: 2.8,
    arpDuration: 1.6,
    leadDuration: 2.2,
  },
  // v10.1.0: Zona 4 — Fossa do Caco. "Pulso do Abismo": Dó♯ cluster grave, uma nota-pulso a cada 2
  // compassos — `sawtooth` grave filtrado + sub `sine`, andamento muito lento (Assets §1.7).
  abyss_z4: {
    name: 'Pulso do Abismo (Dó♯ Cluster Grave)',
    chords: [
      [34.65, 36.71, 69.30, 73.42, 138.59],   // Cluster C#/D grave
      [34.65, 36.71, 69.30, 73.42, 138.59],   // pulso repetido (nota sustentada)
      [32.70, 34.65, 65.41, 69.30, 130.81],   // Cluster C/C# grave
      [34.65, 36.71, 69.30, 73.42, 138.59],   // retorno ao pulso
    ],
    bassOscType: 'sawtooth',
    arpOscType: 'sine',
    leadOscType: 'sine',
    beatMs: 900,
    bassDuration: 3.2,
    arpDuration: 1.8,
    leadDuration: 2.4,
  },
  // v10.4.0 "O Leviatã do Ciclo": "O Coro e a Fera" — alterna dentro da própria progressão de 4
  // acordes entre o coral consonante (sine em camadas, como o "Coro Afogado" da Zona 3) e o
  // cluster dissonante do Pandemônio, aproximando o efeito descrito no Anexo ("8 compassos de
  // Coro alternando com 8 de cluster") dentro do motor de progressão fixa já existente.
  leviathan: {
    name: 'O Coro e a Fera (Lá Menor / Cluster)',
    chords: [
      [110.00, 164.81, 220.00, 329.63, 440.00],  // Am7 em quintas (coral)
      [55.00, 58.27, 110.00, 116.54, 220.00],     // Cluster A/Bb (fera)
      [98.00, 146.83, 196.00, 293.66, 392.00],    // Gm7 (coral)
      [61.74, 65.41, 123.47, 130.81, 246.94],     // Cluster B/C (fera)
    ],
    bassOscType: 'sine',
    arpOscType: 'sawtooth',
    leadOscType: 'sine',
    beatMs: 340,
    bassDuration: 1.6,
    arpDuration: 0.7,
    leadDuration: 1.2,
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
