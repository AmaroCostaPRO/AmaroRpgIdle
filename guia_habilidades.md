# Guia de Habilidades das Classes - Amaro RPG Idle

Este documento detalha o funcionamento mecânico, matemático e visual de todas as habilidades disponíveis no jogo para cada uma das classes de personagens, além da habilidade comum de cura.

---

## 1. Regras de Escalonamento e Fórmulas Gerais

Todas as habilidades de dano ativas seguem uma fórmula matemática padrão baseada nos atributos atuais de combate do personagem. A cura possui uma fórmula própria baseada em Magia.

### A. Atributo de Escala de Dano por Classe
O atributo principal utilizado para calcular o dano base é determinado pela **Classe Ativa** do personagem no momento do combate:
* **Mago (`Mage`) e Clérigo (`Cleric`):** Escala com **Magia** (`magic`).
* **Arqueiro (`Ranger`) e Ladrão (`Rogue`):** Escala com **Destreza** (`dexterity`).
* **Paladino (`Paladin`):** Escala com **Constituição** (`constitution`).
* **Guerreiro (`Warrior`):** Escala com **Força** (`strength`).

### B. Fórmula de Dano do Ataque Básico (Auto-Attack)
$$\text{Dano Final} = \lfloor \text{Atributo de Escala} \times 1.0 + \text{Random}(0, 4) \rfloor$$

*O ataque básico agora causa exatamente 100% (1.0) do atributo de escala da classe correspondente, criando uma distinção clara de valor em relação às habilidades ativas.*

### C. Fórmula Geral de Dano (Habilidades Ativas)
$$\text{Multiplicador de Nível} = 1.0 + (\text{Nível da Habilidade} - 1) \times 0.15$$
$$\text{Dano Base} = \text{Atributo de Escala} \times \text{Multiplicador Base} \times \text{Multiplicador de Nível}$$
$$\text{Dano Final} = \lfloor \text{Dano Base} + \text{Random}(0, 4) \rfloor$$

*Onde:*
* $\text{Multiplicador Base}$ é o multiplicador inicial da habilidade ativa (definido em `SKILL_BASE_MULTIPLIERS` no código).
* $\text{Nível da Habilidade}$ é o nível atual do upgrade (de 1 a 5).
* A função $\text{Random}(0, 4)$ adiciona uma variação aleatória inteira de 0 a 4 ao dano final.

*Casos especiais:*
* **Punição da Luz (`smite_paladin`):** Dano misto que escala com $125\%$ ($1.25$) de Constituição e $125\%$ ($1.25$) de Força combinados:
  $$\text{Dano Base} = (\text{Constituição} \times 1.25 + \text{Força} \times 1.25) \times \text{Multiplicador de Nível}$$

### D. Fórmulas de Custos de Mana e Recarga (Cooldown)
* **Custo de Mana:**
  * **Slash (Guerreiro):** $8$ Mana.
  * **Fireball (Mago):** $15$ Mana.
  * **Cura (Comum):** $12$ Mana.
  * **Outras Habilidades:** $10 + (\text{Nível Requerido} \times 1.5)$ Mana.
* **Tempo de Recarga (Cooldown):**
  * **Cura (Comum):** $10.000\text{ ms}$ ($10$ segundos).
  * **Habilidades com Nível Requerido $\le 1$:** $3.000\text{ ms}$ ($3$ segundos).
  * **Habilidades com Nível Requerido $\le 3$:** $5.000\text{ ms}$ ($5$ segundos).
  * **Habilidades com Nível Requerido $\le 7$:** $8.000\text{ ms}$ ($8$ segundos).
  * **Habilidades com Nível Requerido $> 7$:** $12.000\text{ ms}$ ($12$ segundos).

---

## 2. Habilidades por Classe

---

