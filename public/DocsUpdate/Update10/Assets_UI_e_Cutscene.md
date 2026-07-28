# Anexo de Design v10.0.0 — Assets & Sprites, Estrutura de UI e a Cutscene do Caco Submerso
## Amaro RPG Idle — Documento complementar (Anexo 3, final)

> Fecha a trilogia de anexos. As specs de arte seguem RIGOROSAMENTE os padrões técnicos das Seções 3.B (backgrounds), 3.G (sprites de combate) e 18.H (spritesheets de construção com chroma key) do Manual Técnico v9.7.0 — nenhuma convenção nova é inventada onde uma existente serve.

---

# PARTE 1 — Inventário Completo de Assets

## 1.1. Resumo quantitativo

| Categoria | Qtd. | Padrão técnico |
| :--- | :---: | :--- |
| Sprites de combate (inimigos) | 15 novos + 1 reaproveitado | Fundo branco `#FFFFFF`, 1024×1024 (Seção 3.G) |
| Sprite de chefe mundial (Leviatã) | 1 | Idem, classe de chefe (215px+) |
| Sprite não-combatente (Bolsão de Ar) | 1 | Padrão Mercador Ambulante |
| Backgrounds de arena | 6 | 1024×1024, chão a 9% da borda inferior (Seção 3.B) |
| Backgrounds de tela de gestão | 2 | Opacos, sem grid (padrão `citadel_background.png`) |
| Spritesheets de construção (evolução 2×2) | 8 | Chroma key `#FE0201`, ordem diagonal (Seção 18.H) |
| Spritesheets de ícones (runas) | 2 | **Novo padrão 3×3** (ver 1.6) |
| Temas de BGM sintetizados | 5 | Web Audio (`bgmThemes.ts`) |
| SFX sintetizados | 8 | `AudioManager.ts` |

## 1.2. Sprites de combate — inimigos (padrão Seção 3.G integral)

**Checklist obrigatório por arte** (copiado do padrão vigente, para colar no prompt de geração): pixel art de alta densidade (contornos pretos finos, micro-texturas, dithering marcado — nem 8/16-bit rústico, nem vetor liso); 1024×1024, arte centralizada horizontalmente; fundo **branco puro sólido `#FFFFFF`** sem ruído/degradê; **nenhum branco puro interno** (brilhos internos abaixo de 220 nos canais — crítico em criaturas aquáticas, cheias de reflexos, bolhas e barrigas claras: usar off-white `#DCDCDC` máximo); **sem aura/glow/anti-aliasing** na borda externa (atenção redobrada à bioluminescência — o brilho deve ser desenhado *dentro* do contorno, nunca irradiando para o fundo); **sombra elíptica preta `#000000` 100% opaca** sob o corpo, em contato com a base.

⚠️ **Adendo específico do bioma aquático:** criaturas flutuantes (água-viva, peixes) ainda recebem a sombra elíptica no chão *abaixo* delas (não colada ao corpo) — a mesma convenção que os pets voadores da v7.0.0 já usam, mantendo a leitura de profundidade da arena.

