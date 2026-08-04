# Planejamento — Redesign do Amuleto ("Oráculo Rúnico") e Rework do Anel

> Documento de design. Nenhuma linha de código foi alterada ainda — este arquivo serve de referência para a implementação futura.

## 1. Contexto e problema atual

Colar, amuleto e anel foram adicionados juntos num update anterior. A intenção original era que cada um tivesse uma identidade clara:

| Item | Intenção original | Estado atual |
|---|---|---|
| Colar | Utilidade / stats percentuais (várias opções) | ✅ Correto — `generateNecklaceStats` (`src/core/StatEngine.ts`) já rola 1-3 stats de um pool de utilidade (`damageMultiplierPct`, `maxHpPct`, `maxManaPct`, `attackSpeedPct`, `robotClicks`, `lifesteal`, `touchDamageMult`, `dropChancePct`, `damageReductionPct`, `frenzyChancePct`). |
| Amuleto | Item inicial simples, com só 1 atributo do tipo que existe no **colar** | ❌ Ficou igual ao anel: `generateAmuletStats` rola 1 stat de um pool minúsculo (`dropChancePct`, `critChance`, `lifesteal`) — não tem identidade própria, não usa runas, não tem tela dedicada. |
| Anel | (não definido claramente antes) | ❌ Não tem gerador dedicado. Usa o caminho genérico de peças pesadas em `CombatFSM.ts` (`possibleStatsMap` por classe), concedendo atributos primários **restritos à classe** do personagem. |

O sistema de runas atual (`src/core/runeFormulas.ts`) só socketa em `HEAVY_SLOTS = [head, chest, legs, gloves, weapon, ring]`, com no máximo 3 sockets por item (`MAX_SOCKETS_PER_ITEM = 3`). **Colar e amuleto não são socketáveis hoje.**

## 2. Objetivo desta atualização

1. Transformar o amuleto no item de **maior profundidade estratégica** do jogo, com tela própria e sistema de palavras rúnicas exclusivo, com até 6 espaços e efeitos que alteram ou adicionam habilidades do jogador (não só stats).
2. Criar uma nova estrutura na Cidadela Astral, responsável por gerenciar o amuleto.
3. Reformular o anel para virar o item "puro" de atributo primário: pool universal dos 6 atributos, independente de classe.
4. Manter o colar como está (já cumpre seu papel).

Sem migração de itens antigos — amuletos e anéis do sistema legado serão descartados manualmente pelo usuário; a implementação não precisa suportar o formato antigo.

## 3. Nova estrutura da Cidadela Astral — "Oráculo Rúnico"

- **Nome**: Oráculo Rúnico
- **Ícone de aba**: 🔮
- **Sub-aba nova** em `CITADEL_SUB_TABS` (`src/components/citadel/CitadelTabsBar.tsx`), painel próprio (`AmuletOraclePanel.tsx`) usando o wrapper comum `CitadelBuildingPanel.tsx` (mesmo header/botão de upgrade/estado bloqueado que as outras construções).
- **Tema visual**: torre-observatório mística, cristais flutuantes, constelações — condizente com o restante da Cidadela Astral (`cosmicSiphon`, `synchronyAltar`, etc.).
- **Função**: desbloqueia e amplia a tela de ativação do amuleto (ver seção 5). Sem o Oráculo construído, o amuleto equipado não tem efeito algum — ele só passa a funcionar quando o jogador consegue "consultar" a palavra rúnica na estrutura.

### 3.1 Níveis de upgrade (máx. 5)

Custos seguem o padrão de `citadelFormulas.ts` (`X_UPGRADE_COST(nextLevel)` em materiais do jogo — a definir valores exatos na implementação).

| Nível | O que libera |
|---|---|
| **1** (construção) | Acesso à tela do Oráculo. 3 dos 6 espaços de runa utilizáveis. Apenas Runas Astrais Tier 1. Palavras rúnicas de comprimento 3. |
| **2** | Libera o 4º espaço. Palavras de comprimento 4. Runas Astrais Tier 2 (drops de combate endgame). |
| **3** | Libera o 5º espaço. Palavras de comprimento 5. A estrutura passa a **produzir** lentamente Runas Astrais Tier 1-2 (produção passiva, tique a tique, como outras construções de produção da cidadela). |
| **4** | Libera o 6º espaço (círculo completo). Palavras de comprimento 6. Runas Astrais Tier 3 — exclusivas de drops em **Torre nível 100+** e **Pandemônio nível 50+**. |
| **5** (máximo) | Reduz custo/tempo de "ativação" da palavra rúnica. Libera efeito passivo residual (uma fração do bônus da palavra ativa continua valendo mesmo fora da tela, uma vez "consultada" pelo menos uma vez). Libera as **palavras rúnicas lendárias** — as que alteram/adicionam habilidades ativas, não só stats. |

