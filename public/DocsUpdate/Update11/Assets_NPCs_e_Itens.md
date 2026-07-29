# Anexo de Design v11.0.0 — Catálogo de Assets & Prompts: NPCs e Itens de História

## Amaro RPG Idle — Especificação de Arte para o Update v11 ("Ecos do Destino")

> **Padrão Técnico de Arte (Retratos de Diálogo & Ícones de Itens de História)**: Estes assets são exibidos em componentes **React/DOM** (`NpcDialogOverlay.tsx`, `ActCutsceneOverlay.tsx`, `QuestLogPanel.tsx`), não no Phaser — por isso **não** seguem a Seção 3.G do Manual Técnico (essa seção é escopada a sprites de combate de heróis/monstros, cujo fundo branco é removido em runtime por `CombatScene.ts`/`makeTextureTransparent`). Aqui a convenção é a mesma já usada pelas construções da Cidadela (`EvolutionSprite.tsx`/`IconSprite.tsx`): **1024×1024, Pixel Art HD 512-bit, fundo sólido liso `#FE0201` (vermelho puro, sem gradiente/blur nas bordas), sem brilho externo, SEM sombra** (não há "chão" nesses retratos/ícones). O fundo é removido no browser via chroma key por `getTransparentImageUrl` (`src/core/imageBackgroundStrip.ts`).
>
> Por que vermelho e não branco: os designs abaixo têm vários destaques/brilhos brancos legítimos (pergaminho brilhante, barba em brasa, luz da trombeta) que ficariam ambíguos com um fundo-chave branco. `#FE0201` é uma cor ausente de todos os designs, então a remoção de fundo nunca confunde arte com fundo.

---

# PARTE 1 — Sprites de NPCs (Personagens de História)

Exibidos como **retratos circulares pequenos** (42px em `NpcDialogOverlay.tsx`, 110px em `ActCutsceneOverlay.tsx`) — não como sprites de corpo inteiro. Compor cada arte como um **busto/meio corpo** (da cintura ou peito para cima, rosto ocupando a maior parte do quadro, ângulo frontal ou 3/4, expressão característica bem legível mesmo em miniatura), com o objeto de assinatura do personagem próximo ao peito/ombro — nunca uma pose de corpo inteiro (o rosto ficaria ilegível reduzido a 42-110px de diâmetro).

| Arquivo | Nome em Jogo | Facção / Papel | Especificação Técnica & Prompt de Geração |
| :--- | :--- | :--- | :--- |
| `npc_archivist_valeria.png` | Valéria, a Arquivista Astral | Cidadela Astral | **Prompt**: Ultra refined high-density 512-bit fine pixel art bust portrait (chest-up, 3/4 view) of Valéria, the Astral Archivist NPC. A beautiful wise female scholar with dark navy blue star-patterned robes with gold filigree, holding a floating glowing scroll with sharp magical runes near her chest, wearing delicate gold reading spectacles, warm intelligent face with clear features. Extreme micro-pixel texture, smooth fine dithering, razor-sharp black outlines. CRITICAL: Absolutely NO background scenery, NO background environment, NO room, NO books, NO shelves. The background behind the character is 100% completely flat solid uniform pure red `#FE0201` with zero patterns, zero gradients, zero shadows. |
| `npc_forge_master_vulkan.png` | Vulkan, o Mestre da Forja | Cidadela Astral | **Prompt**: Ultra refined high-density 512-bit fine micro-pixel art bust portrait (chest-up, 3/4 angle facing towards the left) of Vulkan, the Master Forge Dwarf NPC. A muscular dwarven smith facing towards the left side of the frame, with a glowing fiery ember beard, wearing a heavy leather apron with correctly oriented glowing ember runes, blacksmith warhammer resting on his shoulder. Extreme micro-pixel texture, smooth fine-line dithering, razor-sharp black outlines, ultra refined pixel art style. CRITICAL: Absolutely NO background scenery, NO background environment. Flat solid uniform pure red background `#FE0201` with zero patterns, zero gradients, zero shadows. |
| `npc_void_wanderer.png` | O Andarilho do Vazio | Neutro / Mercador | **Prompt**: Hyper-detailed fine-line 512-bit pixel art bust portrait (chest-up, 3/4 angle) of the Void Wanderer NPC. A mysterious hooded figure in tattered dark purple cloaks with intricate fabric folds and micro-dithering, faceless shadow beneath the hood with two sharp glowing violet pinpoint eyes, holding an ornate brass soul lantern with glowing soul embers near chest height. High resolution pixel density, crisp sharp outlines, micro-texture dithering, ultra refined pixel art style. Flat solid pure red background `#FE0201` with NO glow outside and no blur at the edges. No drop shadow. |
| `npc_sky_herald.png` | O Heraldo dos Céus | Desconhecido | **Prompt**: High density 512-bit pixel art bust portrait (chest-up) of the Sky Herald NPC. An ethereal alate winged guardian knight in cracked golden armor, wing tips visible behind the shoulders, holding a crystal trumpet near the chest/mouth that emanates soft azure energy. Crisp black outlines, micro-texture dithering. Flat solid pure red background `#FE0201` with NO glow outside and no blur at the edges. No drop shadow. |
| `npc_sunken_castellan.png` | O Castelão Afundado | Cidadela Submersa | **Prompt**: High density 512-bit pixel art bust portrait (chest-up, 3/4 angle) of the Sunken Castellan NPC. A weathered aquatic guardian knight in barnacle-encrusted dark teal armor, coral growths along the shoulders, deep-set glowing cyan eyes, kelp-like beard/hair strands. Crisp black outlines, micro-texture dithering. Flat solid pure red background `#FE0201` with NO glow outside and no blur at the edges. No drop shadow. |

