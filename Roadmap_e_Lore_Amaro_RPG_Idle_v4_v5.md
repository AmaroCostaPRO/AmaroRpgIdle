# Documento de Planejamento — Amaro RPG Idle
## Lore Fundacional + Roadmap de Conteúdo (v3.4.5 → v5.0.0)

> Este documento complementa o **Manual Técnico Definitivo** e tem dois objetivos: (1) estabelecer uma base narrativa/lore para o início do jogo, amarrando mecânicas já existentes (Ascensão, Altar de Alma, Modo Pandemônio, Sets Ancestrais) a uma história coesa; e (2) detalhar o roadmap completo de conteúdo desde a versão atual (3.4.5) até o lançamento das duas próximas grandes atualizações, **4.0.0** e **5.0.0**, incluindo as versões menores entre elas.

---

## 1. Filosofia de Design do Roadmap

Antes de entrar em conteúdo, três princípios guiam todas as decisões abaixo, para manter coerência com o que já existe:

1. **Toda mecânica nova nasce de uma mecânica antiga.** O jogo já tem um vocabulário próprio (Alma, Ascensão, Pandemônio, Forja, Sets). Novo conteúdo deve *esticar* esse vocabulário, não introduzir sistemas paralelos desconexos.
2. **Cadência 1 grande + 2–3 pequenas.** Cada grande atualização (X.0.0) é precedida por 2–3 atualizações menores que testam pedaços isolados da feature grande antes dela ser lançada por completo — reduzindo risco de balanceamento quebrado (como já ocorreu e foi corrigido nas versões 2.4.4 e 3.1.0).
3. **Todo novo tier de dificuldade precisa de uma razão narrativa.** Pesadelo, Inferno, Apocalipse e Pandemônio já existem como degraus de intensidade. As próximas expansões (Purgatório em 4.0.0, Transcendência em 5.0.0) devem se encaixar como o *próximo* degrau da mesma escada, não como reinícios temáticos aleatórios.

---

## 2. Lore Fundacional — "O Ciclo da Alma Partida"

### 2.1 Conceito Central

A lore parte de uma observação simples: mecanicamente, o herói **nunca morre de verdade** — ele ressuscita em combate após 3 segundos, e ao Ascender ele "reseta" o nível e as fases mas mantém pontos permanentes. Isso já É a história. Em vez de inventar um mundo genérico de fantasia, a lore explica *por que* o herói funciona assim: ele não é um aventureiro comum, é um **fragmento consciente de uma Alma-Mundo** presa em um ciclo eterno de morte e renascimento, tentando se recompor.

Isso também explica de forma elegante:
- **Ascensão** = o fragmento retorna à fonte, entrega o que aprendeu (Pontos de Prestígio) e renasce mais forte.
- **Altar de Alma** = literalmente o núcleo da Alma-Mundo, visível na árvore de prestígio.
- **Modo Pandemônio** = ao invés de se recompor, o fragmento decide mergulhar fundo demais e rasga o próprio tecido da realidade.
- **Sets Ancestrais** = equipamentos que só existem depois da primeira Ascensão porque são "memórias" de vidas anteriores do herói, cristalizadas em forma de armadura.
- **As seis classes** = não são "profissões" escolhidas livremente, são as seis formas em que a Alma-Mundo historicamente se fragmentou.

### 2.2 Texto de Abertura (a ser exibido na criação de personagem / primeira tela do jogo)

> *Antes que houvesse reinos, havia uma única Alma — vasta, inteira, sonhando o mundo em existência.*
>
> *Ela se partiu.*
>
> *Ninguém sabe se foi guerra, acidente ou escolha. O que se sabe é que seus cacos caíram sobre a terra como estrelas, e cada um deles despertou como um herói: um Guerreiro de fúria inquebrantável, um Mago de fogo arcano, um Arqueiro de mira impossível — seis ecos de uma única vontade, cada um convencido de ser o único.*
>
> *Os monstros que você enfrenta não nasceram deste mundo. São o vazio entre os cacos, tentando preencher o espaço onde a Alma deveria estar inteira — e a cada fase que você atravessa, o vazio fica mais denso, mais faminto, mais forte.*
>
> *Você vai morrer. Muitas vezes. Mas cada morte é só um fragmento retornando à fonte por um instante — e cada retorno o torna mais do que era.*
>
> *Chamam isso de Ascensão. Você chama de a única forma de continuar.*
>
> *E em algum lugar, no fundo de tudo, algo mais antigo que os cacos está esperando você cavar fundo demais.*
>
> *Chamam isso de Pandemônio.*

