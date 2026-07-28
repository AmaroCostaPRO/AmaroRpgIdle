# Documento de Design — Versão 10.0.0 "A Cidadela Submersa"
## Amaro RPG Idle — A Grande Expansão do Décimo Ciclo

> Documento de desenvolvimento de ideias baseado no Manual Técnico v9.7.0. Todas as propostas foram desenhadas para serem compatíveis com a arquitetura atual (React 18 + Zustand + Phaser 3 + GameBridge), reaproveitando padrões já validados no código (Torre Infinita como arena estática, Cidadela Astral como overlay React, `tickCitadelProduction` como motor offline-safe, pipeline do `StatEngine`, campos opcionais em `Character` + `mergeLoadedCharacter`).

---

## 1. Visão Geral e Filosofia do Update

A v9.0.0 já registrou a decisão: *"Cidadela Submersa: adiada para uma versão futura (v10+) — ainda não está claro se deve ser uma nova fase de combate, um local funcional novo, ou só uma zona visual"*. A proposta aqui responde essa pergunta com um **"todos os três, em camadas"**:

1. **Uma nova região de combate** com estilo de jogo próprio (mergulho vertical, não sidescrolling) — **As Profundezas**.
2. **Um novo local funcional de gerenciamento/simulação** — a restauração da própria **Cidadela Submersa**, distrito por distrito.
3. **Uma nova camada de itemização** que costura tudo — o **Sistema de Soquetes e Runas Abissais**.

### Divisão de escopo (conforme pedido)

| Faixa | Conteúdo | % do update |
| :--- | :--- | :---: |
| **Early game** (Fase 1+) | Litoral Naufragado, Pesca Abissal, Runas Tier I, soquete único | ~20% |
| **Midgame** (Fase 11+ / 1ª Ascensão) | Mergulhos Rasos, Runas Tier II, Câmara de Gravação, novos elites aquáticos | ~30% |
| **Endgame** (Fase 50+) | As Profundezas completas, Cidadela Submersa, Palavras Rúnicas, Set Abissal, Leviatã, Maré Viva | ~50% |

### O gancho de lore ("O Ciclo da Alma Partida")
No fim do primeiro ciclo, quando a Alma se partiu, um dos cacos não caiu na terra — caiu no mar. A cidadela que o guardava afundou com ele, e seus habitantes não morreram: viraram **Ecos Afogados**, presos entre a maré e a memória. Ao alcançar a Fase 50 do Pandemônio, o herói sente o caco submerso "chamar" — o mesmo limiar que hoje habilita a Transcendência, criando uma escolha narrativa e mecânica: *transcender agora, ou mergulhar primeiro?*

---

## 2. FASE 1 DO UPDATE — Early Game: O Litoral Naufragado

**Objetivo de design:** dar ao jogador novo (e ao veterano recém-ascendido) um gostinho do tema submerso desde a Fase 1, sem exigir nenhum sistema de endgame. É o "marco digno da versão 10" visível para todos.

### 2.A. Nova aba: Litoral (🌊)
Desbloqueada ao **completar a Fase 2** (barreira mínima, quase imediata). É um overlay React de tela cheia no mesmo padrão da Cidadela (`position: fixed; inset: 0`), com o combate continuando em segundo plano a 15fps — zero mudança no motor.

### 2.B. Sistema de Pesca Abissal (idle + ativo)
Um minissistema de coleta com dois modos, pensado para ser a "porta de entrada" da economia submersa:

* **Pesca Passiva (idle):** o jogador equipa 1 de 3 **Iscas** (fabricadas com Carne — material que hoje quase não tem uso fora de construção) e o Litoral gera capturas automaticamente a cada X minutos, resolvidas dentro de `tickCitadelProduction()` (offline-safe, mesmo padrão da Torre de Vigia).
* **Pesca Ativa (clique):** um botão "Puxar a Linha" com uma barra de timing simples (janela verde que encolhe conforme a raridade do peixe fisgado). Acertar a janela dobra a captura. Reaproveita o hook `useHoldRepeat`/padrão de `HoldButton` para acessibilidade mobile.
* **Capturas:**
    | Item | Uso | Raridade |
    | :--- | :--- | :---: |
    | 🐟 Peixe-Lanterna | +Carne (conversão 1:3) | Comum |
    | 🪸 Coral Vivo | Novo material de construção da Cidadela Submersa | Comum |
    | 🦪 Pérola Abissal | **Nova moeda premium** do update (compra runas, drenagem, palavras rúnicas) | Raro |
    | 📜 Runa Encharcada (Tier I) | Sistema de Soquetes (Seção 4) | Raro |
    | 🗝️ Fragmento de Batisfera | 5 fragmentos = 1 **Chave de Mergulho** (acesso às Profundezas no midgame) | Muito raro |

