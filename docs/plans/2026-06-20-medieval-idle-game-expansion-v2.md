# Plano de Implementação - RPG Idle Roguelite Medieval V2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expandir o RPG medieval com tela inicial, novas classes (Mago, Arqueiro, Paladino, Clérigo, Ladrão) com dano escalando com atributos específicos, catálogo completo de 6 habilidades por classe destravadas por nível, sistema de fases com 10 inimigos e boss, tela de enciclopédia informativa e layout gráfico aprimorado de árvore para habilidades e prestígio.

**Architecture:** A store do Zustand será expandida para suportar classes jogáveis, estados de menu e progresso de fases (10 inimigos + boss). A HUD do React terá uma nova aba de Enciclopédia, uma tela de menu principal e seleção de personagem sobreposta, além de renderizar a árvore de habilidades e prestígio de forma gráfica com conectores SVG. A FSM do combate no Phaser carregará texturas específicas por classe e ajustará o comportamento dos inimigos por fase.

**Tech Stack:** React 18, Zustand, Phaser 3, TypeScript, Tailwind CSS.

---

### Task 1: Definição de Tipos e Expansão do Zustand Store
**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/store/useGameStore.ts`

**Step 1: Atualizar tipos em `src/core/types.ts`**
Adicionar suporte para as novas classes, progresso de fases e persistência de níveis de classe na interface `Character`.

```typescript
export interface BaseStats {
  strength: number;
  magic: number;
  dexterity: number;
  constitution: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  dependencies: string[];
  type: 'active' | 'passive';
  statBonuses?: Partial<BaseStats>;
  requiredLevel: number; // Nível necessário para liberar
  classId: string; // 'warrior' | 'mage' | 'ranger' | 'paladin' | 'cleric' | 'rogue' | 'common'
}

export interface Character {
  id: string;
  classId: string;
  level: number;
  xp: number;
  baseStats: BaseStats;
  growthRates: BaseStats;
  unlockedSkills: string[];
  skillLevels: Record<string, number>;
  prestigePoints: number;
  prestigeUpgrades: Record<string, number>;
  attributePoints: number;
  skillPoints: number;
  highestStageReached: number;
  currentStage: number; // Fase ativa do combate
  enemiesDefeatedInStage: number; // Progresso na fase atual (0 a 10)
  classLevels: Record<string, number>; // Maior nível alcançado por classe para desbloqueios persistentes
}
```

**Step 2: Atualizar a Store em `src/store/useGameStore.ts`**
Adicionar o catálogo expandido de habilidades de todas as classes com restrição de nível, o estado de telas e a lógica de seleção de classes.

*   Adicionar estado `screen: 'menu' | 'character_select' | 'playing' | 'options'` e ações correspondentes.
*   Atualizar o `SKILLS_CATALOG` para incluir no mínimo 6 habilidades por classe (sem contar `heal` que é comum).
*   Salvar o estado no `localStorage` automaticamente para suportar o botão "Continuar".

---

### Task 2: Geração de Sprites de Imagem para as Novas Classes
**Files:**
- Create: `public/assets/mage_sprite.png`
- Create: `public/assets/ranger_sprite.png`
- Create: `public/assets/paladin_sprite.png`
- Create: `public/assets/cleric_sprite.png`
- Create: `public/assets/rogue_sprite.png`

**Step 1: Gerar os sprites usando a ferramenta de IA**
Criar imagens em pixel art medieval correspondentes a cada uma das classes com fundo sólido ou transparente.

---

### Task 3: Menu Inicial e Tela de Seleção de Classe no React
**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/GameUI.tsx`

**Step 1: Criar o Menu Principal**
Adicionar uma sobreposição no React cobrindo a tela quando `screen === 'menu'`. Incluir botões:
*   **Novo Jogo**: Direciona para a Seleção de Classe.
*   **Continuar**: Carrega o jogo salvo em `localStorage` (desabilitado se não houver dados).
*   **Opções**: Exibe ajustes gerais.

**Step 2: Tela de Seleção de Classe**
Exibir cards dos personagens:
*   **Warrior**, **Mage**, **Ranger**: Disponíveis inicialmente.
*   **Paladin** (Requer Warrior Nvl 10), **Cleric** (Requer Mage Nvl 10), **Rogue** (Requer Ranger Nvl 10). Exibir indicador visual de cadeado e progresso de nível da classe pai.

---

### Task 4: Atualização da Lógica de Combate e Sistema de Fases
**Files:**
- Modify: `src/core/CombatFSM.ts`
- Modify: `src/phaser/scenes/CombatScene.ts`

**Step 1: Escalonamento de Dano por Classe**
Na FSM, fazer o dano do herói escalar baseado no atributo principal da classe ativa:
*   Warrior: `strength`
*   Mage, Cleric: `magic`
*   Ranger, Rogue: `dexterity`
*   Paladin: `constitution`

**Step 2: Lógica de Progresso da Fase**
*   Substituir a evolução contínua por um contador de 10 inimigos normais (nível = `currentStage`).
*   O 11º inimigo é o Boss da Fase (nível = `currentStage`, multiplicadores: 3x HP, 1.5x Dano, textura `enemy_necromancer` ou outra temática).
*   Ao derrotar o Boss: Incrementa a fase `currentStage` na store.
*   Ao morrer: Reseta a contagem de derrotados na fase atual para 0 (o jogador tenta a mesma fase novamente).

**Step 3: Carregamento de Texturas Dinâmicas no Phaser**
No `CombatScene.ts`, fazer o jogador carregar o sprite da classe ativa do personagem.

---

### Task 5: Árvores Gráficas de Habilidades e Prestígio com Conectores SVG
**Files:**
- Modify: `src/components/GameUI.tsx`

**Step 1: Estruturar as Habilidades em Linhas/Nível**
Agrupar habilidades no painel em linhas baseadas no `requiredLevel` (Nvl 1, 3, 5, 7, 9, 11).

**Step 2: Conectores SVG dinâmicos**
Adicionar um contêiner SVG absoluto por trás da árvore de habilidades para desenhar linhas conectando os botões de habilidades consecutivas, simulando caminhos de evolução reais. Aplicar o mesmo design premium para a árvore de Prestígio partindo de um nó central.

---

### Task 6: Guia Informativo e Enciclopédia do Jogo
**Files:**
- Modify: `src/components/GameUI.tsx`

**Step 1: Criar aba de Guia / Info**
Adicionar a aba "Guia" na barra de abas superior.

**Step 2: Conteúdo da Enciclopédia**
*   **Atributos**: Explicar detalhadamente o efeito de Força, Magia, Destreza e Constituição.
*   **Classes**: Descrição temática e indicação de atributo principal de cada uma das 6 classes.
*   **Habilidades**: Listagem e descrição dos efeitos das 6 habilidades de cada classe de forma legível.
