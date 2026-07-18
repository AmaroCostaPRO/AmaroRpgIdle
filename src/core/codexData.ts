import type { Character } from './types';

// ============================================================================
// CODEX — Enciclopédia de Lore do Ciclo da Alma Partida
// ============================================================================
// Catálogo de dados puro (sem JSX), seguindo o mesmo padrão dos outros
// catálogos do jogo (ENEMY_TYPES, ACTIVE_RELICS_CATALOG, DEFAULT_RELICS...).
// Consumido por CodexPanel.tsx.
//
// Modelo de desbloqueio HÍBRIDO:
// - alwaysVisible: true  -> lore fundacional (cosmologia, facções, locais,
//   linha do tempo) sempre legível, funciona como enciclopédia aberta.
// - alwaysVisible: false -> biografias de chefes, biologia de criaturas e
//   capítulos históricos avançados só revelam o texto (`lore`) depois que
//   `isUnlocked` retorna true; até lá mostra `unlockHint`. Mantém o gancho
//   de descoberta que já existia no protótipo "Crônicas".

export type CodexCategory = 'cosmology' | 'factions' | 'characters' | 'bestiary' | 'events' | 'locations';

export const CODEX_CATEGORIES: { id: CodexCategory; label: string; icon: string }[] = [
  { id: 'cosmology', label: 'Cosmologia', icon: '🌌' },
  { id: 'factions', label: 'Facções', icon: '🏛️' },
  { id: 'characters', label: 'Personagens', icon: '👤' },
  { id: 'bestiary', label: 'Biologia', icon: '🐉' },
  { id: 'events', label: 'História', icon: '📜' },
  { id: 'locations', label: 'Locais', icon: '🗺️' },
];

export interface CodexUnlockContext {
  character: Character;
  getClassLevel: (classId: string) => number;
  isClassUnlockedFn: (classId: string) => boolean;
  totalKills: number;
}

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  icon: string;
  title: string;
  subtitle?: string;
  lore: string;
  color: string;
  tags?: string[];
  alwaysVisible: boolean;
  unlockHint?: string;
  isUnlocked: (ctx: CodexUnlockContext) => boolean;
}

// --- Helpers de desbloqueio ---
const killed = (ctx: CodexUnlockContext, enemyId: string): boolean => (ctx.character.killCount?.[enemyId] ?? 0) > 0;
const anyKilled = (ctx: CodexUnlockContext, ids: string[]): boolean => ids.some((id) => killed(ctx, id));
const always = (): boolean => true;

const CONVERGENCE_BOSS_IDS = ['boss_what_still_dreams', 'boss_reflection_reaper', 'boss_nameless_hunger', 'boss_empty_throne'];