* **Fórmula de rendimento passivo** (coerente com a curva do jogo):
    $$\text{Capturas/hora} = 2 + \lfloor \text{Fase Máxima} \times 0.1 \rfloor \times (1 + \text{Nível da Doca} \times 0.15)$$

### 2.C. Novos inimigos do Litoral (Fases 1–10, spawn alternativo)
Em vez de criar um bioma novo que compete com o Bosque Sussurrante, o Litoral injeta **spawns alternativos aquáticos** nas fases existentes (mesma tag `materialDrops` que os monstros já usam, agora com `'coral'`), com 15% de chance de substituir o sorteio normal quando o Litoral está desbloqueado:

| Inimigo | Papel | Mult. HP / Dano / Vel. | Gimmick |
| :--- | :--- | :---: | :--- |
| 🦀 Caranguejo de Casco Naufragado | Tanque lento | 1.45 / 0.90 / 0.70 | Primeiro inimigo do jogo com **escudo** (reusa `enemyShield` do afixo Replicante da v8.0.0) |
| 🪼 Água-Viva Errante | Punidor de toque | 0.70 / 1.20 / 1.10 | 10% de chance de aplicar **[ENCHARCADO]** no herói ao atacar |
| 🐍 Moreia do Limo | Burst | 0.85 / 1.40 / 1.30 | Ataca em rajadas de 2 golpes |
| 👻 Eco Afogado (miniboss raro, 2%) | Presságio narrativo | 3.00 / 1.20 / 1.00 | Drop garantido de 1 Pérola Abissal; primeiro contato com a lore da Cidadela Submersa |

### 2.D. Novo status effect: Encharcado
| Efeito | Sigla | Alvo | Duração | Funcionamento |
| :--- | :---: | :---: | :---: | :--- |
| **Encharcado** | `[ENCHARCADO]` | Ambos | 6s | −15% Velocidade de Ataque. No herói, também reduz a regeneração de Mana em 25%. Habilidades de raio/gelo causam +20% de dano em alvos encharcados (sinergia Mago/Arqueiro). |

É o primeiro debuff **bidirecional** do jogo e cria a identidade elemental do update: água prepara, raio/gelo detona.

---

## 3. FASE 2 DO UPDATE — Midgame: Mergulhos Rasos e a Câmara de Gravação

**Objetivo de design:** entre a 1ª Ascensão e a Fase 50, o jogador ganha a versão "treino" do novo modo de jogo e o miolo do sistema de runas.

### 3.A. Mergulhos Rasos (prévia das Profundezas)
Desbloqueio: **1ª Ascensão** + 1 Chave de Mergulho (5 Fragmentos de Batisfera da pesca). Funciona como um "tutorial pago" das Profundezas (Seção 5), limitado à **Zona 1 (Recife Partido, profundidade 1–25)**, com a mecânica de Fôlego ativa mas sem Pressão. Recompensas: Runas Tier I–II, Coral, Pérolas.

### 3.B. Câmara de Gravação (12ª construção da Cidadela Astral)
A construção que ancora o sistema de soquetes no midgame — ocupa a 3ª vaga livre da página 2 do pátio (`PAGE_2_SUB_TABS`), ao lado do Laboratório de Alquimia e do Santuário de Contratos:

* **Custo base:** 800 Madeira / 800 Pedra / 200 Coral Vivo (primeiro uso estrutural do Coral).
* **Função por nível:**
    | Nível | Desbloqueio |
    | :---: | :--- |
    | 1 | **Perfurar soquete** em armas (1 soquete máx.) |
    | 2 | Perfurar em peitorais; **remover runa** (destrói a runa, preserva o item) |
    | 3 | 2º soquete em armas; perfurar em qualquer slot pesado |
    | 4 | **Extrair runa** intacta (custo em Pérolas); fusão de runas 3→1 tier acima |
    | 5 | 3º soquete em armas/peitorais; habilita **Palavras Rúnicas** (endgame, Seção 7.B) |

---

## 4. Sistema de Soquetes e Runas Abissais (espinha dorsal de itemização)

**Objetivo de design:** o jogo hoje tem duas alavancas de item — raridade/set (drop) e nível Místico (forja). Runas adicionam a terceira alavanca: **escolha deliberada de build**, sem RNG no efeito (só na obtenção), preenchendo o espaço entre "dropou, equipou" e "fundiu, upou".

### 4.A. Modelo de dados (compatível com saves antigos)
```typescript
// EquipmentItem ganha dois campos opcionais:
sockets?: number;              // 0–3, default undefined (= sem soquete)
socketedRunes?: (RuneId | null)[]; // paralelo a sockets

// Character ganha:
runeInventory?: Partial<Record<RuneId, number>>; // runas soltas empilháveis (não ocupam slots do inventário de 100)
```
Runas soltas são **empilháveis e fora do inventário físico** (como Fragmentos de Forja), evitando reencontrar o bug de lentidão por acúmulo corrigido na v9.5.1.

### 4.B. Regras de compatibilidade (espelham a Forja)
* Soquetes só em slots **pesados** (Cabeça, Peito, Pernas, Mãos, Arma, Anel). Colar/Amuleto/Relíquia Ativa ficam de fora — preservam suas identidades de "passivos utilitários" e "habilidade ativa".
* **Fusão Mística preserva soquetes:** o item resultante herda `max(soquetes A, soquetes B)`; runas engastadas no Item A permanecem, as do Item B são devolvidas ao `runeInventory`. Isso faz soquete e Místico serem **complementares**, não concorrentes.
* Perfurar custa Pérolas Abissais + Ouro, escalando por soquete: 1º = 10 Pérolas + 100k Ouro; 2º = 40 Pérolas + 1M; 3º = 150 Pérolas + 10M.

### 4.C. Catálogo de Runas (18 runas, 3 tiers)
Cada runa tem efeito **fixo por tier** (zero RNG no valor — o oposto proposital do Colar). Tier I dropa no Litoral/Mergulhos Rasos, Tier II nas Profundezas Zonas 1–2, Tier III nas Zonas 3+ e na Fossa. Fusão 3→1 na Câmara Nível 4 permite ao jogador paciente "subir" runas sem sorte.

| Runa | Tier I | Tier II | Tier III |
| :--- | :--- | :--- | :--- |
| 🔴 **Ur** (Sangue) | +2% Lifesteal | +3.5% | +5% |
| 🟠 **Kar** (Fúria) | +4% Dano Geral | +7% | +11% |
| 🟡 **Sol** (Fortuna) | +3% Ouro | +6% | +10% + 1% chance de Ouro em dobro |
| 🟢 **Vin** (Vigor) | +5% Vida Máx. | +9% | +14% |
| 🔵 **Mar** (Maré) | +4% Mana Máx. | +7% | +11% + custo de mana −5% relativo |
| 🟣 **Nix** (Vazio) | +3% Dano vs. Elite/Chefe | +6% | +10% |
| ⚪ **Lum** (Eco) | +2% Vel. de Ataque | +3.5% | +5% |
| ⚫ **Dol** (Pressão) | +2% Redução de Dano | +3.5% | +5% + imunidade a [ENCHARCADO] |
| 🟤 **Fen** (Caça) | +2% Chance de Drop | +4% | +6% |

*(9 famílias × 2 exclusivas de Palavra Rúnica no endgame = 18 ids no union `RuneId`.)*

**Integração no motor:** um novo passo "4.7" em `StatEngine.calculateFinalStats` itera `equipment[*].socketedRunes` e soma os efeitos — mesmo pipeline dinâmico das passivas reformuladas na v9.5.0, sem nada "assado" em `baseStats`, sem migração de save (campos opcionais, `saveVersion` não precisa subir por isso).

