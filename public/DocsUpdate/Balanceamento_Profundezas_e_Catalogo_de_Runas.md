# Anexo de Design v10.0.0 — Balanceamento das Profundezas & Catálogo Completo de Runas
## Amaro RPG Idle — Documento complementar ao Design da Cidadela Submersa

> Todos os números abaixo derivam das fórmulas reais do Manual Técnico v9.7.0 (Seção 7.C). O inimigo de referência é o **inimigo comum da Fase 50 do Pandemônio com multiplicadores 1.0**, calculado pelas fórmulas da campanha.

---

# PARTE 1 — Balanceamento Matemático das Profundezas

## 1.1. A âncora de calibragem: o Inimigo de Referência F50

Aplicando as fórmulas da campanha (Fator Tier 6.0 do Pandemônio):

$$\text{HP}_{50} = (150 + 50 \times 50) \times 1.30^{49} \times 6.0 = 2650 \times 383{.}050 \times 6 \approx \mathbf{6{,}09 \times 10^9}$$

$$\text{Dano}_{50} = (10 + 50 \times 4) \times 1.18^{49} \times 6.0 = 210 \times 3328 \times 6 \approx \mathbf{4{,}19 \times 10^6 \text{ por golpe}}$$

*(dano bruto, antes da redução por Constituição do herói — com o cap de 95%, o piso recebido é ~210k/golpe)*

**Princípio de calibragem auto-ajustável:** em vez de assumir um valor absoluto de DPS do jogador (que varia enormemente com Místico +N, sets e passivas infinitas), todo o balanceamento é expresso em função de **TTK_ref** — o tempo médio que *aquele* jogador leva para matar um inimigo comum da sua Fase 50. Se o jogador mata em 6s na campanha, a Profundidade 1 morre em ~3s; se mata em 15s, morre em ~7,5s. A curva escala proporcionalmente para qualquer nível de poder, o que blinda o modo contra o power creep futuro (novas versões que aumentem o DPS do jogador só deslocam a profundidade alcançável, nunca quebram a proporção interna do modo).

## 1.2. Fórmulas centrais

### HP do inimigo por profundidade
$$\text{HP}_{\text{ab}}(p) = \text{HP}_{50} \times 0.5 \times 1.14^{p-1} \times \text{Fator de Zona}_{HP}$$

### Dano do inimigo por profundidade
$$\text{Dano}_{\text{ab}}(p) = \text{Dano}_{50} \times 0.6 \times 1.085^{p-1} \times \text{Fator de Zona}_{Dmg}$$

### Fatores de Zona (análogo direto do Fator Tier da campanha)
| Zona | Profundidade | Fator HP | Fator Dano |
| :--- | :---: | :---: | :---: |
| 1. Recife Partido | 1–25 | × 1.00 | × 1.00 |
| 2. Bosque de Algas Negras | 26–50 | × 1.25 | × 1.15 |
| 3. Ruínas da Cidadela | 51–80 | × 1.60 | × 1.35 |
| 4. Fossa do Caco | 81+ (∞) | × 2.00 | × 1.60 |

### Pressão (multiplica o dano RECEBIDO pelo herói, após a redução por Constituição)
$$\text{Pressão}(p, s) = 1 + 0.04 \times p \times (1 - 0.06 \times s)$$
*(onde s = nível do Traje de Mergulho, 0–10; no nível 10, apenas 40% da Pressão bruta se aplica)*

### Drenagem de Fôlego
$$\text{Dreno}(p, s) = 0.8\%/\text{s} \times (1 + 0.02 \times p) \times (1 - 0.04 \times s) \times \text{Velocidade do Jogo}$$
*(o fator de velocidade da simulação é obrigatório: sem ele, jogar em 3x renderia 3× mais profundidade por Fôlego de graça — mesmo cuidado de deltaTime já usado no FSM)*

### Racional dos expoentes (por que 1.14 e 1.085, e não os 1.30/1.18 da campanha)
* Na campanha, cada fase multiplica o HP por ~1.30 — mas o jogador *cresce entre fases* (níveis, drops, forja). Dentro de uma descida, os stats do herói são **congelados** (nada de XP nem equipamento nas Profundezas), então a curva precisa ser mais suave para que uma sessão tenha 15–30 profundidades de vida útil, não 3.
* 1.14 por profundidade ≈ 1.30 por "duas profundidades e pouco": **~2,3 profundidades equivalem a 1 fase de campanha em HP**. Isso dá uma régua mental limpa para o jogador ("desci 25, é como se eu tivesse enfrentado a Fase 59").
* O expoente de dano (1.085) é deliberadamente mais baixo que o de HP (1.14) **no papel** — mas a Pressão o compensa e ultrapassa (ver 1.4). O resultado é a assinatura do modo: quem te para primeiro é o dano, não a esponja de HP.