### 2.3 As Seis Classes como Ecos da Alma-Mundo

| Classe | Papel narrativo dentro do lore |
| :--- | :--- |
| **Guerreiro** | O Eco da Vontade — a força bruta e a teimosia da Alma original de nunca aceitar a derrota. |
| **Mago** | O Eco do Pensamento — a curiosidade da Alma que quis entender o próprio universo e queimou tudo ao redor tentando. |
| **Arqueiro** | O Eco da Precisão — a parte da Alma que via longe demais e sofreu com o que via, então aprendeu a acertar de longe antes de ser tocada. |
| **Paladino** | O Eco da Devoção (evolução do Guerreiro) — quando a Vontade aprendeu a proteger algo além de si mesma. |
| **Clérigo** | O Eco da Compaixão (evolução do Mago) — quando o Pensamento aceitou que compreender o mundo exigia também curá-lo. |
| **Ladrão** | O Eco da Sobrevivência (evolução do Arqueiro) — quando a Precisão deixou de mirar alvos e passou a mirar oportunidades. |

Essa tabela já justifica narrativamente a regra técnica existente ("classes secundárias exigem Nível 10 na primária") — a evolução narrativa acompanha a evolução mecânica.

### 2.4 Onde essa lore aparece no jogo (implementação sugerida, sem alterar a engine)

- Um **modal de introdução** (uma vez, no primeiro save) reaproveitando o padrão de modal local absoluto já usado no inventário/bestiário.
- Uma nova sub-aba dentro de **Guia** chamada **"Crônicas"**, com o texto acima e, futuramente, entradas de lore desbloqueáveis por marco (ver Codex de Lendas em 5.0.0).
- Pequenas falas de bestiário (1–2 linhas por monstro) explicando o que aquele monstro representa dentro do "vazio entre os cacos" — trabalho de conteúdo leve, mecânica zero.

---

## 3. Linha do Tempo Resumida do Roadmap

| Versão | Tipo | Tema | Amarração com a Lore |
| :--- | :--- | :--- | :--- |
| 3.5.0 | Menor | Elites e Afixos de Monstros | O vazio começa a "aprender" a imitar os heróis |
| 3.6.0 | Menor | Desafios Diários e Recordes | O ciclo de Ascensão ganha marcos mensuráveis |
| 3.7.0 | Menor | Relíquias (prévia) | Primeiros cacos de Alma "estranhos" começam a cair |
| **4.0.0** | **Grande** | **O Purgatório e as Relíquias** | O vazio entre os cacos ganha um nome e um território |
| 4.1.0 | Menor | Torre Infinita | Um teste vertical e isolado da própria Alma |
| 4.2.0 | Menor | Sets Celestiais e Refinamento de Forja | Memórias de uma vida ainda não vivida |
| 4.3.0 | Menor | Codex de Lendas e Notificações | Registro da lore de conquistas e sistema de notificações integrados |
| **5.0.0** | **Grande** | **Transcendência e o Segundo Ciclo** | A Alma-Mundo descobre que já se partiu antes |

---

## 4. Atualizações Menores — Preparando a 4.0.0

### Versão 3.5.0 — "Elites do Vazio"
*Objetivo: dar variedade tática ao combate normal sem tocar em progressão de longo prazo.*

- **🎯 Monstros Elite**: chance (~8% em Inferno+, escalando com dificuldade) de um monstro comum spawnar como **Elite**, com aura visual distinta (contorno pulsante prateado), HP e dano 3× superiores e **um afixo aleatório** de uma lista inicial de 5 (ex.: *Enfurecido* — ataque 40% mais rápido; *Blindado* — reduz dano recebido em 25%; *Vampírico* — cura 10% do dano causado; *Volátil* — explode ao morrer causando dano de área ao herói; *Regenerador* — regenera 2% do HP máximo por segundo).
- **💰 Recompensa Elite**: Elites garantem 100% de chance de drop (ignorando a fórmula normal de Sorte) e ouro com bônus fixo de 2×.
- **📖 Registro de Bestiário Estendido**: cada monstro passa a ter as 1–2 linhas de lore mencionadas na Seção 2.4, exibidas no painel de detalhes do Bestiário.
- **⚖️ Ajuste de Base**: nenhuma mudança em fórmulas de atributos ou classes — atualização puramente de conteúdo de combate.

