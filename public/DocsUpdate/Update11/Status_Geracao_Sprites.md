# Status de Geração dos Sprites — Update v11 ("Ecos do Destino")

> **Documento de Controle de Geração de Assets**: Rastreia quais dos 12 sprites do Update v11 foram gerados, refinados e copiados para `public/assets/`.
> **Status Atual**: 12 de 12 sprites concluídos e refinados em padrão 512-bit micro-pixel art (100%).

---

## 🎭 PARTE 1 — Retratos de NPCs (5 Sprites)

| Sprite | Nome | Status | Arquivo Final |
| :--- | :--- | :---: | :--- |
| `npc_archivist_valeria.png` | Valéria, a Arquivista Astral | ✅ REFINADO (512-bit) | `public/assets/npc_archivist_valeria.png` |
| `npc_forge_master_vulkan.png` | Vulkan, o Mestre da Forja | ✅ REFINADO (512-bit) | `public/assets/npc_forge_master_vulkan.png` |
| `npc_void_wanderer.png` | O Andarilho do Vazio | ✅ REFINADO (512-bit) | `public/assets/npc_void_wanderer.png` |
| `npc_sky_herald.png` | O Heraldo dos Céus | ✅ REFINADO (512-bit) | `public/assets/npc_sky_herald.png` |
| `npc_sunken_castellan.png` | O Castelão Afundado | ✅ REFINADO (512-bit) | `public/assets/npc_sunken_castellan.png` |

---

## 🏺 PARTE 2 — Artefatos de História (7 Sprites)

| Sprite | Nome | Status | Arquivo Final |
| :--- | :--- | :---: | :--- |
| `story_shard_memory.png` | Fragmento de Memória da Alma | ✅ REFINADO (512-bit) | `public/assets/story_shard_memory.png` |
| `story_seal_archdemon.png` | Selo do Arquidemônio Vencido | ✅ REFINADO (512-bit) | `public/assets/story_seal_archdemon.png` |
| `story_astral_compass.png` | Bússola Astral da Alma-Mundo | ✅ REFINADO (512-bit) | `public/assets/story_astral_compass.png` |
| `story_drowned_locket.png` | Relicário dos Ecos Afogados | ✅ REFINADO (512-bit) | `public/assets/story_drowned_locket.png` |
| `story_vessel_avatar.png` | Vazilhame do Avatar Pleno | ✅ REFINADO (512-bit) | `public/assets/story_vessel_avatar.png` |
| `story_herald_horn.png` | Trombeta do Heraldo dos Céus | ✅ REFINADO (512-bit) | `public/assets/story_herald_horn.png` |
| `story_void_promise.png` | Promessa Quebrada do Vazio | ✅ REFINADO (512-bit) | `public/assets/story_void_promise.png` |

---

### 🎨 Padrão de Arte Aplicado:
- **Estilo**: Ultra-refined fine-line 512-bit micro-pixel art com micro-dithering.
- **Fundo Chroma Key**: `#FE0201` (Vermelho puro, 100% plano, sem elementos de cenário) para remoção via `imageBackgroundStrip.ts`.
- **Enquadramento NPC**: Retrato de busto (*chest-up, 3/4 angle*).