## 1.3. Tabela mestra de profundidades

Valores para Traje nível 0 (colunas de Pressão/Dreno) — "Fase equiv." é a fase de campanha cujo inimigo teria o mesmo HP:

| Prof. | Zona | HP | Fase equiv. (HP) | Dano bruto/golpe | Pressão (s=0) | Dano efetivo* | Dreno de Fôlego | TTK esperado |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | Z1 | 3,05 B | ~47 | 2,52 M | ×1.04 | 2,62 M | 0,82%/s | 0.5 × TTK_ref |
| 5 | Z1 | 5,15 B | ~49 | 3,49 M | ×1.20 | 4,19 M | 0,88%/s | 0.85 × TTK_ref |
| 10 | Z1 | 9,92 B | ~52 | 5,25 M | ×1.40 | 7,35 M | 0,96%/s | 1.6 × TTK_ref |
| 25 † | Z1 | 70,8 B | ~59 | 17,8 M | ×2.00 | 35,6 M | 1,20%/s | 11.6 × TTK_ref |
| 26 | Z2 | 101 B | ~61 | 21,6 M | ×2.04 | 44,1 M | 1,22%/s | 16.6 × TTK_ref |
| 40 | Z2 | 630 B | ~68 | 66,9 M | ×2.60 | 174 M | 1,44%/s | — |
| 50 † | Z2 | 2,34 T | ~73 | 158 M | ×3.00 | 474 M | 1,60%/s | — |
| 51 | Z3 | 3,42 T | ~74 | 214 M | ×3.04 | 651 M | 1,62%/s | — |
| 65 | Z3 | 21,4 T | ~81 | 665 M | ×3.60 | 2,39 G | 1,84%/s | — |
| 80 † | Z3 | 153 T | ~89 | 2,26 G | ×4.20 | 9,49 G | 2,08%/s | — |
| 81 | Z4 | 218 T | ~90 | 2,75 G | ×4.24 | 11,7 G | 2,10%/s | — |
| 100 | Z4 | 2,62 Q | ~99 | 12,9 G | ×5.00 | 64,5 G | 2,40%/s | — |
| 120 | Z4 | 36,0 Q | ~110 | 65,4 G | ×5.80 | 379 G | 2,72%/s | — |

\* Dano efetivo = bruto × Pressão (aplicado após a redução por Constituição, então o cap de 95% NÃO absorve a Pressão — decisão deliberada, ver 1.4).
† Profundidades 25, 50 e 80 são ocupadas por **Guardiões de Zona** (ver 1.6) — a tabela mostra o inimigo comum daquele nível; o Guardião multiplica sobre ele.

> **Nota de leitura:** o jogador "recém-chegado à F50" opera confortavelmente até ~prof. 12–18 (TTK 2–4× o de campanha). A prof. 25 (1º Guardião) pede algumas melhorias de Traje/runas. A Fossa (81+) exige poder de nível pós-Transcendência (Fase equiv. 90+) — é o conteúdo que o jogador de Fase 80+ do Pandemônio vai quebrar a cabeça, cumprindo a fatia "endgame profundo" do update.

## 1.4. A divergência HP × Dano (o coração do push-your-luck)

Comparando o crescimento efetivo contra as curvas da campanha:

| Prof. | Fase equiv. em HP | Fase equiv. em DANO efetivo | Gap |
| :---: | :---: | :---: | :---: |
| 10 | 52 | 53 | +1 |
| 25 | 59 | 63 | +4 |
| 50 | 73 | 79 | +6 |
| 81 | 90 | 98 | +8 |
| 120 | 110 | 122 | +12 |

O dano efetivo "corre na frente" do HP de forma **progressiva**: no começo da descida os dois andam juntos; no fundo, o inimigo bate como se estivesse 8–12 fases além do que sua vida sugere. Consequências de design:

