# Sprites Necessários — Atualização do Amuleto ("Oráculo Rúnico")

> Especificação de assets para gerar no Antigravity. Segue as convenções já usadas em `public/assets/` (nomenclatura, resolução, grid de evolução).

## 1. Sprite da construção — "Oráculo Rúnico"

- **Nome de arquivo**: `citadel_runicOracle.png`
- **Formato**: grid **2×2** de **1024×1024** no total (cada quadrante = 512×512, um estágio de evolução), mesmo padrão consumido por `EvolutionSprite.tsx` e os demais arquivos `citadel_*.png` já existentes em `public/assets/`.
- **Conteúdo dos 4 quadrantes** (estágios de evolução do prédio, do nível mais baixo ao mais alto):
  1. **Estágio 1** (recém-construído): estrutura simples e modesta — uma pequena torre ou plataforma de pedra com um único cristal flutuante fraco pairando acima.
  2. **Estágio 2**: estrutura cresce — torre mais alta, 2-3 cristais menores orbitando, brilho sutil azul-arroxeado começando a aparecer.
  3. **Estágio 3**: estrutura elaborada — anéis de pedra ou runas gravadas na base, mais cristais orbitando, feixes de luz astral saindo do topo.
  4. **Estágio 4** (nível máximo): estrutura grandiosa — torre-observatório mística completa, constelações visíveis ao redor, múltiplos cristais orbitando em anéis concêntricos, forte brilho astral (roxo/azul/dourado).
- **Direção de arte geral**: tema místico/astral consistente com o restante da Cidadela Astral (torre-observatório, cristais flutuantes, constelações, partículas de luz). Deve se diferenciar visualmente de construções já existentes como `cosmicSiphon` e `synchronyAltar` — pensar nesta como um "observatório de oráculos", com elementos de adivinhação/revelação (ex. um olho estilizado, runas gravadas, um portal circular no topo).
- **Paleta esperada**: tons de roxo e azul profundo com destaques dourados/prateados para o brilho astral, alinhado com a paleta já usada nos outros assets da Cidadela Astral.

## 2. Sprite do amuleto — tela de ativação

- **Nome de arquivo sugerido**: `amulet_oracle_frame.png` (estado inerte) + `amulet_oracle_frame_active.png` (estado ativado).
- **Descrição visual**:
  - Amuleto circular grande, centralizado na composição, ocupando a maior parte do quadro.
  - **6 encaixes de runa** visíveis e equidistantes ao redor da borda externa do amuleto (formando um círculo) — cada um deve parecer um "slot" vazio nítido, pronto para receber o glifo de uma runa (semelhante em função aos sockets de itens na Câmara de Gravação, mas dispostos em círculo em vez de em linha).
  - **1 espaço central**, maior e visualmente destacado (uma gema ou moldura central diferente dos 6 encaixes periféricos) — é onde a "palavra rúnica" ativa será exibida em texto/ícone sobreposto pelo código.
  - Deixar espaço visual limpo entre cada encaixe periférico e o centro, pois **linhas de conexão serão desenhadas via código** (não fazem parte do sprite) ligando cada encaixe preenchido ao centro.
- **Dois estados de referência a gerar**:
  1. **Inerte**: cores neutras/foscas (cinza-azulado, prata opaca), sem brilho, encaixes vazios ou com runas "apagadas".
  2. **Ativado**: brilho dourado/astral pulsante, encaixes preenchidos com glifos acesos, espaço central brilhando fortemente — referência de como o "acender" da palavra rúnica deve parecer quando o jogador clica em "Consultar o Oráculo" e a sequência é válida.
- **Formato/resolução**: quadrado, resolução sugerida 1024×1024 (mesma escala dos demais assets de UI/item do projeto). ~~Fundo transparente (PNG)~~ — **correção pós-entrega**: como a IA de geração não produz alpha real, os dois arquivos foram entregues com fundo em chroma key `#FE0201` (igual ao padrão dos sprites de construção/runas), removido em runtime pelo mesmo pipeline (`imageBackgroundStrip.ts`/`getTransparentImageUrl`), com pré-carregamento no `App.tsx` para não aparecer o fundo vermelho piscando na 1ª renderização.

## 3. Ícones das Runas Astrais (`ASTRAL_RUNE_CATALOG`, 9 runas)

Hoje as 9 Runas Astrais (ver `src/core/astralRuneFormulas.ts`) renderizam via glifo Unicode + cor de fundo em CSS (fase de lançamento, custo zero de arte) — o mesmo esquema em duas fases já usado pelas Runas Abissais do sistema de soquetes pesado (Seção 1.6 de `Assets_UI_e_Cutscene.md`). Esta seção é a spec da **fase de arte definitiva**, seguindo EXATAMENTE aquele padrão 3×3 (não o 2×2 de evolução de construção):