| Arquivo | Nome em jogo | Zona/Local | Direção de arte (resumo p/ prompt) |
| :--- | :--- | :--- | :--- |
| `enemy_wreck_crab.png` | Caranguejo de Casco Naufragado | Litoral | Caranguejo grande com casco de madeira de navio partido cravado nas costas, cracas, um olho por fresta do casco |
| `enemy_drift_jelly.png` | Água-Viva Errante | Litoral | Água-viva translúcida azul-violeta (interior em tons ≤220!), tentáculos com pontas cintilantes escuras |
| `enemy_slime_moray.png` | Moreia do Limo | Litoral | Moreia verde-lodo emergindo de uma ânfora quebrada, dentes de agulha, mancha de limo escuro |
| `enemy_drowned_echo.png` | Eco Afogado (miniboss) | Litoral | Silhueta humana espectral azul-esverdeada, roupas de cidadão antigo, água escorrendo eternamente, expressão serena e triste (não agressiva — é lore) |
| `enemy_grudge_puffer.png` | Baiacu Rancoroso | Prof. Z1 | Baiacu inflado coberto de espinhos de âncora enferrujada, bochechas trêmulas (vai explodir) |
| `enemy_reef_shark.png` | Tubarão do Recife | Prof. Z1 | Tubarão com cicatrizes de coral crescendo NAS feridas, guelras vermelhas |
| `enemy_hungry_anemone.png` | Anêmona Faminta | Prof. Z1 | Anêmona ambulante sobre raízes-pata, boca central dentada entre tentáculos coloridos |
| `boss_reef_arachnid.png` | Aracnídeo do Recife (Guardião 1) | Prof. 25 | Caranguejo-aranha colossal, corpo = fortaleza de coral vivo, 8 patas-lança, bolhas de escudo desenhadas no casco |
| `enemy_kelp_strangler.png` | Estrangulador de Algas | Prof. Z2 | Massa humanoide de algas negras trançadas, dois pontos de luz âmbar como olhos |
| `enemy_mirror_octopus.png` | Polvo Espelhado | Prof. Z2 | Polvo de pele metálica-espelho (cinzas opacos, NUNCA branco puro), reflexo distorcido do herói sugerido num tentáculo |
| `enemy_gloom_angler.png` | Peixe-Pescador do Breu | Prof. Z2 | Anglerfish com isca luminosa em forma de moeda de ouro (armadilha temática), dentes externos |
| `boss_kelp_thing.png` | A Coisa Entre as Algas (Guardião 2) | Prof. 50 | Forma indefinível dentro de cortina de algas — só garras e um olho gigante visíveis; horror sugerido, não mostrado |
| *(reuso)* | Eco do Guardião | Prof. Z3 | **Sem asset novo**: reaproveita sprites de chefes antigos com tint espectral ciano via `setTint` (fanservice de bestiário, decisão registrada no Anexo 1) |
| `enemy_salt_mourner.png` | Carpideira do Sal | Prof. Z3 | Figura feminina espectral coberta por véu de cristais de sal, lágrimas cristalizadas na face |
| `enemy_barnacle_knight.png` | Cavaleiro Cracudo | Prof. Z3 | Armadura de cavaleiro da cidadela tomada por cracas e anêmonas, espada corroída, postura digna |
| `boss_drowned_castellan.png` | O Castelão Afundado (Guardião 3) | Prof. 80 | Gigante em armadura cerimonial real alagada, capa de rede de pesca rasgada, coroa torta, alabarda-âncora |
| `enemy_dark_breather.png` | O Que Respira no Escuro | Prof. Z4 | Quase invisível: contorno de criatura enorme sugerido por bolhas e duas brânquias bioluminescentes — 70% da arte é escuridão texturizada |
| `enemy_trench_serpent.png` | Serpente da Fossa | Prof. Z4 | Serpente abissal esquelética com órgãos luminosos visíveis pela pele translúcida escura |
| `enemy_false_light.png` | Luz Falsa | Prof. Z4 | Enxame de luzes convidativas orbitando uma boca-flor central cheia de dentes |
| `boss_leviathan_spawn.png` | Prole do Leviatã | Prof. Z4 | Versão juvenil do Leviatã (mesma silhueta, ~cores do pai) — desenhar DEPOIS do pai para herdar identidade |
| `boss_leviathan.png` | **O Leviatã do Ciclo** | Trono | Ver spec dedicada abaixo |

**Spec dedicada — Leviatã:** serpente-baleia ancestral cujo corpo é meio criatura, meio cidadela (torres afundadas fundidas ao dorso, janelas acesas como órgãos bioluminescentes — a revelação visual de que ele E a cidade são um só, antecipando a cutscene). Uma cicatriz luminosa vertical no peito (onde engoliu o Caco — brilha mais a cada fase, controlável por tint aditivo na engine). Renderizado na classe de chefe (215px base); recomenda-se compor a arte com o corpo enrolado/vertical para caber imponente no quadro 1024×1024 sem rimar com sprites horizontais comuns.