1. **A parede que o jogador encontra é sempre letal, nunca tediosa** — ele morre antes de o TTK ficar insuportável. Torres infinitas costumam morrer de tédio (inimigo-esponja); as Profundezas morrem de perigo.
2. **É por isso que a Pressão é aplicada DEPOIS da redução por Constituição**: se fosse antes, o cap de 95% engoliria toda a Pressão para builds tanque (Paladino ficaria imune ao mecanismo central do modo). Aplicada depois, ela é a única fonte de dano do jogo que atravessa o cap — e o Traje de Mergulho é a única resposta, o que dá ao Traje um nicho que nenhum equipamento invade.
3. **O Fôlego é o limitador nas zonas 1–2; o dano é o limitador nas zonas 3–4.** Verificação numérica na seção 1.5.

## 1.5. Economia de Fôlego — exemplo trabalhado

Modelo de tempo por profundidade: $t(p) = \text{TTK}(p) + 4\text{s}$ (transição de pan vertical + spawn). Bolsão de Ar a cada 5 profundidades, restaurando +60% se escolhido (cap 100%).

**Jogador recém-F50 (TTK_ref = 8s, Traje 0), escolhendo sempre o ar no bolsão:**

| Trecho | TTK médio | Tempo/prof. | Dreno médio | Fôlego gasto no trecho | Saldo pós-bolsão |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 1–5 | 4,5s | 8,5s | 0,85%/s | ~36% | 100% (bolsão devolve) |
| 6–10 | 7,5s | 11,5s | 0,93%/s | ~53% | 100% |
| 11–15 | 13s | 17s | 1,00%/s | ~85% | ~75% |
| 16–20 | 22s | 26s | 1,10%/s | ~143% ⚠️ | **afoga em ~prof. 18** |

→ **Primeira descida esperada: profundidade 15–18.** O jogador vê o Guardião do Recife (25) no horizonte mas não o alcança — a cenoura perfeita para a primeira compra de Traje.

**Mesmo jogador com Traje 4 (+alguma progressão de runas, TTK_ref efetivo 6s):** dreno ×0.84, TTK −25% → alcança **prof. 24–27**, matando o 1º Guardião no limite do Fôlego. **Traje 8 + build de runas madura:** prof. 45–55. **Pós-Transcendência com Traje 10 + Palavras Rúnicas:** 80+, abrindo a Fossa.

Cada patamar de investimento compra ~10–15 profundidades — uma escada de progressão legível, com o Guardião de Zona como marco a cada degrau.

### Afogamento (Fôlego 0%)
* Dano recebido ×2 (multiplicativo com a Pressão), regeneração de HP zerada, o overlay azul da tela pulsa em vinheta escura.
* Morrer afogado: **−50% das recompensas não-bancadas**. Morrer com Fôlego (morte "limpa"): −25%. Subir voluntariamente: 100% bancado. Três resultados, três incentivos — a matemática do risco fica explícita para o jogador na tela de resumo da descida.

## 1.6. Guardiões de Zona e minibosses

| Encontro | Prof. | Mult. HP | Mult. Dano | Mecânica |
| :--- | :---: | :---: | :---: | :--- |
| 🦀 **Aracnídeo do Recife** (Guardião 1) | 25 | ×6.0 | ×1.8 | Escudo (`enemyShield`) de 20% do HP que se refaz a cada 15s — checagem de DPS sustentado |
| 🐙 **A Coisa Entre as Algas** (Guardião 2) | 50 | ×6.0 | ×1.8 | Aplica [ENCHARCADO] permanente durante a luta; alterna janelas Bioluminescentes (±40% de dano recebido a cada 6s) |
| 👑 **O Castelão Afogado** (Guardião 3) | 80 | ×6.0 | ×1.8 | Invoca Ecos do Guardião como "réplica fantasma" (escudo de 15% a cada 10s, padrão Replicante); drop garantido de 1 Runa Primordial na 1ª morte |
| 🐋 Prole do Leviatã (miniboss aleatório) | 81+, 5% | ×3.5 | ×1.4 | Rouba 5% de Fôlego por golpe; pressagia o chefe mundial |

* Guardiões **pausam o dreno de Fôlego durante a luta** (a adrenalina segura a respiração — e mecanicamente, evita que a luta longa de 6× HP seja simplesmente impossível pelo relógio). O dreno retoma ao vencer.
* Vencer um Guardião pela primeira vez cria um **checkpoint permanente**: descidas futuras podem começar na prof. 26/51/81 (custando 2 Chaves de Mergulho em vez de 1). Sem isso, re-farmar a Fossa exigiria 80 andares de corredor a cada tentativa — o mesmo problema que faria a Torre ser insuportável se não fosse curta por natureza.

