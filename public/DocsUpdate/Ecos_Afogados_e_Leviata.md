# Anexo de Design v10.0.0 — Simulação dos Ecos Afogados & O Leviatã do Ciclo
## Amaro RPG Idle — Documento complementar (Anexo 2)

> Complementa o Design da Cidadela Submersa e o Anexo de Balanceamento. Onde este documento refina algo dito nos anteriores, a versão daqui é a canônica (marcado com 🔧).

---

# PARTE 1 — A Simulação dos Ecos Afogados

## 1.1. O modelo em uma frase

**O distrito define O QUE o slot produz; a vocação define QUANTO (afinidade); o traço define COMO (modificadores, muitos deles de vizinhança).** É o modelo clássico de *worker placement*, escolhido por ser o mais legível de todos: o jogador olha para um slot vazio e sabe exatamente o que ganhará ao preenchê-lo — a otimização está em *quem* colocar *onde*, não em decifrar o sistema.

$$\text{Eficácia do Eco} = \text{Base do Distrito} \times \text{Afinidade} \times (1 + \text{Traço próprio}) \times \left(1 + \sum \text{Traços vizinhos}\right) \times (1 + \text{Bônus do Salão})$$

*Cap de eficácia individual: ×2.5 (protege contra combos degenerados de traços empilhados).*

## 1.2. O mapa de distritos e a regra de adjacência

Grade fixa 2×3, adjacência **ortogonal** (o layout visual do overlay já segue essa grade, então a vizinhança é literalmente o que o jogador vê na tela):

```
┌─────────────────┬──────────────────┬───────────────────┐
│  ⚓ Doca Batial │ 🏛️ Salão dos Ecos│ ⚒️ Forja Encharcada│
├─────────────────┼──────────────────┼───────────────────┤
│ 🕍 Templo da Maré│ 📚 Arquivo Subm. │ 👑 Trono Afundado │
└─────────────────┴──────────────────┴───────────────────┘
```

| Distrito | Vizinhos |
| :--- | :--- |
| Doca Batial | Salão, Templo |
| Salão dos Ecos | Doca, Forja, Arquivo |
| Forja Encharcada | Salão, Trono |
| Templo da Maré | Doca, Arquivo |
| Arquivo Submerso | Salão, Templo, Trono |
| Trono Afundado | Forja, Arquivo |

O **Salão** e o **Arquivo** são os hubs (3 vizinhos cada) — não por acaso, são os dois distritos cujos efeitos são "meta" (amplificar Ecos / revelar receitas). Traços de vizinhança valem mais no centro do mapa, criando um gradiente espacial de valor sem nenhuma regra extra.

## 1.3. 🔧 Slots por nível de restauração (refinamento do Design principal)

Cada distrito, após drenado, tem **3 níveis de Restauração** (I/II/III), pagos em Pérolas + Coral:

| Nível | Efeito |
| :---: | :--- |
| **Restaurado I** | Função principal do distrito ativa + **1 slot de Eco** |
| **Restaurado II** | **+1 slot de Eco** (total 2) — custo ≈ 50% do custo de drenagem original |
| **Restaurado III** | Efeito aprimorado do distrito (ver tabela 1.4) — custo ≈ 100% da drenagem |

Total máximo de **12 slots de alocação** (6 distritos × 2). População resgatável: cap de **16 Ecos** (os 4 excedentes ficam "descansando no Salão", sem produzir, mas contam para os marcos de resgate — incluindo o 12º resgate, que concede a Runa Primordial **Ecoh**).

## 1.4. Efeito por Eco alocado, distrito a distrito

| Distrito | Efeito base por Eco | Aprimoramento (Restaurado III) |
| :--- | :--- | :--- |
| ⚓ **Doca Batial** | +8% rendimento da Pesca Passiva; a cada 48h, +1 Fragmento de Batisfera | O Fragmento passa a cair a cada 24h |
| 🏛️ **Salão dos Ecos** | +6% de eficácia para **todos os demais Ecos** (o multiplicador "Bônus do Salão" da fórmula; cap +24% com Voz do Coro) | O Salão passa a contar Ecos descansando: +2% por Eco não-alocado (cap +8%) |
| ⚒️ **Forja Encharcada** | −5% custo de Pérolas em fusões e gravações; 3% de chance de uma fusão devolver 1 das runas consumidas | A chance de devolução sobe para 8% |
| 📚 **Arquivo Submerso** | +10% velocidade de revelação de receitas; gera 2 Pérolas/dia | Gera 4 Pérolas/dia |
| 🕍 **Templo da Maré** | +20% de duração da Bênção da Maré escolhida | Desbloqueia escolher **2 Bênçãos** por Maré Alta (a 2ª com 50% de potência) |
| 👑 **Trono Afundado** | Na luta do Leviatã: +3% de dano causado e −2% de dano recebido | Concede +1 tentativa semanal contra o Leviatã (3→4) |