---

## 5. FASE 3 DO UPDATE — Endgame 50+: As Profundezas (novo estilo de jogo)

**Objetivo de design:** o pedido explícito de "novo estilo de jogo para além do sidescrolling". As Profundezas não são uma torre reskinada: são um modo **push-your-luck de descida vertical** com dois recursos de tensão (Fôlego e Pressão) e uma decisão central que nem a Torre nem a campanha têm — **subir e garantir, ou descer e arriscar**.

### 5.A. Acesso e estrutura
* **Gate:** Fase 50 do Pandemônio alcançada (`highestStageReached >= 50`) — o mesmo marco da Transcendência, tornando-o um ponto de inflexão duplo. Consome 1 Chave de Mergulho por descida.
* **Renderização:** arena estática no padrão da Torre Infinita (sem parallax lateral), mas com a transição de "andar" **invertida e vertical**: ao vencer, a tela faz um pan de câmera para baixo (tween de `scrollY` no Phaser + fade curto), o cenário escurece progressivamente por profundidade (overlay de tint azul→preto com alpha crescente) e partículas de bolhas sobem. O herói recebe um leve `tween` de flutuação idle (sobe/desce 4px em loop) — vende a sensação de estar submerso sem tocar a física do FSM.
* **Zonas de profundidade** (cada uma com bestiário, paleta e BGM próprios — 4 novos temas sintetizados no `AudioManager`, seguindo o padrão de acordes por fase):
    | Zona | Profundidade | Tema | BGM sugerida |
    | :--- | :---: | :--- | :--- |
    | 1. Recife Partido | 1–25 | Luz filtrada, corais | "Luz Coada (Dó Maior Aquoso)" — a única BGM em tom maior do jogo, quebrando o padrão sombrio |
    | 2. Bosque de Algas Negras | 26–50 | Penumbra verde | "Sussurro das Algas (Mi Frígio)" |
    | 3. Ruínas da Cidadela | 51–80 | Arquitetura afundada, Ecos | "Coro Afogado (Lá Menor sob reverb)" |
    | 4. Fossa do Caco | 81+ (infinita) | Escuridão bioluminescente | "Pulso do Abismo (Dó♯ Cluster Grave)" |

### 5.B. Mecânica 1 — Fôlego (o relógio da descida)
* O herói entra com **Fôlego = 100%**, drenando `0.8%/s` (não escala — é um relógio de sessão, não de poder).
* **Fôlego 0% ≠ morte:** o herói entra em **Afogamento** — todo o dano recebido é dobrado e a regeneração de HP zera. Morrer afogado custa **50% das recompensas não-bancadas** da descida (a punição do push-your-luck).
* **Bolsões de Ar:** a cada 5 profundidades, o "inimigo" é substituído por um bolsão (sem combate) que oferece **uma escolha entre três** — restaurar 60% de Fôlego, ou +1 runa aleatória do tier da zona, ou +25% de Pérolas na descida. Estrutura de dados idêntica ao painel do Mercador Ambulante (suspende o FSM em um estado `AIR_POCKET`, modal local, retoma ao fechar).
* **Botão "Subir à Superfície":** disponível a qualquer momento fora de combate — banca 100% do acumulado e encerra a descida. É a decisão que define o modo.

### 5.C. Mecânica 2 — Pressão (o escalonamento com resposta de build)
$$\text{Multiplicador de Pressão} = 1 + \text{Profundidade} \times 0.04$$
* Aplica-se ao **dano recebido** pelo herói (multiplicativo, após Constituição) e à **drenagem de Fôlego**.
* **Contramedida de gestão:** o **Traje de Mergulho** — um item de progressão permanente (não-equipamento, campo `divingSuitLevel` em `Character`) melhorado na Doca da Cidadela Submersa com Coral + Pérolas. Cada nível reduz a Pressão efetiva em 6% relativo e o dreno de Fôlego em 4% (10 níveis). É o "Sifão Cósmico das Profundezas": transforma farm de gestão em poder no modo de combate.