## 1.7. Curvas de recompensa

### Pérolas Abissais (bancadas por profundidade concluída)
$$\text{Pérolas}(p) = 1 + \lfloor p / 10 \rfloor$$
* Guardiões: +25 / +50 / +100 (toda vez, não só na primeira).
* **Verificação de sanidade:** descida completa 1→25 = 47 Pérolas + 25 do Guardião = **72 Pérolas**. Custo do Traje nível 1 = 60 → primeira melhoria em ~1 boa descida. Descida 1→50 ≈ 205 Pérolas.

### Traje de Mergulho (10 níveis, melhorado na Doca Batial)
$$\text{Custo}(s) = 60 \times 1.6^{s-1} \text{ Pérolas} + 50 \times s \text{ Coral}$$

| Nível | Custo (Pérolas) | Pressão residual | Dreno residual | Efeito acumulado |
| :---: | :---: | :---: | :---: | :--- |
| 1 | 60 | 94% | 96% | — |
| 3 | 154 | 82% | 88% | — |
| 5 | 393 | 70% | 80% | +Bolsões oferecem 4ª opção: "Sonar" (revela os próximos 5 encontros) |
| 8 | 1.611 | 52% | 68% | — |
| 10 | 4.123 | 40% | 60% | +1 ressurreição por descida com 50% HP/Fôlego ("Reserva de Emergência") |

Custo total 0→10: **~10.900 Pérolas** — dezenas de descidas profundas ou semanas de pesca+mergulho. É o sumidouro de médio prazo do modo (as Palavras Rúnicas são o de longo prazo).

### Runas (chance de drop por abate: 8% fixo, sem influência de Sorte — padrão Colar)
| Zona | Tier I | Tier II | Tier III |
| :---: | :---: | :---: | :---: |
| Z1 (1–25) | 100% | — | — |
| Z2 (26–50) | 70% | 30% | — |
| Z3 (51–80) | 50% | 45% | 5% |
| Z4 (81+) | 20% | 55% | 25% |
* Guardiões: 1 runa garantida do tier mais alto da sua zona. Bolsão de Ar (opção runa): 1 runa do tier da zona.
* **Taxa esperada:** descida 1→25 ≈ 25 abates × 8% = **~2 runas T1 por descida** (+garantias). Alimenta a fusão 3→1 sem inundar.

### Demais recompensas
* **Coral Vivo:** 1 por abate em Z1–Z2, 2 em Z3–Z4 (drop direto, 100%).
* **Ecos Afogados:** Z3+, 10% por profundidade concluída, máx. 2 por descida (o cap protege o ritmo da simulação da Cidadela Submersa).
* **Sem XP, sem ouro, sem equipamento comum** — exceto o **Set Abissal**, exclusivo da Z4: 4% de chance por abate na Fossa, rolagem separada (padrão Colar), mult. de atributos 8.0×.

## 1.8. Interações com sistemas existentes (regras explícitas)
* **Velocidade 2x/3x:** TTK cai, mas o dreno de Fôlego escala pelo mesmo fator — a profundidade alcançável por descida é **idêntica** em qualquer velocidade; 3x só economiza tempo real. (Teste de QA obrigatório.)
* **Elixires do Mercador / Poções de Alquimia:** funcionam normalmente (são o "consumível de descida" natural — o Elixir do Defensor vira estratégia legítima para atravessar um trecho letal). Exceção: nenhum efeito restaura Fôlego — Fôlego só volta em Bolsões.
* **Maldições da Torre:** nunca ativas aqui (`activeCurses` é zerado fora da Torre; nenhuma mudança necessária).
* **Ecoterra:** o switch é ignorado dentro das Profundezas (mesma exclusão que a Torre já aplica à Lua de Sangue).
* **Robô Assistente e cliques:** funcionam — o modo é idle-compatível; o "ativo" está nas decisões (subir/descer, bolsões), não em APM.

---

# PARTE 2 — Catálogo Completo das 18 Runas

## 2.0. Arquitetura do catálogo

**18 ids no union `RuneId` = 9 Runas Base (cada uma existindo em Tier I/II/III) + 9 Runas Primordiais (tier único, fonte fixa, não-fundíveis).**