*(Todos os percentuais de distrito somam aditivamente entre os Ecos do mesmo distrito, antes dos multiplicadores individuais da fórmula.)*

## 1.5. As 4 Vocações

Cada Eco nasce com exatamente 1 vocação. A afinidade multiplica a **Base do Distrito** na fórmula; o *perk* é global (vale onde quer que o Eco esteja alocado, somando entre Ecos da mesma vocação até o cap).

| Vocação | Afinidade (×1.5) | Perk global por Eco alocado | Cap do perk |
| :--- | :--- | :--- | :---: |
| 🎣 **Pescador** | Doca Batial | +1% de chance de captura rara na Pesca (Pérolas/Runas/Fragmentos) | +4% |
| 🤿 **Mergulhador** | Forja Encharcada | −5% custo de Pérolas na drenagem/restauração dos distritos restantes | −20% |
| 📖 **Escriba** | Arquivo Submerso *(e Templo ×1.25)* | "Cartas Batimétricas": +5% de Pérolas bancadas por descida nas Profundezas | +15% |
| 🛡️ **Guardião** | Trono Afundado *(e Templo ×1.25)* | +1% de Redução de Dano dentro das Profundezas | +4% |

**Pesos de sorteio por fonte de resgate** (temático e ligeiramente direcionável — o jogador que precisa de Escribas sabe onde procurá-los):

| Fonte do resgate | Pescador | Mergulhador | Escriba | Guardião |
| :--- | :---: | :---: | :---: | :---: |
| Profundezas Z3 (Ruínas) | 15% | 25% | **35%** | 25% |
| Profundezas Z4 (Fossa) | 10% | 25% | 25% | **40%** |
| Conclusão de drenagem de distrito | **35%** | **35%** | 15% | 15% |

## 1.6. Catálogo de Traços (12, sorteio determinístico)

Raridade no sorteio: **Comum 60% / Incomum 30% / Raro 10%.** "Adjacentes" = Ecos alocados nos distritos ortogonalmente vizinhos (tabela 1.2).

| # | Traço | Raridade | Efeito |
| :---: | :--- | :---: | :--- |
| 1 | **Constante** | Comum | +10% eficácia própria |
| 2 | **Insone** | Comum | +20% própria; **−10% para os Ecos adjacentes** (trabalha a noite toda, ninguém dorme) |
| 3 | **Contador de Histórias** | Comum | **+8% para os Ecos adjacentes**; nenhum bônus próprio |
| 4 | **Tímido** | Comum | +15% se for o único Eco do seu distrito; −5% caso contrário |
| 5 | **Nostálgico da Maré** | Incomum | +25% durante a **Maré Baixa**; −10% na Alta |
| 6 | **Filho da Tempestade** | Incomum | +25% durante a **Maré Alta**; −10% na Baixa |
| 7 | **Gêmeo de Eco** | Incomum | +12% para cada **outro** Eco com este mesmo traço no mapa (cap +36%) |
| 8 | **Mão Dupla** | Incomum | Afinidade de vocação vale ×1.75 em vez de ×1.5; sem afinidade, ×0.9 |
| 9 | **Memória de Ferro** | Raro | Imune a penalidades vindas de traços vizinhos (Insone etc.); +5% própria |
| 10 | **Farol Humano** | Raro | +15% própria e **+5% para os adjacentes** — o único traço que soma nas duas pontas |
| 11 | **Voz do Coro** | Raro | Se alocado no Salão dos Ecos, o bônus do Salão que ELE gera sobe de 6% para 12% |
| 12 | **Coração Partido** | Raro | −30% própria. Após **7 dias reais alocado sem realocação**, transforma-se permanentemente em **Coração Curado: +30%** |