### 🛡️ Guerreiro (Warrior)
Focado em dano físico corpo a corpo e sobrevivência, escalando com **Força** (`strength`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Slash** | Ativa | 1 | 8 | 3.0s | Corte rápido. Multiplicador Base: $1.5$ ($150\%$). Escala de $150\%$ (Nível 1) a $240\%$ (Nível 5) do atributo de Força. | Efeito físico de corte vermelho (`0xf43f5e`) diagonal sobre o inimigo e vibração na câmera. |
| **Impacto de Escudo** | Ativa | 3 | 14.5 | 5.0s | Golpe de escudo. Multiplicador Base: $1.2$ ($120\%$). Escala de $120\%$ (Nível 1) a $192\%$ (Nível 5). | Efeito físico de corte vermelho sobre o inimigo com vibração média na câmera. |
| **Fúria Berserk** | Passiva | 5 | -- | -- | Aumento passivo e permanente de $+5$ em **Força** na árvore de habilidades. | Apenas atualização numérica estática nos atributos primários na UI do React. |
| **Executar** | Ativa | 7 | 20.5 | 8.0s | Golpe finalizador. Multiplicador Base: $3.0$ ($300\%$). Escala de $300\%$ (Nível 1) a $480\%$ (Nível 5). | Efeito físico de corte vermelho sobre o inimigo com forte vibração na câmera. |
| **Grito de Guerra** | Passiva | 9 | -- | -- | Grito de guerra protetor. Aumento passivo de $+5$ em **Constituição** na árvore. | Apenas atualização numérica estática nos atributos primários na UI do React. |
| **Tempestade de Aço** | Ativa | 11 | 26.5 | 12.0s | Tempestade de aço. Multiplicador Base: $4.0$ ($400\%$). Escala de $400\%$ (Nível 1) a $640\%$ (Nível 5). | Efeito físico de corte vermelho rápido com forte vibração na câmera. |

---

### 🔮 Mago (Mage)
Conjura feitiços elementais massivos à distância, escalando com **Magia** (`magic`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fireball** | Ativa | 1 | 15 | 3.0s | Esfera de fogo explosiva. Multiplicador Base: $2.5$ ($250\%$). Escala de $250\%$ (Nível 1) a $400\%$ (Nível 5) de Magia. | Círculo laranja (`0xf97316`) voando até o inimigo, gerando uma explosão amarela e leve tremor de tela. |
| **Raio de Gelo** | Ativa | 3 | 14.5 | 5.0s | Raio gélido desacelerador. Multiplicador Base: $1.5$ ($150\%$). Escala de $150\%$ (Nível 1) a $240\%$ (Nível 5). | Projétil mágico disparado em direção ao inimigo gerando explosão de impacto. |
| **Escudo de Mana** | Passiva | 5 | -- | -- | Escudo protetor. Aumento passivo permanente de $+5$ em **Magia** na árvore. | Atualização numérica estática nos atributos primários do personagem. |
| **Relâmpago** | Ativa | 7 | 20.5 | 8.0s | Descarga elétrica destrutiva. Multiplicador Base: $3.5$ ($350\%$). Escala de $350\%$ (Nível 1) a $560\%$ (Nível 5). | Projétil mágico disparado em direção ao inimigo gerando explosão de impacto. |
| **Brilho Arcano** | Passiva | 9 | -- | -- | Expansão arcana mental. Aumento passivo permanente de $+5$ em **Magia** na árvore. | Atualização numérica estática nos atributos primários do personagem. |
| **Meteoro** | Ativa | 11 | 26.5 | 12.0s | Cataclismo de fogo cadente. Multiplicador Base: $5.0$ ($500\%$). Escala de $500\%$ (Nível 1) a $800\%$ (Nível 5). | Grande projétil de fogo voando e colidindo com explosão e tremor de câmera. |

---

### 🏹 Arqueiro (Ranger)
Ataques rápidos à distância e venenos letais, escalando com **Destreza** (`dexterity`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Disparo Preciso** | Ativa | 1 | 11.5 | 3.0s | Disparo rápido. Multiplicador Base: $1.5$ ($150\%$). Escala de $150\%$ (Nível 1) a $240\%$ (Nível 5) de Destreza. | Efeito físico de corte vermelho sobre o corpo do monstro indicando o impacto do projétil. |
| **Flecha Venenosa** | Ativa | 3 | 14.5 | 5.0s | Flecha tóxica. Multiplicador Base: $1.0$ ($100\%$). Escala de $100\%$ (Nível 1) a $160\%$ (Nível 5). | Efeito físico de corte vermelho sobre o corpo do monstro. |
| **Olho de Águia** | Passiva | 5 | -- | -- | Concentração. Aumento passivo permanente de $+5$ em **Destreza** na árvore. | Atualização numérica estática nos atributos primários. |
| **Disparo Duplo** | Ativa | 7 | 20.5 | 8.0s | Duas flechas simultâneas. Multiplicador Base: $2.8$ ($280\%$). Escala de $280\%$ (Nível 1) a $448\%$ (Nível 5). | Efeito físico de corte vermelho sobre o inimigo com vibração média. |
| **Passo Ligeiro** | Passiva | 9 | -- | -- | Agilidade felina. Aumento passivo permanente de $+3$ em **Destreza** e $+2$ em **Constituição**. | Atualização numérica estática nos atributos primários. |
| **Chuva de Flechas** | Ativa | 11 | 26.5 | 12.0s | Saraivada de flechas em área. Multiplicador Base: $4.2$ ($420\%$). Escala de $420\%$ (Nível 1) a $672\%$ (Nível 5). | Efeito físico de corte vermelho veloz sobre o inimigo e forte tremor. |

---

### 🛡️ Paladino (Paladin)
Defensor sagrado com alta defesa e retaliação divina, escalando com **Constituição** (`constitution`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Golpe Sagrado** | Ativa | 1 | 11.5 | 3.0s | Corte abençoado. Multiplicador Base: $1.5$ ($150\%$). Escala de $150\%$ (Nível 1) a $240\%$ (Nível 5) de Constituição. | Efeito físico de corte diagonal vermelho e tremor na câmera. |
| **Escudo da Justiça** | Ativa | 3 | 14.5 | 5.0s | Impacto punidor. Multiplicador Base: $1.2$ ($120\%$). Escala de $120\%$ (Nível 1) a $192\%$ (Nível 5). | Efeito físico de corte vermelho e tremor de câmera. |
| **Retribuição Aura** | Passiva | 5 | -- | -- | Aura protetora. Aumento passivo permanente de $+5$ em **Constituição** na árvore. | Atualização numérica estática nos atributos primários do personagem. |
| **Punição da Luz** | Ativa | 7 | 20.5 | 8.0s | Golpe sagrado pesado. Multiplicador Base: $2.5$ ($250\%$) misto. Escala de $250\%$ (Nível 1) a $400\%$ (Nível 5) da média de Força e Constituição. | Efeito físico de corte vermelho e tremor médio de tela. |
| **Dever Sagrado** | Passiva | 9 | -- | -- | Benção passiva. Aumento de $+3$ em **Força** e $+3$ em **Constituição** permanente. | Atualização numérica nos atributos na UI do React. |
| **Consagração** | Ativa | 11 | 26.5 | 12.0s | Santifica o chão. Multiplicador Base: $3.8$ ($380\%$). Escala de $380\%$ (Nível 1) a $608\%$ (Nível 5). | Efeito físico de corte vermelho e forte vibração na câmera. |

---

### ✝️ Clérigo (Cleric)
Mestre das curas e dos relâmpagos sagrados, escalando com **Magia** (`magic`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Golpe de Fé** | Ativa | 1 | 11.5 | 3.0s | Punição sagrada. Multiplicador Base: $1.5$ ($150\%$). Escala de $150\%$ (Nível 1) a $240\%$ (Nível 5) de Magia. | Dispara círculo mágico brilhante laranja (`0xf97316`) que voa até o monstro e explode. |
| **Bênção Divina** | Passiva | 3 | -- | -- | Foco divino. Aumento passivo permanente de $+5$ em **Magia** na árvore. | Atualização numérica estática nos atributos do personagem. |
| **Escudo Sagrado** | Passiva | 5 | -- | -- | Aura defensiva. Aumento passivo permanente of $+5$ em **Constituição** na árvore. | Atualização numérica nos atributos na UI do React. |
| **Ira do Céu** | Ativa | 7 | 20.5 | 8.0s | Raio divino purificador. Multiplicador Base: $3.0$ ($300\%$). Escala de $300\%$ (Nível 1) a $480\%$ (Nível 5). | Dispara círculo mágico brilhante laranja que explode no monstro. |
| **Crescimento Espiritual**| Passiva| 9 | -- | -- | Iluminação. Aumento passivo permanente de $+3$ em **Magia** e $+3$ em **Constituição**. | Atualização nos atributos do herói. |
| **Julgamento Final** | Ativa | 11 | 26.5 | 12.0s | Julgamento dos céus. Multiplicador Base: $4.5$ ($450\%$). Escala de $450\%$ (Nível 1) a $720\%$ (Nível 5). | Dispara grande círculo de fogo com explosão de $1.6x$ de tamanho e forte tremor. |

---

### 🗡️ Ladrão (Rogue)
Combate ágil baseado em furtividade e venenos, escalando com **Destreza** (`dexterity`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Apunhalar** | Ativa | 1 | 11.5 | 3.0s | Golpe veloz de adagas. Multiplicador Base: $1.8$ ($180\%$). Escala de $180\%$ (Nível 1) a $288\%$ (Nível 5) de Destreza. | Corte diagonal físico vermelho (`0xf43f5e`) e vibração na tela. |
| **Adaga de Veneno** | Ativa | 3 | 14.5 | 5.0s | Lança adaga venenosa. Multiplicador Base: $1.2$ ($120\%$). Escala de $120\%$ (Nível 1) a $192\%$ (Nível 5). | Corte diagonal físico vermelho sobre o inimigo. |
| **Manto de Sombras** | Passiva | 5 | -- | -- | Furtividade permanente. Aumento passivo de $+5$ em **Destreza** na árvore. | Atualização estática na UI nos atributos de Destreza. |
| **Ataque Furtivo** | Ativa | 7 | 20.5 | 8.0s | Golpe pelas costas. Multiplicador Base: $3.2$ ($320\%$). Escala de $320\%$ (Nível 1) a $512\%$ (Nível 5). | Corte diagonal vermelho com vibração média. |
| **Passo Sombrio** | Passiva | 9 | -- | -- | Velocidade rápida. Aumento passivo permanente de $+3$ em **Destreza** e $+3$ em **Força**. | Atualização estática nos atributos na tela de jogo. |
| **Florescer Letal** | Ativa | 11 | 26.5 | 12.0s | Redemoinho de adagas. Multiplicador Base: $4.5$ ($450\%$). Escala de $450\%$ (Nível 1) a $720\%$ (Nível 5). | Vários cortes diagnonais vermelhos rápidos com forte tremor. |

---

## 3. Habilidade Comum (Disponível para todas as classes)

Esta habilidade fica desbloqueada para todas as classes desde o nível 1 e serve para garantir a sustentabilidade do personagem em fases difíceis.

### 💚 Cura (`heal`)
* **Tipo:** Habilidade Ativa
* **Nível Requerido:** 1
* **Custo de Mana:** 12 Mana
* **Tempo de Recarga:** 10.0s (10 segundos)
* **Cálculo Matemático:**
  $$\text{Valor da Cura} = \lfloor \text{Magia} \times 3 + (12 \times \text{Nível da Habilidade}) \rfloor$$
  *Onde $\text{Magia}$ é o valor de Magic atual e $\text{Nível da Habilidade}$ é o nível do upgrade de Cura na árvore.*
* **Funcionamento de Inteligência Artificial (Auto-Cast):**
  * Se a Conjuração Automática estiver habilitada (vencer a Fase 5) e a vida do personagem cair abaixo de **50% de HP máximo**, o sistema de combate do jogo prioriza o uso de **Cura** antes de conjurar qualquer outra habilidade de ataque, desde que tenha mana suficiente e a habilidade não esteja em recarga.
* **Efeito Visual no Phaser:**
  * Executa o método `animateHealEffect()`.
  * Um círculo verde-esmeralda brilhante (`0x10b981` com contorno de `0x34d399`) é desenhado nos pés do jogador.
  * O círculo sobe verticalmente em direção ao peito do herói e se expande até $1.3x$ do tamanho original, sumindo gradativamente (`alpha` vai de $1.0$ para $0.0$) em um período de **500 ms**.
  * O texto verde em formato flutuante `+<quantidade>` sobe e desaparece no ar sobre o herói.

---

## 4. Dificuldade das Fases e Escalonamento dos Inimigos

O jogo possui uma curva de dificuldade que cresce de forma exponencial a cada fase para incentivar a realização de Ascensões. O fluxo de monstros e seu escalonamento funcionam da seguinte forma:

### A. Fluxo de Combate
* **Progresso da Fase:** Para avançar de fase, o jogador deve derrotar **15 monstros normais** (`ENEMIES_PER_STAGE = 15`) seguidos pelo **Chefe da Fase**.
* **Nível dos Inimigos:** O nível dos monstros em combate é igual à Fase Atual (`stage`).

### B. Fórmulas de Escalonamento de Atributos dos Monstros
* **Escala de Dificuldade Exponencial (HP):**
  $$\text{Fator de Dificuldade (HP)} = 1.65^{\text{Fase} - 1}$$
* **Escala de Dificuldade Exponencial (Dano):**
  $$\text{Fator de Dificuldade (Dano)} = 1.30^{\text{Fase} - 1}$$
* **Modo Pesadelo:** A partir da **Fase 6**, os monstros entram no modo pesadelo e ganham um multiplicador adicional de atributos:
  $$\text{Fator Pesadelo} = \begin{cases} 2.5 & \text{se Fase} \ge 6 \\ 1.0 & \text{se Fase} < 6 \end{cases}$$

* **Vida Máxima do Inimigo Normal:**
  $$\text{HP Máximo Normal} = \lfloor (120 + (\text{Fase} \times 35)) \times \text{Fator de Dificuldade (HP)} \times \text{Multiplicador HP do Monstro} \times \text{Fator Pesadelo} \rfloor$$
* **Vida Máxima do Chefe:**
  $$\text{HP Máximo Chefe} = \lfloor (120 + (\text{Fase} \times 35)) \times \text{Fator de Dificuldade (HP)} \times \text{Multiplicador HP do Chefe} \times 3.0 \times \text{Fator Pesadelo} \rfloor$$
* **Dano dos Inimigos:**
  $$\text{Dano do Inimigo} = \lfloor (5 + \text{Fase} \times 2.0 + \text{Random}(0, 1)) \times \text{Fator de Dificuldade (Dano)} \times \text{Multiplicador Dano do Monstro} \times \text{Fator Pesadelo} \rfloor$$

---

## 5. Mecânica de Ascensão e Prestígio (Roguelite)

Quando o progresso fica lento devido ao escalonamento de dificuldade dos monstros, o jogador pode realizar a **Ascensão** no painel correspondente para obter bônus permanentes.

### A. Condições e Regras
* **Requisito Mínimo:** Ter XP acumulada suficiente para obter pelo menos **1 Ponto de Prestígio (PP)**. Isso requer atingir pelo menos o **Nível 5** (com 0 XP).
* **O que é Resetado:**
  * O nível atual do personagem volta para 1.
  * O progresso do combate volta para a Fase 1.
  * Os Pontos de Atributos normais distribuídos pelo jogador são removidos.
  * O HP e a Mana são reiniciados para os valores base de Nível 1.
* **O que é Mantido (Permanente):**
  * Habilidades desbloqueadas (com seus respectivos níveis e níveis de upgrade).
  * A classe escolhida e sua maestria de nível.
  * Todas as melhorias permanentes de atributos compradas com Pontos de Prestígio (PP).

### B. Fórmulas de Recompensa
* **Cálculo da XP Total Acumulada:**
  $$\text{XP Total} = 50 \times \text{Nível} \times (\text{Nível} - 1) + \text{XP Atual}$$
  *(Esta fórmula soma com precisão toda a XP necessária para subir até o nível atual mais a XP restante na barra).*
* **Ganho de Pontos de Prestígio (PP):**
  $$\text{PP Obtidos} = \lfloor \left( \frac{\text{XP Total}}{1000} \right)^{0.85} \rfloor$$

### C. Melhorias Permanentes de Ascensão
Com os Pontos de Prestígio (PP) obtidos, o jogador pode comprar bônus permanentes na árvore de prestígio:
* **Fortalecimento Permanente:** Cada upgrade concede bônus permanentes diretamente nos atributos primários (**Força**, **Magia**, **Destreza** ou **Constituição**), acelerando drasticamente o início e o ritmo de progressão nas próximas rodadas.