### Versão 3.6.0 — "Trilha da Ascensão"
*Objetivo: dar objetivos de curto prazo e replayability sem depender de servidor (tudo local).*

- **📅 Desafio Diário Local**: uma semente (seed) diária gera uma "Fase Espelho" com modificadores fixos (ex.: "Fase 12, +50% dano recebido, -30% cooldown"), pontuável por tempo de sobrevivência ou dano total. Recompensa: Ouro e um novo consumível, o **Fragmento de Alma Instável** (usado apenas em 3.7.0 e 4.0.0).
- **🏆 Painel de Recordes Pessoais**: nova sub-aba em Ascensão mostrando: maior fase alcançada, maior PP ganho em uma única Ascensão, menor tempo até Fase 20, contagem total de Ascensões. Puramente local (localStorage), sem backend.
- **🔔 Sistema de Notificação de Metas**: pequenos toasts não-intrusivos quando o jogador bate um recorde pessoal, reaproveitando o padrão visual de toast dourado já usado na Forja Lendária.

### Versão 3.7.0 — "Ecos Instáveis"
*Objetivo: introduzir a base técnica do sistema de Relíquias que estreia cheio em 4.0.0, com escopo mínimo para validar UI e persistência.*

- **🔹 Fragmentos de Alma Instável → Relíquias (protótipo)**: acumular 10 Fragmentos (do Desafio Diário ou de drop raro de Chefes) permite forjar **1 de 3 Relíquias iniciais** no Altar de Alma, cada uma dando um bônus passivo pequeno e permanente por personagem (não por save-slot, mas global, como os níveis de classe): +3% Dano Geral, +3% Ouro Ganho, +3% Chance de Drop. Nível máximo 3 nesta fase (será expandido em 4.0.0).
- **🧪 Nova store slice**: `useRelicStore` isolada da store principal para já validar performance de persistência antes da expansão grande.
- Nenhuma mudança visual de vulto — o objetivo é técnico e de conteúdo mínimo, testando o gancho de UI que será expandido.

---

## 5. Versão 4.0.0 — "O Purgatório e as Relíquias" (Grande Atualização)

### 5.1 Pilar Narrativo
O vazio entre os cacos da Alma-Mundo finalmente ganha um nome: o **Purgatório** — uma camada entre a Fase 20 (fim do Apocalipse) e o loop infinito do Pandemônio, onde os cacos perdidos de vidas passadas do herói (as **Relíquias**) podem ser recuperados antes de ele decidir mergulhar de vez no Pandemônio.

### 5.2 Novo Território: Purgatório (Fases 21–30, entre Apocalipse e Pandemônio)
- Substitui a transição direta de "Fase 20 → Pandemônio Fase 21" por um novo bloco intermediário de **10 fases fixas e não-aleatórias** (diferente do spawn aleatório do Pandemônio), narrativamente ambientadas em cenários de cristal partido / espelhos quebrados.
- Multiplicador de HP/Dano: 4.5× sobre a base do Apocalipse (posicionado entre Apocalipse ×4.0 e Pandemônio ×5.0).
- Chefe fixo ao final (Fase 30): **"O Guardião dos Cacos"**, primeiro chefe do jogo com **duas fases de combate** (muda de padrão de ataque ao atingir 50% de HP), preparando o padrão técnico que será reaproveitado nos chefes de 5.0.0.
- Concluir o Purgatório pela primeira vez é o novo gatilho para desbloquear o Pandemônio (substituindo diretamente a Fase 20 como requisito), dando um propósito real a esse novo território em vez de ser apenas um filtro cosmético.

### 5.3 Sistema de Relíquias (versão completa)
Expansão total do protótipo da 3.7.0:
- **8 Relíquias** no total (as 3 antigas + 5 novas), cada uma com **5 níveis** (antes limitado a 3).
- Cada Relíquia agora tem um **efeito único de nível 5** (não apenas escala linear), por exemplo:
  - *Relíquia do Eco Vampírico*: nível 5 concede lifesteal passivo de 2% do dano causado.
  - *Relíquia do Colecionador*: nível 5 aumenta em +1 o número de itens gerados por Baús da Loja.
  - *Relíquia do Retorno*: nível 5 reduz o tempo de ressurreição de 3s para 1.5s.