// ============================================================================
// 1. COSMOLOGIA
// ============================================================================
const cosmologyEntries: CodexEntry[] = [
  {
    id: 'cosmo_alma_mundo',
    category: 'cosmology',
    icon: '☯️',
    title: 'A Alma-Mundo Inteira',
    lore:
      'Antes que houvesse reinos, fases ou nomes, havia uma única Alma — vasta, inteira, sonhando o mundo em existência a cada instante. Ela não governava a realidade: ela *era* a realidade, e tudo o que existia era um pensamento seu ainda não terminado. Não existia "tempo" como o conhecemos; existia apenas o sonho contínuo da Alma, sem começo e sem fim, sem sequer a necessidade de um observador que o testemunhasse. Os poucos textos que sobreviveram à Fragmentação chamam esse período de "o Fôlego Único" — o único momento em que a existência inteira concordava consigo mesma.',
    color: '#c084fc',
    tags: ['alma-mundo', 'mito', 'origem'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_fragmentacao',
    category: 'cosmology',
    icon: '💔',
    title: 'A Fragmentação',
    lore:
      'Ninguém sabe ao certo se foi guerra, acidente ou escolha. O que se sabe é que, em um instante sem duração, a Alma-Mundo se partiu — e onde havia uma vontade única, passaram a existir seis vozes discordantes, cada uma convencida de ser a *única* legítima. Esses seis fragmentos maiores ficaram conhecidos como os Ecos, e cada um carregava consigo uma fatia distorcida do que a Alma um dia foi: força sem dúvida, magia sem limites, precisão sem hesitação, fé sem perdão, cura sem descanso, e traição sem remorso. Nenhum deles é "o mundo verdadeiro". Todos são, ao mesmo tempo, verdadeiros e incompletos — cacos tentando se convencer de que são o espelho inteiro.',
    color: '#a855f7',
    tags: ['alma-mundo', 'mito', 'origem', 'ecos'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_seis_ecos',
    category: 'cosmology',
    icon: '🔯',
    title: 'Os Seis Ecos',
    lore:
      'Da Fragmentação nasceram seis vontades incompletas — os Ecos — e cada Herói que desperta neste mundo carrega, sem escolher, um deles em si: o Guerreiro (Força sem dúvida), o Mago (Magia sem limites), o Arqueiro (Precisão sem hesitação). Com o tempo e o sofrimento, três desses Ecos aprendem a se dobrar em algo mais: o Guerreiro que jura proteger em vez de apenas vencer torna-se Paladino; o Mago que escolhe curar em vez de destruir torna-se Clérigo; o Arqueiro que aprende que a flecha mais letal caminha nas sombras torna-se Ladrão. Um sétimo caminho, proibido e mais antigo que os outros seis, nasce não da Fragmentação em si, mas da fadiga da própria Morte: o Necromante. Nenhuma classe é "melhor" que outra — são ângulos diferentes do mesmo espelho quebrado, e é por isso que a Ascensão permite caminhar por todos eles, uma vida de cada vez.',
    color: '#f0abfc',
    tags: ['classes', 'ecos', 'guerreiro', 'mago', 'arqueiro', 'paladino', 'clerigo', 'ladrao', 'necromante'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_vazio',
    category: 'cosmology',
    icon: '🕳️',
    title: 'O Vazio Entre os Cacos',
    lore:
      'Quando a Alma se partiu, ela não deixou apenas seis Ecos — deixou também as rachaduras entre eles. Esse espaço sem substância, o intervalo onde nenhum fragmento da Alma jamais tocou, é o que os sobreviventes chamam de Vazio. Os monstros que você enfrenta em combate não nasceram deste mundo: são o Vazio tentando imitar formas que já existiram, tentando ser "algo" em vez de nada. É por isso que goblins, lobos, esqueletos e demônios de biomas tão diferentes compartilham uma mesma sede muda por matar — não é fome nem malícia como a de um ser vivo, é o Vazio testando, repetidamente, se consegue enfim ser real o bastante para durar.',
    color: '#4c1d95',
    tags: ['vazio', 'monstros', 'mito'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_ascensao',
    category: 'cosmology',
    icon: '🌀',
    title: 'A Ascensão: Morrer Para Lembrar',
    lore:
      'Você vai morrer. Muitas vezes. Cada tentativa termina, cedo ou tarde, com a Alma sendo empurrada de volta ao início — mas nada se perde de fato. Chamam isso de Ascensão: não uma derrota, e sim um ritual involuntário em que a Alma-Mundo, ao sentir seu Eco romper o véu de uma vida, absorve o que foi aprendido e devolve o Herói ao começo mais forte do que antes, carregando Pontos de Prestígio como cicatrizes permanentes. A Ascensão dói porque lembrar dói — mas é a única forma que a Alma partida encontrou de crescer sem se recompor de verdade. Ela não aceita ficar presa a uma única tentativa, assim como não aceitou ficar presa a uma única forma.',
    color: '#facc15',
    tags: ['ascensao', 'prestigio', 'mito'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_purgatorio',
    category: 'cosmology',
    icon: '🔮',
    title: 'O Purgatório: Cárcere dos Cacos',
    lore:
      'Depois das cinco regiões conhecidas — Floresta, Deserto, Picos Glaciais, Cemitério e Ruínas — o mapa que todo Herói carrega revela ser menor que o território real. O Purgatório é onde as almas partidas esperam, presas entre a memória e o esquecimento, vigiadas por algo que se autodenomina Guardião. Diferente dos biomas anteriores, o Purgatório não tem estação, clima ou geografia própria: é um não-lugar construído inteiramente da tentativa desesperada da Alma-Mundo de conter os próprios estilhaços antes que se espalhem longe demais. Chegar até lá não é conquista — é a descoberta de que havia uma prisão sob todo o resto do jogo, e que você acabou de bater na porta dela.',
    color: '#818cf8',
    tags: ['purgatorio', 'mito', 'fase-30'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_pandemonio',
    category: 'cosmology',
    icon: '🌌',
    title: 'Pandemônio: A Promessa Quebrada',
    lore:
      'O Modo Pandemônio não é um lugar — é uma promessa quebrada. A promessa de que, um dia, a jornada teria um fim. Depois que o Guardião dos Cacos cai e o ritual é conduzido no Altar de Sincronia, as fases deixam de terminar: o Vazio, que antes imitava formas conhecidas por curiosidade, começa a imitá-las por desespero, ficando mais rápido, mais denso, mais parecido consigo mesmo a cada nova tentativa. É a primeira região do jogo que "aprende" com suas derrotas de forma perceptível — e é também, segundo os textos mais antigos, o primeiro lugar onde algo mais velho que os próprios seis Ecos começa a prestar atenção em você.',
    color: '#ec4899',
    tags: ['pandemonio', 'mito', 'endgame'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_convergencia',
    category: 'cosmology',
    icon: '🩸',
    title: 'A Convergência: Rachaduras Semanais',
    lore:
      'Toda quarta-feira, por um motivo que ninguém no mundo desperto sabe explicar com certeza, o véu entre o Pandemônio e o resto da realidade fica fino demais para se manter. É nesse instante que a Convergência se manifesta: um único ser, sempre diferente, sempre imenso, que tenta atravessar a rachadura antes que ela se feche de novo. Os quatro rostos já vistos — O Que Ainda Sonha, O Ceifador de Reflexos, A Fome sem Nome e O Trono Vazio — não são quatro criaturas distintas, mas quatro tentativas malformadas da *mesma coisa antiga* de assumir uma forma que caiba neste mundo. Cada semana, ela falha de um jeito novo. Cada falha deixa um fragmento para trás — uma relíquia ativa exclusiva, moldada da própria tentativa fracassada.',
    color: '#dc2626',
    tags: ['convergencia', 'mito', 'endgame', 'quarta-feira'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_transcendencia',
    category: 'cosmology',
    icon: '✨',
    title: 'Transcendência: Além da Roda',
    lore:
      'A Ascensão quebra uma vida de cada vez. A Transcendência quebra o próprio ciclo. Ao acumular Pontos de Prestígio suficientes depois de já ter aberto o Pandemônio e alcançado a Fase 50, o Herói para de repetir a roda e passa a reescrevê-la: sua essência é refeita em algo que já não precisa "nascer de novo" a cada Ascensão, e sim carregar Pontos de Transcendência entre todas elas, como uma segunda camada de memória que a própria Alma-Mundo não sabia ser possível. Não é mais um Eco tentando se lembrar de ser inteiro — é um Eco aprendendo a existir por conta própria, fora da lógica original da Fragmentação.',
    color: '#00e5ff',
    tags: ['transcendencia', 'mito', 'endgame'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_ecoterra',
    category: 'cosmology',
    icon: '🪞',
    title: 'Ecoterra: O Espelho Além do Véu',
    lore:
      'Quando a Transcendência é ativada, o mundo que o Herói percorre passa a ter um reflexo — a Ecoterra, uma versão do mesmo território vista do outro lado do véu que a Fragmentação abriu. Não é um lugar novo, mas o mesmo lugar visto pelo ângulo que o Vazio usa para tentar imitá-lo: as mesmas fases, os mesmos biomas, porém carregados de uma intensidade que só faz sentido para quem já morreu vezes o bastante para deixar de ter medo disso. Diz-se que cada vez que o Herói ativa a Ecoterra, uma versão minúscula do Vazio observa de volta, tentando aprender o que significa "ser um reflexo de propósito", em vez de um reflexo de vazio.',
    color: '#22d3ee',
    tags: ['ecoterra', 'transcendencia', 'mito'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_avatar',
    category: 'cosmology',
    icon: '🌟',
    title: 'O Avatar: Reunião Simbólica',
    lore:
      'O Avatar não é um Guerreiro, um Mago ou um Arqueiro — é a única forma conhecida em que os cinco atributos cardinais da Alma (Força, Magia, Destreza, Constituição e Sorte) voltam a falar em uma única voz, ainda que por um instante. Não é a Alma-Mundo restaurada — seria ingênuo pensar isso — mas é a prova viva de que a reunificação não é impossível, apenas extremamente rara e extremamente dolorosa de sustentar. Alcançar o Avatar Pleno exige dominar Mana Suprema, Domínio do Vazio, Foco Temporal e a Alma do Avatar em perfeita sintonia: cada um desses talentos é, na prática, aprender a ouvir um dos Ecos sem deixar que ele grite mais alto que os outros.',
    color: '#f87171',
    tags: ['avatar', 'transcendencia', 'mito', 'classes'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'cosmo_bosque_sussurrante',
    category: 'cosmology',
    icon: '🌿',
    title: 'O Bosque Sussurrante: O Fragmento Intocado',
    lore:
      'Entre todos os biomas que o Herói atravessa, o Bosque Sussurrante é o único que o Vazio ainda não corrompeu por completo. É o lugar onde a jornada sempre começa — não por acaso, mas porque é o único canto do mundo partido onde ecos pequenos demais para carregar uma vontade inteira ainda conseguem existir em paz, sussurrando entre as folhas em vez de atacar por instinto. Alguns estudiosos da Cidadela Astral acreditam que o Bosque é, na verdade, o berço original de todos os Ecos menores — o rascunho que a Alma fez antes de tentar (e falhar) se recompor em algo maior.',
    color: '#4ade80',
    tags: ['bosque-sussurrante', 'mito', 'bioma'],
    alwaysVisible: true,
    isUnlocked: always,
  },
];

// ============================================================================
// 2. FACÇÕES & ORGANIZAÇÕES
// ============================================================================
const factionEntries: CodexEntry[] = [
  {
    id: 'faction_cidadela_astral',
    category: 'factions',
    icon: '🌌',
    title: 'Cidadela Astral',
    subtitle: 'A base do Herói entre uma investida e outra',
    lore:
      'A Cidadela Astral não foi construída — ela foi *lembrada*. É o único lugar estável o bastante para que o Herói monte uma base entre incursões, e cresce conforme mais fragmentos da vontade do jogador se organizam em algo parecido com uma instituição. Cada ala da Cidadela representa uma função que a Alma-Mundo antiga desempenhava sozinha e que agora precisa ser reconstruída peça por peça: guardar recursos, treinar recrutas, vigiar o horizonte, forjar armas, sifonar energia cósmica, sincronizar rituais, catalogar relíquias, destilar poções e caçar sob contrato. Não é uma cidade no sentido tradicional — é mais parecida com um órgão vivo que só existe enquanto alguém continua alimentando sua vontade de continuar existindo.',
    color: '#a855f7',
    tags: ['cidadela', 'faccao'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_deposito_expedicoes',
    category: 'factions',
    icon: '📦',
    title: 'O Depósito e o Quartel de Expedições',
    subtitle: 'Recursos e destacamentos da Cidadela',
    lore:
      'O Depósito é a memória material da Cidadela: madeira, pedra e carne recolhidas de cada bioma são guardadas ali como se cada tora e cada pedra carregasse um pedaço de história de onde veio. É também onde equipamentos excedentes esperam para ser reaproveitados. Já o Quartel de Expedições é o braço mais ousado da organização — destacamentos de personagens de classes já dominadas pelo jogador são enviados em missões paralelas, fora do alcance direto do Herói, retornando com materiais que nenhuma incursão sozinha conseguiria coletar tão rápido. É a prova mais concreta de que a Cidadela deixou de ser apenas um abrigo e passou a agir como uma força organizada.',
    color: '#eab308',
    tags: ['cidadela', 'faccao', 'deposito', 'expedicoes'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_academia_vigia',
    category: 'factions',
    icon: '🎓',
    title: 'A Academia Militar e a Torre de Vigia',
    subtitle: 'Pesquisa e vigilância astral',
    lore:
      'A Academia Militar transforma insígnias de estudo em avanços permanentes — pesquisas de dano, vida, velocidade e sorte que a Cidadela inteira passa a carregar, como se cada descoberta fosse ensinada a todo Eco simultaneamente. A Torre de Vigia Astral, erguida no ponto mais alto da Cidadela, tem uma única função: observar as rachaduras no céu antes que qualquer outra ala perceba, armazenando Chaves da Torre Infinita recolhidas das investidas mais perigosas. Juntas, essas duas alas formam o "cérebro" estratégico da Cidadela — uma decide o que aprender, a outra decide o que vigiar.',
    color: '#38bdf8',
    tags: ['cidadela', 'faccao', 'academia', 'torre-de-vigia'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_forja_sifao',
    category: 'factions',
    icon: '🛠️',
    title: 'A Oficina da Forja e o Sifão Cósmico',
    subtitle: 'Onde o metal e a energia se dobram à vontade',
    lore:
      'A Oficina da Forja é onde fragmentos de forja se tornam poder bruto — não fabrica equipamentos do zero, mas aprimora os que já sobreviveram ao combate, fundindo raridades umas nas outras até que um item comum se torne uma relíquia mística. O Sifão Cósmico, por sua vez, é a ala mais estranha da Cidadela: um dispositivo que suga energia residual do próprio Vazio quando ele se aproxima demais das muralhas, convertendo o que seria uma ameaça em combustível utilizável. Poucos entendem completamente como o Sifão funciona — nem mesmo quem o opera —, mas todos concordam que desligá-lo seria um erro.',
    color: '#f97316',
    tags: ['cidadela', 'faccao', 'forja', 'sifao'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_altar_laboratorios',
    category: 'factions',
    icon: '🔯',
    title: 'O Altar de Sincronia e os Laboratórios',
    subtitle: 'Rituais, relíquias e alquimia',
    lore:
      'O Altar de Sincronia é o coração ritualístico da Cidadela — é ali que o ritual de abertura do Pandemônio é conduzido, e é ali que a Transcendência, mais tarde, se torna possível. O Laboratório de Relíquias estuda Fragmentos de Alma Instável e os transforma em Relíquias passivas — ecos menores da Alma-Mundo, permanentemente ligados ao Herói. O Laboratório de Alquimia, mais recente que os outros dois, destila os materiais trazidos pelas Expedições em poções de efeito temporário, sem depender de produção automática: cada poção é, literalmente, preparada à mão. As três alas juntas representam a tentativa da Cidadela de dominar não só matéria, mas também o que resta da vontade da Alma partida.',
    color: '#c084fc',
    tags: ['cidadela', 'faccao', 'altar', 'relicario', 'alquimia'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_santuario_caca',
    category: 'factions',
    icon: '📜',
    title: 'O Santuário de Contratos de Caça',
    subtitle: 'A ala mais nova da Cidadela Astral',
    lore:
      'Erguido só depois que o Pandemônio já era realidade conhecida, o Santuário de Contratos de Caça nasceu de uma constatação simples: o Bestiário, sozinho, registrava criaturas — mas não organizava a caça a elas. O Santuário rotaciona contratos que exigem abates específicos, prometendo materiais e ouro em troca, tratando cada monstro do Vazio não mais como um obstáculo aleatório, mas como um alvo catalogado e ativamente perseguido. É a ala mais "militarizada" da Cidadela — a que trata o combate como um trabalho, e não apenas como sobrevivência.',
    color: '#fbbf24',
    tags: ['cidadela', 'faccao', 'santuario', 'contratos', 'caca'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_tradicao_primordial',
    category: 'factions',
    icon: '⚔️',
    title: 'A Tríade Primordial',
    subtitle: 'Guerreiro, Mago e Arqueiro',
    lore:
      'Guerreiro, Mago e Arqueiro não formam uma "ordem" no sentido formal — não têm templo, hierarquia ou juramento — mas compartilham algo mais antigo que qualquer instituição: são os três primeiros Ecos a assumir forma reconhecível depois da Fragmentação, e por isso costumam ser chamados de Tríade Primordial nos poucos registros que sobreviveram. Cada um representa uma resposta bruta e sem filtro a um dos impulsos da Alma original — força, conhecimento, precisão — sem ainda ter aprendido a se dobrar em algo mais complexo. É desse solo simples que nascem, mais tarde, os caminhos avançados.',
    color: '#f87171',
    tags: ['faccao', 'guerreiro', 'mago', 'arqueiro', 'classes'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_tradicao_ascendente',
    category: 'factions',
    icon: '🕊️',
    title: 'Os Caminhos Ascendentes',
    subtitle: 'Paladino, Clérigo e Ladrão',
    lore:
      'Onde a Tríade Primordial responde ao mundo com impulso puro, os Caminhos Ascendentes respondem com escolha. O Paladino é o Guerreiro que decidiu que proteger vale mais que apenas vencer; o Clérigo é o Mago que escolheu curar em vez de destruir, mesmo sendo chamado de ingênuo por isso; o Ladrão é o Arqueiro que aprendeu que a flecha mais letal nem sempre precisa voar. Nenhum desses caminhos existe sem primeiro dominar o original — é preciso levar Guerreiro, Mago ou Arqueiro a Nível 50 antes que a Alma-Mundo permita a mudança, como se cada Eco precisasse provar que entende plenamente o que está prestes a abandonar.',
    color: '#fbbf24',
    tags: ['faccao', 'paladino', 'clerigo', 'ladrao', 'classes'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_culto_proibido',
    category: 'factions',
    icon: '💀',
    title: 'O Culto Proibido do Necromante',
    subtitle: 'A sétima classe, nascida fora da regra',
    lore:
      'Dizem que o Necromante não nasceu da Fragmentação como os outros seis Ecos, mas da fadiga da própria Morte, cansada de esperar por almas que se recusavam a partir em paz. Diferente dos Caminhos Ascendentes, ele não evolui de um único Eco anterior — exige que o jogador já tenha levado tanto o Clérigo quanto o Ladrão a Nível 50 (um rastreamento que atravessa até mesmo saves diferentes), como se apenas quem já entendeu cura *e* traição, luz *e* sombra, tivesse maturidade para negociar com o que vem depois da morte. Não é uma classe "má" — é uma classe que se recusou a fingir que a morte não faz parte do ciclo.',
    color: '#f43f5e',
    tags: ['faccao', 'necromante', 'classes'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_uniao_avatar',
    category: 'factions',
    icon: '🌟',
    title: 'A União do Avatar',
    subtitle: 'Quando os sete caminhos deixam de competir',
    lore:
      'A União do Avatar não é bem uma facção — é o momento em que todas as outras deixam de fazer sentido como divisões separadas. Só é alcançada depois da Transcendência, quando o Herói já entendeu, na prática, o peso de cada um dos Ecos que vestiu ao longo da jornada. O Avatar não escolhe entre Força, Magia, Destreza, Constituição e Sorte: canaliza todas ao mesmo tempo, em perfeita e frágil harmonia. É o mais próximo que qualquer Herói já chegou de sentir, ainda que por instantes, o que era ser a Alma-Mundo antes de tudo se partir.',
    color: '#f87171',
    tags: ['faccao', 'avatar', 'classes', 'transcendencia'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_mercador_ambulante',
    category: 'factions',
    icon: '🎪',
    title: 'O Mercador Ambulante',
    subtitle: 'Neutro, enigmático, sempre de passagem',
    lore:
      'Ninguém na Cidadela Astral sabe dizer com certeza de onde o Mercador Ambulante vem, nem para onde vai quando desaparece. Ele simplesmente aparece — em qualquer bioma, em qualquer fase, sem aviso — oferecendo Elixires poderosos em troca de ouro, e depois some com a mesma naturalidade com que chegou. Não luta, não pode ser atacado, e nunca oferece a mesma seleção duas vezes seguidas. Alguns acreditam que ele é um Eco menor que aprendeu a negociar em vez de lutar; outros suspeitam que ele nem pertença à Fragmentação, e sim a algo de fora dela inteiramente — o que tornaria seu comércio a única forma de contato pacífico com algo além do Ciclo.',
    color: '#fde68a',
    tags: ['faccao', 'mercador'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'faction_vazio_antifaccao',
    category: 'factions',
    icon: '🕳️',
    title: 'O Vazio Como Anti-Facção',
    subtitle: 'Sem líder, sem hierarquia, sem intenção — só padrão',
    lore:
      'O Vazio não tem general, não tem capital, não tem plano. E ainda assim, com o tempo, ele desenvolve *padrões* que se parecem perigosamente com estratégia: nas noites de Lua de Sangue, os inimigos de qualquer fase ficam mais fortes e ganham uma coloração vermelha, como se o Vazio estivesse experimentando uma versão mais afiada de si mesmo. Inimigos de Elite surgem isoladamente, portando afixos que nenhum monstro comum carregaria. E, nas quartas-feiras, a Convergência tenta romper o véu por inteiro. Nada disso é ordenado por ninguém — é o Vazio aprendendo, por tentativa e erro, a imitar cada vez melhor o que significa "ter uma intenção".',
    color: '#7c2d12',
    tags: ['faccao', 'vazio', 'elite', 'lua-de-sangue', 'convergencia'],
    alwaysVisible: true,
    isUnlocked: always,
  },
];

// ============================================================================
// 3. PERSONAGENS
// ============================================================================
const characterEntries: CodexEntry[] = [
  {
    id: 'char_alma_mundo_voz',
    category: 'characters',
    icon: '☯️',
    title: 'A Alma-Mundo',
    subtitle: 'A voz que sussurra em cada Ascensão',
    lore:
      'Ela não fala com palavras — fala com a sensação de déjà vu que acompanha cada Ascensão, com o peso extra de cada Eco recém-dominado, com o silêncio específico que só existe depois de derrotar um chefe importante demais para comemorar sozinho. A Alma-Mundo não é uma personagem no sentido tradicional: é a presença constante por trás de cada sistema do jogo, tentando se lembrar de como era ser inteira através de cada vida que o Herói vive em seu nome. Ninguém sabe se ela ainda está consciente do que restou dela, ou se apenas reage, por hábito, a qualquer coisa que se pareça com progresso.',
    color: '#c084fc',
    tags: ['alma-mundo', 'mito'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'char_heroi',
    category: 'characters',
    icon: '🧍',
    title: 'Você, o Eco Que Caminha',
    subtitle: 'O protagonista desta crônica',
    lore:
      'A Alma acordou sem memória. Apenas a sensação de um combate inacabado, como se o mundo inteiro esperasse por um herói que ainda não sabia que era. Você é esse Eco — o único, entre incontáveis outros que já se apagaram no Vazio, que continuou se levantando depois de cada Ascensão. Não por ser mais forte no início, mas por se recusar a aceitar que uma tentativa fosse a última. Cada linha deste Codex, cada monstro catalogado, cada facção descrita, existe porque você continuou escolhendo caminhar.',
    color: '#94a3b8',
    tags: ['heroi', 'jogador'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'char_mercador',
    category: 'characters',
    icon: '🎪',
    title: 'O Sábio das Encruzilhadas',
    subtitle: 'Assim os registros mais antigos chamam o Mercador',
    lore:
      'Antes de ser apenas "o Mercador Ambulante", alguns fragmentos de texto recuperados da Cidadela o chamavam de Sábio das Encruzilhadas — um nome que sugere algo mais antigo e mais deliberado do que um simples vendedor itinerante. Ele nunca luta, nunca é ferido, e parece saber exatamente quando aparecer: sempre em momentos de baixo suprimento, nunca em momentos de perigo real. Se ele é aliado, neutro, ou apenas seguindo uma lógica que não temos como compreender, nenhum Herói descobriu até hoje.',
    color: '#fde68a',
    tags: ['mercador', 'personagem'],
    alwaysVisible: false,
    unlockHint: 'Encontre o Mercador Ambulante em combate ao menos uma vez.',
    isUnlocked: (ctx) => !!ctx.character.resolvedMerchantEncounterKey,
  },
  {
    id: 'char_guardiao_sussurro',
    category: 'characters',
    icon: '🌿',
    title: 'Guardião do Sussurro',
    subtitle: 'Chefe do Bosque Sussurrante — Fases 1 a 5',
    lore:
      'O guardião mais antigo do Bosque Sussurrante é um eco maior que os demais, grande o bastante para ter aprendido a proteger — não a atacar por instinto, como quase todo o resto do Vazio. Ele não busca o Herói; apenas impede que qualquer coisa saia ou entre do único fragmento do mundo que o Vazio ainda não conseguiu corromper por inteiro. Derrotá-lo não é um ato de conquista, mas uma prova de que é possível atravessar o Bosque sem quebrar o pouco de paz que resta nele.',
    color: '#4ade80',
    tags: ['boss', 'bosque-sussurrante'],
    alwaysVisible: false,
    unlockHint: 'Derrote o Guardião do Sussurro no Bosque Sussurrante.',
    isUnlocked: (ctx) => killed(ctx, 'boss_whispering_warden'),
  },
  {
    id: 'char_golem_pedra_silvestre',
    category: 'characters',
    icon: '🗿',
    title: 'Golem de Pedra Silvestre',
    subtitle: 'Chefe da Floresta Antiga — Fase 1',
    lore:
      'Uma antiga entidade de pedra e raízes, adormecida por tanto tempo que as próprias árvores cresceram através dela, até que a corrupção lenta do Vazio a despertou de vez. Não pensa como um ser vivo pensaria — reage à presença de qualquer coisa que perturbe seu território com punhos colossais, sem malícia e sem hesitação. É o primeiro verdadeiro teste de resistência que qualquer Herói enfrenta, um lembrete de que a Floresta Antiga guarda mais peso, literal e figurativamente, do que aparenta.',
    color: '#34d399',
    tags: ['boss', 'floresta-antiga'],
    alwaysVisible: false,
    unlockHint: 'Derrote o Golem de Pedra Silvestre na Floresta Antiga.',
    isUnlocked: (ctx) => killed(ctx, 'boss_forest_golem'),
  },
  {
    id: 'char_rei_escorpiao',
    category: 'characters',
    icon: '🦂',
    title: 'Rei Escorpião de Ouro',
    subtitle: 'Chefe do Deserto de Ouro — Fase 2',
    lore:
      'O maior predador do Deserto de Ouro tem uma carapaça fundida com o próprio ouro das dunas — não por vaidade, mas porque passou séculos enterrado sob elas, absorvendo o metal precioso camada após camada. Suas pinças são capazes de partir armaduras ao meio, e seus súditos, serpentes e escorpiões menores, aprendem a temê-lo tanto quanto qualquer aventureiro. Reina sobre um território que não tem lei além da sobrevivência, e é o único das criaturas do deserto que parece entender, ainda que vagamente, o conceito de território.',
    color: '#fbbf24',
    tags: ['boss', 'deserto-de-ouro'],
    alwaysVisible: false,
    unlockHint: 'Derrote o Rei Escorpião de Ouro no Deserto de Ouro.',
    isUnlocked: (ctx) => killed(ctx, 'boss_sand_scorpion'),
  },
  {
    id: 'char_dragao_gelo',
    category: 'characters',
    icon: '🐉',
    title: 'Dragão de Gelo Ancião',
    subtitle: 'Chefe dos Picos Glaciais — Fase 3',
    lore:
      'Um dragão lendário que repousa no topo do pico mais alto e mais frio que qualquer Herói já escalou. As lendas dizem que seu sopro congelou exércitos inteiros de heróis antes mesmo de chegarem perto o bastante para vê-lo de verdade. Diferente dos outros chefes de bioma, o Dragão de Gelo Ancião não parece corrompido pelo Vazio — parece, ao contrário, algo que sobreviveu a ele por puro peso próprio, uma criatura antiga demais para o Vazio conseguir imitar ou substituir.',
    color: '#0ea5e9',
    tags: ['boss', 'picos-glaciais'],
    alwaysVisible: false,
    unlockHint: 'Derrote o Dragão de Gelo Ancião nos Picos Glaciais.',
    isUnlocked: (ctx) => killed(ctx, 'boss_frost_dragon'),
  },
  {
    id: 'char_necromante_sombrio',
    category: 'characters',
    icon: '💀',
    title: 'Necromante Sombrio',
    subtitle: 'Chefe do Cemitério Maldito — Fase 4',
    lore:
      'Um mago corrupto que dominou os segredos da morte e da reanimação muito antes de qualquer Necromante "oficial" existir entre os Ecos — e talvez seja, inclusive, a razão pela qual esse caminho se tornou possível para os Heróis mais tarde. Comanda o Cemitério Maldito com cajados profanos, erguendo esqueletos e zumbis como uma guarda pessoal que nunca se cansa e nunca questiona. Alguns estudiosos da Academia da Cidadela suspeitam que ele não seja um monstro corrompido pelo Vazio, mas um mortal que negociou tempo demais com a Morte, e perdeu.',
    color: '#c084fc',
    tags: ['boss', 'cemiterio-maldito'],
    alwaysVisible: false,
    unlockHint: 'Derrote o Necromante Sombrio no Cemitério Maldito.',
    isUnlocked: (ctx) => killed(ctx, 'boss_necromancer'),
  },
  {
    id: 'char_arquidemonio',
    category: 'characters',
    icon: '👹',
    title: 'Arquidemônio das Ruínas',
    subtitle: 'Chefe das Ruínas Sombrias — Fase 5',
    lore:
      'O soberano supremo das Ruínas Sombrias é um ser titânico que empunha o fogo do inferno como extensão do próprio corpo, buscando consumir a alma de qualquer invasor que ouse atravessar seus salões desmoronados. Diferente do Golem ou do Dragão, ele parece ter *ambição* — não apenas defende seu território, ele deseja expandi-lo, e é por isso que as Ruínas continuam crescendo lentamente em direção ao Cemitério vizinho a cada era que passa.',
    color: '#f43f5e',
    tags: ['boss', 'ruinas-sombrias'],
    alwaysVisible: false,
    unlockHint: 'Derrote o Arquidemônio das Ruínas nas Ruínas Sombrias.',
    isUnlocked: (ctx) => killed(ctx, 'boss_archdemon'),
  },
  {
    id: 'char_guardiao_dos_cacos',
    category: 'characters',
    icon: '🔮',
    title: 'Guardião dos Cacos',
    subtitle: 'Chefe final do Purgatório — Fase 30',
    lore:
      'O terrível protetor das profundezas do Purgatório jurava que ninguém passaria por ele rumo ao Pandemônio. Sua função nunca foi atacar por prazer — foi *reter*, com a determinação teimosa de algo que sabe exatamente o que está guardando e por quê. Mas a Alma-Mundo não aceita prisões, nem mesmo as construídas dos seus próprios fragmentos: quando finalmente cai, não é apenas uma vitória de combate, é a confirmação de que nenhuma barreira erguida pela própria Fragmentação consegue conter, para sempre, a vontade de continuar.',
    color: '#38bdf8',
    tags: ['boss', 'purgatorio', 'endgame'],
    alwaysVisible: false,
    unlockHint: 'Derrote o Guardião dos Cacos na Fase 30 do Purgatório.',
    isUnlocked: (ctx) => !!ctx.character.purgatoryCompleted || killed(ctx, 'boss_crystal_guardian'),
  },
  {
    id: 'char_que_ainda_sonha',
    category: 'characters',
    icon: '🕳️',
    title: 'O Que Ainda Sonha',
    subtitle: 'Rosto da Convergência — quartas-feiras',
    lore:
      'A mais silenciosa das quatro formas da Convergência não ataca com fúria, mas com a estranha certeza de quem ainda acredita, apesar de tudo, que o Fôlego Único pode ser recuperado. Enfrentá-lo é enfrentar uma versão do Vazio que não quer destruir o mundo desperto — quer voltar a sonhá-lo por inteiro, como a Alma-Mundo fazia antes da Fragmentação, e não hesita em consumir qualquer coisa em seu caminho para tentar.',
    color: '#7c3aed',
    tags: ['boss', 'convergencia', 'endgame'],
    alwaysVisible: false,
    unlockHint: 'Derrote O Que Ainda Sonha durante uma Convergência de quarta-feira.',
    isUnlocked: (ctx) => killed(ctx, 'boss_what_still_dreams'),
  },
  {
    id: 'char_ceifador_reflexos',
    category: 'characters',
    icon: '🩸',
    title: 'O Ceifador de Reflexos',
    subtitle: 'Rosto da Convergência — quartas-feiras',
    lore:
      'Onde O Que Ainda Sonha tenta lembrar, o Ceifador de Reflexos tenta *copiar*. É a forma da Convergência mais próxima da Lua de Sangue e dos Elites — uma tentativa agressiva de imitar tudo o que já provou ser eficaz contra o Herói, reciclando padrões de combate vistos em outros biomas e devolvendo-os amplificados. Combatê-lo é, muitas vezes, como lutar contra um espelho distorcido de tudo que você já enfrentou antes.',
    color: '#dc2626',
    tags: ['boss', 'convergencia', 'endgame'],
    alwaysVisible: false,
    unlockHint: 'Derrote O Ceifador de Reflexos durante uma Convergência de quarta-feira.',
    isUnlocked: (ctx) => killed(ctx, 'boss_reflection_reaper'),
  },
  {
    id: 'char_fome_sem_nome',
    category: 'characters',
    icon: '🪱',
    title: 'A Fome sem Nome',
    subtitle: 'Rosto da Convergência — quartas-feiras',
    lore:
      'Não tem forma fixa, não tem propósito além de consumir, e nem mesmo os poucos textos que a descrevem concordam sobre sua aparência. A Fome sem Nome é a manifestação mais primal do Vazio: sem a curiosidade de O Que Ainda Sonha, sem a imitação do Ceifador de Reflexos, apenas o instinto puro e antigo de devorar qualquer coisa que ainda tenha forma definida — inclusive, se puder, a própria forma do Herói.',
    color: '#16a34a',
    tags: ['boss', 'convergencia', 'endgame'],
    alwaysVisible: false,
    unlockHint: 'Derrote A Fome sem Nome durante uma Convergência de quarta-feira.',
    isUnlocked: (ctx) => killed(ctx, 'boss_nameless_hunger'),
  },
  {
    id: 'char_trono_vazio',
    category: 'characters',
    icon: '👑',
    title: 'O Trono Vazio',
    subtitle: 'Rosto da Convergência — quartas-feiras',
    lore:
      'A mais orgulhosa das quatro formas da Convergência se comporta como se já tivesse vencido antes mesmo do combate começar — como se, em algum outro fragmento da realidade que não este, ela já governasse tudo o que restou da Alma-Mundo. Enfrentá-la é enfrentar a arrogância do Vazio tomando forma quase régia, uma paródia distorcida de autoridade que nunca teve súditos de verdade além dos próprios monstros que arrasta consigo.',
    color: '#b45309',
    tags: ['boss', 'convergencia', 'endgame'],
    alwaysVisible: false,
    unlockHint: 'Derrote O Trono Vazio durante uma Convergência de quarta-feira.',
    isUnlocked: (ctx) => killed(ctx, 'boss_empty_throne'),
  },
];

// ============================================================================
// 4. BESTIÁRIO — BIOLOGIA
// ============================================================================
const bestiaryEntries: CodexEntry[] = [
  // --- Bosque Sussurrante ---
  {
    id: 'best_bioma_bosque',
    category: 'bestiary',
    icon: '🌿',
    title: 'Ecologia do Bosque Sussurrante',
    lore:
      'O único bioma que o Vazio ainda não corrompeu por inteiro abriga criaturas pequenas demais para carregar uma vontade própria completa — ecos frágeis que aprenderam a existir sem atacar por instinto puro. É o berço de toda jornada, e o único lugar onde encontrar uma criatura hostil ainda é, de certa forma, uma surpresa.',
    color: '#4ade80',
    tags: ['bioma', 'bosque-sussurrante'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'best_whisper_sprite',
    category: 'bestiary',
    icon: '✨',
    title: 'Sprite Sussurrante',
    lore: 'Um pequeno eco da Alma partida, pequeno demais para carregar uma vontade inteira. Sussurra entre as folhas do Bosque, ainda intocado pelo Vazio.',
    color: '#86efac',
    tags: ['bosque-sussurrante', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Sprite Sussurrante.',
    isUnlocked: (ctx) => killed(ctx, 'whisper_sprite'),
  },
  {
    id: 'best_thorned_treant',
    category: 'bestiary',
    icon: '🌳',
    title: 'Treantulho Espinhoso',
    lore: 'Uma criatura de casca e espinhos que cresceu devagar demais para notar o tempo passar. Defende o Bosque Sussurrante com raízes e galhos afiados.',
    color: '#65a30d',
    tags: ['bosque-sussurrante', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Treantulho Espinhoso.',
    isUnlocked: (ctx) => killed(ctx, 'thorned_treant'),
  },
  {
    id: 'best_fae_rabbit',
    category: 'bestiary',
    icon: '🐇',
    title: 'Coelho Feérico',
    lore: 'Ágil e esquivo, essa criatura feérica atravessa o Bosque em saltos rápidos demais para o olho acompanhar — mais curiosa que hostil, ataca apenas quando se sente encurralada.',
    color: '#fde68a',
    tags: ['bosque-sussurrante', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Coelho Feérico.',
    isUnlocked: (ctx) => killed(ctx, 'fae_rabbit'),
  },

  // --- Floresta Antiga ---
  {
    id: 'best_bioma_floresta',
    category: 'bestiary',
    icon: '🌲',
    title: 'Ecologia da Floresta Antiga',
    lore:
      'Mais densa e mais hostil que o Bosque Sussurrante, a Floresta Antiga já mostra os primeiros sinais claros de corrupção do Vazio: criaturas que espreitam, emboscam e atacam em grupo, organizadas por um instinto que não é bem inteligência, mas já não é mais inocência.',
    color: '#4ade80',
    tags: ['bioma', 'floresta-antiga'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'best_goblin',
    category: 'bestiary',
    icon: '👺',
    title: 'Goblin Ladino',
    lore: 'Pequenos, ágeis e traiçoeiros, costumam espreitar nas sombras das copas das árvores da Floresta Antiga para emboscar aventureiros desavisados.',
    color: '#4ade80',
    tags: ['floresta-antiga', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Goblin Ladino.',
    isUnlocked: (ctx) => killed(ctx, 'goblin'),
  },
  {
    id: 'best_shadow_wolf',
    category: 'bestiary',
    icon: '🐺',
    title: 'Lobo das Sombras',
    lore: 'Um predador voraz cujos olhos brilham no escuro. Sua pelagem negra se confunde com as sombras da floresta, facilitando botes letais e silenciosos.',
    color: '#94a3b8',
    tags: ['floresta-antiga', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Lobo das Sombras.',
    isUnlocked: (ctx) => killed(ctx, 'shadow_wolf'),
  },
  {
    id: 'best_orc_warrior',
    category: 'bestiary',
    icon: '🪓',
    title: 'Guerreiro Orc',
    lore: 'Um combatente brutal que empunha machados massivos. Sua força física avantajada compensa sua lerdeza em batalha.',
    color: '#f87171',
    tags: ['floresta-antiga', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Guerreiro Orc.',
    isUnlocked: (ctx) => killed(ctx, 'orc_warrior'),
  },

  // --- Deserto de Ouro ---
  {
    id: 'best_bioma_deserto',
    category: 'bestiary',
    icon: '🏜️',
    title: 'Ecologia do Deserto de Ouro',
    lore:
      'Sob as dunas douradas, o calor e a escassez moldaram criaturas oportunistas — venenosas, rápidas, acostumadas a atacar de surpresa em um território onde esperar demais para agir significa morrer de fome ou de sede antes mesmo de encontrar uma presa.',
    color: '#fbbf24',
    tags: ['bioma', 'deserto-de-ouro'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'best_sand_serpent',
    category: 'bestiary',
    icon: '🐍',
    title: 'Serpente da Areia',
    lore: 'Réptil venenoso gigante que desliza silenciosamente sob as dunas do Deserto de Ouro, atacando suas presas de surpresa.',
    color: '#fbbf24',
    tags: ['deserto-de-ouro', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote uma Serpente da Areia.',
    isUnlocked: (ctx) => killed(ctx, 'sand_serpent'),
  },
  {
    id: 'best_desert_bandit',
    category: 'bestiary',
    icon: '🗡️',
    title: 'Bandido Nômade',
    lore: 'Exilados implacáveis que aprenderam a sobreviver nos confins mais hostis do deserto através da pilhagem e do combate rápido.',
    color: '#f59e0b',
    tags: ['deserto-de-ouro', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Bandido Nômade.',
    isUnlocked: (ctx) => killed(ctx, 'desert_bandit'),
  },
  {
    id: 'best_desert_scorpion',
    category: 'bestiary',
    icon: '🦂',
    title: 'Escorpião de Fogo',
    lore: 'Uma criatura monstruosa com uma carapaça que parece lava solidificada, capaz de injetar toxinas ardentes com seu ferrão.',
    color: '#ef4444',
    tags: ['deserto-de-ouro', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Escorpião de Fogo.',
    isUnlocked: (ctx) => killed(ctx, 'desert_scorpion'),
  },

  // --- Picos Glaciais ---
  {
    id: 'best_bioma_picos',
    category: 'bestiary',
    icon: '🏔️',
    title: 'Ecologia dos Picos Glaciais',
    lore:
      'O frio extremo dos Picos Glaciais não afasta o Vazio — o intensifica. As criaturas que vivem ali desenvolveram corpos capazes de congelar feridas, dispersar frio como arma e sobreviver isoladas em cavernas por tempo suficiente para se tornarem territoriais até a violência.',
    color: '#38bdf8',
    tags: ['bioma', 'picos-glaciais'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'best_frost_wolf',
    category: 'bestiary',
    icon: '🐺',
    title: 'Lobo Invernal',
    lore: 'Uma criatura mística adaptada ao frio extremo dos Picos Glaciais. Sua mordida congelante pode paralisar as feridas de suas presas.',
    color: '#38bdf8',
    tags: ['picos-glaciais', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Lobo Invernal.',
    isUnlocked: (ctx) => killed(ctx, 'frost_wolf'),
  },
  {
    id: 'best_ice_elemental',
    category: 'bestiary',
    icon: '❄️',
    title: 'Elemental de Gelo',
    lore: 'Um espírito da natureza feito de gelo eterno e energia mágica pura, que dispara estilhaços congelantes nos invasores.',
    color: '#7dd3fc',
    tags: ['picos-glaciais', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Elemental de Gelo.',
    isUnlocked: (ctx) => killed(ctx, 'ice_elemental'),
  },
  {
    id: 'best_cave_yeti',
    category: 'bestiary',
    icon: '🧊',
    title: 'Yeti das Cavernas',
    lore: 'Uma besta peluda colossal e territorial que habita as cavernas mais profundas dos picos glaciais, esmagando oponentes com saltos pesados.',
    color: '#e2e8f0',
    tags: ['picos-glaciais', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Yeti das Cavernas.',
    isUnlocked: (ctx) => killed(ctx, 'cave_yeti'),
  },

  // --- Cemitério Maldito ---
  {
    id: 'best_bioma_cemiterio',
    category: 'bestiary',
    icon: '⚰️',
    title: 'Ecologia do Cemitério Maldito',
    lore:
      'Nenhuma criatura no Cemitério Maldito está, tecnicamente, viva. É o bioma onde a linha entre o Vazio e a morte comum se confunde por completo — corpos reanimados, almas presas e ressentimentos que se recusam a desaparecer compartilham o mesmo solo profano.',
    color: '#84cc16',
    tags: ['bioma', 'cemiterio-maldito'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'best_skeleton_warrior',
    category: 'bestiary',
    icon: '💀',
    title: 'Esqueleto Guerreiro',
    lore: 'Os restos reanimados de antigos defensores do reino, mantidos erguidos por pura magia negra e uma eterna sede de combate.',
    color: '#94a3b8',
    tags: ['cemiterio-maldito', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Esqueleto Guerreiro.',
    isUnlocked: (ctx) => killed(ctx, 'skeleton_warrior'),
  },
  {
    id: 'best_decaying_zombie',
    category: 'bestiary',
    icon: '🧟',
    title: 'Zumbi Putrefato',
    lore: 'Um cadáver em decomposição lenta que ergueu-se das sepulturas rasas. Embora lento, seu corpo ignora ferimentos fatais.',
    color: '#84cc16',
    tags: ['cemiterio-maldito', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Zumbi Putrefato.',
    isUnlocked: (ctx) => killed(ctx, 'decaying_zombie'),
  },
  {
    id: 'best_tormented_ghost',
    category: 'bestiary',
    icon: '👻',
    title: 'Fantasma Atormentado',
    lore: 'A alma penada de um pecador que não consegue descansar em paz. Flutua vagando pelo Cemitério Maldito e drena a energia vital.',
    color: '#67e8f9',
    tags: ['cemiterio-maldito', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Fantasma Atormentado.',
    isUnlocked: (ctx) => killed(ctx, 'tormented_ghost'),
  },

  // --- Ruínas Sombrias ---
  {
    id: 'best_bioma_ruinas',
    category: 'bestiary',
    icon: '🏛️',
    title: 'Ecologia das Ruínas Sombrias',
    lore:
      'O que um dia foi, talvez, um templo ou uma fortaleza agora abriga demônios menores e construtos animados por almas presas. Diferente dos outros biomas, as Ruínas Sombrias parecem *crescer* lentamente com o tempo, como se ainda estivessem em construção sob o comando de algo que não desiste.',
    color: '#f43f5e',
    tags: ['bioma', 'ruinas-sombrias'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'best_stone_gargoyle',
    category: 'bestiary',
    icon: '🗿',
    title: 'Gárgula de Pedra',
    lore: 'Uma criatura demoníaca esculpida em pedra que ganha vida nas Ruínas Sombrias, caindo do alto das muralhas sobre suas vítimas.',
    color: '#64748b',
    tags: ['ruinas-sombrias', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote uma Gárgula de Pedra.',
    isUnlocked: (ctx) => killed(ctx, 'stone_gargoyle'),
  },
  {
    id: 'best_living_armor',
    category: 'bestiary',
    icon: '🛡️',
    title: 'Armadura Possuída',
    lore: 'Um conjunto de placas de aço pesado que ganhou senciência por almas aprisionadas nas ruínas, lutando incansavelmente.',
    color: '#a78bfa',
    tags: ['ruinas-sombrias', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote uma Armadura Possuída.',
    isUnlocked: (ctx) => killed(ctx, 'living_armor'),
  },
  {
    id: 'best_demon_imp',
    category: 'bestiary',
    icon: '👿',
    title: 'Diabrete Menor',
    lore: 'Um pequeno demônio alado vindo das profundezas do submundo, ágil e especializado em conjurar pequenas bolas de fogo e caos.',
    color: '#f43f5e',
    tags: ['ruinas-sombrias', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Diabrete Menor.',
    isUnlocked: (ctx) => killed(ctx, 'demon_imp'),
  },

  // --- Purgatório ---
  {
    id: 'best_bioma_purgatorio',
    category: 'bestiary',
    icon: '🔮',
    title: 'Ecologia do Purgatório',
    lore:
      'Nada no Purgatório tem forma fixa por muito tempo. As criaturas que vivem ali não nasceram de biologia alguma — são fragmentos de ressentimento, memória e cristal que a Alma-Mundo ainda não conseguiu processar, vagando entre a lembrança e o esquecimento.',
    color: '#818cf8',
    tags: ['bioma', 'purgatorio', 'endgame'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'best_purgatory_specter',
    category: 'bestiary',
    icon: '👤',
    title: 'Espectro do Purgatório',
    lore: 'Uma silhueta distorcida feita de ressentimento e poeira estelar, vagando eternamente pelo purgatório em busca de vingança contra os vivos.',
    color: '#e9d5ff',
    tags: ['purgatorio', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Espectro do Purgatório.',
    isUnlocked: (ctx) => killed(ctx, 'purgatory_specter'),
  },
  {
    id: 'best_lost_soul',
    category: 'bestiary',
    icon: '🌫️',
    title: 'Alma Perdida',
    lore: 'Uma alma que perdeu seu caminho e sua forma após a quebra do mundo. Seu toque frio drena a energia vital.',
    color: '#a5f3fc',
    tags: ['purgatorio', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote uma Alma Perdida.',
    isUnlocked: (ctx) => killed(ctx, 'lost_soul'),
  },
  {
    id: 'best_crystal_shatterer',
    category: 'bestiary',
    icon: '💎',
    title: 'Quebrador de Cristais',
    lore: 'Uma besta cristalina que se alimenta dos fragmentos da Alma-Mundo. Suas garras afiadas podem despedaçar a mais resistente das armaduras.',
    color: '#f472b6',
    tags: ['purgatorio', 'criatura'],
    alwaysVisible: false,
    unlockHint: 'Derrote um Quebrador de Cristais.',
    isUnlocked: (ctx) => killed(ctx, 'crystal_shatterer'),
  },
];

// ============================================================================
// 5. EVENTOS HISTÓRICOS
// ============================================================================
const eventEntries: CodexEntry[] = [
  {
    id: 'event_era_zero',
    category: 'events',
    icon: '💔',
    title: 'Era Zero — A Fragmentação',
    subtitle: 'O evento fundador de toda a história',
    lore:
      'Não há data para a Fragmentação, porque o tempo, como o entendemos, nasceu junto com ela. Antes, havia apenas o Fôlego Único da Alma-Mundo. Depois, havia seis vozes discordantes e um Vazio crescendo em cada rachadura entre elas. Todo o resto da história — cada bioma, cada classe, cada facção da Cidadela Astral — é, em essência, uma tentativa de lidar com as consequências desse único instante.',
    color: '#a855f7',
    tags: ['historia', 'fragmentacao'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'event_longo_silencio',
    category: 'events',
    icon: '🌑',
    title: 'O Longo Silêncio',
    subtitle: 'Entre a Fragmentação e o primeiro Herói',
    lore:
      'Por um período que nenhum registro consegue medir, o mundo partido ficou sem ninguém capaz de atravessá-lo por inteiro. Os Ecos existiam, dispersos, incapazes de se organizar; o Vazio crescia devagar, testando formas sem pressa. Foi só quando o primeiro Eco — o que você carrega agora — despertou com a "sensação de um combate inacabado" que o Longo Silêncio terminou, e a história, de fato, começou a ser contada.',
    color: '#475569',
    tags: ['historia', 'origem'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'event_despertar_cidadela',
    category: 'events',
    icon: '🌌',
    title: 'O Despertar da Cidadela',
    subtitle: 'Fundação da Cidadela Astral',
    lore:
      'Depois de sobreviver aos primeiros biomas repetidas vezes, o Herói finalmente encontrou um lugar estável o bastante para não precisar recomeçar tudo do zero a cada Ascensão: a Cidadela Astral. Não foi construída como uma fortaleza tradicional — foi lembrada, peça por peça, como se cada ala (o Depósito, o Quartel, a Academia) já existisse na memória da Alma-Mundo, esperando apenas alguém disposto a reconstruí-la.',
    color: '#a855f7',
    tags: ['historia', 'cidadela'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'event_ecos_que_despertam',
    category: 'events',
    icon: '🌿',
    title: 'Ecos que Despertam',
    subtitle: 'O Bosque Sussurrante, os companheiros e o Mercador',
    lore:
      'Um novo fragmento do mundo se revelou — pequeno, frágil, ainda intocado pelo Vazio: o Bosque Sussurrante. Junto com ele, vieram companheiros capturáveis, pequenos ecos dispostos a acompanhar o Herói em sua jornada sem lutar por conta própria, e os primeiros encontros documentados com o Mercador Ambulante. Foi a era em que a jornada, pela primeira vez, pareceu ter espaço para algo além de sobrevivência.',
    color: '#4ade80',
    tags: ['historia', 'bosque-sussurrante', 'mercador'],
    alwaysVisible: false,
    unlockHint: 'Derrote o Guardião do Sussurro no Bosque Sussurrante.',
    isUnlocked: (ctx) => killed(ctx, 'boss_whispering_warden'),
  },
  {
    id: 'event_espelho_faminto',
    category: 'events',
    icon: '🩸',
    title: 'O Espelho Faminto',
    subtitle: 'Lua de Sangue, Elites e a Torre das Maldições',
    lore:
      'O Vazio aprendeu a imitar melhor. Nas noites de fim de semana, um fenômeno batizado de Lua de Sangue passou a intensificar cada criatura da fase atual, tingindo-as de vermelho e abrindo uma tabela de recompensas própria. Inimigos de Elite, isolados e mais perigosos, começaram a surgir com afixos nunca antes vistos. E, nas profundezas da Torre Infinita, uma nova ramificação — a das Maldições — revelou que até estruturas conhecidas podiam ser distorcidas de dentro para fora.',
    color: '#dc2626',
    tags: ['historia', 'lua-de-sangue', 'elite', 'torre'],
    alwaysVisible: false,
    unlockHint: 'Complete o Purgatório para desbloquear este capítulo.',
    isUnlocked: (ctx) => !!ctx.character.purgatoryCompleted,
  },
  {
    id: 'event_que_espera_pandemonio',
    category: 'events',
    icon: '🌌',
    title: 'O Que Espera no Pandemônio',
    subtitle: 'Contratos de Caça e Relíquias Ativas',
    lore:
      'Com o Pandemônio finalmente aberto, a Cidadela Astral precisou evoluir de novo: o Bestiário, que antes só catalogava, ganhou um braço ativo — o Santuário de Contratos de Caça, tratando cada abate como trabalho organizado. Ao mesmo tempo, Relíquias Ativas passaram a ser encontradas em combate, cada uma uma habilidade fixa própria. E, nas profundezas mais recentes do Pandemônio, os primeiros sinais de algo mais antigo que os próprios seis Ecos começaram a ser sentidos.',
    color: '#ec4899',
    tags: ['historia', 'pandemonio', 'santuario', 'reliquias'],
    alwaysVisible: false,
    unlockHint: 'Desbloqueie o Modo Pandemônio.',
    isUnlocked: (ctx) => !!ctx.character.pandemoniumUnlocked,
  },
  {
    id: 'event_primeiro_sinal_convergencia',
    category: 'events',
    icon: '🩸',
    title: 'O Primeiro Sinal da Convergência',
    subtitle: 'Quando o véu ficou fino demais pela primeira vez',
    lore:
      'Ninguém sabe dizer com certeza qual das quatro formas apareceu primeiro. O que se sabe é que, em uma quarta-feira qualquer, o véu entre o Pandemônio e o resto da realidade ficou fino demais para se manter, e algo tentou atravessar. Derrotá-la não fechou a rachadura — apenas a fez esperar até a próxima quarta-feira, com um rosto novo e uma tentativa nova.',
    color: '#dc2626',
    tags: ['historia', 'convergencia', 'endgame'],
    alwaysVisible: false,
    unlockHint: 'Derrote qualquer um dos quatro chefes da Convergência.',
    isUnlocked: (ctx) => anyKilled(ctx, CONVERGENCE_BOSS_IDS),
  },
  {
    id: 'event_fragmento_afundado',
    category: 'events',
    icon: '🕳️',
    title: 'O Fragmento Afundado',
    subtitle: 'Um capítulo ainda não totalmente escrito',
    lore:
      'Entre os registros mais recentes recuperados da Cidadela, um trecho incompleto menciona algo mais antigo que os próprios cacos da Fragmentação, um pedaço afundado do mundo original — de antes mesmo do Fôlego Único se partir — esperando no fundo do Pandemônio. Ainda longe demais de alcançar nesta era. Os estudiosos da Academia discordam sobre o que isso significa. A única certeza é que a Cidadela continua se preparando, ala por ala, para o dia em que essa distância deixar de ser suficiente.',
    color: '#4c1d95',
    tags: ['historia', 'pandemonio', 'futuro', 'mistério'],
    alwaysVisible: false,
    unlockHint: 'Desbloqueie o Modo Pandemônio para vislumbrar este registro.',
    isUnlocked: (ctx) => !!ctx.character.pandemoniumUnlocked,
  },
  {
    id: 'event_cronica_do_heroi',
    category: 'events',
    icon: '🌟',
    title: 'A Crônica do Próprio Herói',
    subtitle: 'O capítulo que você ainda está escrevendo',
    lore:
      'Ao quebrar o ciclo infinito da alma mundana através da Transcendência, você deixou de ser apenas mais um Eco tentando se lembrar de ser inteiro. Sua jornada — cada Ascensão, cada classe dominada, cada chefe derrotado — já não é mais um evento isolado na história deste mundo: é, ela mesma, um capítulo novo, ainda sendo escrito, no mesmo Codex que você está lendo agora.',
    color: '#00e5ff',
    tags: ['historia', 'heroi', 'transcendencia'],
    alwaysVisible: false,
    unlockHint: 'Realize sua primeira Transcendência.',
    isUnlocked: (ctx) => (ctx.character.transcendenceCount || 0) >= 1,
  },
];

// ============================================================================
// 6. LOCAIS
// ============================================================================
const locationEntries: CodexEntry[] = [
  {
    id: 'loc_cidadela_astral',
    category: 'locations',
    icon: '🌌',
    title: 'Cidadela Astral',
    subtitle: 'A base entre incursões',
    lore:
      'Suspensa em algum ponto que não é bem um lugar físico e não é bem uma memória, a Cidadela Astral é onde o Herói retorna entre uma investida e outra. Suas alas crescem conforme mais recursos e conhecimento se acumulam, e é o único ponto do mundo partido que se sente, ainda que artificialmente, seguro.',
    color: '#a855f7',
    tags: ['local', 'cidadela'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_bosque_sussurrante',
    category: 'locations',
    icon: '🌿',
    title: 'Bosque Sussurrante',
    subtitle: 'Fases 1 a 5',
    lore:
      'Verde, silencioso e estranhamente calmo para um mundo em pedaços, o Bosque Sussurrante é o único bioma que o Vazio ainda não conseguiu corromper por completo. As folhas sussurram porque os pequenos ecos que ali vivem ainda conseguem ser ouvidos, em vez de apenas atacar.',
    color: '#4ade80',
    tags: ['local', 'bioma', 'bosque-sussurrante'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_floresta_antiga',
    category: 'locations',
    icon: '🌲',
    title: 'Floresta Antiga',
    subtitle: 'Fase 1 — primeiro grande bioma',
    lore:
      'Copas altas o bastante para esconder emboscadas, raízes antigas o bastante para lembrar de tempos anteriores à Fragmentação. A Floresta Antiga é onde a maioria dos Heróis enfrenta, pela primeira vez, uma resistência organizada — goblins, lobos e orcs que já demonstram os primeiros sinais de comportamento coordenado.',
    color: '#4ade80',
    tags: ['local', 'bioma', 'floresta-antiga'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_deserto_de_ouro',
    category: 'locations',
    icon: '🏜️',
    title: 'Deserto de Ouro',
    subtitle: 'Fase 2',
    lore:
      'Dunas douradas escondem tanto riqueza quanto perigo em partes iguais. O calor extremo forjou criaturas rápidas e venenosas, governadas à distância por um rei escorpião cuja carapaça guarda mais ouro do que qualquer aventureiro conseguiria carregar sozinho.',
    color: '#fbbf24',
    tags: ['local', 'bioma', 'deserto-de-ouro'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_picos_glaciais',
    category: 'locations',
    icon: '🏔️',
    title: 'Picos Glaciais',
    subtitle: 'Fase 3',
    lore:
      'O frio ali não é apenas clima — é presença. Cavernas profundas escondem yetis territoriais, e no topo do pico mais alto repousa um dragão antigo o bastante para ter sobrevivido, ao que tudo indica, sem nunca precisar da proteção do Vazio.',
    color: '#38bdf8',
    tags: ['local', 'bioma', 'picos-glaciais'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_cemiterio_maldito',
    category: 'locations',
    icon: '⚰️',
    title: 'Cemitério Maldito',
    subtitle: 'Fase 4',
    lore:
      'Lápides tortas, névoa baixa e um silêncio que só é quebrado pelo arrastar de ossos. O Cemitério Maldito é o primeiro bioma onde a linha entre "monstro do Vazio" e "morto reanimado" deixa de ser clara — e talvez nunca tenha sido, para começar.',
    color: '#84cc16',
    tags: ['local', 'bioma', 'cemiterio-maldito'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_ruinas_sombrias',
    category: 'locations',
    icon: '🏛️',
    title: 'Ruínas Sombrias',
    subtitle: 'Fase 5',
    lore:
      'Colunas quebradas e salões desmoronados que, segundo alguns relatos, ainda estão em lenta expansão. Gárgulas, armaduras possuídas e diabretes menores servem a um Arquidemônio que trata as Ruínas não como um lar, mas como um território a conquistar.',
    color: '#f43f5e',
    tags: ['local', 'bioma', 'ruinas-sombrias'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_purgatorio',
    category: 'locations',
    icon: '🔮',
    title: 'Purgatório',
    subtitle: 'Fases 21 a 30',
    lore:
      'Não é bem um bioma — é um cárcere. Sem geografia própria, o Purgatório é onde a Alma-Mundo tenta reter os próprios estilhaços perdidos, vigiado pelo Guardião dos Cacos. Chegar até a Fase 30 é descobrir que o mapa era menor do que o território real.',
    color: '#818cf8',
    tags: ['local', 'bioma', 'purgatorio', 'endgame'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_ecoterra',
    category: 'locations',
    icon: '🪞',
    title: 'Ecoterra',
    subtitle: 'O reflexo pós-Transcendência',
    lore:
      'Depois da Transcendência, os mesmos biomas ganham um reflexo — a Ecoterra, o mesmo território visto do ângulo que o Vazio usa para tentar imitá-lo. Não é um lugar novo, mas uma versão mais intensa do que já se conhece, reservada a quem já morreu vezes o bastante para deixar de temer isso.',
    color: '#22d3ee',
    tags: ['local', 'ecoterra', 'transcendencia', 'endgame'],
    alwaysVisible: true,
    isUnlocked: always,
  },
  {
    id: 'loc_torre_infinita',
    category: 'locations',
    icon: '🏰',
    title: 'Torre Infinita',
    subtitle: 'Torre Normal, Ramificação de Maldições e Provações do Vácuo',
    lore:
      'Nem todo desafio precisa de um bioma novo. A Torre Infinita se ergue como uma estrutura à parte, dividida em três formas: a Torre Normal, um teste puro de progressão andar por andar; a Ramificação de Maldições, onde o próprio Vazio distorce as regras do combate a cada tentativa (um roguelike dentro do roguelite maior que é o jogo); e as Provações do Vácuo, liberadas só após a Transcendência, um desafio verdadeiramente sem fim para quem já esgotou todo o resto.',
    color: '#94a3b8',
    tags: ['local', 'torre-infinita', 'endgame'],
    alwaysVisible: true,
    isUnlocked: always,
  },
];

export const CODEX_ENTRIES: CodexEntry[] = [
  ...cosmologyEntries,
  ...factionEntries,
  ...characterEntries,
  ...bestiaryEntries,
  ...eventEntries,
  ...locationEntries,
];