O **Coração Partido** é o traço-assinatura da expansão: mecanicamente é um investimento de paciência (o melhor traço do jogo, atrás do pior); narrativamente é a tese da Cidadela Submersa inteira — os afogados não se consertam, se curam, e curar leva tempo. A UI mostra a contagem regressiva dos 7 dias no card do Eco.

## 1.7. O quebra-cabeça na prática — exemplo trabalhado

Elenco: 8 Ecos — 2 Pescadores (Constante; Insone), 2 Mergulhadores (Tímido; Gêmeo de Eco), 2 Escribas (Contador de Histórias; Filho da Tempestade), 2 Guardiões (Farol Humano; Coração Partido).

**Alocação ingênua** (cada um na sua afinidade, sem olhar traços): o Insone na Doca penaliza Salão e Templo; o Tímido divide a Forja com o Gêmeo e fica negativo; eficácia total ≈ **10.9 unidades-base**.

**Alocação otimizada:**
* Insone (Pescador) → Doca, **sozinho** — os vizinhos Salão/Templo recebem quem tem Memória... não temos; então: Insone → Doca, e no Salão aloca-se o **Farol Humano** (Guardião, sem afinidade ×1.0, mas o +5% dele irradia para Doca/Forja/Arquivo e o −10% do Insone é parcialmente compensado).
* Contador de Histórias (Escriba) → **Arquivo** (afinidade ×1.5 E hub de 3 vizinhos: o +8% dele alcança Salão, Templo e Trono).
* Tímido (Mergulhador) → Forja **sozinho** (+15%, afinidade ×1.5); o Gêmeo de Eco espera no banco até cair um segundo Gêmeo.
* Coração Partido (Guardião) → Trono e **não mexe por 7 dias** (o Trono só importa na semana do Leviatã — o lugar perfeito para "curar" sem custo de oportunidade).
* Filho da Tempestade (Escriba) → Templo (afinidade ×1.25, e o Templo só age na Maré Alta — exatamente quando o traço dá +25%: **sinergia distrito-traço perfeita**).

Eficácia total ≈ **14.6 unidades-base** (+34% sobre a ingênua) — e a diferença veio inteiramente de leitura de tabela e posicionamento, sem nenhum recurso gasto. Esse delta de ~30–40% entre jogar bem e jogar no automático é o alvo de balanceamento da simulação: grande o bastante para recompensar atenção, pequeno o bastante para não punir quem só quer alocar e voltar ao combate.

## 1.8. Marcos de Resgate (contador vitalício `echoesRescuedLifetime`)

| Resgates | Recompensa |
| :---: | :--- |
| 3 | Título "Pastor de Ecos" + 50 Pérolas |
| 6 | +1 slot de Bênção guardada no Templo |
| 9 | Receita da Palavra Rúnica **MARÉ VIVA** (rota alternativa ao Arquivo) |
| **12** | **Runa Primordial Ecoh, a Voz Afogada** (+4% em todos os atributos) |
| 16 (cap) | Cutscene de lore: o Salão cheio canta — pista sobre o Trono e o Leviatã |

## 1.9. Dados e implementação

```typescript
interface DrownedEcho {
  id: string;                 // `${saveSlot}_${rescueIndex}` — a própria seed
  name: string;               // gerado da lista temática (Nereu, Iara, Salino, Corvina, Abissa...)
  vocation: 'fisher' | 'diver' | 'scribe' | 'warden';
  trait: EchoTraitId;         // union dos 12
  assignedDistrict?: DistrictId;
  rescuedAt: number;
  brokenHeartHealsAt?: number; // só para o traço 12
}
```
* **Geração determinística:** `generateEcho(saveSlot, rescueIndex, sourceType)` — função pura no padrão de `generateHuntContracts` (vocação pela tabela de pesos da fonte, traço pela tabela de raridade, nome pelo índice). Nada de RNG persistido, só o contador.
* **Recálculo de eficácia:** função pura `calculateEchoEfficacies(sunkenCitadel, tidePhase)` chamada quando muda alocação, maré ou o relógio do Coração Partido — nunca por frame. Os resultados alimentam os mesmos pontos de consumo já existentes (rendimento da pesca em `tickCitadelProduction`, custos em Pérolas nos helpers de fórmula, buffs do Leviatã/Profundezas via flags no `CombatFSM`).
* **UI mobile:** tocar no Eco → distritos elegíveis acendem → tocar no distrito (fallback do arrastar). Card do Eco mostra a eficácia final calculada E a decomposição ("Base 8% × Afinidade 1.5 × Traço 1.1 × Vizinhos 0.9 = 11.9%") — transparência total da fórmula, no espírito das prévias de dano que a Árvore de Habilidades já exibe.
* **Interação com resets:** Ecos e restauração sobrevivem a Ascensão E Transcendência (são construção de conta, decisão já registrada no Design principal). O relógio do Coração Partido também sobrevive — seria cruel demais resetá-lo.

