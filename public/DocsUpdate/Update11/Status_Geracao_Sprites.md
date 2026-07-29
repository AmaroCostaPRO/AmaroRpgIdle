# Status de Geração dos Sprites — Update v11 ("Ecos do Destino")

> **Documento de Controle de Geração de Assets**: Rastreia quais dos 10 sprites do Update v11 foram gerados, validados e copiados para `public/assets/`.
> **Status Atual**: 10 de 10 sprites concluídos (100%).

---

## 🎭 PARTE 1 — Retratos de NPCs (4 Sprites)

| Sprite | Nome | Status | Arquivo Final |
| :--- | :--- | :---: | :--- |
| `npc_archivist_valeria.png` | Valéria, a Arquivista Astral | ✅ CONCLUÍDO | `public/assets/npc_archivist_valeria.png` |
| `npc_forge_master_vulkan.png` | Vulkan, o Mestre da Forja | ✅ CONCLUÍDO | `public/assets/npc_forge_master_vulkan.png` |
| `npc_void_wanderer.png` | O Andarilho do Vazio | ✅ CONCLUÍDO | `public/assets/npc_void_wanderer.png` |
| `npc_sky_herald.png` | O Heraldo dos Céus | ✅ CONCLUÍDO | `public/assets/npc_sky_herald.png` |

---

## 🏺 PARTE 2 — Artefatos de História (6 Sprites)

| Sprite | Nome | Status | Observação |
| :--- | :--- | :---: | :--- |
| `story_shard_memory.png` | Fragmento de Memória da Alma | ⏳ NA FILA | Prompt 512-bit refinado registrado (Aguardando reset da cota ~2h39m) |
| `story_seal_archdemon.png` | Selo do Arquidemônio Vencido | ✅ CONCLUÍDO | `public/assets/story_seal_archdemon.png` |
| `story_astral_compass.png` | Bússola Astral da Alma-Mundo | ✅ CONCLUÍDO | `public/assets/story_astral_compass.png` |
| `story_drowned_locket.png` | Relicário dos Ecos Afogados | ⏳ NA FILA | Prompt 512-bit refinado registrado (Aguardando reset da cota ~2h39m) |
| `story_vessel_avatar.png` | Vazilhame do Avatar Pleno | ⏳ NA FILA | Prompt 512-bit refinado registrado (Aguardando reset da cota ~2h39m) |
| `story_herald_horn.png` | Trombeta do Heraldo dos Céus | ✅ CONCLUÍDO | `public/assets/story_herald_horn.png` |

---

### 🎨 Padrão de Arte Aplicado:
- **Resolução**: 1024×1024 Pixel Art HD 512-bit
- **Fundo Chroma Key**: `#FE0201` (Vermelho puro, sem gradientes) para remoção via `imageBackgroundStrip.ts`
- **Estilo NPC**: Retrato busto / meio-corpo
- **Estilo Artefato**: Ícone de item sem chão e sem sombra de gota