Regras globais:
* **Valores fixos por tier — zero RNG no efeito.** A variância do sistema está em *obter* a runa, nunca em rolá-la (contraste deliberado com o Colar).
* **Empilhamento:** a mesma runa pode ocupar múltiplos soquetes (efeitos somam aditivamente). Os caps globais do jogo continuam valendo (95% red. de dano, 75% esquiva, 50% drop etc.); caps específicos por família estão na tabela.
* **Fusão (Câmara de Gravação N4):** 3 runas idênticas do mesmo tier → 1 do tier acima. Custo: T1→T2 = 5 Pérolas; T2→T3 = 15 Pérolas. Primordiais não fundem.
* **Extração (Câmara N4):** remove a runa intacta por 10 Pérolas. Remoção destrutiva (Câmara N2): grátis.
* **Integração técnica:** as 9 famílias base mapeiam 1:1 para chaves de stats **que já existem** no pipeline (`lifesteal`, `damageMultiplierPct`, `maxHpPct`, `maxManaPct`, `attackSpeedPct`, `damageReductionPct`, `dropChancePct`, bônus de ouro e dano vs. Elite) — o passo 4.7 do `StatEngine` soma nas mesmas variáveis que Colar/Academia/Transcendência já alimentam. Só os efeitos secundários de T3 e as Primordiais pedem flags novas.

## 2.1. As 9 Runas Base

Coluna "Orçamento" = comparação com a fonte equivalente já existente no jogo, provando que os valores não quebram a economia de stats.

| # | Runa | Glifo | Tier I | Tier II | Tier III (+ efeito secundário) | Cap por família | Orçamento / referência |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | **Ur** — Sangue | 🔴 ᚢ | +2% Lifesteal | +3.5% | +5%; curas de Lifesteal podem criticar (usando o crit do jogador) | 12% via runas | Colar capa lifesteal em 4%; set Pandemoníaco 3pç dá 5%. 3× Ur T3 = 15%→capado em 12%: forte, mas custa 3 soquetes T3 |
| 2 | **Kar** — Fúria | 🟠 ᚲ | +4% Dano Geral | +7% | +11%; +3% adicionais enquanto HP > 80% | 30% | Colar capa `damageMultiplierPct` em 20%; Academia dá até 37.5%. 3× Kar T3 = 33%→30%: paridade com uma pesquisa maximizada, custando slots |
| 3 | **Sol** — Fortuna | 🟡 ᛋ | +3% Ouro | +6% | +10%; +2% de chance de Ouro em dobro | 30% ouro / 6% dobro | Relíquia Moeda do Ciclo: +20% ouro + 5% dobro no cap. Sol compete sem eclipsar |
| 4 | **Vin** — Vigor | 🟢 ᚹ | +5% Vida Máx. | +9% | +14%; +0.5% do HP máx. de regeneração ao matar um inimigo | 35% | Colar capa `maxHpPct` em 20%; set Celestial 5pç dá 20%. Runas estendem o teto para builds defensivas dedicadas |
| 5 | **Mar** — Maré | 🔵 ᛗ | +4% Mana Máx. | +7% | +11%; custo de mana −5% relativo | 30% mana / −10% custo | Mana Suprema (Transcendência) dá +100% por 40 PT — Mar é o degrau acessível pré-PT |
| 6 | **Nix** — Vazio | 🟣 ᚾ | +3% Dano vs. Elite/Chefe | +6% | +10%; Elites morrem soltando +1 Pérola (só nas Profundezas) | 25% | Domínio do Vazio (Transcendência): +50% por 40 PT. Mesma lógica do Mar |
| 7 | **Lum** — Eco | ⚪ ᛚ | +2% Vel. de Ataque | +3.5% | +5%; o 1º ataque de cada combate é sempre crítico | 12% | Colar capa `attackSpeedPct` em 10%; teto global de 15× segue absoluto |
| 8 | **Dol** — Pressão | ⚫ ᛞ | +2% Red. de Dano | +3.5% | +5%; imunidade a [ENCHARCADO] | 12% via runas | Colar capa `damageReductionPct` em 12% — mesmo teto, fonte alternativa |
| 9 | **Fen** — Caça | 🟤 ᚠ | +2% Chance de Drop | +4% | +6%; +2% de chance de drop de runa (8%→10%) | 15% | Colar capa `dropChancePct` em 15% — espelhado; cap global de 50% intacto |

