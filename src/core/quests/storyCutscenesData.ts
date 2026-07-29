export interface CutsceneLine {
  speakerId: string;
  speakerName: string;
  speakerRole: string;
  factionColor: string;
  avatarIcon: string; // Emoji / ícone de fallback para placeholder
  text: string;
}

export interface ActCutsceneDef {
  act: number;
  title: string;
  subtitle: string;
  lines: CutsceneLine[];
}

export const ACT_CUTSCENES_CATALOG: Record<number, ActCutsceneDef> = {
  // --- ATO I: O DESPERTAR DO ECO ---
  1: {
    act: 1,
    title: 'Ato I: O Despertar do Eco',
    subtitle: 'Nas sombras do Bosque Sussurrante, a alma se recusa a apagar.',
    lines: [
      {
        speakerId: 'alma_mundo',
        speakerName: 'Voz da Alma-Mundo',
        speakerRole: 'Consciência Primordial',
        factionColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'Abra os olhos, mortal... Ou melhor, o que resta de você. Não há memórias de onde veio, nem nomes a resgatar nesta névoa. Apenas sinta a pulsação fria da terra sob seus pés.',
      },
      {
        speakerId: 'alma_mundo',
        speakerName: 'Voz da Alma-Mundo',
        speakerRole: 'Consciência Primordial',
        factionColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'Você não é um habitante comum desta era. Você é um Eco — uma centelha de vontade moldada no molde dos campeões ancestrais. Este mundo já desmoronou e renasceu inúmeras vezes, tragado pelas sombras do Vazio.',
      },
      {
        speakerId: 'archivist_valeria',
        speakerName: 'Valéria',
        speakerRole: 'Arquivista Astral',
        factionColor: '#38bdf8',
        avatarIcon: '📜',
        text: 'Ah, você despertou! Meus registros astrais indicavam um distúrbio na malha do Bosque Sussurrante. Eu sou Valéria, guardiã das memórias não apagadas. O Vazio enviou suas imitações para extinguir sua centelha antes mesmo que você recobre suas forças.',
      },
      {
        speakerId: 'forge_master_vulkan',
        speakerName: 'Vulkan',
        speakerRole: 'Mestre da Forja',
        factionColor: '#f97316',
        avatarIcon: '⚒️',
        text: 'Deixe o garoto respirar, Valéria! Pela bigorna de obsidiana, olhe para esse corpo... fraco, sem armas e sem metal refinado. Mas há fogo nos olhos. Escute bem, Eco: limpe o bosque dos monstros iniciais e prove que seu pulso pode empunhar o aço.',
      },
      {
        speakerId: 'alma_mundo',
        speakerName: 'Voz da Alma-Mundo',
        speakerRole: 'Consciência Primordial',
        factionColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'Quando a dor do combate se tornar insuportável e os monstros imporem a barreira da finitude, não tema o fim. Realize o Rito de Ascensão. Grave cada cicatriz na sua alma e retorne mais forte do que a própria morte.',
      },
    ],
  },

  // --- ATO II: A RECONSTRUÇÃO ASTRAL ---
  2: {
    act: 2,
    title: 'Ato II: A Reconstrução Astral',
    subtitle: 'Com o metal e a vontade, ergue-se o baluarte contra o Vazio.',
    lines: [
      {
        speakerId: 'forge_master_vulkan',
        speakerName: 'Vulkan',
        speakerRole: 'Mestre da Forja',
        factionColor: '#f97316',
        avatarIcon: '⚒️',
        text: 'Veja com seus próprios olhos! As ruínas da Cidadela Astral repousavam esquecidas sob a poeira das eras. Mas agora que você alcançou o domínio inicial, podemos erguer novamente a Oficina da Forja e o Centro de Comando!',
      },
      {
        speakerId: 'archivist_valeria',
        speakerName: 'Valéria',
        speakerRole: 'Arquivista Astral',
        factionColor: '#38bdf8',
        avatarIcon: '📜',
        text: 'A Cidadela não é um mero refúgio de pedra, Eco. Ela é o ancorete espiritual que impede que o Vazio dissolva nossos tomos e experimentos. À medida que você aprimora suas construções, novas técnicas de maestria se desdobram em seu espírito.',
      },
      {
        speakerId: 'forge_master_vulkan',
        speakerName: 'Vulkan',
        speakerRole: 'Mestre da Forja',
        factionColor: '#f97316',
        avatarIcon: '⚒️',
        text: 'E não se esqueça da bigorna! O aço comum trinca diante das abominações do Purgatório. Forje e refine equipamentos de raridade Lendária. Alcance o limite da sua classe até que os ecos ancestrais de Paladino, Clérigo e Ladrão ressoem com você!',
      },
      {
        speakerId: 'alma_mundo',
        speakerName: 'Voz da Alma-Mundo',
        speakerRole: 'Consciência Primordial',
        factionColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'Derrote o Arquidemônio que guarda a Fase 20. O Selo de obsidian em suas mãos será a chave para rasgar o véu entre a realidade conhecida e o cárcere espelhado.',
      },
    ],
  },

  // --- ATO III: O CÁRCERE DOS CACOS ---
  3: {
    act: 3,
    title: 'Ato III: O Cárcere dos Cacos',
    subtitle: 'No purgatório espelhado, a verdade sobre os fragmentos se revela.',
    lines: [
      {
        speakerId: 'void_wanderer',
        speakerName: 'O Andarilho do Vazio',
        speakerRole: 'Sentinela Esquecida',
        factionColor: '#10b981',
        avatarIcon: '🌌',
        text: 'Passos pesados para quem carrega uma alma tão remendada... Bem-vindo ao Purgatório. Não olhe para os espelhos de cristal — eles mostram todas as vidas em que você falhou.',
      },
      {
        speakerId: 'archivist_valeria',
        speakerName: 'Valéria',
        speakerRole: 'Arquivista Astral',
        factionColor: '#38bdf8',
        avatarIcon: '📜',
        text: 'Os registros astrais confirmam: o Purgatório não foi criado pelos demônios para nos conter. Ele foi construído pelos próprios deuses antigos para encancerar os Fragmentos da Alma-Mundo antes que a Entropia os corrompesse por completo.',
      },
      {
        speakerId: 'void_wanderer',
        speakerName: 'O Andarilho do Vazio',
        speakerRole: 'Sentinela Esquecida',
        factionColor: '#10b981',
        avatarIcon: '🌌',
        text: 'O Guardião dos Cacos vigia a barreira da Fase 30. Ele desferirá golpes que partem o tecido do tempo. Se você o derrotar, não libertará apenas o mapa... libertará o poder adormecido das Relíquias Místicas.',
      },
      {
        speakerId: 'alma_mundo',
        speakerName: 'Voz da Alma-Mundo',
        speakerRole: 'Consciência Primordial',
        factionColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'Avance, Eco de Sangue e Aço. Estilhace os cristais do cárcere e tome a Bússola Astral. O próximo degrau não pertence aos mortais.',
      },
    ],
  },

  // --- ATO IV: A PROMESSA QUEBRADA ---
  4: {
    act: 4,
    title: 'Ato IV: A Promessa Quebrada',
    subtitle: 'No abismo do Pandemônio, a entropia aprende e se adapta.',
    lines: [
      {
        speakerId: 'void_wanderer',
        speakerName: 'O Andarilho do Vazio',
        speakerRole: 'Sentinela Esquecida',
        factionColor: '#10b981',
        avatarIcon: '🌌',
        text: 'Você cruzou o limiar da Fase 30... Mas olhe ao redor. O ar queimar como enxofre astral. Este é o Modo Pandemônio — a dimensão onde o Vazio não apenas ataca, ele aprende com cada movimento seu.',
      },
      {
        speakerId: 'alma_mundo',
        speakerName: 'Voz da Alma-Mundo',
        speakerRole: 'Consciência Primordial',
        factionColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'Há muito tempo, uma promessa foi feita pelos sete primeiros Avatares: eles garantiram que conteriam o Vazio no selo de obsidiana. Eles falharam. A promessa foi quebrada quando o primeiro de nós caiu no desespero.',
      },
      {
        speakerId: 'archivist_valeria',
        speakerName: 'Valéria',
        speakerRole: 'Arquivista Astral',
        factionColor: '#38bdf8',
        avatarIcon: '📜',
        text: 'No Pandemônio, seus equipamentos Lendários precisarão do toque supremo da Fusão Mística e do poder das Palavras Rúnicas gravadas na Câmara. Sem as Runas, a pressão atordoante do Vazio esmagará seu espírito.',
      },
      {
        speakerId: 'forge_master_vulkan',
        speakerName: 'Vulkan',
        speakerRole: 'Mestre da Forja',
        factionColor: '#f97316',
        avatarIcon: '⚒️',
        text: 'Mostre a eles do que o metal da Cidadela é feito! Marche através das hordas vulcânicas até a Fase 35. Quebre o ciclo da derrota!',
      },
    ],
  },

  // --- ATO V: O ESPELHO DA ALMA ---
  5: {
    act: 5,
    title: 'Ato V: O Espelho da Alma',
    subtitle: 'Além da roda do renascimento, a alma realiza o Rito de Transcendência.',
    lines: [
      {
        speakerId: 'avatar_echo',
        speakerName: 'O Eco do Avatar',
        speakerRole: 'Reflexo Divino',
        factionColor: '#ec4899',
        avatarIcon: '✨',
        text: 'Você finalmente chegou diante do espelho primordial. Olhe para mim... Eu sou aquilo que você se tornará quando abandonar o medo de recomeçar.',
      },
      {
        speakerId: 'archivist_valeria',
        speakerName: 'Valéria',
        speakerRole: 'Arquivista Astral',
        factionColor: '#38bdf8',
        avatarIcon: '📜',
        text: 'A Ascensão comum renova o corpo, mas a Transcendência purifica a própria essência espiritual. Ao realizar o Rito da Transcendência, os bônus acumulados deixam de ser simples frações de força — eles se tornam multiplicadores universais perpétuos!',
      },
      {
        speakerId: 'avatar_echo',
        speakerName: 'O Eco do Avatar',
        speakerRole: 'Reflexo Divino',
        factionColor: '#ec4899',
        avatarIcon: '✨',
        text: 'Toque o Vaso do Avatar e reclame sua marca. A roda do destino não mais controla seus passos. A partir deste instante, sua vontade moldará a própria Ecoterra.',
      },
      {
        speakerId: 'alma_mundo',
        speakerName: 'Voz da Alma-Mundo',
        speakerRole: 'Consciência Primordial',
        factionColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'A terra desperta sob seu comando. Mas escute... um lamento antigo ressoa das profundezas oceânicas. O último segredo aguarda no mar submerso.',
      },
    ],
  },

  // --- ATO VI: A NOTA DOS CÉUS ---
  6: {
    act: 6,
    title: 'Ato VI: A Nota dos Céus',
    subtitle: 'Nas abóbadas afundadas do mar, o Leviatã guarda a nota da criação.',
    lines: [
      {
        speakerId: 'sunken_castellan',
        speakerName: 'O Castelão Afundado',
        speakerRole: 'Senhor da Cidadela Submersa',
        factionColor: '#06b6d4',
        avatarIcon: '🌊',
        text: 'Quem é você que caminha sob o peso de cem atmosferas sem sufocar? Eu guardei estas ruínas naufragadas enquanto os séculos dissolviam as pedras em coral e sal.',
      },
      {
        speakerId: 'archivist_valeria',
        speakerName: 'Valéria',
        speakerRole: 'Arquivista Astral',
        factionColor: '#38bdf8',
        avatarIcon: '📜',
        text: 'A Cidadela Submersa! Uma segunda fortaleza erguida pelos nossos ancestrais, soterrada pelas marés primordiais. Resgate os Ecos Afogados presos nas correntes para restaurar a Doca Batial, o Salão e o Templo da Maré!',
      },
      {
        speakerId: 'sunken_castellan',
        speakerName: 'O Castelão Afundado',
        speakerRole: 'Senhor da Cidadela Submersa',
        factionColor: '#06b6d4',
        avatarIcon: '🌊',
        text: 'No Trono Afundado repousa O Leviatã do Ciclo. Ele não é um monstro cego, mas o afinador da grande melodia do mundo. Cada vez que ele canta nas Profundezas, um novo ciclo se inicia.',
      },
      {
        speakerId: 'alma_mundo',
        speakerName: 'Voz da Alma-Mundo',
        speakerRole: 'Consciência Primordial',
        factionColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'Mergulhe com sua Batisfera. Enfrente o Leviatã na quinta fase do combate abissal e escute a nota que atravessou as nuvens. É hora de fazer os céus responderem ao seu Eco!',
      },
    ],
  },
};
