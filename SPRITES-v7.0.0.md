# Briefing de Sprites — Versão 7.0.0 "Ecos que Despertam"

Descrições prontas para colar em uma IA de geração de imagem. Todos os assets atualmente usam placeholders reaproveitados de sprites já existentes — este documento serve para gerar a arte final que vai substituí-los.

## Diretriz de estilo (aplicar a todos os prompts abaixo)

> Estética **AAA Dark Fantasy Medieval**, pintura digital semi-realista, iluminação dramática, paleta rica e saturada mas sombria, o mesmo nível de acabamento de um RPG isométrico/2.5D premium. Sem texto, sem marca d'água, sem múltiplos personagens no quadro (exceto quando indicado).

## Especificação técnica (aplicar a todos os sprites de personagem/inimigo/pet)

- **Formato**: PNG ou JPEG, canvas quadrado **1024x1024px**.
- **Fundo**: cor sólida e lisa (uma única cor chapada, sem gradiente, sem textura, sem outros elementos) — o motor do jogo remove esse fundo automaticamente por detecção de cor nos cantos da imagem. Qualquer cor sólida funciona, desde que seja uniforme e diferente das cores do personagem (ex: um verde-chroma, cinza neutro ou azul saturado).
- **Enquadramento**: personagem centralizado, de corpo inteiro, ocupando a maior parte do quadro com uma margem confortável até a borda.
- **Pose**: neutra/de combate (idle), voltada para a esquerda ou de frente — o jogo espelha o sprite horizontalmente quando necessário via código, então a orientação exata não é crítica.

## Especificação técnica (para o background de bioma)

- **Formato**: PNG ou JPEG, canvas quadrado **1024x1024px**.
- **Fundo**: imagem completa (full-bleed), sem remoção de fundo — é usado como um `TileSprite` com rolagem horizontal contínua, então as bordas esquerda/direita devem casar bem visualmente (tileable horizontalmente, se possível).

---

## 1. Background — Bosque Sussurrante

**Arquivo sugerido**: `whispering_woods_background.png`

> Cenário de floresta encantada e serena, com árvores altas e finas de troncos claros levemente tortos, folhagem em tons de verde-jade e dourado suave, raios de luz atravessando a copa como véus. Atmosfera calma e onírica, ainda intocada pela corrupção — mais clara e viva que uma floresta comum de fantasia sombria, com um leve brilho mágico esverdeado/dourado pairando no ar, como poeira de fada. Composição de sidescroller (câmera lateral, profundidade em camadas), horizonte baixo, chão de grama e raízes expostas em primeiro plano.

---

## 2. Inimigo comum — Sprite Sussurrante

**ID no código**: `whisper_sprite` · **Arquivo sugerido**: `enemy_whisper_sprite.png`

> Um pequeno espírito etéreo feito de luz verde-clara e neblina, com forma humanoide vaga e translúcida, sem feições definidas além de dois pontos de luz onde ficariam os olhos. Parece um fragmento de vontade ainda se formando — frágil, ágil, quase transparente nas bordas, com pequenas partículas de luz se desprendendo do corpo.

## 3. Inimigo comum — Treantulho Espinhoso

**ID no código**: `thorned_treant` · **Arquivo sugerido**: `enemy_thorned_treant.png`

> Uma pequena criatura feita de casca de árvore nodosa e galhos espinhosos, do tamanho de um anão, com dois braços-galho grossos terminando em pontas afiadas. Musgo verde-escuro cobre parte do corpo, e dois olhos amarelo-âmbar brilham entre as fendas da casca. Postura robusta e teimosa, como se estivesse enraizado no lugar.

## 4. Inimigo comum — Coelho Feérico

**ID no código**: `fae_rabbit` · **Arquivo sugerido**: `enemy_fae_rabbit.png`

> Um coelho feérico esguio com pelagem branco-amarelada pontilhada de padrões dourados bioluminescentes, orelhas compridas com pontas em forma de folha, e pequenas asas de libélula translúcidas nas costas. Postura ágil, em pé sobre as patas traseiras como se estivesse prestes a saltar. Expressão levemente traquina.

## 5. Chefe de fase — Guardião do Sussurro

**ID no código**: `boss_whispering_warden` · **Arquivo sugerido**: `boss_whispering_warden.png`

> Um golem de madeira viva e musgo, maior e mais imponente que o Treantulho Espinhoso, com uma copa de árvore florida crescendo do topo da cabeça como uma coroa natural. Runas verde-esmeralda brilham fracamente entalhadas na casca do peito e dos braços. Postura de guardião — ereto, braços grossos cruzados ou levemente abertos, como se protegesse algo atrás de si. Presença solene, não hostil à primeira vista, mas claramente poderoso.

---

## 6. Companheiro/Pet — Sprite Lumen

**ID no código**: `sprite_lumen` · **Arquivo sugerido**: `pet_sprite_lumen.png`

> Uma pequena criatura voadora esférica, do tamanho de uma bola de tênis, feita de luz dourada suave e algumas partículas cintilantes orbitando ao redor do corpo. Duas asas pequenas e translúcidas de inseto nas costas. Sem boca ou nariz — apenas dois pontos de luz simples como olhos, expressão serena. Deve transmitir calor e proteção (tema: bônus de XP).

## 7. Companheiro/Pet — Moeda Alada

**ID no código**: `moeda_alada` · **Arquivo sugerido**: `pet_moeda_alada.png`

> Uma moeda antiga e desgastada, de ouro velho com runas gastas gravadas na superfície, flutuando com um par de pequenas asas emplumadas presas nas laterais como uma criatura viva. Um leve brilho âmbar/dourado emana das bordas da moeda. Deve transmitir sorte e fortuna (tema: bônus de Ouro).

---

## Observações para quando a arte estiver pronta

Cada sprite novo (itens 2-7) hoje usa uma textura placeholder reaproveitada de um sprite já existente no jogo (`enemy_goblin`, `enemy_wolf`, `enemy_imp`, `boss_forest_golem`). Depois que os arquivos finais forem gerados e salvos em `public/assets/` com os nomes sugeridos acima, será necessário um pequeno ajuste de código para:
1. Adicionar o `this.load.image(...)` de cada novo arquivo no `preload()` de `CombatScene.ts`.
2. Trocar o campo `texture` da entrada correspondente em `ENEMY_TYPES` (`CombatFSM.ts`) e em `PET_POOL` (`types.ts`) para a nova chave.

O background (item 1) hoje usa a chave `whispering_woods_background`, mas temporariamente carregada a partir do arquivo `medieval_background.png` (mesmo arquivo do fundo de Floresta, só como placeholder). Ao salvar a arte final como `public/assets/whispering_woods_background.png`, é preciso trocar esse caminho no `this.load.image('whispering_woods_background', ...)` de `CombatScene.ts` para apontar para o novo arquivo.