---

# PARTE 2 — O Leviatã do Ciclo (kit completo)

## 2.1. Acesso e estrutura da semana

* **Requisito:** Trono Afundado drenado. A luta ocorre **no próprio Trono** (arena especial: o distrito drenado, com o Leviatã emergindo do poço central) — logo, **sem Fôlego** (há ar) e com **Pressão fixa ×2.5** ("a presença dele pesa"), reduzível pelo Traje normalmente. Elixires e Poções funcionam; Ecoterra/Maldições, não.
* 🔧 **Tentativas: 3 por semana** (4 com Trono Restaurado III), resetadas no domingo junto do `checkWeeklyReset` global. *(Refina o "1 por semana" do Design principal, que conflitava com a própria ideia de progresso persistente.)*
* **Progresso persistente:** `leviathanWeeklyProgress: { weekSeed, phasesCleared, attemptsUsed }`. Cada fase derrotada fica derrotada até domingo; a próxima tentativa começa na fase seguinte, com o HP daquela fase cheio. Morrer encerra a tentativa (o progresso da fase em andamento se perde, as fases concluídas não).
* A estrutura resultante é uma **raid solo em prestações**: o jogador "no nível" derruba 1–2 fases por tentativa e fecha o boss na semana; o jogador acima da curva faz o *full clear* em uma tentativa e ganha o direito de se gabar (estatística `leviathanFastestFullClear` no painel de Estatísticas).

## 2.2. Escalonamento dinâmico (a decisão central do kit)

Um boss de stats fixos ou nasce impossível ou morre trivial em duas versões. O Leviatã escala com o próprio jogador:

$$p_{\text{Lev}} = \max\left(90,\ \lfloor \text{Recorde histórico das Profundezas} \times 0.9 \rfloor\right)$$

$$\text{HP por fase} = \text{HP}_{\text{ab}}(p_{\text{Lev}}) \times 8 \quad (\times 40 \text{ no total das 5 fases})$$
$$\text{Dano base} = \text{Dano}_{\text{ab}}(p_{\text{Lev}}) \times 4.5$$

* O piso 90 mantém o gate de endgame (Fase equiv. ~90 — conteúdo pós-Transcendência, como planejado).
* O fator 0.9 garante que o Leviatã sempre lute **um degrau abaixo do melhor momento do jogador**: difícil, nunca intransponível. Cada recorde novo nas Profundezas "acorda" um Leviatã maior — os dois sistemas se retroalimentam.
* **Recompensas escalam junto:** multiplicador de Pérolas $= 1 + p_{\text{Lev}}/100$.
* Referência numérica no piso ($p_{\text{Lev}} = 90$): HP por fase ≈ **5,7 × 10^15**; dano base ≈ **25,8 G/golpe** antes da redução do herói e ×2.5 de Pressão. Um comum da prof. 90 morre em segundos para quem chegou lá; ×8 disso por fase ≈ luta de 2–5 minutos por fase — o alvo de ritmo.

## 2.3. As 5 fases (20% do HP total cada)

### Fase 1 — "O DESPERTAR" (100–80%)
*A água do poço ferve. Algo antigo abre um olho.*
* **Comportamento:** ataques lentos e devastadores — recarga 4.0s, dano ×1.3 do base.
* **Mecânica: Vagalhão.** A cada 20s, canaliza por 3s (sprite recua + tint branco pulsante + texto `[VAGALHÃO...]`) e desfere um golpe de dano **×4**.
* **Contra-jogo:** o Vagalhão é **interrompível por Atordoamento** (Bater Escudo do Guerreiro, stuns de relíquia) — o primeiro uso realmente crítico de stun no endgame. Alternativas: esquiva (o Vagalhão respeita a chance de esquiva), Elixir do Defensor, ou simplesmente tankar com HP alto. Barra de ameaça de 3s dá tempo de reação manual mesmo em autoplay.
* **Função de design:** ensinar que este boss pede atenção, com a mecânica mais legível do kit.