**Bolsão de Ar** (`npc_air_pocket.png`): grande bolha de ar presa sob um arco de coral/ruína, superfície interna trêmula refletindo luz (reflexos ≤220), pequenas bolhas satélites. Padrão não-combatente do Mercador: renderizado na posição de encontro, sem barra de HP.

## 1.3. Backgrounds de arena (padrão Seção 3.B)

Regras herdadas: 1024×1024; linha do chão **exatamente a 9% da borda inferior** (Y=532.5 renderizado); para os que rolam lateralmente, emendas laterais perfeitas (seamless loop).

| Arquivo | Uso | Rolagem? | Direção de arte |
| :--- | :--- | :---: | :--- |
| `coastal_background.png` | Spawns aquáticos do Litoral nas fases 1–10 | Sim (sidescroll) | Praia de naufrágios ao entardecer: cascos encalhados, mastros tortos, espuma; horizonte marinho |
| `abyss_z1_background.png` | Profundezas — Recife Partido | **Não** (arena estática, padrão Torre) | Recife colorido sob luz coada em feixes; a ÚNICA paleta clara/alegre do jogo — o contraste que faz as zonas fundas pesarem |
| `abyss_z2_background.png` | Bosque de Algas Negras | Não | Floresta de kelp negro-esverdeado em penumbra, silhuetas ao fundo |
| `abyss_z3_background.png` | Ruínas da Cidadela | Não | Rua submersa da cidadela: fachadas nobres alagadas, janelas escuras, estátua caída — arquitetura reconhecível como "a mesma civilização" da Cidadela Astral |
| `abyss_z4_background.png` | Fossa do Caco | Não | Escuridão quase total pontuada por vida bioluminescente e, ao fundo, um brilho vertical distante (o Caco, plantado visualmente antes da cutscene) |
| `throne_arena_background.png` | Arena do Leviatã | Não | O salão do Trono drenado: água na altura dos tornozelos (desenhada no chão), trono colossal ao fundo, poço central escuro de onde ele emerge |

**Escurecimento por profundidade é da engine, não da arte:** um `Rectangle` overlay azul-escuro no Phaser com `alpha = min(0.45, profundidadeNaZona × 0.015)` sobre o background — as 4 artes de zona ficam limpas e o gradiente de descida é contínuo e barato.

## 1.4. Telas de gestão (padrão `citadel_background.png` — opaco, sem chroma key)

| Arquivo | Uso | Layout obrigatório |
| :--- | :--- | :--- |
| `coastal_hub_background.png` | Tela do Litoral | Píer em primeiro plano à esquerda (âncora visual do painel de pesca), mar aberto à direita, **céu ocupando o terço superior** (área reservada para o indicador de Maré e HUD do painel) |
| `submersa_background.png` | Pátio da Cidadela Submersa | **6 clareiras em grade 2×3** para os marcadores de distrito: colunas a 18% / 50% / 82% da largura; linhas a 32% / 72% da altura (constantes espelhadas em `SubmersaSpriteStage.tsx` — se a arte mudar, só esses valores mudam, mesma regra da Seção 18.H) |

## 1.5. Spritesheets de construção/distrito (padrão Seção 18.H integral)

Regras herdadas: 1024×1024, grade 2×2, fundo **chroma key vermelho `#FE0201`** (tolerância 50), contorno preto fino ao redor de cada quadrante, **ordem diagonal** de evolução:

| Quadrante | Estado (construções) | Estado (distritos submersos) 🔧 |
| :--- | :--- | :--- |
| `[0,1]` inferior-esq. | Bloqueado/Nível 1 | **Alagado** (só o topo aparece acima d'água) |
| `[0,0]` superior-esq. | Básico | **Restaurado I** (drenado, escorado, funcional) |
| `[1,1]` inferior-dir. | Avançado | **Restaurado II** (reconstruído, iluminado) |
| `[1,0]` superior-dir. | Supremo | **Restaurado III** (glorioso, coral ornamental vivo) |

*O estado "Drenando" NÃO tem quadrante: usa o quadrante Alagado + overlay de água CSS animado descendo (decisão do Design principal — a spritesheet continua 2×2, `EvolutionSprite.tsx` funciona sem nenhuma alteração).*

| Arquivo | Construção |
| :--- | :--- |
| `citadel_engraving_chamber.png` | Câmara de Gravação (Cidadela Astral, pág. 2 do pátio) |
| `coastal_dock.png` | Doca de Pesca do Litoral (níveis 1–5) |
| `submersa_doca_batial.png` | ⚓ Doca Batial |
| `submersa_salao_ecos.png` | 🏛️ Salão dos Ecos |
| `submersa_forja_encharcada.png` | ⚒️ Forja Encharcada |
| `submersa_arquivo.png` | 📚 Arquivo Submerso |
| `submersa_templo_mare.png` | 🕍 Templo da Maré |
| `submersa_trono.png` | 👑 Trono Afundado |

## 1.6. Ícones de runas — o único padrão novo (3×3, e por quê)

Runas são ícones de UI, não sprites de combate — e o jogo já resolve ícones de item com emoji + moldura CSS (`itemVisuals.ts`). Estratégia em duas fases:

* **Fase de lançamento (custo zero de arte):** glifo rúnico Unicode (ᚢ ᚲ ᛋ ᚹ ᛗ ᚾ ᛚ ᛞ ᚠ) sobre fundo colorido pela família + **borda pelo tier** (bronze/prata/dourado I–II–III), tudo em CSS no padrão de `itemVisuals.ts`. Primordiais usam os glifos alquímicos já definidos no Anexo 1 (🜲 🜄 🜚 🝆 🜃 🝮 🜠 🝓 🜏) com borda animada própria.
* **Fase de arte definitiva:** 2 spritesheets `runes_base.png` e `runes_primordial.png` — **1024×1024 em grade 3×3** (9 células de ~341px, uma runa por célula, ordem de leitura em linha — SEM a ordem diagonal, que só existe para evolução), chroma key `#FE0201` e contorno preto fino, processadas pelo mesmo `imageBackgroundStrip.ts`/`getTransparentImageUrl` das construções. Um novo componente trivial `IconSprite.tsx` (primo do `EvolutionSprite`, recorte por índice em vez de por nível) serve qualquer spritesheet 3×3 futura (poções, iscas, pérolas).

## 1.7. Áudio sintetizado (padrões de `bgmThemes.ts` / `AudioManager.ts`)

| Tema | Onde toca | Tom/caráter | Osciladores sugeridos | Andamento |
| :--- | :--- | :--- | :--- | :---: |
| "Luz Coada" | Prof. Z1 | **Dó Maior** aquoso — o único tema maior do jogo | `sine` (baixo) + `triangle` (arpejo borbulhante) | Calmo |
| "Sussurro das Algas" | Prof. Z2 | Mi Frígio, intervalos rastejantes | `triangle` + `sine` detunado (batimento lento = correnteza) | Lento |
| "Coro Afogado" | Prof. Z3 | Lá menor, vozes em quintas paralelas (coral de igreja submerso) | `sine` em 3 camadas defasadas | Solene |
| "Pulso do Abismo" | Prof. Z4 | Dó♯ cluster grave, uma nota-pulso a cada 2 compassos | `sawtooth` grave filtrado + sub `sine` | Muito lento |
| "O Coro e a Fera" | Luta do Leviatã | Alterna 8 compassos do "Coro Afogado" com 8 de cluster do Pandemônio — a cada fase do boss, a proporção pende para o Coro (a cidade vencendo a fera) | Mistura das camadas acima | Acelera por fase |

**SFX novos (8):** mergulho/splash (ruído branco filtrado descendente), bolha de Fôlego crítico (blip `sine` agudo, dispara sob 25%), coleta de Pérola (dyad cintilante), engaste de runa (clique grave + harmônico), Palavra Rúnica completa (acorde ascendente de 4 notas), Vagalhão carregando (sweep grave 3s — áudio-telégrafo além do visual), troca de fase do Leviatã (impacto + silêncio de 0.5s), canto de Eco resgatado (uma voz `sine` breve).

---

# PARTE 2 — Estrutura de UI das Novas Telas

## 2.1. Decisão estrutural: UMA aba nova, não três

O menu já carrega 13+ abas no carrossel mobile. A expansão inteira entra em **uma única aba de topo — 🌊 Abismo** — com sub-abas internas, seguindo o precedente já consolidado por Opções (`statsSubTab`) e Transcendência (Talentos/Loja):

```
🌊 ABISMO
├── 🎣 Litoral        (visível ao completar a Fase 2)
├── 🤿 Profundezas    (visível na Fase 50; antes: Mergulhos Rasos, pós-1ª Ascensão)
└── 🔱 Cidadela       (visível após a 1ª descida que alcança a Zona 3)
```

A própria aba 🌊 só aparece com o Litoral desbloqueado (mesma regra de visibilidade condicional da aba Cidadela/`citadel.unlocked`). Sub-abas travadas aparecem com cadeado + requisito textual — padrão do 3º botão de ramificação da Torre (v9.0.0).

**Árvore de componentes** (convenção de pastas do projeto):
```
src/components/abyss/
  AbyssPanel.tsx            // roteador de sub-abas (padrão OptionsPanel)
  CoastalPanel.tsx          // Litoral
  DepthsPanel.tsx           // Profundezas (pré/pós-descida)
  SubmersaPanel.tsx         // overlay fullscreen da Cidadela Submersa
  SubmersaSpriteStage.tsx   // pátio 2×3 (primo do CitadelSpriteStage)
  EchoRosterDrawer.tsx      // gaveta de Ecos
  EchoCard.tsx              // card com decomposição da eficácia
  DistrictModal.tsx         // modal local (padrão Seção 3.D — nunca fixo global)
  LeviathanPanel.tsx        // tela do Trono/chefe
  DiveHud.tsx               // overlay de Fôlego/Pressão sobre o canvas
  LoreCutscene.tsx          // Parte 3
src/components/citadel/EngravingChamberPanel.tsx  // Câmara (sub-aba da Cidadela Astral)
```

## 2.2. 🎣 Litoral (`CoastalPanel.tsx`)

Layout sobre `coastal_hub_background.png` (combate segue em 2º plano a 15fps, padrão Cidadela):
* **Faixa superior:** indicador de Maré — `🌊⬇ MARÉ BAIXA · vira em 1h 12m` (hook `useCountdown`), com os modificadores ativos da maré em texto curto ao lado.
* **Coluna esquerda (o Píer):** card da Doca de Pesca (`EvolutionSprite` + nível + botão de melhoria com timer, padrão universal das construções); seletor de **Isca** (3 cards, mostra custo em Carne e o viés de captura de cada uma); **buffer de capturas passivas** com botão "Recolher a Rede" — clone deliberado do fluxo "Coletar Chaves" da Torre de Vigia (v9.6.0): produção pausa com buffer cheio, coleta move o que couber.
* **Coluna direita:** botão grande **"🎣 Puxar a Linha"** (pesca ativa) → abre a barra de timing: uma faixa horizontal com janela verde que encolhe conforme a raridade fisgada; acerto = captura dobrada; acerto perfeito (20% centrais) alimenta o contador vitalício da runa **Faro** (`100 acertos`), exibido discretamente abaixo (`✨ 37/100`).
* **Rodapé:** log das últimas 5 capturas (padrão console de combate, respeitando a opção de abreviar números).

## 2.3. 🤿 Profundezas (`DepthsPanel.tsx` + `DiveHud.tsx`)

**Estado pré-descida** (espelho estrutural do `TowerPanel`, familiaridade imediata):
* Cabeçalho: Chaves de Mergulho disponíveis + recorde histórico + título equipado (**reusa `EquippedTitleBox.tsx`** via props, como as ramificações da Torre já fazem).
* **Seletor de ponto de partida:** cards Superfície (1 chave) / Prof. 26 / 51 / 81 (2 chaves; com cadeado até o Guardião correspondente cair) — visual dos botões de ramificação da Torre.
* **Card do Traje de Mergulho:** nível, Pressão/Dreno residuais, próximo custo, botão de melhoria (habilitado só com a Doca Batial restaurada — link textual "requer ⚓ Doca Batial" que navega para a sub-aba Cidadela).
* Botão **"INICIAR MERGULHO"** (desabilitado sem chave — regra idêntica ao "INICIAR SUBIDA").

**Estado em-descida** (a sub-aba muda de conteúdo, como o TowerPanel durante subida):
* **Recompensas não-bancadas** em destaque (Pérolas/runas/coral acumulados) com o aviso de risco atual ("morte afogada: −50%").
* Botão grande **"⬆ SUBIR À SUPERFÍCIE"** com dupla confirmação (padrão de 2 cliques/3s das ações destrutivas do inventário — aqui protegendo contra o toque acidental que encerraria a descida).
* **`DiveHud.tsx`** — overlay absoluto sobre o `phaser-container` (mesmo mount da `ActiveBuffsTray`): barra de **Fôlego** horizontal fina no topo (azul→âmbar→vermelha pulsante sob 25%), contador `PROFUNDIDADE 37 · ZONA 2` substituindo o "Fase X" do Phaser (via evento `DIVE_STARTED`/`DEPTH_CHANGED`), e o multiplicador de Pressão atual em texto pequeno. No mobile, mesma dieta da bandeja de buffs: `@media (max-width: 840px)` reduz tudo.
* **Bolsão de Ar:** modal local de 3–4 cards de escolha, clone estrutural do painel do Mercador (suspende o FSM, posicionado ao lado do canvas no desktop / abaixo do carrossel no mobile).

## 2.4. 🔱 Cidadela Submersa (`SubmersaPanel.tsx`)

Overlay fullscreen (padrão `CitadelPanel`): pátio 2×3 sobre `submersa_background.png`, cada distrito com seu `EvolutionSprite` + **overlay de água CSS** (`div` azul translúcido com `height` animada por `transition: height 2s` — 100% alagado, descendo em tempo real durante a drenagem via `useCountdown`, 0% restaurado).

* **Modal de distrito** (local, absoluto — Seção 3.D): estado, função, custo/timer de drenagem-restauração, e os **slots de Eco** como soquetes circulares (vazio = tracejado; ocupado = retrato do Eco).
* **Gaveta de Ecos (`EchoRosterDrawer`):** lateral no desktop, bottom-sheet no mobile. Cada `EchoCard` mostra retrato-glifo, vocação, traço e a **decomposição da eficácia** (`Base 8% × Afin. 1.5 × Traço 1.1 × Viz. 0.9 = 11.9%`) — a transparência de fórmula que a Árvore de Habilidades já pratica com prévias de dano. Coração Partido exibe o cronômetro dos 7 dias.
* **Fluxo de alocação (mobile-first):** tocar no Eco → distritos elegíveis pulsam com contorno verde → tocar no destino → confirmação de 2º toque (padrão Quartel v6.0.0). Realocar um Coração Partido dispara aviso explícito ("isso reinicia os 7 dias") antes da confirmação.
* **Templo:** durante a Maré Alta, o modal exibe as 3 Bênções como cards de escolha única (estrutura do Bolsão de Ar reaproveitada).
* **`LeviathanPanel` (Trono):** barra de HP **segmentada em 5** com as fases já vencidas na semana esmaecidas, contador `Tentativas: 2/3 · reinicia Domingo`, resumo dos bônus de Ecos Guardiões alocados, e botão "DESAFIAR O LEVIATÃ". Durante a luta, o HUD de combate mostra o subtítulo da fase (`FASE 3 — A INUNDAÇÃO`) na linha própria de eventos (a mesma criada na v9.0.0 para Lua de Sangue/Convergência — visível no mobile por construção).

## 2.5. Câmara de Gravação (`EngravingChamberPanel.tsx`, sub-aba da Cidadela Astral)

Fluxo em 3 painéis encadeados, todos modais locais:
1. **Seleção de item** — grade filtrada aos slots pesados (reusa `itemVisuals.ts` na íntegra; itens exibem os soquetes como pontos sob o ícone: ● engastado / ○ vazio / ◌ não perfurado).
2. **Vista do item** — soquetes em linha; ações por soquete: Perfurar (custo em Pérolas+Ouro), Engastar (abre o picker), Extrair/Remover (conforme nível da Câmara, com dupla confirmação na remoção destrutiva).
3. **Picker de runas** — grade do `runeInventory` com contagem por pilha; selecionar mostra **prévia do stat resultante** (padrão da prévia de fusão da Forja) e, crucialmente, o **detector de Palavra Rúnica**: se a sequência parcial casa com o prefixo de uma receita revelada, uma faixa mostra `⚡ 2/3 — CORO SUBMERSO: falta ᛗ Mar` (receitas não reveladas mostram `??? — sequência desconhecida ressoa...`, plantando a caça sem entregar o Arquivo de graça).

**Alterações em telas existentes (lista fechada):** modal de detalhes do item (Inventário + Depósito) ganha a linha de soquetes/runas via `itemVisuals.ts` — automaticamente consistente nos dois lugares; painel da Forja Mística exibe aviso "runas do Item B serão devolvidas" na prévia de fusão; aba Estatísticas ganha bloco "Abismo" (recorde de profundidade, Pérolas vitalícias, Ecos resgatados, full clears do Leviatã); Bestiário ganha as entradas aquáticas com os filtros existentes.

**Novos `GameEvent` (lista completa):** `DIVE_STARTED`, `DIVE_ENDED`, `DEPTH_CHANGED`, `BREATH_CHANGED`, `AIR_POCKET_OPENED`, `TIDE_CHANGED`, `LEVIATHAN_PHASE_CHANGED`, `LEVIATHAN_CHANNEL_STARTED`, `LEVIATHAN_CHANNEL_INTERRUPTED`, `RUNEWORD_COMPLETED`, `CUTSCENE_TRIGGERED`.

---

# PARTE 3 — A Cutscene do Caco Submerso (roteiro integral)

## 3.1. Sistema (mínimo viável, reutilizável)

O jogo nunca teve cutscenes — a spec é deliberadamente humilde: `LoreCutscene.tsx`, um overlay fullscreen preto que apresenta uma sequência de painéis `{ image?, text, holdMs }` com fade-in do texto (CSS), avanço por toque/clique, botão "Pular" discreto no canto após o 2º painel. BGM esmaece via `AudioManager`. Dispara uma única vez (`Character.leviathanCutsceneSeen`), imediatamente após a morte da Fase 5, antes da tela de recompensas; fica **rejogável no Guia** (nova entrada "Memórias"). Duas artes de apoio opcionais (`cutscene_shard.png`, `cutscene_choir.png` — ilustrações 1024×1024 opacas); sem elas, os painéis rodam só com texto sobre preto, plenamente funcionais.

## 3.2. As três sementes (plantadas ANTES, colhidas na cutscene)

* **Eco Afogado (miniboss do Litoral), ao morrer:** *"Ela ainda canta lá embaixo... você não ouve?"*
* **O Castelão Afundado (Guardião 3), ao surgir:** *"Eu jurei guardar o rei. O rei jurou guardar o Caco. Só um de nós ainda cumpre o juramento."*
* **12º Eco resgatado (marco da runa Ecoh):** o Salão canta em conjunto pela primeira vez — *"Quando formos muitos, ele vai lembrar quem era."*

## 3.3. Roteiro — "O Coro e o Caco"

> **[BGM esmaece ao silêncio. Tela preta. Um único som: uma bolha subindo.]**

**PAINEL 1** *(preto, texto surgindo devagar)*
> A água parou.
>
> Pela primeira vez em mil anos, o Trono Afundado ficou em silêncio.

**PAINEL 2** *(silhueta do Leviatã afundando lentamente, luz vinda de baixo)*
> O Leviatã não caiu como caem os monstros.
>
> Caiu como cai uma sentinela — rendida, não derrotada.
> Devagar. Quase agradecida.

**PAINEL 3** *(a cicatriz luminosa no peito dele se abre)*
> E do peito da fera, a luz que ela carregou por dez ciclos
> escorreu de volta para o mundo.

**PAINEL 4** *(o Caco revelado, suspenso na água — `cutscene_shard.png`)*
> Um caco. Do tamanho de um coração.
>
> Aceso como a primeira manhã do primeiro ciclo.
> O pedaço da Alma que escolheu o mar — ou que o mar escolheu esconder.

**PAINEL 5** *(a revelação — texto mais lento, `holdMs` maior)*
> Foi então que o herói entendeu o que enfrentara.
>
> Quando a cidadela afundou, seu guardião mergulhou atrás do Caco.
> E, não podendo carregá-lo de volta, fez a única coisa que um juramento permite:
> **engoliu a luz, e virou a tranca.**
>
> Mil anos de pressão fazem de qualquer sentinela uma fera.
> Ninguém guarda algo por tanto tempo sem esquecer o porquê.

**PAINEL 6** *(sacadas alagadas se enchendo de vultos azuis — `cutscene_choir.png`)*
> Ao redor, os Ecos Afogados se reuniram nas sacadas da cidade.
>
> E cantaram.
>
> Não o lamento que o mar decorou —
> o canto que a cidadela cantava quando ainda tinha sol.
> *(Se o jogador resgatou 12+ Ecos, uma linha extra:)* E desta vez, o coro estava completo.

**PAINEL 7** *(a mão do herói se aproxima do Caco; o Caco recua um palmo)*
> O herói estendeu a mão.
>
> O Caco recuou — não por medo.
> Por peso.
>
> Um caco da Alma não se carrega.
> **Se merece.**
> E dez ciclos ainda não eram o bastante.

**PAINEL 8** *(a nota — a tela clareia de baixo para cima; uma única nota `sine` sustentada)*
> Mas o Caco cantou uma nota. Uma só.
>
> E a nota subiu pela água, atravessou a superfície,
> cruzou o céu que a cidadela não via há mil anos —
>
> e em algum lugar acima, muito acima das nuvens,
> **alguma outra coisa partida... respondeu.**

**PAINEL FINAL** *(preto; três linhas centradas, a última em dourado)*
> O Trono tem um novo guardião agora. Ele conhece o caminho de volta à superfície.
>
> — Fim do Décimo Ciclo —
>
> *O Ciclo da Alma Partida continuará.*

## 3.4. Notas de direção
* **O Leviatã é reabilitado, não vilanizado** — a tragédia do guardião que virou tranca ecoa a tese do Coração Partido (o que está quebrado se cura com tempo, não com força) e justifica retroativamente o BGM "O Coro e a Fera" pendendo para o Coro a cada fase: a luta inteira era a cidade chamando-o de volta.
* **O herói NÃO leva o Caco** — a recusa protege a economia (nenhum item "caco" para balancear agora) e transforma a cutscene num contrato com o jogador: *merecer* o Caco é a promessa da v11. A "outra coisa partida" que responde do céu é o gancho aberto — irmão celeste do caco submerso, apontando a próxima expansão para cima (um contraste limpo com esta, que apontou para baixo).
* **Kills repetidos do Leviatã** pulam a cutscene e mostram só o Painel Final resumido em toast — respeito ao tempo de farm semanal.
* A linha condicional do Painel 6 é o único ponto dinâmico do roteiro: barata de implementar (`echoesRescuedLifetime >= 12`), e devolve à simulação dos Ecos um pagamento emocional além do numérico.
