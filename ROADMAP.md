# Roadmap de Conteúdo — Amaro RPG Idle 🗺️

Este documento organiza o roadmap de conteúdo pós-**v6.0.0 "O Despertar da Cidadela"** em três marcos temáticos — **Versão 7**, **Versão 8** e **Versão 9** — cada um guiado por uma lore própria que amarra as novas mecânicas ao **"Ciclo da Alma Partida"**, a lore de abertura oficial do jogo (ver modal de introdução em `src/components/GameUI.tsx`).

> É um roadmap vivo: cada versão listada aqui será implementada em **etapas incrementais** (uma feature por vez, com sub-versões do tipo `v7.1.0`, `v7.2.0`...), seguindo o mesmo padrão de changelog já usado no `Manual Técnico Amaro RPG Idle.md`. Nada aqui está implementado ainda — é planejamento.

---

## 📖 A Lore-Guia: O Ciclo da Alma Partida

> *"Antes que houvesse reinos, havia uma única Alma — vasta, inteira, sonhando o mundo em existência. Ela se partiu. [...] seis ecos de uma única vontade, cada um convencido de ser o único."*
>
> *"Os monstros que você enfrenta não nasceram deste mundo. São o vazio entre os cacos, tentando preencher o espaço onde a Alma deveria estar inteira — e a cada fase que você atravessa, o vazio fica mais denso, mais faminto, mais forte."*
>
> *"Você vai morrer. Muitas vezes. Mas cada morte é só um fragmento retornando à fonte por um instante — e cada retorno o torna mais do que era. Chamam isso de Ascensão."*
>
> *"E em algum lugar, no fundo de tudo, algo mais antigo que os cacos está esperando você cavar fundo demais. Chamam isso de Pandemônio."*

Essa lore de abertura deixa três ganchos narrativos em aberto, que dão origem aos três marcos deste roadmap:

1. **Outros ecos da Alma**, menores que os heróis, ainda esperam para despertar no mundo → **Versão 7**.
2. **O Vazio** citado no segundo parágrafo continua "mais denso, mais faminto" — e passa a encontrar novas fendas para vazar no mundo desperto, não só na Ecoterra → **Versão 8**.
3. **A coisa "mais antiga que os cacos"** do aviso final finalmente se aproxima da superfície → **Versão 9**.

---

## Versão 7.0.0 — "Ecos que Despertam" 🌱

### Lore
*Nem todo caco da Alma partida se tornou um herói. Alguns são ecos menores — pequenos demais para carregar uma vontade inteira, grandes o suficiente para mudar o mundo ao redor. Enquanto os seis heróis avançam, esses ecos menores começam a se manifestar: criaturas que se apegam a quem reconhecem como parente, mercadores que nasceram do excedente de intenção alheia, bosques que o Vazio ainda não alcançou. Não é o Vazio se expandindo — é a Alma, lentamente, se lembrando de mais partes de si mesma.*

### Conteúdo planejado

* **🧿 Amuleto/Trinket (novo slot de equipamento)** — Slot leve adicional aos 6 atuais (`head/chest/legs/gloves/weapon/necklace`), com 1 bônus passivo simples (ex: +5% chance de drop, +3% crítico). Serve como primeira lição de itemização antes da complexidade da fusão mística.
  * *Gancho de lore*: o amuleto é o próprio eco em miniatura, um pedaço de vontade pequeno demais para lutar, mas disposto a ajudar quem reconhece como parente.
* **🌲 Bosque Sussurrante (novo bioma inicial)** — Zona visual alternativa para as primeiras stages (antes da Cidadela), com paleta e silhuetas de inimigos próprias, introduzindo efeitos de status simples (veneno, lentidão) em doses pequenas.
  * *Gancho de lore*: um dos poucos cantos do mundo que o Vazio ainda não corroeu — por isso os inimigos aqui ainda "erram" ao tentar imitar criaturas vivas, em vez de serem só vazio denso.