### Fase 2 — "A PROLE" (80–60%)
*O poço cospe filhotes. Eles não vêm te matar — vêm morrer por ele.*
* **Mecânica: Escudo de Prole.** A cada 15s sem escudo, uma Prole do Leviatã se funde a ele: escudo (`enemyShield`, padrão Replicante) de **25% do HP da fase**. Enquanto o escudo existir, o Leviatã recebe **−50% de dano no HP real** — quebrar o escudo não é opcional.
* **Comportamento:** recarga 2.8s, dano ×1.0; sem Vagalhão.
* **Contra-jogo:** fase de **burst em janelas** — guardar cooldowns para o momento pós-quebra. Builds de DoT brilham (ticks continuam corroendo o escudo entre bursts); Nix/Selo Caçador de Elites valem (a Prole conta como Elite para bônus de dano).
* **Função:** checagem de DPS sustentado + gestão de cooldown.

### Fase 3 — "A INUNDAÇÃO" (60–40%)
*Ele para de lutar contra você. Ele afoga a sala.*
* **Ambiente:** a arena alaga (overlay azul sobe até a cintura do herói) — **[ENCHARCADO] permanente no herói** durante a fase.
* **Payoff de itemização:** as três imunidades a [ENCHARCADO] do update (Runa Dol T3, Runa Ciss, Set Abissal 5 peças) **anulam o ambiente inteiro da fase** — o momento em que semanas de farm de runas viram um "aperte para pular a mecânica".
* **Comportamento:** frenesi — velocidade ×1.8, dano ×0.7 (morte por mil cortes, não por marretada).
* **Mecânica: Correnteza.** A cada 12s, aplica **[LENTO]** no herói por 4s (−40% velocidade de ataque — primeiro uso do status contra o jogador; o sistema de `StatusEffect` já suporta alvo-herói via Consagração).
* **Contra-jogo:** regeneração e lifesteal (Ur, Fome do Abismo) sustentam contra o chip damage; Clérigo/Paladino têm sua fase de brilho.
* **Função:** inverter o teste — de "você bate forte?" para "você aguenta?".

### Fase 4 — "O OLHAR DO ABISMO" (40–20%)
*Ele te estuda. E o que ele aprende, ele pune.*
* **Mecânica 1: Ciclo Bioluminescente.** Alterna janelas globais de 6s: **Aceso** (recebe +50% de dano; tint ciano) / **Apagado** (recebe −70% e **reflete 15%** do dano que absorver; tint escuro). Autoplay cego perde ~metade do DPS e ainda sangra no refletido; jogar as habilidades e a Ultimate na janela Acesa quase dobra o resultado. É o afixo Bioluminescente (Anexo 1) elevado a mecânica central.
* **Mecânica 2: Canto Abissal.** A cada 30s, canaliza 5s; se completar, **cura 3% do HP da fase**. Interrompível por stun (reprise da lição da Fase 1, agora competindo pela mesma ferramenta que o jogador quer usar no ciclo de dano — a decisão da fase).
* **Comportamento:** recarga 3.2s, dano ×1.15.
* **Função:** a fase-exame — timing manual, prioridade de interrupção, disciplina de burst. Soft check, não wipe: o Canto atrasa, não reseta.

### Fase 5 — "O CORAÇÃO DO CICLO" (20–0%)
*Sem mecânicas. Sem truques. Só ele, você, e a pergunta de quem acaba primeiro.*
* **Mecânica: Fúria do Ciclo.** +2% de dano e velocidade a cada 10s decorridos de fase, **sem teto prático** (cap técnico +200%). Vagalhões voltam, a cada 15s, **não-interrompíveis** (tint vermelho na canalização sinaliza a diferença).
* **Contra-jogo:** é uma corrida pura — queime tudo: Frenesi, Ultimate, Elixires, Bastião Intangível, o escudo do Coração do Leviatã (se já obtido em semana anterior). A fase é curta por construção (20% do HP com o jogador em burst total) mas letal se enrolar.
* **Ao morrer:** o poço se ilumina — cutscene curta de lore revelando o **Caco Submerso da Alma Partida** no fundo do Trono, amarrando a expansão ao "Ciclo da Alma Partida" e plantando o gancho da v11.

