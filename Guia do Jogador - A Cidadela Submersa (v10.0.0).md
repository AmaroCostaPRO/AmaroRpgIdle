# Guia do Jogador — A Cidadela Submersa (v10.0.0)

Guia prático de "como jogar" a expansão completa: como desbloquear cada sistema, como farmar
cada recurso, e como progredir do primeiro peixe fisgado até a derrota do Leviatã do Ciclo.
Não é um documento de lore nem de fórmulas internas — para isso, veja o Codex in-game e o
Manual Técnico. Este guia assume que você já joga a campanha normal e quer saber, na prática,
o que fazer em cada tela nova.

Como bônus, o guia também cobre **A Convergência**, o chefe mundial de quarta-feira do
Pandemônio — que não é parte da Cidadela Submersa (chegou na v9.0.0), mas gera a mesma dúvida
de "como eu desbloqueio/ativo isso".

---

## Índice

1. [Ordem recomendada de progressão](#1-ordem-recomendada-de-progressão)
2. [O Litoral Naufragado (pesca)](#2-o-litoral-naufragado-pesca)
3. [As Profundezas (mergulho vertical)](#3-as-profundezas-mergulho-vertical)
4. [A Cidadela Submersa (os 6 distritos)](#4-a-cidadela-submersa-os-6-distritos)
5. [Os Ecos Afogados (resgate e alocação)](#5-os-ecos-afogados-resgate-e-alocação)
6. [O Ciclo de Marés e as Bênçãos do Templo](#6-o-ciclo-de-marés-e-as-bênçãos-do-templo)
7. [Runas Abissais e Palavras Rúnicas](#7-runas-abissais-e-palavras-rúnicas)
8. [O Set Abissal](#8-o-set-abissal)
9. [O Leviatã do Ciclo (chefe semanal)](#9-o-leviatã-do-ciclo-chefe-semanal)
10. [A cutscene "O Coro e o Caco"](#10-a-cutscene-o-coro-e-o-caco)
11. [Bônus: A Convergência (chefe de quarta-feira do Pandemônio)](#11-bônus-a-convergência-chefe-de-quarta-feira-do-pandemônio)
12. [Checklist rápido de desbloqueios](#12-checklist-rápido-de-desbloqueios)

---

## 1. Ordem recomendada de progressão

A expansão se abre em **duas ondas**, separadas pela Fase 50 (o mesmo marco da Transcendência):

| Marco | O que abre |
|---|---|
| Completar a Fase 2 (chegar na Fase 3) | Litoral Naufragado — pesca passiva e ativa |
| Fase 50 (`highestStageReached >= 50`) | "Graduação": Mergulhos Rasos viram Profundezas completas (Zonas 2–4), Pressão passa a valer, Guardiões de Zona 2 e 3 liberados |
| 1º distrito drenado da Cidadela Submersa | Ecos Afogados, Câmara de Gravação de Palavras Rúnicas conforme distritos avançam |
| Trono Afundado restaurado (nível 1) | O Leviatã do Ciclo |

Não existe uma "quest" formal — cada sistema libera sozinho ao bater o requisito acima. Você
pode pescar desde bem cedo e ficar puxando Pérolas/Coral parado, mesmo sem ainda ter chegado
na Fase 50.

---

## 2. O Litoral Naufragado (pesca)

**Desbloqueio:** completar a Fase 2 (ou seja, `highestStageReached >= 3`).

### Pesca passiva
Roda sozinha, sem interação, e enche um "buffer" de capturas que você coleta manualmente.

- **Capturas/hora** = `(2 + ⌊FaseMáx × 0.1⌋) × (1 + Nível da Doca × 0.15)`
- **Capacidade do buffer** = `10 + Nível da Doca × 8` (a produção pausa quando o buffer enche — colete!)
- Melhore a **Doca de Pesca** (até nível 5) para aumentar as duas coisas. Custo em Ouro + Carne,
  dobrando por nível (~2.2× Ouro, ~1.6× Carne); o upgrade leva `nível` horas para terminar.

### Pesca ativa
Puxe manualmente a cada 15s (cooldown fixo, ou **7,5s às sextas-feiras** por causa da Maré Viva —
veja seção 6). Cada puxada é `miss`/`hit`/`perfect`. Acumular **100 acertos perfeitos** garante a
runa primordial **Faro** (+10% de chance de qualquer drop subir 1 raridade).

### Iscas
Consomem **Carne** em lotes de 10:

| Isca | Custo (Carne) | Efeito |
|---|---|---|
| Sem isca | grátis | só capturas comuns (peixe/coral) |
| 🪱 Isca de Carne | 50 | equilibrada — abre as capturas raras |
| ✨ Isca Luminosa | 200 | puxa mais Pérolas Abissais e Runas |
| 🪝 Isca Abissal | 500 | puxa mais Fragmentos de Batisfera e Coral |

Ciclo de economia: **Peixe-Lanterna → Carne (1:3)** fecha o loop mesmo sem nenhuma Ascensão —
ninguém trava sem isca.

### Capturas possíveis
Peixe-Lanterna (vira Carne), Coral Vivo, Pérola Abissal, Runa Encharcada T1, Fragmento de
Batisfera — **5 Fragmentos = 1 Chave de Mergulho**.

### A Maré também afeta a pesca
- **Maré Baixa:** pesca +50%.
- **Maré Alta:** pesca −25%, mas Coral de inimigos aquáticos +50%.

Veja o indicador de maré no topo do painel do Litoral (ícone + contagem regressiva).

---

## 3. As Profundezas (mergulho vertical)

### Antes da Fase 50 — "Mergulhos Rasos"
Já disponíveis desde a Fase 3 junto com o Litoral. Descida tetada na **profundidade 25**, sem
Pressão, usando a fase mais alta que você já alcançou como referência de dificuldade. Serve para
já ir farmando Pérolas e a 1ª Runa Primordial (Guardião do Recife, prof. 25).

### Depois da Fase 50 — Profundezas completas
Ao alcançar `highestStageReached >= 50`, a MESMA descida "gradua": passa a usar uma âncora FIXA
na Fase 50 (o personagem não fica mais forte por subir de fase — a Profundidade vira o eixo de
progressão), habilita a **Pressão** e libera as **Zonas 2 a 4**.

| Zona | Profundidade | Nome | Fator HP/Dano dos inimigos |
|---|---|---|---|
| 1 | 1–25 | Recife Partido | 1.00 / 1.00 |
| 2 | 26–50 | Bosque de Algas Negras | 1.25 / 1.15 |
| 3 | 51–80 | Ruínas da Cidadela | 1.60 / 1.35 |
| 4 | 81+ (infinita) | Fossa do Caco | 2.00 / 1.60 |

### Fôlego
Reserva de 0–100% que drena **0,8%/segundo**, reduzida **4% por nível de Traje de Mergulho**
(até 10 níveis = −40% de dreno). NÃO escala com a profundidade — é um relógio de sessão, não de
dificuldade. Chegar a 0% = Afogamento (dano recebido dobra, sem regeneração de HP).

- A cada **5 profundidades**, você passa por um **Bolsão de Ar**: escolha entre +60% de Fôlego,
  uma runa, ou +25% de Pérolas na próxima entrega.
- **Como subir:** dentro de um Bolsão de Ar, ou usando o botão de "Subir à Superfície" (pede
  dupla confirmação — 2 toques em ~3s).
- Manter as recompensas: subir voluntariamente = 100%; morrer com Fôlego ainda ativo = 75%;
  morrer afogado = só 50%.

### Pressão
Multiplica o dano que você RECEBE, e é a única fonte de dano do jogo que **atravessa o cap de
95% de redução** — por isso o Traje de Mergulho é essencial no fundo.
`Pressão = 1 + 0.04 × profundidade × (1 − 0.06 × nível do Traje)`. Só se aplica pós-Fase 50.

### Traje de Mergulho
Melhorado na **Doca Batial** (1º distrito da Cidadela, veja seção 4), até 10 níveis. Reduz
Pressão e dreno de Fôlego. Custo: `60 × 1.6^(nível−1)` Pérolas + `50 × nível` Coral.

### Guardiões de Zona
Chefes fixos, sempre na profundidade exata — não aparecem no pool aleatório.

| Zona | Prof. | Nome | Recompensa | Runa Primordial garantida (1ª morte) |
|---|---|---|---|---|
| 1 | 25 | Aracnídeo do Recife | 25 Pérolas | **Thal, a Âncora** (+12% Redução de Dano, −8% Vel. Ataque) |
| 2 | 50 | A Coisa Entre as Algas | 50 Pérolas | **Vrak, Ossos do Naufrágio** (+18% Dano Geral, 2% recuo) |
| 3 | 80 | O Castelão Afundado | 100 Pérolas | **Morvo, a Fossa** (+1%/10 prof. do recorde, cap +40%) |

Vencer um Guardião libera um **checkpoint**: a próxima descida pode começar direto na
profundidade seguinte (26/51/81) por **2 Chaves de Mergulho** em vez de recomeçar do zero.

### Outras runas primordiais das Profundezas (fora dos Guardiões)
- **Ciss, o Sal Eterno** — Carpideira do Sal (Zona 3): imune a [ENCHARCADO], aplica no inimigo.
- **Nereh, a Maré Primeira** — comprada no **Templo da Maré** (Restauração I+), 200 Pérolas:
  mana grátis em Maré Alta, −10% de custo fora dela.
- **Ecoh, a Voz Afogada** — resgatar o **12º Eco Afogado**: +4% em todos os atributos.
- **Faro, Lúmen Abissal** — 100 acertos perfeitos na pesca ativa: +10% chance de upgrade de raridade.
- **Levh, Coração do Leviatã** — só derrotando o Leviatã do Ciclo.
- **Umbra, o Abismo** — Fossa, profundidade 100+: dobra dano de DoT em alvos acima de 50% HP.

Lembre-se: **1 primordial por personagem inteiro** (não empilha — precisa extrair para trocar).

### Runas base e Coral por abate
Runas dropam **8% fixo por abate** (sem influência de Sorte). Tier sorteado por zona (Z1 só T1;
Z4 até 25% T3). Coral: 1 por abate em Z1–Z2, 2 em Z3–Z4.

### Títulos das Profundezas (por recorde histórico de profundidade)
10 = Molhado de Coragem · 25 = Vencedor do Recife Partido · 50 = Sobrevivente das Algas Negras ·
80 = Andarilho das Ruínas Afundadas · 120 = Peregrino da Fossa do Caco · 200 = O Que Voltou do Fundo.

---

## 4. A Cidadela Submersa (os 6 distritos)

Tela própria (grade 2×3) com 6 distritos, todos começam **Alagados**. Cada um precisa ser
**drenado** (custo + tempo real) e depois pode ser **Restaurado** até nível III (custo adicional,
sem tempo extra).

| Distrito | Custo de drenagem (Pérolas / Coral) | Duração | O que ele faz |
|---|---|---|---|
| ⚓ Doca Batial | 100 / 50 | 8h | Melhora o Traje de Mergulho; produz chave passiva (24h desde Restauração I) |
| 🏛️ Salão dos Ecos | 250 / 125 | 16h | Aumenta o cap do elenco de Ecos (+2/nível: 12→14→16→18); bônus de eficácia por Eco alocado ali |
| ⚒️ Forja Encharcada | 400 / 200 | 24h | Reduz custo de fusão/gravação de runas (até −20% na Restauração III); chance de devolver a runa fundida |
| 📚 Arquivo Submerso | 600 / 300 | 36h | Chance extra de revelar uma 2ª Palavra Rúnica ao desbloquear uma |
| 🕍 Templo da Maré | 900 / 450 | 48h | Escolha de Bênção durante a Maré Alta (veja seção 6); vende a runa Nereh |
| 👑 Trono Afundado | 1500 / 750 | 72h | Libera o Leviatã do Ciclo (precisa nível 1) |

**Restauração II/III:** custa ~50%/100% do valor original de drenagem (sem timer extra), e cada
distrito ganha **1 slot de Eco por Restauração alcançada** (até 2 slots no nível II+).

Ao clicar em um marcador de distrito, abre-se um **modal** com o estado atual, o timer se estiver
drenando, o botão de restauração, e os soquetes de Eco daquele distrito (círculos: vazio =
tracejado, ocupado = retrato do Eco).

---

## 5. Os Ecos Afogados (resgate e alocação)

Os Ecos são a "população" que você resgata e aloca nos distritos restaurados para produzir bônus.

### Como resgatar
- **Mergulhando** na Zona 3 ou 4: **10% de chance por profundidade concluída**, até **2 por
  descida**.
- **Drenando um distrito**: também pode gerar um Eco.

### Vocação, raridade e traço
Cada Eco nasce com:
- **Vocação** (Pescador/Mergulhador/Escriba/Guardião) — cada uma tem afinidade **×1,5** com um
  distrito "primário" e, às vezes, **×1,25** com um "secundário" (Escriba/Guardião → Templo).
- **Traço** — 4 comuns, 4 incomuns, 4 raros (10% de chance de raro, 30% incomum, 60% comum).
  O mais importante para acompanhar é o **Coração Partido** (raro): dá −30% de eficácia até
  **7 dias reais** alocado sem trocar de distrito — depois disso vira +30%. Realocar um Eco com
  esse traço reinicia a contagem, então o jogo avisa antes de confirmar a troca.

### Alocação (toque-para-alocar)
No painel: toque no card do Eco na gaveta lateral (desktop) / bottom-sheet (mobile) → os
distritos elegíveis pulsam → toque no distrito de destino → confirme (2º toque). Cada distrito
restaurado abre 1 slot (2 na Restauração II+).

### Fórmula de eficácia (mostrada card a card)
```
Eficácia = Base do Distrito × Afinidade × (1 + Traço próprio) × (1 + Traços recebidos dos vizinhos) × (1 + Bônus do Salão)
```
Cap de multiplicador: ×2,5 (não afeta a Base do Distrito). O card do Eco mostra a decomposição
completa (ex.: `Base 8% × Afin. 1.5 × Traço 1.1 × Viz. 0.9 × Salão 1.06 = 12.6%`), então não
precisa decorar a fórmula — só usar o número final.

- **Bônus do Salão:** soma 6% por Eco alocado no Salão dos Ecos (12% se tiver o traço **Voz do
  Coro**), cap 24% (+8% extra na Restauração III do Salão, por Eco "descansando" sem distrito).
- **Cap do elenco:** 12 + 2 por nível de Restauração do Salão (12/14/16/18).
- **Marcos de resgate vitalício:** 3, 6, 9, 12 (dá a runa Ecoh) e 16.

---

## 6. O Ciclo de Marés e as Bênçãos do Templo

Relógio determinístico, sem depender de servidor — todo mundo vê a mesma maré ao mesmo tempo.

- **Ciclo normal:** 6h totais (3h Maré Baixa + 3h Maré Alta).
- **Sextas-feiras ("Maré Viva"):** o ciclo acelera para **1h total** (10 min baixa / 50 min...
  na prática o ciclo inteiro fica 6× mais rápido) — e a pesca ativa fica com cooldown de **7,5s**
  em vez de 15s nesse dia.

| Fase | Efeitos |
|---|---|
| **Maré Baixa** | Pesca +50% · Custo de drenagem −20% · Pressão nas Profundezas −10% |
| **Maré Alta** | Pesca −25% · Coral de inimigos aquáticos +50% · Templo libera Bênção |

### Bênçãos do Templo (só durante Maré Alta)
Escolha uma no **Templo da Maré** (precisa estar restaurado nível 1+):
- **+10% Dano** (durante a Maré Alta)
- **+10% Chance de Drop**
- **+15% Produção Submersa** (dos Ecos alocados)

A duração da Bênção pode ser estendida em até **+20%** pela eficácia acumulada do Templo, e na
**Restauração III** você pode manter **2 Bênções simultâneas** (a 2ª com metade da força).

---

## 7. Runas Abissais e Palavras Rúnicas

### Soquetes
Perfurar slots pesados (cabeça, peito, pernas, mãos, arma, anel) custa Pérolas + Ouro,
escalando por soquete já aberto no item (10/40/150/400 Pérolas). O teto de soquetes por slot
depende do nível da **Câmara de Gravação**:

| Nível da Câmara | Libera |
|---|---|
| N1 | Perfurar armas (1 soquete) |
| N2 | Perfurar peitorais; remoção destrutiva |
| N3 | 2º soquete em armas; perfurar qualquer slot pesado |
| N4 | Extração intacta; **fusão 3→1** |
| N5 | 3º soquete em arma/peito/cabeça; **Palavras Rúnicas** |

- **Fusão:** 3 runas idênticas do mesmo tier → 1 do tier acima (custa 5 Pérolas T1→T2, 15
  Pérolas T2→T3). Primordiais nunca fundem.
- **Extração:** preserva a runa (10 Pérolas base, 25 primordial).

### Palavras Rúnicas (gravação, Câmara N5)
Engastar uma **sequência exata** (ordem importa!) transforma runas individuais num efeito único.
Custo: **50 Pérolas** (só runas base) ou **150 Pérolas** (sequência com primordial), exceto a
última da lista abaixo.

| Nome | Sequência | Slot | Efeito |
|---|---|---|---|
| MARÉ VIVA | mar_t1, vin_t1, mar_t1 | qualquer | 15% de chance de resetar o cooldown da Cura ao usar habilidade |
| FOME DO ABISMO | ur_t1, kar_t1, ur_t1 | arma | Lifesteal 8% (16% abaixo de 30% HP) |
| OLHO DO NAUFRÁGIO | fen_t1, sol_t1, nix_t1 | cabeça | Chefes: +25% chance de drop, sempre ao menos Raro |
| PULMÃO DE FERRO | dol_t1, dol_t1, vin_t1 | peito | Nas Profundezas: −30% dreno de Fôlego; fora: +8% Redução de Dano |
| CORO SUBMERSO | lum_t1, mar_t1, kar_t1 | arma | A cada 5 ataques básicos, o próximo ecoa 2× (50% de dano na 2ª instância) |
| ÂNCORA DO MUNDO | thal, dol_t1, vin_t1 | peito | Imune a Atordoamento; reflete 10% do dano recebido |
| CANÇÃO DA CARPIDEIRA | ciss, mar_t1, lum_t1 | arma | Aplica [ENCHARCADO]; +35% dano contra encharcados |
| OLHAR DO VAZIO | umbra, nix_t1, kar_t1 | cabeça | Inimigos abaixo de 15% HP recebem +100% dano |
| **CORAÇÃO DO LEVIATÃ** | vin_t1, ur_t1, dol_t1, kar_t1 | arma | +20% Vida Máx.; escudo de 40% HP máx. 1×/combate abaixo de 25% HP — **exige a arma do Set Abissal com 4 soquetes**; custo fixo **400 Pérolas**; a receita só é revelada na 1ª derrota do Leviatã |

O **Arquivo Submerso** dá uma chance extra (proporcional à sua eficácia acumulada) de revelar uma
**2ª** Palavra Rúnica bloqueada sempre que uma revelação normal disparar.

---

## 8. O Set Abissal

Equipamento exclusivo da **Fossa do Caco (Zona 4)** e das mortes do Leviatã — o novo teto de
multiplicador de status do jogo (**×8,0**, acima do Celestial).

- **Chance de drop:** 4% por abate, só na Zona 4 (rolagem separada, não compete com equipamento
  normal de campanha).
- 8 conjuntos, um por classe, com nomes temáticos próprios (ex.: "Set Abissal do Afogador" para
  Guerreiro).
- **Bônus de 3 peças:** +1 soquete extra na arma (até o 4º), necessário para gravar CORAÇÃO DO
  LEVIATÃ.

---

## 9. O Leviatã do Ciclo (chefe semanal)

### Desbloqueio
- **Trono Afundado restaurado (nível 1 ou mais).**
- Não pode estar na Torre Infinita, em um mergulho ativo, nem no Desafio Diário ao desafiá-lo.

### Escalonamento e tentativas
- **Sempre um degrau abaixo do seu melhor mergulho:** `p_Lev = max(90, ⌊recorde histórico × 0,9⌋)`
  — cada novo recorde nas Profundezas "acorda" um Leviatã mais forte na semana seguinte.
- HP por fase = HP base naquela profundidade × 8,0. Dano base × 4,5.
- **Pressão fixa ×2,5** no Traje 0 (reduzida pelo Traje normalmente).
- **3 tentativas por semana**, ou **4 com o Trono na Restauração III**. Reinicia no domingo.
- Progresso é **salvo por fase**: se você perder na Fase 3, a próxima tentativa começa na Fase 3
  (as fases já vencidas não se repetem naquela semana).

### As 5 fases
| Fase | Nome | Mecânica |
|---|---|---|
| 1 | O Despertar | **Vagalhão** — canaliza 3s a cada 20s, dano ×4 se completar. **Interrompível** por Atordoamento. |
| 2 | A Prole | Escudo de Prole (25% do HP da fase, refaz a cada 15s sem escudo); a fase conta como **Elite** (bônus de Nix/Caçador de Elites valem); enquanto o escudo existir, você recebe **−50%** de dano real no HP. |
| 3 | A Inundação | **Correnteza** — [LENTO] a cada 12s por 4s: **−40% de velocidade de ataque**. |
| 4 | O Olhar do Abismo | **Ciclo Bioluminescente** (janelas de 6s: "Aceso" dano recebido +50% / "Apagado" −70% + reflete 15%); **Canto Abissal** — canaliza 5s a cada 30s, cura 3% do HP da fase se completar (interrompível). |
| 5 | O Coração do Ciclo | **Vagalhão NÃO-interrompível** a cada 15s — 30% de chance de te atordoar por 2s ao completar (é o único stun do jogo contra o jogador — a Âncora do Mundo protege dele). **Fúria do Ciclo:** +2%/10s de dano e velocidade, cap +200%. |

### Recompensas
| Fase derrotada | Recompensa (1ª vez na semana) |
|---|---|
| 1 | 50 Pérolas × multiplicador de profundidade |
| 2 | 75 Pérolas + 1 Runa T2 |
| 3 | 100 Pérolas + 1 Runa T3 |
| 4 | 150 Pérolas + 1 Runa T3 |
| 5 (kill) | Recompensas de morte — veja abaixo |

Multiplicador de Pérolas = `1 + p_Lev/100`.

**Ao matar (Fase 5):**
- Recompensas de morte normais (Set Abissal, título, receita de CORAÇÃO DO LEVIATÃ na 1ª vez, a
  runa primordial **Levh**).
- Matar de novo na mesma semana (já tendo limpo antes): +50 Pérolas + 10% de chance de uma 2ª
  peça de equipamento.
- **Full Clear** (derrotar as 5 fases numa única tentativa, sem morrer): +100 Pérolas de bônus
  extra.

---

## 10. A cutscene "O Coro e o Caco"

Dispara automaticamente na **1ª derrota** do Leviatã do Ciclo — é a primeira cutscene do jogo.
Depois de vista, pode ser rejogada a qualquer momento pela entrada **"Memórias"** no Guia/Codex.
Se você já resgatou **12 ou mais Ecos** na hora da 1ª derrota, o painel final ganha uma linha
extra ("E desta vez, o coro estava completo"). Derrotas repetidas do Leviatã (semanas seguintes)
mostram um toast resumido no lugar da cutscene completa.

---

## 11. Bônus: A Convergência (chefe de quarta-feira do Pandemônio)

Não faz parte da Cidadela Submersa (chegou na v9.0.0 "O Que Espera no Pandemônio"), mas segue a
mesma lógica de "boss por dia da semana" que o Leviatã (domingo) e a Maré Viva (sexta), então vale
explicar aqui.

### Como desbloquear
- **Modo Pandemônio precisa estar ativo** (`pandemoniumUnlocked`) — isto é, você já:
  1. Maximizou os 5 upgrades permanentes de prestígio (nível 10 em cada um),
  2. Tem pelo menos 100 Pontos de Prestígio,
  3. E já completou o Purgatório.
  Ativar o Pandemônio reinicia o personagem (como uma Ascensão) mas mantém os upgrades permanentes.

### Como ativar/encontrar
- **Só às quartas-feiras** (checagem de dia da semana local, sem servidor).
- Com o Pandemônio já ativo, **cada encontro comum** (fora da Torre) tem **1% de chance** de virar
  o world boss da semana.
- **Limite: 1 manifestação por semana** — uma vez sorteado, fica bloqueado até a próxima quarta
  (a mesma seed semanal do Leviatã/Maré Viva).
- Não precisa "ativar" nada manualmente: é passivo, só jogue a campanha normalmente numa quarta-feira.

### Os 4 bosses rotativos (1 por semana, determinístico)
- 🟣 **O Que Ainda Sonha**
- 🔴 **O Ceifador de Reflexos**
- 🟢 **A Fome sem Nome**
- 🟠 **O Trono Vazio**

Cada um dropa uma **relíquia ativa exclusiva**, mais forte que as do catálogo normal e com valor
FIXO (sem variação de roll) — só existe essa fonte de obtenção.

---

## 12. Checklist rápido de desbloqueios

- [ ] Fase 3 → Litoral Naufragado (pesca) + Mergulhos Rasos
- [ ] Fase 50 → Profundezas completas (Zonas 2–4, Pressão, Guardiões 2 e 3)
- [ ] Guardião do Recife (prof. 25) → runa Thal
- [ ] Guardião das Algas (prof. 50) → runa Vrak
- [ ] Guardião das Ruínas (prof. 80) → runa Morvo
- [ ] Drenar Doca Batial → Traje de Mergulho, chave passiva
- [ ] Drenar Salão dos Ecos → mais cap de Ecos
- [ ] Drenar Templo da Maré (Restauração I) → Bênçãos + comprar runa Nereh
- [ ] Drenar Trono Afundado (Restauração I) → desafiar o Leviatã do Ciclo
- [ ] Câmara de Gravação N5 → Palavras Rúnicas
- [ ] Set Abissal com 4 soquetes na arma → gravar CORAÇÃO DO LEVIATÃ
- [ ] Derrotar o Leviatã (1ª vez) → cutscene "O Coro e o Caco" + runa Levh
- [ ] Pandemônio ativo + quarta-feira → chance de Convergência
