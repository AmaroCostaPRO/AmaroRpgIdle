# Plano de Implementação - RPG Idle Roguelite Medieval 2D

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expandir o jogo idle 2D roguelite com movimentação sidescrolling de cenário infinito, sistema de Prestígio (roguelite reset), árvore de passivas permanentes e árvore de habilidades ativas e passivas.

**Architecture:** A movimentação será feita através de um fundo infinito com rolagem (`tilePositionX`) no Phaser que para quando um inimigo se aproxima. A store de Zustand será expandida para conter estados de prestígio, progresso de habilidades e árvores de upgrades. Criaremos uma navegação por abas na HUD React para as diferentes telas.

**Tech Stack:** React, Zustand, Phaser 3, TypeScript.

---

### Task 1: Definição de Tipos e Expansão da Store de Estado

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/store/useGameStore.ts`

**Step 1: Atualizar tipos em `src/core/types.ts`**
Modificar o arquivo de tipos para incluir a estrutura das árvores de habilidades e passivas permanentes, além de atualizar o estado do personagem.

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
}

export interface PrestigeUpgradeNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  statBonus: Partial<BaseStats>;
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
  prestigeUpgrades: Record<string, number>; // upgradeId -> level
  attributePoints: number;
  skillPoints: number;
  highestStageReached: number;
}
```

**Step 2: Atualizar `src/store/useGameStore.ts`**
Implementar o método `performPrestige` e as funções de compra de habilidades e upgrades permanentes na store.

```typescript
// Adicionar ao estado e ações da Store:
performPrestige: () => void;
upgradePrestigeStat: (upgradeId: string) => void;
unlockOrUpgradeSkill: (skillId: string) => void;

// Lógica de performPrestige na store:
performPrestige: () => set((state) => {
  // Ganha pontos de prestígio baseados no nível alcançado
  const pointsEarned = Math.floor(state.character.level * 1.5);
  return {
    character: {
      ...state.character,
      level: 1,
      xp: 0,
      attributePoints: 0,
      skillPoints: 0,
      unlockedSkills: ['slash'], // skill inicial
      skillLevels: { slash: 1 },
      prestigePoints: state.character.prestigePoints + pointsEarned,
      baseStats: {
        strength: 10,
        magic: 5,
        dexterity: 8,
        constitution: 12
      }
    }
  };
})
```

**Step 3: Compilar para validar tipos**
Rodar: `npx tsc --noEmit`
Esperado: Compilação concluída sem erros.

---

### Task 2: Interface de Navegação por Abas e HUD Expandida

**Files:**
- Modify: `src/components/GameUI.tsx`

**Step 1: Adicionar estado de aba ativa**
Criar abas para dividir a HUD em: `Combate`, `Atributos`, `Habilidades` e `Ascensão (Prestige)`.

**Step 2: Estilizar barra de abas**
Adicionar botões na parte superior da HUD para navegar entre as telas com cores HSL contrastantes e bordas neon.

**Step 3: Componentizar renderização condicional**
Mostrar apenas o painel correspondente à aba ativa selecionada.

---

### Task 3: Árvore de Habilidades (Skills)

**Files:**
- Modify: `src/components/GameUI.tsx`

**Step 1: Criar catálogo de habilidades**
Definir a lista de habilidades ativas (`slash`, `fireball`, `heal`) e passivas (`regen`, `haste`) com dependências de nível e custo de pontos de habilidade.

**Step 2: Componentizar a interface da árvore de habilidades**
Renderizar conexões de linha entre habilidades dependentes e botões de upgrade tátil que mostram o nível atual (ex: `Slash (Lvl 2/5)`).

---

### Task 4: Árvore de Passivas de Prestígio (Roguelite Upgrades)

**Files:**
- Modify: `src/components/GameUI.tsx`

**Step 1: Criar catálogo de upgrades de prestígio**
Definir upgrades permanentes (ex: `Dano Físico Permanente (+2 Strength por nível)`, `Velocidade Adicional (+1 Dexterity)`).

**Step 2: Implementar botão de Prestígio / Ascensão**
Exibir um card explicativo contendo o ganho previsto de pontos de prestígio se o usuário reiniciar a campanha naquele momento, e um botão "Ascender".

---

### Task 5: Cenário Sidescrolling e Sprites de Imagem no Phaser

**Files:**
- Modify: `src/phaser/scenes/CombatScene.ts`
- Modify: `src/core/CombatFSM.ts`

**Step 1: Carregar os novos assets de imagem medieval**
Carregar os arquivos de imagem gerados no método `preload` ou `create` do Phaser:
* Background de rolagem: `/assets/medieval_background.png`
* Sprite do herói: `/assets/hero_sprite.png`
* Sprite do inimigo: `/assets/enemy_sprite.png`

```typescript
// No método preload da CombatScene:
this.load.image('bg_medieval', '/assets/medieval_background.png');
this.load.image('hero', '/assets/hero_sprite.png');
this.load.image('enemy', '/assets/enemy_sprite.png');
```

**Step 2: Substituir os retângulos primitivos por Sprites reais**
* Substituir `this.playerBody = this.add.rectangle(...)` por um `Phaser.GameObjects.Sprite` usando a textura `'hero'`. Dimensionar proporcionalmente com `.setScale(...)` se necessário.
* Substituir `this.enemyBody = this.add.rectangle(...)` por um `Phaser.GameObjects.Sprite` usando a textura `'enemy'`.
* Substituir o grid de fundo por um `tileSprite` para o background infinito:
  ```typescript
  // Adicionar na criação da cena:
  this.background = this.add.tileSprite(400, 300, 800, 600, 'bg_medieval');
  ```

**Step 3: Implementar movimentação contínua de sidescrolling**
Na função `update` da cena Phaser:
* Se o estado de combate for `IDLE` ou `SEARCHING_ENEMY`: Rolar a `tilePositionX` do background (`this.background.tilePositionX += velocidade * delta`) para simular o herói caminhando/correndo.
* Se o inimigo surgir na tela e entrar na zona de combate: Reduzir suavemente a velocidade de rolagem até parar. Iniciar a FSM de ataque.
* Ao derrotar o inimigo: Esperar 1.5 segundos, voltar a mover o cenário com velocidade máxima e instanciar um novo inimigo que entra deslizando pela direita.

**Step 4: Testar e Validar**
Navegar localmente no browser e certificar-se de que os inimigos surgem vindo da direita, o cenário corre continuamente em paralaxe e as estatísticas de combate se comportam de forma robusta e otimizada com imagens reais.
