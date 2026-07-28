# Anexo de Design v11.0.0 — Catálogo de Assets & Prompts: NPCs e Itens de História

## Amaro RPG Idle — Especificação de Arte para o Update v11 ("Ecos do Destino")

> **Padrão Técnico de Arte**: Segue rigorosamente a **Seção 3.G do Manual Técnico** (sprites 1024×1024, Pixel Art HD 512-bit, fundo branco puro `#FFFFFF`, sem brilho externo/glow, sombra elíptica preta `#000000` 100% opaca sob os pés).

---

# PARTE 1 — Sprites de NPCs (Personagens de História)

| Arquivo | Nome em Jogo | Facção / Papel | Especificação Técnica & Prompt de Geração |
| :--- | :--- | :--- | :--- |
| `npc_archivist_valeria.png` | Valéria, a Arquivista Astral | Cidadela Astral | **Prompt**: High density 512-bit pixel art of Valéria, the Astral Archivist NPC. A wise female scholar in dark navy blue star-patterned robes, holding a floating glowing scroll with mystical runes, wearing gold reading spectacles. Crisp black outlines, micro-texture dithering. Rendered on a pure solid white background `#FFFFFF` with NO glow outside. Solid `#000000` elliptical drop shadow under feet. |
| `npc_forge_master_vulkan.png` | Vulkan, o Mestre da Forja | Cidadela Astral | **Prompt**: High density 512-bit pixel art of Vulkan, the Master Forge Dwarf NPC. A muscular dwarven smith with a glowing fiery ember beard, wearing a heavy leather apron with glowing ember runes, wielding a massive blacksmith warhammer. Crisp black outlines, micro-texture dithering. Solid white background `#FFFFFF` with NO glow outside. Solid `#000000` elliptical drop shadow under feet. |
| `npc_void_wanderer.png` | O Andarilho do Vazio | Neutro / Mercador | **Prompt**: High density 512-bit pixel art of the Void Wanderer NPC. A mysterious hooded figure in tattered dark purple cloaks, faceless shadow beneath the hood with two glowing violet pinpoint eyes, holding a brass soul lantern. Crisp black outlines, micro-texture dithering. Solid white background `#FFFFFF` with NO glow outside. Solid `#000000` drop shadow. |
| `npc_sky_herald.png` | O Heraldo dos Céus | Desconhecido | **Prompt**: High density 512-bit pixel art of the Sky Herald NPC. An ethereal alate winged guardian knight in cracked golden armor, holding a crystal trumpet that emanates soft azure energy. Crisp black outlines, micro-texture dithering. Solid white background `#FFFFFF` with NO glow outside. Solid `#000000` drop shadow. |

---

# PARTE 2 — Sprites de Itens de História (Artefatos Narrativos)

| Arquivo | Nome do Item | Categoria | Especificação Técnica & Prompt de Geração |
| :--- | :--- | :--- | :--- |
| `story_shard_memory.png` | Fragmento de Memória da Alma | Artefato | **Prompt**: High density 512-bit pixel art of a glowing amethyst soul shard artifact. A floating crystalline shard with swirling inner memories and galaxy dust. Crisp black outlines. Pure solid white background `#FFFFFF` with NO glow outside. Solid `#000000` drop shadow underneath. |
| `story_seal_archdemon.png` | Selo do Arquidemônio Vencido | Artefato | **Prompt**: High density 512-bit pixel art of an ancient Archdemon Obsidian Seal artifact. Heavy black volcanic stone medallion with carved glowing crimson demon horns and runes. Crisp black outlines. Pure solid white background `#FFFFFF`. Solid `#000000` drop shadow. |
| `story_astral_compass.png` | Bússola Astral da Alma-Mundo | Artefato | **Prompt**: High density 512-bit pixel art of an intricate brass Astral Compass artifact. A mystical nautical compass with blue glowing starlight needles pointing across space-time. Crisp black outlines. Pure solid white background `#FFFFFF`. Solid `#000000` drop shadow. |
| `story_drowned_locket.png` | Relicário dos Ecos Afogados | Artefato | **Prompt**: High density 512-bit pixel art of a Drowned Echo Locket artifact. An antique silver locket encrusted with barnacles, sea moss, and a glowing cyan pearl center. Crisp black outlines. Pure solid white background `#FFFFFF`. Solid `#000000` drop shadow. |
| `story_vessel_avatar.png` | Vazilhame do Avatar Pleno | Artefato | **Prompt**: High density 512-bit pixel art of a pristine golden Avatar Vessel urn artifact. An ornate crystal vessel containing glowing multi-colored elemental embers (red, blue, green, yellow). Crisp black outlines. Pure solid white background `#FFFFFF`. Solid `#000000` drop shadow. |
| `story_herald_horn.png` | Trombeta do Heraldo dos Céus | Artefato | **Prompt**: High density 512-bit pixel art of a divine Golden Sky Herald Horn artifact. A curved ceremonial war horn made of sun-gold metal and celestial feathers. Crisp black outlines. Pure solid white background `#FFFFFF`. Solid `#000000` drop shadow. |

---

# PARTE 3 — Mapeamento e Integração no Código

Os assets são carregados dinamicamente pelos componentes de interface:
- `NpcDialogOverlay.tsx`: Carrega `/assets/npc_${npcId}.png` ou `/assets/${npcId}.png`.
- `QuestLogPanel.tsx`: Exibe o ícone e a arte correspondente em `/assets/${storyItemId}.png` no catálogo de Artefatos de História.