* **🐾 Companheiro/Pet capturável** — A cada certo número de stages iniciais, chance de "domesticar" uma criatura pequena que acompanha o herói em combate (sprite simples, sem IA própria) e concede um bônus passivo leve (ex: +XP% ou +ouro%).
  * *Gancho de lore*: pequenos ecos da Alma que reconhecem o herói como um caco maior de si mesmos e escolhem segui-lo.
* **🛒 Mercador Ambulante (evento simulado leve)** — A cada N stages, chance de um mercador aparecer com estoque rotativo temporário (seed determinístico local, sem backend), ensinando o jogador a gerenciar ouro como recurso escasso.
  * *Gancho de lore*: um eco que nasceu do excedente de desejo e comércio de incontáveis vidas anteriores — não luta, só barganha.

### Reaproveitamento técnico
`EquipmentItem`/`StatEngine` (novo slot), pipeline de sprites de `CombatScene.ts` e `citadelBuildingSprites.ts` (bioma), `GameBridge` para eventos de captura de pet, sistema de drops/loot já existente para o mercador.

---

## Versão 8.0.0 — "O Espelho Faminto" 🪞

### Lore
*O Vazio nunca esqueceu o gosto de quase preencher a Alma inteira. Ele já aprendeu a se infiltrar pelo Espelho da Ecoterra — mas agora encontra outras fendas: uma lua que nasce vermelha e finge ser familiar, torres que se dobram sobre si mesmas em espirais impossíveis, monstros comuns que de repente ganham reflexos próprios e força emprestada de algo maior. O Vazio não está mais só esperando nas bordas — está aprendendo a imitar o que encontra.*

### Conteúdo planejado

* **⚗️ Laboratório de Alquimia (novo edifício da Cidadela)** — Usa materiais das Expedições (madeira/pedra/carne/insígnias) para preparar receitas de consumíveis com efeitos temporários (buff de dano, regeneração, etc.), expandindo o slot `consumable` hoje pouco explorado.
  * *Gancho de lore*: destila fragmentos de intenção capturados dos ecos menores em efeitos temporários — um uso mais "vivo" da matéria-prima da Cidadela.
* **💍 Anel (novo slot de equipamento)** — Adiciona mais uma peça de itemização no momento em que os bônus de conjunto (`SET_BONUSES`) já existem, dando mais decisões de build por classe e mais alvos para a fusão mística.
  * *Gancho de lore*: um círculo fechado — a forma que o Vazio tenta imitar quando quer parecer completo.
* **👑 Expansão dos Inimigos de Elite (sistema já existente)** — Evolução do sistema de afixos de Elite já implementado: novos afixos exclusivos de mid game (escudo refletor, velocidade alterada, invocação de réplicas, fase de vulnerabilidade por tempo limitado) e maior variedade de drops exclusivos conforme o jogador avança de stage.
  * *Gancho de lore*: os primeiros monstros que aprenderam a refletir o próprio herói de volta contra ele — literalmente, no caso do afixo de escudo refletor.
* **🌕 Lua de Sangue (evento sazonal simulado)** — Evento recorrente calculado por data real local (ex: semanal, sem backend), com re-skin temporário dos inimigos da stage atual (mais HP/dano, paleta vermelha) e tabela de drop exclusiva por tempo limitado.
  * *Gancho de lore*: as noites em que o véu entre o mundo desperto e o Vazio fica fino o bastante para ele imitar até o céu.
* **🌀 Segunda ramificação da Torre (maldições)** — Expande `useTowerStore.ts` com andares que aplicam "maldições" temporárias ao equipamento (ex: -10% em um atributo, +20% em outro), variante roguelike dentro do modo já existente.
  * *Gancho de lore*: subir a Torre nessa ramificação é subir pelo próprio reflexo distorcido do herói — cada maldição é o Vazio testando se ele ainda reconhece a si mesmo.

### Reaproveitamento técnico
`citadelFormulas.ts` e `CitadelBuildingPanel.tsx` (Laboratório de Alquimia), `EquipmentItem`/`SET_BONUSES` (Anel), sistema de afixos de Elite já existente no `CombatFSM.ts`, checagem de `Date` local para o evento sazonal, `useTowerStore.ts` (ramificação de maldições).