### 5.D. Recompensas das Profundezas
* **Runas** (fonte primária do jogo), **Pérolas Abissais**, **Coral Vivo** e — a partir da Zona 3 — **Ecos Afogados resgatados** (a "população" da simulação da Cidadela Submersa, Seção 6).
* **Sem XP e sem equipamento normal** (mesma decisão de pureza econômica da Torre: cada modo tem sua moeda; evita inflar inventário e curva de nível).
* Recorde histórico próprio (`abyssHistoricalMaxDepth`) + 6 títulos honoríficos temáticos (Molhado de Coragem → O Que Voltou do Fundo), reaproveitando a infraestrutura de títulos da Torre.

---

## 6. FASE 3 (continuação) — A Cidadela Submersa: Gerenciamento e Simulação

**Objetivo de design:** a Cidadela Astral é *construção* (gastar recursos → nível). A Cidadela Submersa é **restauração + simulação**: drenar água, realocar sobreviventes, reagir a um ciclo de marés. Mais decisões contínuas, menos "clicar em melhorar".

### 6.A. Estrutura: 6 Distritos Alagados
Nova aba (🔱), overlay React em tela cheia com arte própria (grid de marcadores como `CitadelSpriteStage`, mas cada distrito tem um **nível de água visual** — um overlay azul semi-transparente com `height` proporcional ao alagamento, animado por CSS).

Cada distrito passa por 3 estados: **Alagado → Drenando (tempo real, padrão `upgradeInProgress`) → Restaurado**. Drenar custa Pérolas + Coral e leva de 8h (1º distrito) a 72h (último) — os timers longos offline-safe já resolvidos por `tickCitadelProduction()`.

| Distrito | Custo de drenagem | Função ao restaurar |
| :--- | :--- | :--- |
| ⚓ **Doca Batial** | 100 Pérolas / 8h | Melhora o Traje de Mergulho; +1 Chave de Mergulho passiva/dia |
| 🏛️ **Salão dos Ecos** | 250 Pérolas / 16h | Habilita alocação de Ecos Afogados (ver 6.B) |
| ⚒️ **Forja Encharcada** | 400 Pérolas / 24h | Fusão de runas com 20% de desconto; 2ª fila de fusão |
| 📚 **Arquivo Submerso** | 600 Pérolas / 36h | Revela receitas de **Palavras Rúnicas** (1 por nível de restauração) |
| 🕍 **Templo da Maré** | 900 Pérolas / 48h | Bênçãos de Maré (buffs rotativos, ver 6.C) |
| 👑 **Trono Afundado** | 1500 Pérolas / 72h | Desbloqueia o confronto com **O Leviatã do Ciclo** (Seção 8) |

### 6.B. Simulação de população: Os Ecos Afogados
* Resgatados nas Profundezas (Zona 3+, ~1 a cada 10 profundidades) e ao concluir drenagens. Cap inicial 12, expansível.
* Cada Eco tem **1 de 4 vocações** sorteadas no resgate (Pescador / Mergulhador / Escriba / Guardião) e **1 traço** (ex.: "Insone: +20% produção, −10% para o distrito vizinho"), gerados deterministicamente por seed no momento do resgate (função pura, mesmo padrão de `generateHuntContracts`).
* O jogador **aloca Ecos em distritos restaurados** (arrastar/tocar): Pescadores turbinam o Litoral, Mergulhadores reduzem custo de drenagem, Escribas aceleram o Arquivo, Guardiões dão um buff global pequeno de Redução de Dano nas Profundezas.
* **Diferença-chave vs. Quartel de Expedições:** expedições são "enviar e esperar 8h"; Ecos são **alocação persistente com sinergias de vizinhança** (o traço de um Eco afeta o distrito ao lado) — um quebra-cabeça de otimização que o jogador revisita a cada novo resgate, sem custo recorrente de ouro.