- **Nova aba dedicada "Relíquias"** no menu principal (substitui o acesso apenas via Altar de Alma), com grade visual similar ao Bestiário.
- **Fragmentos de Alma Instável** passam a dropar também de Chefes de fase normal (não só do Desafio Diário), tornando o sistema jogável mesmo para quem não participa dos desafios diários.

### 5.4 Nova Classe Secundária: Necromante (`Necromancer`)
- **Requisito de desbloqueio**: Nível 10 simultâneo em **duas classes primárias diferentes** (ex.: Mago E Arqueiro), reforçando a ideia de que classes secundárias avançadas nascem da fusão de Ecos, não apenas da evolução de um.
- **Atributo principal**: Magia, com bônus secundário de Sorte (mecânica nova: primeira classe a usar Sorte como atributo secundário de dano).
- **Fantasia de combate**: inversão do papel do Clérigo — ao invés de curar o herói, aplica *Drenagem* nos monstros (rouba HP/Mana do inimigo para o jogador), e sua Ultimate ("Ceifa das Almas Perdidas") ressuscita temporariamente o último monstro derrotado como aliado por 10 segundos.
- Estrutura de árvore de habilidades idêntica em tamanho às demais classes (6 habilidades + Ultimate), reaproveitando o framework técnico existente sem necessidade de novo sistema de UI.
- Set próprio: **Set do Arauto da Ceifa** (normal), **Set Ancestral do Senhor dos Ecos Perdidos** (pós-ascensão), **Set Pandemoníaco do Devorador de Almas** (Pandemônio) — seguindo exatamente o padrão de nomenclatura e escala já estabelecido para as outras 6 classes.

### 5.5 Itens e Economia
- **Baú de Relíquia** na Loja (custo em Fragmentos de Alma Instável, não em Ouro): garante 3 Fragmentos ao ser aberto, dando um caminho de compra direto para quem farma ouro em excesso mas tem poucos Fragmentos.
- Ajuste de preço: com a nova fonte de Fragmentos via Chefes normais, o Desafio Diário passa a garantir Fragmentos em dobro (2×) para manter relevância como fonte primária.

### 5.6 Resumo de Escopo Técnico da 4.0.0
| Sistema | Está pronto (herdado) | Precisa ser criado |
| :--- | :--- | :--- |
| Fases fixas do Purgatório | Sistema de fases/tiers (Pesadelo/Inferno/Apocalipse) | Novo bloco de 10 fases + flag `purgatoryCompleted` |
| Chefe com 2 fases | `CombatFSM` de chefe único | Máquina de estados de transição por % de HP |
| Relíquias | `useRelicStore` (protótipo 3.7.0) | Expansão de 3→8 relíquias, nível 3→5, aba de UI dedicada |
| Necromante | Framework de classes/skill tree/sets | Dados da classe, ícones, efeito de Drenagem no `CombatFSM` |

---

## 6. Atualizações Menores — Preparando a 5.0.0

### Versão 4.1.0 — "Torre Infinita"
*Objetivo: modo de progressão vertical isolado, sem afetar economia principal — testa infraestrutura de "runs" separadas antes da 5.0.0 introduzir Transcendência.*

- **🗼 Nova aba "Torre"**: modo alternativo onde o herói sobe andares 1 a 1 com HP/Mana que **não regeneram entre andares** (tensão de recursos), usando os atributos e equipamentos atuais do save sem consumir vidas/fases da campanha principal.
- Recompensas exclusivas: título cosmético por andar alcançado (ex.: "Andar 50 — Escalador do Vazio") e Fragmentos de Alma Instável extras.
- Reseta semanalmente (baseado em data local), reaproveitando a mesma lógica de seed do Desafio Diário da 3.6.0.

### Versão 4.2.0 — "Memórias Celestiais"
*Objetivo: dar mais profundidade ao end-game de equipamentos antes do salto de 5.0.0.*