### Curva de valor entre tiers (regra geral)
$$\text{T2} \approx \text{T1} \times 1.75 \qquad \text{T3} \approx \text{T1} \times 2.6 \text{ + efeito secundário}$$
Como a fusão é 3→1, um T2 custa 3 T1 mas vale só 1.75× — **fundir sempre "perde" valor bruto em troca de densidade por soquete**. Essa é a decisão econômica do sistema: soquetes são o recurso escasso, não runas. (E o efeito secundário do T3 é o que torna a perda aceitável — ele não existe em nenhuma soma de T1.)

### Direcionamento por classe (emergente, não forçado)
Nenhuma runa tem restrição de classe, mas os efeitos secundários criam afinidades naturais: Ur T3 (lifesteal crítico) casa com Ladrão/Sorte; Mar T3 com Mago/Clérigo pós-custo-percentual da v9.0.0; Vin T3 com Paladino; Lum T3 (1º ataque crítico) com o Manto de Sombras do Ladrão (que já garante N críticos iniciais — os efeitos se somam em cadeia); Dol T3 é a resposta barata ao [ENCHARCADO] para quem não tem o Set Abissal 5pç.

## 2.2. As 9 Runas Primordiais

Tier único, **1 por soquete no personagem inteiro** (não empilham consigo mesmas — são artefatos nomeados, não commodities). Fonte fixa, sem fusão, sem extração destrutiva (extração sempre preserva, custo 25 Pérolas).

| # | Runa | Glifo | Fonte | Efeito engastado | Tensão de design |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 10 | **Thal**, a Âncora | 🜲 | Guardião do Recife (p25) — 100% na 1ª morte, 10% depois | +12% Red. de Dano; −8% Vel. de Ataque | O primeiro "trade-off puro" do jogo em item: tanque paga em tempo |
| 11 | **Nereh**, a Maré Primeira | 🜄 | Evento Maré Viva (sexta): compra por 200 Pérolas no Litoral | Durante a Maré Alta: habilidades custam 0 de mana. Fora dela: −10% de custo | Acopla itemização ao Ciclo de Marés — build que "respira" com o relógio do mundo |
| 12 | **Vrak**, Ossos do Naufrágio | 🜚 | Guardião das Algas (p50) — 100%/10% | +18% Dano Geral; você sofre recuo de 2% do dano que causa (não pode matar o herói, para em 1 HP) | Glass cannon verdadeiro; sinergia perversa com Ur (o lifesteal come o recuo) |
| 13 | **Ciss**, o Sal Eterno | 🝆 | Carpideira do Sal (inimiga Z3), drop de 0.5% | Imune a [ENCHARCADO]; seus ataques básicos aplicam [ENCHARCADO] no inimigo | Inverte o debuff assinatura do update a favor do jogador — liga com a sinergia raio/gelo (+20% em encharcados) |
| 14 | **Morvo**, a Fossa | 🜃 | Guardião das Ruínas (p80) — 100%/10% | +1% Dano Geral a cada 10 profundidades do seu recorde histórico (cap +40% na prof. 400) | Transforma o recorde das Profundezas em stat permanente — o "título honorífico que funciona" |
| 15 | **Ecoh**, a Voz Afogada | 🝮 | Resgatar o 12º Eco Afogado (marco da simulação) | +4% em todos os atributos primários | Recompensa de gestão que vira poder de combate — espelho do papel do Traje |
| 16 | **Faro**, Lúmen Abissal | 🜠 | 100 acertos perfeitos acumulados na Pesca Ativa (contador vitalício) | +10% de chance de um drop subir 1 raridade (empilha com o capstone do Símbolo do Aprendizado) | A runa "do early game": qualquer jogador da Fase 3 pode começar a persegui-la no dia 1 |
| 17 | **Levh**, Coração do Leviatã | 🝓 | Leviatã do Ciclo — 100% na 1ª morte | A cada 60s de combate, ganha um escudo de 15% do HP máx. (usa `playerShield` do Escudo de Mana) | O troféu do chefe mundial; âncora da Palavra Rúnica homônima |
| 18 | **Umbra**, o Abismo | 🜏 | Fossa p100+ — 0.3% por abate | Seus DoTs (Veneno, Queimadura, Sangramento, Exército de Esqueletos) causam dano dobrado em alvos acima de 50% de HP | O chase item absoluto (~1 a cada 330 abates na prof. 100+); redefine builds de DoT no abrir de cada luta |

## 2.3. Palavras Rúnicas — tabela consolidada e final