### 6.C. Simulação ambiental: O Ciclo de Marés
Um relógio determinístico global de **6 horas reais por maré** (derivado de `Date.now()`, sem backend, mesmo espírito de `getWeeklySeed`):
* **Maré Baixa (3h):** Pesca +50%, custo de drenagem −20%, Profundezas com −10% de Pressão.
* **Maré Alta (3h):** Pesca −25%, mas inimigos aquáticos dropam +50% de Coral e o Templo da Maré ativa sua Bênção.
* **Bênçãos de Maré (Templo restaurado):** durante a Maré Alta, o jogador escolhe 1 de 3 buffs de 3h (+10% Dano / +10% Drop / +15% produção da Cidadela Submersa). Renovável a cada ciclo — um motivo leve e recorrente de check-in, sem FOMO punitivo (não perder a bênção não pune, só deixa de somar).
* HUD: um indicador discreto 🌊⬆/🌊⬇ na aba, com contagem regressiva (hook `useCountdown` já existente).

---

## 7. Endgame de Itemização: Palavras Rúnicas e o Set Abissal

### 7.A. Set Abissal (novo tier supremo de equipamento)
Drop exclusivo das Profundezas **Zona 4 (Fossa, prof. 81+)** e do Leviatã — multiplicador de atributos **8.0×** (acima do Pandemoníaco 7.0×), fechando a escada 4.5 → 5.5 → 6.0 → 7.0 → 8.0. Oito conjuntos por classe ("Set Abissal do Afogador" etc.) + variante do Avatar, seguindo exatamente o template de `SET_BONUSES` (lição da v9.0.0: **cadastrar os bônus no lançamento**, não deixar o set órfão como aconteceu com a Lua de Sangue).
* **Bônus especiais de categoria:** 3 peças: itens do set ganham **+1 soquete acima do teto** (até 4 na arma). 5 peças: +30% Dano Final, +12% Vida Máx. e **[ENCHARCADO] não afeta o herói**.

### 7.B. Palavras Rúnicas (o "metagame" dos soquetes)
Com a Câmara de Gravação Nível 5 + receitas do Arquivo Submerso: engastar uma **sequência exata** de runas (ordem importa) em um item com 3+ soquetes transforma os bônus individuais em um efeito único nomeado. Exemplos de receita:

| Palavra | Sequência | Efeito (substitui os bônus individuais) |
| :--- | :--- | :--- |
| **MARÉ VIVA** | Mar–Vin–Mar | Ao usar uma habilidade, 15% de chance de resetar o cooldown da Cura |
| **FOME DO ABISMO** | Ur–Kar–Ur | Lifesteal 8%; abaixo de 30% de HP, dobra para 16% |
| **OLHO DO NAUFRÁGIO** | Fen–Sol–Nix | Chefes têm +25% de chance de drop e sempre dropam ≥Raro |
| **PULMÃO DE FERRO** | Dol–Dol–Vin | Nas Profundezas: dreno de Fôlego −30%; fora: +8% Red. de Dano |
| **CORO SUBMERSO** | Lum–Mar–Kar | A cada 5 ataques básicos, o próximo ecoa 2× (segunda instância com 50% do dano) |

Palavras Rúnicas são o **sumidouro de longo prazo** de runas Tier III e o principal motivo de re-farm da Fossa — o equivalente abissal do que o Místico +8 é para a Forja.

---

## 8. Novos Inimigos, Elites e o Chefe Mundial

### 8.A. Bestiário das Profundezas (16 novos monstros, 4 por zona)
Exemplos com identidade mecânica (todos dentro do que a FSM de 1 inimigo suporta):

| Zona | Inimigo | Gimmick |
| :---: | :--- | :--- |
| 1 | 🐡 Baiacu Rancoroso | Ao morrer, explode (reusa o cálculo do afixo Volátil) |
| 1 | 🦈 Tubarão do Recife | +30% de dano quando o herói está abaixo de 50% HP ("cheiro de sangue") |
| 2 | 🌿 Estrangulador de Algas | Aplica [ENCHARCADO] + [LENTO] juntos |
| 2 | 🐙 Polvo Espelhado | Copia o último debuff que o herói aplicou nele, devolvendo-o |
| 3 | ⚔️ Eco do Guardião | Usa o moveset visual de um chefe antigo (asset reaproveitado com tint espectral) — fanservice de bestiário |
| 3 | 🕯️ Carpideira do Sal | Cura-se ao atacar herói encharcado |
| 4 | 🐋 Prole do Leviatã | Miniboss aleatório; pressagia o chefe mundial |
| 4 | 🫧 O Que Respira no Escuro | Rouba 5% de Fôlego por golpe — o único inimigo que ataca o relógio, não o HP |