## 2.4. Recompensas (pagamento por fase — o progresso parcial sempre vale a tentativa)

| Marco | Recompensa (× multiplicador de Pérolas $1 + p_{\text{Lev}}/100$) |
| :--- | :--- |
| Fase 1 derrotada | 50 Pérolas |
| Fase 2 | 75 Pérolas + 1 Runa T2 |
| Fase 3 | 100 Pérolas + 1 Runa T3 |
| Fase 4 | 150 Pérolas + 1 Runa T3 |
| **Kill (1ª vez na vida)** | Receita da Palavra **CORAÇÃO DO LEVIATÃ** + Runa Primordial **Levh** + título "Aquele Que Ouviu o Coro" |
| Kill (semanas seguintes) | 1 peça do **Set Abissal garantida** + 50 Pérolas + 10% de chance de uma 2ª peça |
| Full clear em 1 tentativa | +100 Pérolas e registro em `leviathanFastestFullClear` |

## 2.5. Resumo de contra-jogo por arquétipo (verificação de que toda build tem fase de brilho)

| Build | Fase forte | Fase fraca | Ferramenta-chave |
| :--- | :---: | :---: | :--- |
| Guerreiro/stun | 1 e 4 (interrupções) | 3 | Bater Escudo nos Cantos/Vagalhões |
| Mago/burst | 4 (janela Acesa) | 5 se errar o timing | Ultimate sincronizada com o ciclo |
| Arqueiro-Ladrão/DoT | 2 (corrói escudo) e com Umbra, 1–2 | 4 (DoT tica na janela Apagada e sofre reflect) | Umbra + Sangramento |
| Paladino-Clérigo/sustain | 3 (imune ao desgaste) | 2 (DPS check) | Consagração + Vin/Ur |
| Avatar | 5 (soma de atributos no Coro da Alma Inteira) | — | A Ultimate de soma total como finisher |

Nenhuma build tem as 5 fases fáceis; nenhuma tem as 5 difíceis. O sistema de 3 tentativas absorve a variação: cada tentativa pode ser "especializada" (trocar runas/relíquia entre tentativas é permitido e esperado — o loadout entre fases é parte do quebra-cabeça).

## 2.6. Checklist técnico
1. **1 sprite, 5 comportamentos:** o Leviatã é um único inimigo na FSM; as fases são limiares internos de HP (`phaseThresholds = [0.8, 0.6, 0.4, 0.2]`) que trocam um `phaseConfig` (recarga, multiplicadores, mecânica ativa). Nenhuma mudança estrutural no motor de 1-inimigo.
2. **Mecânicas 100% recicladas:** Vagalhão = padrão de canalização do Canto (timer + flag interrompível); Escudo de Prole = `enemyShield` do Replicante; Bioluminescente = o afixo do Anexo 1 com janelas fixas; [ENCHARCADO]/[LENTO] no herói = pipeline de `StatusEffect` alvo-herói já existente (Consagração). O kit inteiro é composição, não código novo de combate.
3. **Eventos de bridge:** `LEVIATHAN_PHASE_CHANGED` (HUD troca o subtítulo da fase + barra segmentada em 5), `LEVIATHAN_CHANNEL_STARTED/INTERRUPTED` (barra de canalização sobre o boss).
4. **Persistência:** `leviathanWeeklyProgress` em `Character` (opcional, default ausente); comparação contra `getWeeklySeed()` no acesso — semana virou, progresso zera, tentativas voltam.
5. **Bônus do Trono (Ecos Guardiões)** e Pressão ×2.5 aplicados em `updateStatsFromStore` no mesmo ponto onde as Maldições da Torre já se aplicam (multiplicador pós-`calculateFinalStats`).
6. **QA crítico:** troca de fase no meio de um Vagalhão (cancelar canalização órfã); morte simultânea de escudo+fase; buff de Ecos recalculado se o jogador realocar entre tentativas; velocidade 2x/3x escala a Fúria da Fase 5 pelo mesmo deltaTime (senão 3x encurta a corrida de graça).