- **✨ Sets Celestiais**: novo tier acima de Ancestral, desbloqueado ao concluir o Purgatório pela segunda vez (reforça replay do conteúdo de 4.0.0). Multiplicador de escala 6.0× (acima do 4.5× Ancestral).
- **⚒️ Forja: Nível Místico +6 a +8**: extensão do teto da Forja Mística (antes limitado a +5), com custos crescendo pela mesma fórmula exponencial já estabelecida ($100 \times 5^L$), dando um sumidouro de ouro para jogadores endgame.
- **🔧 Retrabalho de UX da Forja**: pré-visualização em tempo real do item resultante lado a lado com os dois itens de origem (antes só o painel de "Resultado Estimado").

### Versão 4.3.0 — "Primeiras Páginas do Codex & Notificações"
*Objetivo: prévia do sistema de registro histórico que ganha peso total na 5.0.0, aliado a um sistema robusto de notificações e eventos.*

- **📜 Codex de Lendas (protótipo)**: nova sub-aba dentro de Guia/Crônicas que registra automaticamente marcos já existentes (1ª Ascensão, desbloqueio de cada classe secundária, desbloqueio do Pandemônio, conclusão do Purgatório), cada um revelando 1 parágrafo curto de lore adicional.
- **🔔 Notificações Globais de Progressão (Bottom UI)**: Notifica na base da tela o desbloqueio de classes (`CLASS_UNLOCKED`), conclusão de bestiário (`BESTIARY_COMPLETED`) e disponibilidade de ascensão (`ASCENSION_AVAILABLE`), acoplando som e animações táteis.
- **⚔️ Toasts de Combat Drops (Top Right Arena)**: Exibe toasts no canto superior direito da arena de combate ao dropar chaves da torre ou fragmentos de alma instável em combate, prevenindo interrupção com cliques e toques na arena do Phaser (`pointer-events: none`).

---

## 7. Versão 5.0.0 — "Transcendência e o Segundo Ciclo" (Grande Atualização)

### 7.1 Pilar Narrativo
A grande revelação da 5.0.0: a Alma-Mundo **já se partiu antes**. Tudo o que o jogador viveu até aqui — Ascensões, Pandemônio, Purgatório — é apenas o ciclo mais recente de um padrão que se repete. O herói descobre isso ao atingir o topo do Pandemônio e é confrontado por um espelho de si mesmo de um ciclo anterior, abrindo a **Transcendência**: uma segunda camada de prestígio acima da Ascensão.

> *Você achou que estava se recompondo. Estava apenas repetindo.*
>
> *Em algum lugar sob o Pandemônio, uma versão sua de um ciclo esquecido está esperando — não para te deter, mas para te mostrar o que vem depois de "inteiro".*

### 7.2 Transcendência (novo prestígio de segunda camada)
- **Requisito de desbloqueio**: Modo Pandemônio ativo + Fase 50 do loop infinito alcançada pelo menos uma vez.
- **Mecânica**: ao Transcender, o jogador reseta **tudo** que a Ascensão reseta, **e também** zera os upgrades permanentes de Ascensão (`perm_str`, `perm_mag`, etc.) — mas em troca ganha **Pontos de Transcendência (PT)**, uma segunda moeda permanente que não é resetada nem pela Ascensão nem por nada além de uma futura camada acima dela.
- **Fórmula proposta de PT** (mantendo a mesma filosofia de raiz fracionária já usada para PP):
$$\text{PT Obtidos} = \lfloor \left( \frac{\text{PP Vitalício Acumulado}}{500} \right)^{0.75} \rfloor$$
- **Loja de Transcendência**: nova árvore paralela à de Ascensão, com upgrades multiplicativos globais (ex.: "Eco Permanente": +1% de todos os atributos base por ponto, sem teto) — desenhada para ser a nova "casa" do jogador de muito longo prazo, sem substituir a árvore de Ascensão (que continua existindo e sendo usada a cada reset normal).
- Efeito visual: ao Transcender, a esfera "Alma" do Altar de Alma ganha uma segunda camada dourada ao redor da roxa existente, sinalizando visualmente a nova camada de progressão sem exigir uma tela nova do zero.

