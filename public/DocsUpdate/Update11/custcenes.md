# Plano de Implementação: Cutscenes Narrativas Sequenciais de Atos (v11.1.0)

Este plano detalha o design técnico e a implementação das **Cutscenes Narrativas Estilo Visual Novel / RPG** para os 6 Atos da história do jogo. As cenas contarão a narrativa do universo através de diálogos sequenciais, retratos e artes dos NPCs, tela de fundo escurecida para foco dramático e pausa automática do combate durante a exibição.

---

## Estrutura do Sistema Narrativo

```mermaid
graph TD
    Trigger[Evento de Início ou Conclusão de Ato] --> Store[useQuestStore.playActCutscene(act)]
    Store --> Pause[Pausa o Combate: GameEvent.END_COMBAT]
    Store --> Component[Renderiza ActCutsceneOverlay]
    Component --> Render[Fundo Escurecido + Sprites de NPCs + Caixa RPG]
    Component --> Interaction[Avanço de Linhas / Efeito Máquina de Escrever / Pular]
    Interaction --> Finish[Conclusão: markActCutsceneSeen(act)]
    Finish --> Resume[Retoma o Combate: GameEvent.START_COMBAT]
```

---

## Detalhamento das Alterações

### 1. Catálogo de Cenas por Ato (`src/core/quests/storyCutscenesData.ts`)
- Criar a definição de dados para as cutscenes de cada Ato (Atos I a VI).
- Estrutura de cada linha de diálogo:
  - `speakerId`: ID do NPC (ex: `alma_mundo`, `valeria`, `vulkan`, `wanderer`, `avatar_echo`, `sunken_castellan`).
  - `speakerName`: Nome do personagem em destaque.
  - `factionColor`: Cor temática da facção/personagem.
  - `text`: Texto narrativo do diálogo.
  - `portraitPlaceholder`: Ícone/Sprite placeholder de alta qualidade enquanto as ilustrações finais não estiverem prontas.
  - `backgroundStyle`?: Variação temática sutil (ex: brilho astral, cinzas de obsidiana, nevoeiro abissal).

### 2. Gerenciamento de Estado (`src/store/useQuestStore.ts`)
- Adicionar ao estado:
  - `seenActCutscenes: number[]`: Registro persistente dos Atos cujas cenas já foram assistidas (`[1, 2, ...]`).
  - `activeActCutscene: ActCutsceneDef | null`: Cutscene atualmente em exibição na tela.
- Ações:
  - `playActCutscene(act: number)`: Define a cena ativa e emite `GameEvent.END_COMBAT` para pausar os monstros e o herói.
  - `finishActCutscene()`: Registra o Ato como visto, limpa a cena ativa, salva a store e emite `GameEvent.START_COMBAT`.

### 3. Componente Visual de Cutscene (`src/components/ActCutsceneOverlay.tsx`)
- Overlay fixo (`position: fixed, inset: 0, zIndex: 99999`) com fundo escurecido (`rgba(8, 6, 12, 0.88)` e `backdropFilter: blur(8px)`).
- **Ilustração de Retrato / Sprite do NPC**:
  - Container posicionado acima da caixa de diálogo com bordas em gradiente e efeito de brilho da facção.
  - Suporte a imagem real (`/assets/npc_[id].png`) com fallback automático para avatar/emoji temático placeholder.
- **Caixa de Diálogo Estilo RPG**:
  - Posicionada na parte inferior da tela, estilizada com bordas em gradiente e indicador de linha atual (`Linha X / Y`).
  - **Efeito Máquina de Escrever**: Exibição letra por letra do texto com velocidade ajustada. Clique na tela durante a digitação completa o parágrafo instantaneamente.
  - Botão de controle **"Avançar ➔"** e suporte a clique em qualquer área do diálogo / tecla Espaço.
  - Botão **"Pular Cena ⏩"** no canto superior direito para jogadores experientes.

### 4. Gatilhos de Disparo Automático e Re-exibição
1. **Cena Inicial do Ato I**: Ao iniciar um novo jogo / concluir o guia inicial, se o Ato I ainda não foi visto (`!seenActCutscenes.includes(1)`), a cutscene do Ato I é disparada automaticamente antes do combate iniciar.
2. **Cenas dos Atos Seguintes (Atos II a VI)**: Ao reivindicar a recompensa da última missão do Ato $N$ (`claimReward`), se o Ato $N+1$ estiver desbloqueado e sua cena ainda não tiver sido vista, ela é disparada imediatamente com o combate pausado.
3. **Rever Cenas no Diário da Jornada / Codex**: Na aba da Jornada Principal (`QuestLogPanel.tsx`), adicionar um botão **"🎬 Rever Cena do Ato"** ao lado de cada Ato desbloqueado.

---

## User Review Required

> [!IMPORTANT]
> **Placeholders Visuais**: Como os sprites definitivos dos NPCs serão entregues amanhã, o componente utilizará avatares e emblemas temporários estilizados com cores de facção e sombras. Assim que os arquivos `.png` forem adicionados à pasta `public/assets/`, eles serão carregados automaticamente pelo componente sem necessidade de alterar o código.

---

## Proposed Changes

### Core & Data

#### [NEW] [storyCutscenesData.ts](file:///c:/Users/amaro/Documents/AmaroRpgIdle/src/core/quests/storyCutscenesData.ts)
- Definir interfaces `CutsceneLine` e `ActCutsceneDef`.
- Escrever os roteiros completos de diálogos para os Atos I, II, III, IV, V e VI.

#### [MODIFY] [useQuestStore.ts](file:///c:/Users/amaro/Documents/AmaroRpgIdle/src/store/useQuestStore.ts)
- Adicionar os campos `seenActCutscenes` e `activeActCutscene`.
- Implementar as ações `playActCutscene` e `finishActCutscene`.
- Integrar disparo automático de cutscenes ao concluir missões finais de Ato em `claimReward`.

---

### Interface do Usuário (UI)

#### [NEW] [ActCutsceneOverlay.tsx](file:///c:/Users/amaro/Documents/AmaroRpgIdle/src/components/ActCutsceneOverlay.tsx)
- Criar o componente completo de Cutscene RPG (overlay escurecido, sprites de NPCs, caixa de diálogo, máquina de escrever, botões de avanço e pular).

#### [MODIFY] [GameUI.tsx](file:///c:/Users/amaro/Documents/AmaroRpgIdle/src/components/GameUI.tsx)
- Renderizar `<ActCutsceneOverlay />` no nível superior do HUD.

#### [MODIFY] [QuestLogPanel.tsx](file:///c:/Users/amaro/Documents/AmaroRpgIdle/src/components/QuestLogPanel.tsx)
- Adicionar botão **"🎬 Rever Cena"** nos cabeçalhos dos Atos da Jornada Principal.

---

## Verification Plan

### Automated Tests
- Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

### Manual Verification
- O usuário realizará a verificação dos testes e interações em tela conforme alinhado anteriormente.