### 3.2 Bônus de nível da estrutura (implementado — atualização pós-lançamento)

Além dos itens acima, o Oráculo concede um **bônus fixo e permanente da estrutura** (não do item Amuleto): traz de volta o antigo pool que o Amuleto dava antes do rework (Chance de Drop, Chance de Crítico ou Roubo de Vida — `AMULET_ORACLE_BUFF_POOL` em `citadelFormulas.ts`). Sorteado 1x na 1ª construção (nível 0→1) e só cresce de força com o nível (sem re-sortear a cada upgrade), vale mesmo sem nenhum amuleto equipado.

Para não deixar o stat sorteado "travado para sempre" caso o jogador não goste do resultado, existe um botão **"🎲 Rerolar Bônus"** no painel do Oráculo: custo alto em Ouro + Pérolas Abissais, escalando com o nível (`AMULET_ORACLE_REROLL_COST`), e o reroll sempre sorteia um stat **diferente** do atual (nunca repete por sorte azarado, já que o custo é alto).

## 4. Runas Astrais (novo catálogo, exclusivo do amuleto)

Arquivo novo sugerido: `src/core/astralRuneFormulas.ts`, paralelo ao `runeFormulas.ts` existente — **não reaproveita** o `RUNE_CATALOG` atual porque o foco temático é diferente (suporte/utilidade/habilidade, não dano bruto).

### 4.1 Fontes de obtenção (combinadas)

1. Drops de combate em conteúdo endgame (Abismo / Cidadela Submersa).
2. Produção lenta pela própria estrutura do Oráculo (a partir do nível 3).
3. Drops exclusivos em Torre nível 100+ e Pandemônio nível 50+ (Runas Tier 3).

### 4.2 Tiers

- **Tier 1** — runas básicas de suporte (ex.: pequenos bônus de regeneração, redução leve de cooldown). Disponíveis desde o nível 1 do Oráculo.
- **Tier 2** — runas intermediárias, com efeitos mais fortes ou modificadores de comportamento leves. Liberadas no nível 2.
- **Tier 3** — runas de altíssimo poder, exclusivas de conteúdo de fim de jogo (Torre 100+/Pandemônio 50+). Liberadas no nível 4 e usadas nas palavras lendárias do nível 5.

(Lista nominal de runas individuais — glifo, nome, efeito — fica para a fase de balanceamento numérico, fora do escopo deste documento.)

## 5. Tela de ativação do amuleto

Novo componente: `AmuletOraclePanel.tsx`, inspirado no fluxo de socket/picker do `EngravingChamberPanel.tsx` (câmara de gravação atual), mas com layout circular em vez de linear.

### 5.1 Layout

- Sprite do amuleto centralizado na tela.
- **6 espaços de runa** dispostos em círculo ao redor do amuleto (mesmo princípio de "colocar item na forja": clicar no espaço abre o seletor de runas astrais disponíveis).
- **1 espaço central**, maior, onde aparece a palavra rúnica resultante (nome + descrição do efeito) quando ativada.
- Espaços bloqueados (além do limite do nível atual do Oráculo) aparecem visualmente cadeados/apagados.

### 5.2 Fluxo de ativação

1. Jogador preenche os espaços desbloqueados com runas astrais do inventário.
2. Botão temático abaixo do sprite: **"Consultar o Oráculo"**.
3. Ao clicar:
   - Se a sequência de runas corresponde a uma Palavra Rúnica Astral válida: linhas conectando cada espaço preenchido até o centro se acendem (uma a uma ou em conjunto, para dar impacto visual); o espaço central exibe nome e efeito da palavra ativa.
   - Se não corresponde a nenhuma palavra: linhas permanecem apagadas/cinzas; o centro mostra "Nenhuma palavra reconhecida".
4. A palavra ativa permanece em vigor até o jogador trocar as runas e consultar novamente (ou, a partir do nível 5 do Oráculo, deixa um efeito residual mesmo depois de retirado — ver seção 3.1).

## 6. Palavras Rúnicas Astrais (`ASTRAL_RUNEWORD_CATALOG`)

