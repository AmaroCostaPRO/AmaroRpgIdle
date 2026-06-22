# Guia de Habilidades das Classes - Amaro RPG Idle

Este documento detalha o funcionamento mecânico, matemático e visual de todas as habilidades disponíveis no jogo para cada uma das classes de personagens, além da habilidade comum de cura.

---

## 1. Regras de Escalonamento e Fórmulas Gerais

Todas as habilidades de dano ativas seguem uma fórmula matemática padrão para calcular o dano final causado aos inimigos. A cura possui uma fórmula própria.

### A. Atributo de Escala de Dano por Classe
O atributo principal utilizado para calcular o dano base é determinado pela **Classe Ativa** do personagem no momento do combate:
* **Mago (`Mage`) e Clérigo (`Cleric`):** Escala com **Magia** (`magic`).
* **Arqueiro (`Ranger`) e Ladrão (`Rogue`):** Escala com **Destreza** (`dexterity`).
* **Paladino (`Paladin`):** Escala com **Constituição** (`constitution`).
* **Guerreiro (`Warrior`) e outras:** Escala com **Força** (`strength`).

### B. Fórmula Geral de Dano (Habilidades Ativas)
$$\text{Multiplicador de Dano} = 1.0 + (\text{Nível Requerido} \times 0.25) + (\text{Nível da Habilidade} \times 0.15)$$
$$\text{Dano Final} = \lfloor \text{Atributo de Escala} \times \text{Multiplicador de Dano} + \text{Random}(0, 4) \rfloor$$

*Onde $\text{Nível Requerido}$ é o nível do personagem necessário para desbloquear a habilidade (Tier) e $\text{Nível da Habilidade}$ é o nível atual da habilidade (de 1 a 5).*

### C. Fórmulas de Custos de Mana e Recarga (Cooldown)
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
| **Slash** | Ativa | 1 | 8 | 3.0s | Corte rápido. Dano escala com o multiplicador de $1.4$ a $2.0$ com base no nível da habilidade. | Efeito físico de corte vermelho (`0xf43f5e`) diagonal sobre o inimigo e vibração na câmera. |
| **Shield Bash** | Ativa | 3 | 14.5 | 5.0s | Golpe de escudo. Dano escala com multiplicador de $2.2$ a $2.8$ com base no nível da habilidade. | Efeito físico de corte vermelho sobre o inimigo com vibração média na câmera. |
| **Berserk** | Passiva | 5 | -- | -- | Aumento passivo e permanente de $+5$ em **Força** na árvore de habilidades. | Apenas atualização numérica estática nos atributos primários na UI do React. |
| **Execute** | Ativa | 7 | 20.5 | 8.0s | Golpe finalizador. Dano escala com multiplicador de $2.9$ a $3.5$ com base no nível da habilidade. | Efeito físico de corte vermelho sobre o inimigo com forte vibração na câmera. |
| **Battle Cry** | Passiva | 9 | -- | -- | Grito de guerra protetor. Aumento passivo de $+5$ em **Constituição** na árvore. | Apenas atualização numérica estática nos atributos primários na UI do React. |
| **Bladestorm** | Ativa | 11 | 26.5 | 12.0s | Tempestade de aço. Dano escala com multiplicador de $3.9$ a $4.5$ com base no nível da habilidade. | Efeito físico de corte vermelho rápido com forte vibração na câmera. |

---