---

## Versão 9.0.0 — "O Que Espera no Pandemônio" 🌌

### Lore
*A lore de abertura avisou: algo mais antigo que os cacos espera no fundo de tudo. Ele não é o Vazio — o Vazio é só a fome que ele deixou para trás quando a Alma se partiu. Agora, com heróis suficientes ascendendo e o véu do Pandemônio cada vez mais fino, essa coisa antiga começa, finalmente, a se aproximar da superfície. Catalogar o Vazio no Bestiário, dar vontade própria às relíquias, mergulhar em provações sem fundo — tudo isso é o mundo se preparando para o dia em que essa coisa antiga vai, enfim, olhar de volta. Um fragmento afundado do mundo original, de antes mesmo da Alma se partir, também espera lá embaixo — mas esse ainda está longe demais para ser alcançado nesta leva.*

### Conteúdo planejado

* **📖 Santuário de Contratos de Caça (novo edifício da Cidadela, evolução do Bestiário)** — O Bestiário já existente (bônus passivo por marco de kills, ver `killCount` em `useGameStore.ts` e `StatEngine.calculateBestiaryDamageMultiplier`) ganha uma camada de gerenciamento ativo: um novo edifício da Cidadela gera **contratos de caça rotativos** (2-3 por vez, seguindo o mesmo padrão de rotação determinística por seed local já usado no Mercador Ambulante) — "derrote N do inimigo X dentro de um prazo" — com contador próprio por contrato, separado do `killCount` lifetime. Completar um contrato dá materiais/ouro/fragmentos escalando com a dificuldade do alvo; completar todos os contratos da rotação dá um bônus extra. O bônus passivo por marco de kills que já existe continua intacto e inalterado.
  * *Gancho de lore*: um santuário que não só cataloga cada forma que o Vazio já tentou assumir, mas agora envia caçadores atrás de formas específicas que ainda faltam entender — o jogador vira o curador ativo dessa coleção, não só um espectador do acúmulo.
* **🔮 Relíquia equipável ativa (novo slot, 6-8 relíquias com papéis distintos)** — Diferente dos 8 passivos do Relic Lab atual (que continuam intocados), um novo slot `activeRelic` recebe relíquias com habilidade ativa própria e cooldown, reaproveitando 100% o fluxo já existente de `skillCooldowns`/`triggerSkill` na FSM de combate. Cobre papéis distintos entre si: dano burst, cura/sobrevivência, utilidade (redução parcial de cooldown / devolução de mana), foco em elites/bosses, defesa (janela de invulnerabilidade/escudo) e recurso (burst temporário de ouro/drop) — dando decisões de build reais, não só "mais um número".
  * *Fixas, mas roláveis*: diferente do equipamento normal, relíquias ativas **não passam pela Forja/fusão mística** — cada relíquia é uma habilidade fixa e não se combina com outra para virar uma versão mais forte. O que varia por drop é a **potência do parâmetro relevante daquela habilidade específica**, com um range mínimo/máximo por raridade, no mesmo espírito do roll de atributos do colar hoje. Como cada relíquia tem uma função diferente, o parâmetro que rola muda relíquia a relíquia (ex: a de dano burst rola o **valor do dano**; a de defesa rola a **duração do escudo**; a de utilidade rola o **% de redução de cooldown**; a de recurso rola o **multiplicador de ouro/drop**) — isso precisa ser decidido relíquia por relíquia no momento da implementação de cada uma, não é um range genérico único para todas.
  * *Gancho de lore*: relíquias que pararam de ser só ecos de poder passivo e começaram a "acordar" com vontade própria, ecoando a proximidade da coisa antiga — cada papel distinto é um jeito diferente de a relíquia reagir a essa proximidade.