### 7.3 Nova Zona: O Segundo Ciclo (Fases espelhadas pós-Transcendência)
- Após a primeira Transcendência, as Fases 1–20 da campanha principal ganham uma variante visual "espelhada" (paleta invertida, sprites com tingimento espectral) chamada **Ecoterra**, jogável desde o início de cada nova Ascensão *depois* da primeira Transcendência.
- Monstros da Ecoterra são versões-espectro dos monstros normais, com 20% mais HP mas dropando **Essência de Transcendência**, recurso exclusivo para a Loja de Transcendência — dando uma razão mecânica concreta para rejogar o conteúdo inicial em vez de ele se tornar irrelevante.

### 7.4 Sétima Classe: Avatar (`Avatar`) — classe de prestígio, não uma classe primária/secundária tradicional
- Desbloqueada apenas após a primeira Transcendência, disponível para qualquer personagem independente de histórico de classes (reforça a lore: é a Alma se vendo por inteiro, não mais um Eco fragmentado).
- Não tem "atributo principal" fixo — em vez disso, sua mecânica única é: **todas as habilidades escalam com o maior atributo do herói no momento**, recalculado dinamicamente a cada combate. Isso cria uma classe de "capstone" que recompensa a build de itens/relíquias acumulada em vez de introduzir mais um caminho de build isolado.
- Sem árvore de habilidades tradicional: em vez disso, ganha **3 habilidades fixas desde o nível 1** (Golpe do Eco Unificado, Barreira de Todas as Formas, e a Ultimate "Coro da Alma Inteira" — dano baseado na soma de todos os 5 atributos), e investe pontos apenas em Relíquias e Transcendência, simplificando a curva de aprendizado para quem já dominou as outras 6 classes.

### 7.5 Codex de Lendas (versão completa)
- Expansão total do protótipo da 4.3.0: 40+ entradas desbloqueáveis cobrindo cada marco de progressão, cada Set Ancestral/Celestial/Pandemoníaco obtido pela primeira vez, e a lore completa das seis classes (Seção 2.3 deste documento) e da nova classe Avatar.
- **Recompensa de completude**: preencher 100% do Codex concede um título cosmético permanente exibido no cabeçalho ("Guardião do Ciclo Completo") — sem impacto de poder, mantendo o Codex como conteúdo de imersão pura.

### 7.6 Resumo de Escopo Técnico da 5.0.0
| Sistema | Está pronto (herdado) | Precisa ser criado |
| :--- | :--- | :--- |
| Transcendência | Store de Ascensão, padrão de fórmula de PP, Altar de Alma | Nova store `useTranscendenceStore`, fórmula de PT, nova árvore de upgrades |
| Ecoterra | Sistema de fases, sprites de monstros, paleta de cores por tier | Filtro de canvas para tingimento espectral (reaproveita técnica já usada no filtro de transparência do Bestiário), novo drop de Essência |
| Classe Avatar | Framework completo de classes/sets/skills | Lógica de "maior atributo dinâmico", 3 habilidades fixas, sets próprios |
| Codex de Lendas | Protótipo de leitura da 4.3.0 | Sistema de flags de desbloqueio por marco, tela de progresso 0–100% |

---

## 8. Considerações Finais de Sequenciamento

1. **Ordem de implementação sugerida dentro de cada versão grande**: sempre backend/store primeiro (ex.: `useRelicStore`, `useTranscendenceStore`), depois integração no `CombatFSM`/`StatEngine`, e só então UI — mesmo padrão já usado historicamente no projeto (ex.: bônus de Ascensão em 3.1.0 foram implementados na store e no `StatEngine` antes de qualquer ajuste visual).
2. **Risco principal da 4.0.0**: o chefe de duas fases (`Guardião dos Cacos`) é a peça tecnicamente mais nova (primeira máquina de estados de chefe com transição de fase). Recomenda-se prototipar isso já na 3.7.0 ou em um branch isolado antes de comprometer a data de lançamento da 4.0.0.
3. **Risco principal da 5.0.0**: a classe Avatar depende de um recálculo dinâmico de "maior atributo" a cada tick de combate — vale medir o impacto de performance no `StatEngine` antes de expandir esse conceito para qualquer outro sistema futuro.
4. **Consistência de nomenclatura**: todos os nomes de sets, chefes e relíquias novos seguem o padrão gramatical já estabelecido ("Set [Ancestral/Pandemoníaco] do/da [Título]"), evitando quebra de imersão por inconsistência de nomenclatura entre conteúdo antigo e novo.