### 🔮 Mago (Mage)
Conjura feitiços elementais massivos à distância, escalando com **Magia** (`magic`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fireball** | Ativa | 1 | 15 | 3.0s | Esfera de fogo explosiva. Dano escala com o multiplicador de $1.4$ a $2.0$ com base no nível da habilidade. | Círculo laranja (`0xf97316`) voando até o inimigo, gerando uma explosão amarela e leve tremor de tela. |
| **Frostbolt** | Ativa | 3 | 14.5 | 5.0s | Raio gélido desacelerador. Dano escala com multiplicador de $2.2$ a $2.8$ com base no nível da habilidade. | Projétil mágico disparado em direção ao inimigo gerando explosão de impacto. |
| **Mana Shield** | Passiva | 5 | -- | -- | Escudo protetor. Aumento passivo permanente de $+5$ em **Magia** na árvore. | Atualização numérica estática nos atributos primários do personagem. |
| **Lightning** | Ativa | 7 | 20.5 | 8.0s | Descarga elétrica destrutiva. Dano escala com multiplicador de $2.9$ a $3.5$ com base no nível. | Projétil mágico disparado em direção ao inimigo gerando explosão de impacto. |
| **Arcane Intellect** | Passiva | 9 | -- | -- | Expansão arcana mental. Aumento passivo permanente de $+5$ em **Magia** na árvore. | Atualização numérica estática nos atributos primários do personagem. |
| **Meteor** | Ativa | 11 | 26.5 | 12.0s | Cataclismo de fogo cadente. Dano escala com multiplicador de $3.9$ a $4.5$ com base no nível. | Grande projétil de fogo voando e colidindo com explosão e tremor de câmera. |

---

### 🏹 Arqueiro (Ranger)
Ataques rápidos à distância e venenos letais, escalando com **Destreza** (`dexterity`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Disparo Preciso** | Ativa | 1 | 11.5 | 3.0s | Disparo rápido. Dano escala com multiplicador de $1.4$ a $2.0$ com base no nível da habilidade. | Efeito físico de corte vermelho sobre o corpo do monstro indicando o impacto do projétil. |
| **Flecha Venenosa** | Ativa | 3 | 14.5 | 5.0s | Flecha tóxica. Dano de impacto escala com multiplicador de $2.2$ a $2.8$ com base no nível. | Efeito físico de corte vermelho sobre o corpo do monstro. |
| **Olho de Águia** | Passiva | 5 | -- | -- | Concentração. Aumento passivo permanente de $+5$ em **Destreza** na árvore. | Atualização numérica estática nos atributos primários. |
| **Disparo Duplo** | Ativa | 7 | 20.5 | 8.0s | Duas flechas simultâneas. Dano escala com multiplicador de $2.9$ a $3.5$ com base no nível. | Efeito físico de corte vermelho sobre o inimigo com vibração média. |
| **Passo Ligeiro** | Passiva | 9 | -- | -- | Agilidade felina. Aumento passivo permanente de $+3$ em **Destreza** e $+2$ em **Constituição**. | Atualização numérica estática nos atributos primários. |
| **Chuva de Flechas** | Ativa | 11 | 26.5 | 12.0s | Saraivada de flechas em área. Dano escala com multiplicador de $3.9$ a $4.5$ com base no nível. | Efeito físico de corte vermelho veloz sobre o inimigo e forte tremor. |

---

### 🛡️ Paladino (Paladin)
Defensor sagrado com alta defesa e retaliação divina, escalando com **Constituição** (`constitution`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Golpe Sagrado** | Ativa | 1 | 11.5 | 3.0s | Corte abençoado. Dano escala com multiplicador de $1.4$ a $2.0$ baseado na Constituição. | Efeito físico de corte diagonal vermelho e tremor na câmera. |
| **Escudo da Justiça** | Ativa | 3 | 14.5 | 5.0s | Impacto punidor. Dano escala com multiplicador de $2.2$ a $2.8$ baseado na Constituição. | Efeito físico de corte vermelho e tremor de câmera. |
| **Retribuição Aura** | Passiva | 5 | -- | -- | Aura protetora. Aumento passivo permanente de $+5$ em **Constituição** na árvore. | Atualização numérica estática nos atributos primários do personagem. |
| **Punição da Luz** | Ativa | 7 | 20.5 | 8.0s | Golpe sagrado pesado. Dano escala com multiplicador de $2.9$ a $3.5$ baseado na Constituição. | Efeito físico de corte vermelho e tremor médio de tela. |
| **Dever Sagrado** | Passiva | 9 | -- | -- | Benção passiva. Aumento de $+3$ em **Força** e $+3$ em **Constituição** permanente. | Atualização numérica nos atributos na UI do React. |
| **Consagração** | Ativa | 11 | 26.5 | 12.0s | Santifica o chão. Dano escala com multiplicador de $3.9$ a $4.5$ baseado na Constituição. | Efeito físico de corte vermelho e forte vibração na câmera. |

---

### ✝️ Clérigo (Cleric)
Mestre das curas e dos relâmpagos sagrados, escalando com **Magia** (`magic`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Golpe de Fé** | Ativa | 1 | 11.5 | 3.0s | Punição sagrada. Dano escala com multiplicador de $1.4$ a $2.0$ baseado na Magia. | Dispara círculo mágico brilhante laranja (`0xf97316`) que voa até o monstro e explode. |
| **Bênção Divina** | Passiva | 3 | -- | -- | Foco divino. Aumento passivo permanente de $+5$ em **Magia** na árvore. | Atualização numérica estática nos atributos do personagem. |
| **Escudo Sagrado** | Passiva | 5 | -- | -- | Aura defensiva. Aumento passivo permanente de $+5$ em **Constituição** na árvore. | Atualização numérica nos atributos na UI do React. |
| **Ira do Céu** | Ativa | 7 | 20.5 | 8.0s | Raio divino purificador. Dano escala com multiplicador de $2.9$ a $3.5$ baseado na Magia. | Dispara círculo mágico brilhante laranja que explode no monstro. |
| **Crescimento Espiritual**| Passiva| 9 | -- | -- | Iluminação. Aumento passivo permanente de $+3$ em **Magia** e $+3$ em **Constituição**. | Atualização nos atributos do herói. |
| **Julgamento Final** | Ativa | 11 | 26.5 | 12.0s | Julgamento dos céus. Dano escala com multiplicador de $3.9$ a $4.5$ baseado na Magia. | Dispara grande círculo de fogo com explosão de $1.6x$ de tamanho e forte tremor. |

---

### 🗡️ Ladrão (Rogue)
Combate ágil baseado em furtividade e venenos, escalando com **Destreza** (`dexterity`).

| Habilidade | Tipo | Req. Level | Custo Mana | Cooldown | Descrição Técnica & Cálculo | Efeito Visual no Phaser |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Apunhalar** | Ativa | 1 | 11.5 | 3.0s | Golpe veloz de adagas. Dano escala com multiplicador de $1.4$ a $2.0$ baseado na Destreza. | Corte diagonal físico vermelho (`0xf43f5e`) e vibração na tela. |
| **Adaga de Veneno** | Ativa | 3 | 14.5 | 5.0s | Lança adaga venenosa. Dano de impacto escala com multiplicador de $2.2$ a $2.8$ baseado na Destreza. | Corte diagonal físico vermelho sobre o inimigo. |
| **Manto de Sombras** | Passiva | 5 | -- | -- | Furtividade permanente. Aumento passivo de $+5$ em **Destreza** na árvore. | Atualização estática na UI nos atributos de Destreza. |
| **Ataque Furtivo** | Ativa | 7 | 20.5 | 8.0s | Golpe pelas costas. Dano escala com multiplicador de $2.9$ a $3.5$ baseado na Destreza. | Corte diagonal vermelho com vibração média. |
| **Passo Sombrio** | Passiva | 9 | -- | -- | Velocidade rápida. Aumento passivo permanente de $+3$ em **Destreza** e $+3$ em **Força**. | Atualização estática nos atributos na tela de jogo. |
| **Florescer Letal** | Ativa | 11 | 26.5 | 12.0s | Redemoinho de adagas. Dano escala com multiplicador de $3.9$ a $4.5$ baseado na Destreza. | Vários cortes diagnonais vermelhos rápidos com forte tremor. |

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
  * Se a Conjuração Automática estiver habilitada e liberada (vencer a Fase 5), e a vida do personagem cair abaixo de **50% de HP máximo**, o sistema de combate do jogo prioriza o uso de **Cura** antes de conjurar qualquer outra habilidade de ataque, desde que tenha mana suficiente e a habilidade não esteja em recarga.
* **Efeito Visual no Phaser:**
  * Executa o método `animateHealEffect()`.
  * Um círculo verde-esmeralda brilhante (`0x10b981` com contorno de `0x34d399`) é desenhado nos pés do jogador.
  * O círculo sobe verticalmente em direção ao peito do herói e se expande até $1.3x$ do tamanho original, sumindo gradativamente (`alpha` vai de $1.0$ para $0.0$) em um período de **500 ms**.
  * O texto verde em formato flutuante `+<quantidade>` sobe e desaparece no ar sobre o herói.
