# Expansão RPG e Ajustes de Combate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expandir o jogo para 10 fases com cenários temáticos e modo pesadelo, aprofundar o guia matemático de atributos e habilidades, adicionar barras de vida flutuantes para inimigos, implementar cooldowns nas habilidades e um sistema de auto-cast de habilidades após a Fase 5.

**Architecture:** 
1. **Fases & Assets**: Adicionar 4 novos sprites de cenário (`desert`, `snow`, `cemetery`, `ruins`) e no Phaser mapear as 10 fases (1 a 5 normais, 6 a 10 pesadelos com tonalidade escura/maligna).
2. **Barra de Vida Flutuante**: No Phaser, usar um objeto `Graphics` para desenhar barras de progresso (vida) sobre a cabeça dos inimigos atualizadas no frame loop.
3. **Cooldowns & Auto-Cast**: Gerenciar tempos de recarga no `CombatFSM.ts` com base em milissegundos e comunicar o estado ao React via `bridge`. Adicionar lógica de disparo automático prioritário para as habilidades disponíveis se o auto-cast estiver ativado e a fase for maior que 5.

**Tech Stack:** React, Zustand, TypeScript, Phaser 3, SVG, GameBridge

---

### Task 1: Criação de Assets Temáticos de Fundo
**Files:**
- Create: `public/assets/desert_background.png`
- Create: `public/assets/snow_background.png`
- Create: `public/assets/cemetery_background.png`
- Create: `public/assets/ruins_background.png`

**Passo 1:** Gerar imagem do Deserto usando a ferramenta de IA.
Prompt: "A beautiful desert scene with golden sand dunes, cactus, ancient ruins in the distance, blue sky, and a flat horizontal ground base at the bottom for characters to stand on. 8-bit retro pixel art style, matching side-scroller game backgrounds."
Save as: `desert_background`

**Passo 2:** Gerar imagem da Neve.
Prompt: "A snowy landscape with white snow, pine trees covered in snow, high icy mountains in the background, pixel art, side-scroller game background with a flat horizontal snow base at the bottom for characters to stand on."
Save as: `snow_background`

**Passo 3:** Gerar imagem do Cemitério.
Prompt: "A dark gothic cemetery scene at night, spooky graves, tombstones, crooked bare trees, glowing mist, pixel art, side-scroller game background with flat horizontal dark soil base at the bottom."
Save as: `cemetery_background`

**Passo 4:** Gerar imagem das Ruínas.
Prompt: "Ancient stone castle ruins background, cracked stone columns, overgrown vines, stone brick ground, pixel art, side-scroller game background with a flat horizontal stone ground base."
Save as: `ruins_background`

---

### Task 2: Modificações nos Tipos e Ponte de Eventos (Bridge)
**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/store/useGameStore.ts`

**Passo 1:** Adicionar suporte na store para o status do auto-cast e limites de fase até 10.
* No `types.ts`, adicionar evento `TOGGLE_AUTOCAST` e `COOLDOWNS_CHANGED` ao `GameEvent`.
* No `useGameStore.ts`, atualizar as definições de avanço de estágio para limitar em 10 fases (com reset apropriado ou vitória final).

---

### Task 3: Atualização do CombatFSM e Enforcamento de Cooldowns / Auto-Cast
**Files:**
- Modify: `src/core/CombatFSM.ts`

**Passo 1:** Implementar cooldowns das habilidades:
* `heal`: 10000ms
* Habilidade Requerida Nível 1: 3000ms
* Habilidade Requerida Nível 3: 5000ms
* Habilidade Requerida Nível 7: 8000ms
* Habilidade Requerida Nível 11: 12000ms
* Passivas: Sem Cooldown.

**Passo 2:** Atualizar a FSM de combate para:
* Rejeitar ativações de habilidades que estejam em recarga.
* Adicionar decremento no loop `update(delta)`.
* Enviar as recargas ativas para o React via `bridge.emit(GameEvent.COOLDOWNS_CHANGED, cooldowns)`.
* Escutar evento `TOGGLE_AUTOCAST` e, se ativo, executar habilidades sequencialmente (ordem de prioridade decrescente de Tier) quando o cooldown zerar e houver mana.

---

### Task 4: Atualização da Cena do Phaser com Novas Fases e Barra de Vida do Inimigo
**Files:**
- Modify: `src/phaser/scenes/CombatScene.ts`

**Passo 1:** Precarregar os 4 novos backgrounds: `desert_background`, `snow_background`, `cemetery_background`, `ruins_background`.
**Passo 2:** Ajustar o background com base no estágio atual (`currentStage`):
* Estágio 1/6: Floresta (`background`)
* Estágio 2/7: Deserto (`desert_background`)
* Estágio 3/8: Neve (`snow_background`)
* Estágio 4/9: Cemitério (`cemetery_background`)
* Estágio 5/10: Ruínas (`ruins_background`)
* Se estágio >= 6 (Modo Pesadelo), aplicar `setTint(0x663333)` ou similar (tonalidade maligna avermelhada) e aumentar os status de dano/vida dos monstros em +150%.
**Passo 3:** Criar e gerenciar um `Phaser.GameObjects.Graphics` para renderizar a barra de vida do inimigo acima de sua cabeça (`this.enemyBody.y - 60`), atualizando sua largura de acordo com `this.fsm.enemyHP / this.fsm.enemyMaxHP`.

---

### Task 5: Enriquecimento do Guia Matemático e Interface de Cooldowns/Auto-Cast no React
**Files:**
- Modify: `src/components/GameUI.tsx`

**Passo 1:** Atualizar a aba **Guia** (`GuidePanel`) para incluir a seção matemática detalhada:
* **Fórmula de Dano Básico**: `Dano = Atributo Principal * 1.5 + Random(0-2)`
* **Fórmula de Habilidade Ativa**: `Dano = Atributo Principal * (1.0 + Nível Requerido * 0.25 + Nível da Skill * 0.15) + Random(0-4)`
* **Fórmula de Cura**: `Cura = Magia * 3 + 12 * Nível da Skill`
* **Efeito de Atributos**:
  * **Força (Strength)**: +1.5 de dano de ataque básico/habilidades para Guerreiro.
  * **Magia (Magic)**: +1.5 de dano básico/habilidades para Mago e Clérigo, +10 de Mana Máxima e +0.05/s de Regeneração de Mana.
  * **Destreza (Dexterity)**: +1.5 de dano básico/habilidades para Arqueiro e Ladrão.
  * **Constituição (Constitution)**: +1.5 de dano básico/habilidades para Paladino, +12 de Vida Máxima e +0.05/s de Regeneração de HP.
* **Cálculo de Pontos de Prestígio (Ascensão)**: Ganha `Math.floor(Level * 1.5)` (mínimo 1) ao ascender.

**Passo 2:** Atualizar o painel de **Combate** (`ActiveSkillsPanel`) para:
* Escutar alterações de cooldowns via bridge e desabilitar botões com uma máscara visual cinza escuro/timer.
* Mostrar uma caixa de seleção (checkbox) ou botão alternador de **"Auto Habilidades"** se o estágio atual for maior que 5.