* **♾️ Provações do Vácuo (novo modo infinito, ganho de Transcendência estritamente limitado)** — Uma nova branch (`voidTrials`) de `useTowerStore.ts`, reaproveitando a curva de escala sem teto já existente (HP/dano exponencial, seleção de inimigo determinística por seed), registrando só o melhor andar pessoal (sem leaderboard online, sem títulos). **Importante**: Pontos de Transcendência (PT) são hoje a moeda mais escassa do jogo (só vêm de reset quase total via `performTranscendence`, com fórmula fortemente sub-linear). Por isso, Provações do Vácuo segue o mesmo padrão de "recompensa só além do recorde" que a Torre normal já usa para ouro, mas com um **teto semanal fixo e baixo** (ex: 2-3 PT no total por semana, não por andar nem por tentativa), acoplado ao mesmo ciclo de `checkWeeklyReset` que a Torre já tem. Andares além do recorde continuam valendo para progressão cosmética mesmo depois de bater o teto, mas param de gerar PT — o modo é uma fonte secundária e lenta, nunca uma alternativa de farm ao hard-reset de Transcendência.
  * *Gancho de lore*: o mergulho mais direto e literal em direção à coisa que espera "no fundo de tudo" — mas o próprio Vácuo só cede um fragmento de entendimento por semana, não importa quão fundo o jogador desça de uma vez.
* **☄️ Convergência (evento sazonal simulado, world boss)** — Versão endgame da Lua de Sangue: baseado em data real, spawna um "world boss" único e mais difícil, disponível só durante a janela do evento. Seu drop exclusivo é uma **relíquia ativa especial**, do mesmo slot `activeRelic` criado para a Relíquia equipável ativa acima, mas fora do catálogo normal (`ACTIVE_RELICS_CATALOG`) — mais forte que as 6-8 relíquias regulares desse sistema, e obtida **só** derrotando o world boss da Convergência (sem outra fonte de drop, sem fusão mística envolvida).
  * *Gancho de lore*: os raros momentos em que a coisa antiga do Pandemônio ergue o suficiente de si mesma para ser vista — e enfrentada — antes de recuar de novo. A relíquia que ela deixa cair não é um eco comum como as outras: é um fragmento de vontade da própria coisa antiga, forte demais para nascer de qualquer outro combate.

> **Adiado para v10+**: a Cidadela Submersa (zona visual endgame) saiu do escopo da v9.0.0 — ainda não está claro se ela deve ser uma nova fase de combate, um local funcional novo, ou só uma zona visual de recompensa (reskin), e essa decisão fica para quando houver mais clareza de escopo em uma versão futura mais aprofundada.

### Reaproveitamento técnico
`killCount`/`StatEngine.calculateBestiaryDamageMultiplier` já existentes + padrão de rotação por seed do Mercador Ambulante (Santuário de Contratos de Caça), `skillCooldowns`/`triggerSkill` da `CombatFSM.ts` (Relíquia ativa), `useTowerStore.ts` + `checkWeeklyReset` já existente (Provações do Vácuo, com teto semanal de PT), `isBloodMoonActive` da `CombatFSM.ts` para o gatilho de data (Convergência) + o próprio slot/catálogo `activeRelic`/`ACTIVE_RELICS_CATALOG` criado para a Relíquia ativa (relíquia exclusiva do world boss, fora do catálogo normal).

---

## Ordem sugerida de implementação

Cada versão deve ser implementada feature a feature, não de uma vez. Sugestão de sequência dentro de cada bloco (da mais simples/isolada para a mais integrada):

1. **v7**: Amuleto/Trinket → Mercador Ambulante → Companheiro/Pet → Bosque Sussurrante.
2. **v8**: Anel → Expansão dos Elites → Laboratório de Alquimia → Lua de Sangue → Ramificação da Torre.
3. **v9**: Santuário de Contratos de Caça → Relíquia ativa → Convergência → Provações do Vácuo. (Cidadela Submersa adiada para v10+.)

Essa ordem prioriza mudanças isoladas de baixo risco (novos slots, novos eventos simples) antes de features que tocam sistemas centrais (Torre, Cidadela, modos infinitos).