Requisitos gerais: Câmara de Gravação N5 + receita revelada no Arquivo Submerso (1 por nível de restauração; as três primordiais vêm de fontes próprias). A **ordem da sequência importa** e o efeito **substitui** os bônus individuais das runas engastadas.

| Palavra | Sequência (ordem exata) | Item exigido | Efeito |
| :--- | :--- | :--- | :--- |
| **MARÉ VIVA** | Mar–Vin–Mar | Qualquer, 3 soquetes | Usar uma habilidade: 15% de chance de resetar o cooldown da Cura |
| **FOME DO ABISMO** | Ur–Kar–Ur | Arma, 3 soquetes | Lifesteal 8%; abaixo de 30% de HP, dobra para 16% (ignora o cap de família) |
| **OLHO DO NAUFRÁGIO** | Fen–Sol–Nix | Cabeça, 3 soquetes | Chefes: +25% de chance de drop e drop mínimo Raro |
| **PULMÃO DE FERRO** | Dol–Dol–Vin | Peito, 3 soquetes | Nas Profundezas: dreno de Fôlego −30%. Fora: +8% Red. de Dano |
| **CORO SUBMERSO** | Lum–Mar–Kar | Arma, 3 soquetes | A cada 5 ataques básicos, o próximo ecoa 2× (2ª instância com 50% do dano) |
| **ÂNCORA DO MUNDO** | Thal–Dol–Vin | Peito, 3 soquetes | Imune a Atordoamento; reflete 10% do dano recebido (soma com Retribuição Aura, cap conjunto de 55%) |
| **CANÇÃO DA CARPIDEIRA** | Ciss–Mar–Lum | Arma, 3 soquetes | Ataques aplicam [ENCHARCADO]; seu dano contra encharcados +35% (substitui o bônus base de +20%) |
| **OLHAR DO VAZIO** | Umbra–Nix–Kar | Cabeça, 3 soquetes | Inimigos abaixo de 15% de HP recebem +100% de dano ("execute") |
| **CORAÇÃO DO LEVIATÃ** | Vin–Ur–Dol–Kar | Arma do Set Abissal com 4 soquetes (3+1 do bônus de 3 peças) | +20% Vida Máx.; ao cair abaixo de 25% de HP (1×/combate), escudo de 40% do HP máx. |

**Custo de gravação:** 50 Pérolas (palavras de runas base) / 150 Pérolas (com Primordial) / 400 Pérolas (Coração do Leviatã). Desfazer uma palavra devolve as runas intactas (o custo é o preço da tentativa, não uma armadilha).

**Sumidouro de longo prazo, quantificado:** uma palavra de 3 runas T3 = 3 × (9 T1) = **27 drops de T1 equivalentes** + Pérolas de fusão + gravação. Montar 3–4 palavras num personagem é um projeto de semanas de Fossa — exatamente a vida útil que o tier final de um update 10.0 precisa ter, no mesmo espírito do Místico +8 (256 itens fundidos).

## 2.4. Checklist de implementação do catálogo
1. `RuneId` = union dos 18 ids; catálogo em `runeFormulas.ts` (novo módulo compartilhado, padrão `manaFormulas.ts`/`citadelFormulas.ts`) com `{ tier, statKey, value, secondary?, primordialSource? }`.
2. Passo 4.7 do `StatEngine`: reduzir `equipment[*].socketedRunes` sobre as mesmas variáveis dos passivos do Colar; aplicar caps de família ANTES dos caps globais.
3. Palavras Rúnicas: detecção por comparação de sequência exata no mesmo passo (função pura `detectRuneword(item)`); quando detectada, pular a soma individual e ativar a flag da palavra (consumida por `CombatFSM` nos pontos já existentes de flag+duração/efeito).
4. Efeitos condicionais (Kar T3 "HP > 80%", Fome do Abismo "< 30%") avaliados no `CombatFSM.update()` — nunca no `StatEngine` (que é stateless por frame de personagem, não de combate).
5. Cadastrar TODOS os efeitos no lançamento — incluindo o Set Abissal em `SET_BONUSES` (lição da Lua de Sangue, que passou uma versão inteira sem bônus funcional).
6. QA obrigatório: velocidade 3x vs. dreno de Fôlego; caps de família vs. empilhamento 3×; extração de runa dentro de item guardado no Depósito; runas em item que passa por Fusão Mística (devolução ao `runeInventory` do Item B).