### NPCs sem sprite próprio (apresentação especial, sem PNG a gerar)

Nem todo `speakerId`/`npcId` do jogo precisa de arte nova — 2 casos são resolvidos só em código, sem sprite:

- **`alma_mundo`** (Voz da Alma-Mundo): é uma consciência primordial sem forma física, então em vez de retrato ela ganhou uma **chama roxa animada em CSS puro** (`AlmaMundoFlame`, em `src/components/shared/SpecialNpcPortraits.tsx`), reforçando a ideia de presença etérea/sem corpo. Não gerar `npc_alma_mundo.png`.
- **`avatar_echo`** (O Eco do Avatar, Ato V): é literalmente o próprio jogador refletido no espelho primordial, então reaproveita o **sprite de combate da classe atual do herói** (`hero_sprite.png`/`mage_sprite.png`/etc., já existentes), com zoom (`AvatarEchoPortrait`, mesmo arquivo) para focar no busto e esconder as pernas. Não gerar `npc_avatar_echo.png`.

---

# PARTE 2 — Sprites de Itens de História (Artefatos Narrativos)

Exibidos como **ícones pequenos** (32px, `objectFit: 'contain'`) no catálogo de Artefatos de História (`QuestLogPanel.tsx`) — mesma convenção de fundo/recorte da Parte 1, sem sombra (ícone flutuante, sem chão).

| Arquivo | Nome do Item | Categoria | Especificação Técnica & Prompt de Geração |
| :--- | :--- | :--- | :--- |
| `story_shard_memory.png` | Fragmento de Memória da Alma | Artefato | **Prompt**: Ultra refined high-density 512-bit fine micro-pixel art of a glowing amethyst soul shard artifact. A floating crystalline shard with swirling inner galaxy memories, sparkling stardust, and sharp glowing facet reflections. Extreme micro-pixel texture, smooth fine-line dithering, razor-sharp black outlines, ultra refined pixel art style. Flat solid uniform pure red background `#FE0201` with NO glow outside, NO shadows, NO background elements. |
| `story_seal_archdemon.png` | Selo do Arquidemônio Vencido | Artefato | **Prompt**: High density 512-bit pixel art of an ancient Archdemon Obsidian Seal artifact. Heavy black volcanic stone medallion with carved glowing crimson demon horns and runes. Crisp black outlines. Flat solid pure red background `#FE0201`. No drop shadow. |
| `story_astral_compass.png` | Bússola Astral da Alma-Mundo | Artefato | **Prompt**: High density 512-bit pixel art of an intricate brass Astral Compass artifact. A mystical nautical compass with blue glowing starlight needles pointing across space-time. Crisp black outlines. Flat solid pure red background `#FE0201`. No drop shadow. |
| `story_drowned_locket.png` | Relicário dos Ecos Afogados | Artefato | **Prompt**: Ultra refined high-density 512-bit fine micro-pixel art of a Drowned Echo Locket artifact. An antique silver locket encrusted with barnacles, sea moss, and a glowing cyan pearl center with micro-details. Extreme micro-pixel texture, smooth fine-line dithering, razor-sharp black outlines. Flat solid uniform pure red background `#FE0201`. No drop shadow. |
| `story_vessel_avatar.png` | Vazilhame do Avatar Pleno | Artefato | **Prompt**: Ultra refined high-density 512-bit fine micro-pixel art of a pristine golden Avatar Vessel urn artifact. An ornate crystal urn containing glowing multi-colored elemental embers (red, blue, green, yellow) with intricate gold engravings. Extreme micro-pixel texture, smooth fine-line dithering, razor-sharp black outlines. Flat solid uniform pure red background `#FE0201`. No drop shadow. |
| `story_herald_horn.png` | Trombeta do Heraldo dos Céus | Artefato | **Prompt**: High density 512-bit pixel art of a divine Golden Sky Herald Horn artifact. A curved ceremonial war horn made of sun-gold metal and celestial feathers. Crisp black outlines. Flat solid pure red background `#FE0201`. No drop shadow. |

---

# PARTE 3 — Mapeamento e Integração no Código

Os assets são carregados dinamicamente pelos componentes de interface:
- `NpcDialogOverlay.tsx`: Carrega `/assets/npc_${npcId}.png` ou `/assets/${npcId}.png`.
- `QuestLogPanel.tsx`: Exibe o ícone e a arte correspondente em `/assets/${storyItemId}.png` no catálogo de Artefatos de História.
- `ActCutsceneOverlay.tsx`: Carrega `/assets/npc_${speakerId}.png` para o retrato em destaque das cutscenes de Ato.

**Remoção de fundo**: os três componentes acima resolvem a URL da imagem através de `getTransparentImageUrl`/`peekTransparentImageUrl` (`src/core/imageBackgroundStrip.ts`), que remove o fundo `#FE0201` (chroma key, com feathering + despill para não deixar franja colorida na borda) — a mesma função já usada pelas construções da Cidadela. **Não** é o mesmo pipeline de `CombatScene.ts` (Phaser, fundo branco, sem tratamento de borda) — qualquer asset novo adicionado a este catálogo deve seguir o padrão `#FE0201` descrito aqui, não o branco da Seção 3.G do Manual Técnico.