Sequências de **3 a 6 runas**, ocupando parte ou a totalidade dos 6 espaços — diferente do sistema de runewords atual, que é sempre de tamanho fixo (até 3). Cada palavra tem:

- Sequência exigida (lista ordenada de Runas Astrais).
- Descrição do efeito.
- Nível mínimo do Oráculo necessário para ser reconhecida.

Direção de design para os efeitos — diferente do `RUNEWORD_CATALOG` atual (que só dá `statBonuses`), aqui o foco é **alterar ou adicionar habilidades do jogador**:

- **Palavras de comprimento 3-4** (Tier 1-2, níveis 1-3 do Oráculo): efeitos moderados — reduzir cooldown de uma habilidade de classe, adicionar um efeito secundário simples a um ataque existente (ex.: chance de aplicar um debuff), pequenos bônus passivos combinados.
- **Palavras de comprimento 5** (Tier 2-3, nível 3-4): efeitos mais fortes — modificar o comportamento de uma habilidade existente (ex.: ataque em área em vez de single-target), bônus passivo secundário relevante.
- **Palavras de comprimento 6, lendárias** (Tier 3, exclusivas do nível 5 do Oráculo): concedem uma **habilidade ativa inteiramente nova**, exclusiva de quem tem a palavra ativa — o efeito mais marcante do sistema.

A lista nominal de 6-8 receitas específicas (nomes, sequências exatas, efeitos numéricos) é trabalho de balanceamento e fica para uma etapa de implementação futura — este documento define a estrutura e as regras do sistema.

## 7. Rework do Anel

- Novo gerador dedicado: `generateRingStats` (substitui o caminho genérico por classe usado hoje em `CombatFSM.ts`).
- **Pool universal dos 6 atributos**: Força, Magia, Destreza, Constituição, Sorte, Toque — qualquer classe pode rolar qualquer um deles, sem restrição.
- **1 atributo por anel** (não múltiplos, para manter simplicidade e forçar decisões de build).
- Para compensar ser só 1 stat, o valor rolado vem com **o dobro da escala** normal de outras peças (ex.: se uma peça comum rolaria X de Força, o anel rola 2X).
- **Regra de fusão**: dois anéis só podem ser fusionados na Forja se tiverem **o mesmo atributo**. Não é possível fusionar um anel de Força com um de Sorte, por exemplo — isso preserva a escala dobrada como uma vantagem de "anel puro" em vez de virar um sistema de mistura livre.

## 8. Colar — sem mudanças

O colar já cumpre corretamente seu papel de item de utilidade percentual (`generateNecklaceStats`). Mantido como está, sem alterações. Serve de contraste claro com os outros dois:

- **Colar** = utilidade / stats percentuais.
- **Amuleto** = habilidades, via Palavras Rúnicas Astrais na tela do Oráculo.
- **Anel** = atributo primário puro, em dobro, independente de classe.

## 9. Impacto técnico esperado (para a fase de implementação)

Lista de arquivos que precisarão mudar — **não implementado nesta etapa**:

- `src/core/types.ts` — novos campos em `EquipmentItem` (ex. runas astrais equipadas no amuleto) e em `CitadelState` (estado da nova construção).
- `src/core/astralRuneFormulas.ts` (novo) — catálogo de Runas Astrais e Palavras Rúnicas Astrais.
- `src/core/citadelFormulas.ts` — custos/níveis do Oráculo Rúnico.
- `src/components/citadel/citadelBuildingSprites.ts` — registro do sprite `citadel_runicOracle.png`.
- `src/components/citadel/CitadelTabsBar.tsx` — nova sub-aba.
- `src/components/citadel/AmuletOraclePanel.tsx` (novo) — tela de ativação circular do amuleto.
- `src/core/StatEngine.ts` — `generateRingStats` (novo), remoção/ajuste de `generateAmuletStats`.
- `src/core/CombatFSM.ts` — taxas de drop, remoção do amuleto do `possibleStatsMap` genérico, drops de Runas Astrais em Torre 100+/Pandemônio 50+.
- Lógica de fusão da Forja (`ForgeView.tsx` / `getMergedStatsPreview`) — nova regra de restrição por atributo igual para anéis.

## 10. Verificação

Etapa atual é só documentação. Verificação: este arquivo e `Sprites_Necessarios.md` cobrem todos os pontos definidos e alinhados com o usuário; revisão do conteúdo antes de iniciar qualquer implementação de código em uma tarefa futura.