### 8.B. Três novos afixos de Elite (padrão inline da v8.0.0)
* **Abissal:** aura de Pressão — o herói sofre +15% de dano enquanto este Elite vive (some ao morrer; funciona em qualquer modo, não só nas Profundezas).
* **Sifonador:** cada golpe drena 3% da Mana máxima do herói e cura o Elite no valor drenado.
* **Bioluminescente:** alterna a cada 6s entre "aceso" (recebe +40% de dano) e "apagado" (recebe −40%) — um afixo de *timing* que recompensa jogar ativo e segurar a Ultimate para a janela.

### 8.C. Chefe Mundial: O Leviatã do Ciclo (Trono Afundado restaurado)
* **Formato:** luta longa de 5 fases de HP (20% cada), cada quinto trocando o comportamento (invoca Prole / inunda a arena aplicando [ENCHARCADO] permanente / janelas Bioluminescentes / fúria final). Tecnicamente é 1 inimigo com `hpMultiplier` recorde (sugestão: 40.0 / dano 6.0) e checkpoints internos por limiar de HP — sem precisar de múltiplos sprites.
* **Tentativas:** 1 por semana (trava por `getWeeklySeed`, padrão da Convergência), com o progresso de fase **persistindo entre tentativas da mesma semana** (campo `leviathanWeeklyProgress`) — o jogador "lasca" o chefe ao longo da semana, uma estrutura de raid-solo inédita no jogo.
* **Drops:** 1ª morte: receita da Palavra Rúnica exclusiva **CORAÇÃO DO LEVIATÃ** (Vin–Ur–Dol–Kar, exige arma 4 soquetes do Set Abissal: +20% Vida, e ao cair abaixo de 25% HP, 1×/combate, emerge um escudo de 40% do HP máx.). Mortes seguintes: Set Abissal garantido + 50 Pérolas.

### 8.D. Novo evento semanal: Maré Viva (sexta-feira)
Completa o calendário (Dom = Lua de Sangue, Qua = Convergência, **Sex = Maré Viva**): o Ciclo de Marés acelera para 1h por maré, a Pesca ativa fica 2× mais frequente e inimigos aquáticos invadem a campanha inteira (30% dos spawns) dropando Coral. Função pura `isMareVivaActive()` no padrão exato de `isBloodMoonActive()`.

---

## 9. Integração Técnica (mapa de implementação)

### 9.A. Modelo de dados (tudo opcional, retrocompatível)
```typescript
// Character (novos campos opcionais):
abyss?: {
  unlocked: boolean;
  currentDepth: number;          // 0 = na superfície
  historicalMaxDepth: number;
  breath: number;                // 0–100
  divingSuitLevel: number;       // 0–10
  bankedRewards: { pearls: number; runes: RuneId[]; coral: number };
};
sunkenCitadel?: {
  districts: Record<DistrictId, { state: 'flooded'|'draining'|'restored'; drainCompletesAt?: number }>;
  echoes: DrownedEcho[];         // { id, vocation, trait, assignedDistrict? }
  tideBlessing?: { id: string; expiresAt: number };
  leviathanWeeklyProgress?: { weekSeed: number; phasesCleared: number };
};
runeInventory?: Partial<Record<RuneId, number>>;
pearls?: number; coral?: number;
```
Defaults injetados por `mergeLoadedCharacter()` (padrão consolidado pós-auditoria 6.1.0). **`CURRENT_SAVE_VERSION` sobe para 3** apenas se algum campo existente mudar de semântica — o desenho acima evita isso de propósito.