- **Arquivo**: `runes_astral.png` — um único arquivo cobrindo as 9 runas (diferente do sistema pesado, que precisou de 2 arquivos por ter 18+9; aqui 9 cabem numa única grade).
- **Formato**: 1024×1024, grade **3×3** (9 células de ~341×341px), uma runa por célula, **ordem de leitura em linha** (esquerda→direita, cima→baixo — sem ordem diagonal, que é exclusiva de spritesheets de evolução de construção). Chroma key de fundo `#FE0201` (tolerância 50), contorno preto fino ao redor de cada glifo — processado pelo mesmo pipeline (`imageBackgroundStrip.ts`/`getTransparentImageUrl`) já usado por `runes_base.png`/`runes_primordial.png`.
- **Direção de arte geral**: tema astral/celestial (constelações, luz estelar, cristal, revelação) — para se diferenciar claramente das Runas Abissais existentes (tema aquático/orgânico: sangue, maré, sal, vazio). Cada célula deve ler como um selo ou constelação estilizada, não um ícone realista.

| Célula (linha, col) | Runa (id) | Tier | Glifo atual (referência CSS) | Cor de fundo | Direção de arte |
| :--- | :--- | :---: | :---: | :--- | :--- |
| (1,1) | Eco da Regeneração (`ecoRegen_t1`) | 1 | ✦ | `#22c55e` verde | Estrela de 4 pontas com pequenas gotas/folhas orbitando — vitalidade e renovação |
| (1,2) | Passo Leve (`passoLeve_t1`) | 1 | ✧ | `#38bdf8` azul-claro | Estrela vazada com um rastro/vento espiralado atrás — velocidade e reflexo |
| (1,3) | Olho Astral (`olhoAstral_t1`) | 1 | ✩ | `#a78bfa` roxo-claro | Estrela de 5 pontas com um olho estilizado no centro — percepção e sorte |
| (2,1) | Maré Psíquica (`marePsiquica_t2`) | 2 | ✪ | `#818cf8` índigo | Estrela circular com ondas concêntricas ao redor (mente/mana) |
| (2,2) | Chama Interior (`chamaInterior_t2`) | 2 | ✫ | `#f97316` laranja | Estrela com pequenas línguas de fogo contidas dentro do contorno (fúria contida, não explosiva) |
| (2,3) | Véu Sombrio (`veuSombrio_t2`) | 2 | ✬ | `#6d28d9` roxo-escuro | Estrela parcialmente coberta por um véu/sombra estilizado — evasão e dissimulação |
| (3,1) | Coroa Estelar (`coroaEstelar_t3`) | 3 | ✭ | `#facc15` dourado | Estrela grande com pequenos raios/coroa ao redor — poder de fim de jogo, Torre 100+ |
| (3,2) | Pulsar do Vazio (`pulsarVazio_t3`) | 3 | ✮ | `#e879f9` magenta | Estrela com anéis de energia pulsante ao redor, núcleo escuro — Pandemônio 50+ |
| (3,3) | Graal do Oráculo (`graalOraculo_t3`) | 3 | ✯ | `#fbbf24` âmbar | Estrela envolvendo um pequeno cálice/taça estilizado — a mais rara, tema de revelação |

**Nota de integração do componente**: o recorte por índice (célula → posição) é o mesmo problema já resolvido para as Runas Abissais — reaproveitar o componente trivial `IconSprite.tsx` já proposto (Seção 1.6 de `Assets_UI_e_Cutscene.md`, "primo do `EvolutionSprite`, recorte por índice em vez de por nível") para servir também `runes_astral.png`, sem precisar de um componente novo.

## 4. Notas de integração

- Salvar os arquivos finais em `public/assets/`, seguindo a mesma pasta usada por todos os outros sprites do jogo.
- Nomenclatura final deve respeitar as convenções já existentes: prefixo `citadel_` para construções da Cidadela Astral, sem prefixo genérico para o sprite de item/tela do amuleto (`amulet_oracle_*`), e `runes_astral.png` para o spritesheet de ícones (paralelo a `runes_base.png`/`runes_primordial.png`).
- O grid 2×2 do prédio deve ser entregue como um único arquivo PNG (não 4 arquivos separados), pois é assim que `EvolutionSprite.tsx` espera consumir os demais `citadel_*.png`.
- Paleta e estilo devem conversar com os assets já existentes da Cidadela Astral para manter consistência visual entre construções.
- A troca do glifo CSS pelo `runes_astral.png` fica para quando a arte estiver pronta — mesma estratégia em 2 fases já usada pelas Runas Abissais (nenhuma mudança de código é necessária nesta etapa, só a especificação).