### 9.B. Reaproveitamento de infraestrutura (por sistema)
| Sistema novo | Padrão existente reaproveitado |
| :--- | :--- |
| Arena das Profundezas | Torre Infinita (arena estática, `startAttempt`/branch, transições fade) |
| Bolsão de Ar | Estado + modal do Mercador Ambulante (`MERCHANT_ENCOUNTER`) |
| Drenagem de distritos | `upgradeInProgress` + resolução em `tickCitadelProduction()` |
| Pesca passiva | Produção da Torre de Vigia (buffer + coleta manual, v9.6.0) |
| Ciclo de Marés / Maré Viva / Leviatã semanal | Seeds determinísticas (`getWeeklySeed`, `isBloodMoonActive`) |
| Runas no cálculo de stats | Passo dinâmico do `StatEngine` (pipeline das passivas v9.5.0) |
| Ecos determinísticos | Função pura seedada (`generateHuntContracts`) |
| Buffs de Bênção/Palavras | Flag+duração do `CombatFSM` + `ActiveBuffsTray` |
| Novos eventos de bridge | `GameEvent`: `DIVE_STARTED`, `AIR_POCKET_OPENED`, `BREATH_CHANGED`, `TIDE_CHANGED` |

### 9.C. Interação com resets (decisões explícitas, para não repetir bugs históricos)
* **Ascensão:** Pérolas/Coral reduzidos a 2% (mesma regra dos materiais de expedição); runas engastadas seguem a regra do item que as carrega (equipado sobrevive com Pandemônio desbloqueado); `runeInventory` solto **sobrevive** (é infraestrutura, como Fragmentos de Forja... que hoje também sobrevivem à Ascensão? — conferir: Fragmentos hoje só zeram na Transcendência; runas espelham isso).
* **Transcendência:** distritos restaurados e Ecos **sobrevivem** (são construção de conta, como a Cidadela Astral); `runeInventory`, Pérolas, Coral e Traje de Mergulho **zeram** (são poder do ciclo). Essa divisão dá à Transcendência mais uma dimensão de custo/benefício sem invalidar meses de restauração.
* **Depósito da Cidadela Astral:** passa a aceitar itens com soquete normalmente (runas viajam com o item).

### 9.D. Riscos e mitigações
1. **Inflação de moedas (já são 8+):** Pérola é deliberadamente a *única* moeda nova de gasto; Coral é material de construção (par de Madeira/Pedra). Nenhuma loja converte Pérola↔Ouro.
2. **Fôlego em velocidade 2x/3x:** o dreno de Fôlego deve escalar **junto** com o multiplicador de velocidade da simulação (senão 3x vira 3× mais profundidade por descida de graça) — aplicar o mesmo `deltaTime` escalado que o resto do FSM já usa.
3. **Carga de renderização dos distritos:** overlay de água animado por CSS (`transition` em `height`), nunca por re-render de React por frame.
4. **Mobile:** Profundezas usam o mesmo canvas; a UI de alocação de Ecos precisa de fallback de toque (tocar Eco → tocar distrito) além do arrastar.

---

## 10. Roadmap Sugerido de Lançamento (espelhando o padrão 5.1→5.4 da Cidadela Astral)

| Versão | Nome | Conteúdo |
| :--- | :--- | :--- |
| **10.0.0** | "A Cidadela Submersa" | Litoral + Pesca + inimigos aquáticos + [ENCHARCADO] + Soquetes/Runas Tier I–II + Câmara de Gravação + Mergulhos Rasos. *(O marco jogável por todos.)* |
| **10.1.0** | "As Profundezas" | Modo completo (4 zonas, Fôlego, Pressão, Bolsões, Traje), Runas Tier III, bestiário abissal, 3 afixos de Elite |
| **10.2.0** | "Os Ecos Afogados" | Cidadela Submersa (6 distritos, drenagem, Ecos, Ciclo de Marés, Bênçãos) |
| **10.3.0** | "O Coração do Abismo" | Palavras Rúnicas + Set Abissal + Arquivo/Templo/Trono |
| **10.4.0** | "O Leviatã do Ciclo" | Chefe mundial semanal + evento Maré Viva + títulos das Profundezas |

Cada sub-versão é auto-contida e testável — e a 10.0.0 sozinha já entrega early, mid e a fundação do endgame, cumprindo o critério de "marco digno da versão 10" desde o primeiro dia.
