<div align="center">

# ⚔️ Amaro RPG Idle 🛡️

**Um RPG Idle (incremental) de fantasia sombria medieval, com combate automático em Phaser 3, progressão Roguelite profunda e uma interface rica construída em React + TypeScript.**

![Version](https://img.shields.io/badge/vers%C3%A3o-7.0.0-a855f7?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-3-8B5CF6?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Zustand](https://img.shields.io/badge/state-Zustand-2b2b2b?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat-square)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento%20ativo-brightgreen?style=flat-square)

</div>

---

## 📖 Sobre o Jogo

**Amaro RPG Idle** é um jogo de progressão incremental ("idle/clicker") ambientado no **Ciclo da Alma Partida**: uma única Alma-Mundo que se fragmentou em seis Ecos — as classes jogáveis — deixando para trás um Vazio que dá origem a todos os monstros do jogo. O jogador assume um desses Ecos, avança por biomas cada vez mais hostis em combate automático, morre e "Ascende" repetidas vezes (roguelite de prestígio), constrói uma base persistente (a Cidadela Astral) e, no fim, tenta romper de vez o ciclo através da Transcendência.

Toda a lore do universo — cosmologia, facções, biografias de chefes, biologia das criaturas e a linha do tempo dos eventos — está catalogada dentro do próprio jogo na aba **Codex** (`src/core/codexData.ts` + `src/components/CodexPanel.tsx`).

---

## 📑 Índice

- [Funcionalidades Principais](#-funcionalidades-principais)
- [Stack Tecnológica](#️-stack-tecnológica)
- [Arquitetura da Aplicação](#-arquitetura-da-aplicação-ponte-de-alta-performance)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Rodar o Projeto Localmente](#-como-rodar-o-projeto-localmente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Progressive Web App (PWA)](#-progressive-web-app-pwa--instalação-mobile)
- [Persistência e Saves](#-persistência-e-saves)
- [SEO e Compartilhamento](#-otimização-de-seo-search-engine-optimization)
- [Roadmap e Changelog](#-roadmap-e-changelog)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎮 Funcionalidades Principais

### Combate e Progressão
- **Combate automático sidescrolling (Phaser 3):** batalhas contínuas contra monstros normais e chefes, organizadas em fases incrementais que atravessam múltiplos biomas temáticos (Bosque Sussurrante, Floresta Antiga, Deserto de Ouro, Picos Glaciais, Cemitério Maldito, Ruínas Sombrias e o Purgatório).
- **Eventos dinâmicos por calendário real:** **Lua de Sangue** nos finais de semana (inimigos fortalecidos e loot exclusivo), inimigos de **Elite** com afixos aleatórios, e a **Convergência** — um chefe mundial que rotaciona semanalmente entre 4 formas, disponível apenas às quartas-feiras.
- **Torre Infinita:** desafio à parte com três variantes — Torre Normal (progressão pura andar a andar), Ramificação de Maldições (roguelike com runs aleatórias) e Provações do Vácuo (desafio sem fim pós-Transcendência).

### Classes e Habilidades
- **8 classes jogáveis** organizadas em uma árvore de evolução: **Guerreiro, Mago e Arqueiro** (classes iniciais) evoluem para **Paladino, Clérigo e Ladrão** ao atingir Nível 50; **Necromante** é desbloqueado ao levar Clérigo *e* Ladrão a Nível 50 (rastreado globalmente entre saves); e **Avatar**, a classe suprema pós-Transcendência, une os cinco atributos cardinais.
- **Árvore de Habilidades gráfica e interativa** por classe, com habilidades ativas e passivas, pré-requisitos, níveis incrementais e uma habilidade Ultimate exclusiva por classe.

### Equipamento e Economia
- **Sistema de equipamentos com raridades** (Comum → Raro → Épico → Lendário → Místico), sets temáticos com bônus por número de peças equipadas e slots dedicados para colar, amuleto, anel e Relíquia Ativa.
- **Forja Mística:** funde equipamentos do mesmo tipo para elevar a raridade e acumular níveis místicos (*Místico +1*, *+2*...).
- **Relíquias Ativas** (habilidades equipáveis com cooldown próprio) e **Relíquias Passivas** (upgrades permanentes forjados no Laboratório de Relíquias a partir de Fragmentos de Alma Instável).
- **Loja** e **Mercador Ambulante** — NPC itinerante que aparece aleatoriamente em combate vendendo Elixires temporários.

### Roguelite e Endgame
- **Ascensão (Prestígio):** reinicia o progresso em troca de Pontos de Prestígio para upgrades permanentes em uma árvore no formato diamante.
- **Modo Pandemônio:** fases sem fim desbloqueadas após vencer o Purgatório, com dificuldade crescente e adaptativa.
- **Transcendência & Ecoterra:** camada de prestígio acima da Ascensão, que desbloqueia um reflexo mais intenso de todos os biomas já conhecidos e uma árvore própria de melhorias permanentes.

### Cidadela Astral (Base de Operações)
Hub persistente entre incursões com 10 alas funcionais: **Depósito**, **Quartel de Expedições** (envia personagens em missões paralelas), **Academia Militar** (pesquisas permanentes), **Torre de Vigia** (chaves da Torre Infinita), **Oficina da Forja**, **Sifão Cósmico**, **Altar de Sincronia** (rituais de Pandemônio e Transcendência), **Laboratório de Relíquias**, **Laboratório de Alquimia** (poções sob demanda) e o **Santuário de Contratos de Caça** (contratos rotativos de abate).

### Bestiário e Codex
- **Bestiário:** cataloga toda criatura derrotada, revela arte e lore ao atingir o número de abates necessário, e concede um **bônus permanente de dano** (até **+71%** com todas as fases — incluindo o Bosque Sussurrante — 100% completas).
- **Codex (`📖`):** enciclopédia interna com mais de 80 entradas de lore organizadas em 6 categorias — Cosmologia, Facções, Personagens, Biologia (Bestiário), Eventos Históricos e Locais — com um modelo híbrido de desbloqueio (lore fundacional sempre visível, biografias e capítulos avançados revelados por progresso).

### Interface e Acessibilidade
- **Layout mobile-first responsivo:** canvas Phaser redimensionado na proporção `4:3`, navegação por abas em carrossel com suporte a toque (*swipe*) e reposicionamento automático de UI em telas pequenas.
- **Guia in-game:** tutorial completo com explicações de classes e de cada sistema do jogo.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| **Core** | React 18 · TypeScript 5 · Vite 5 |
| **Motor gráfico** | Phaser 3 (renderização Canvas e física do combate sidescrolling) |
| **Gerenciamento de estado** | Zustand (`useGameStore`, `useRelicStore`, `useTowerStore`) |
| **Estilização** | CSS3 vanilla com Design System via variáveis CSS (tema Dark Fantasy, glassmorphism, animações) |
| **Persistência** | `localStorage` do navegador, com múltiplos slots de save |
| **Distribuição** | Progressive Web App (Service Worker + Web App Manifest) |

---

## 📐 Arquitetura da Aplicação (Ponte de Alta Performance)

O jogo usa o padrão **Bridge (Ponte de Eventos)**, implementado na classe [`GameBridge`](src/bridge/GameBridge.ts), para comunicação bidirecional de baixíssima latência entre a simulação do Phaser 3 e a interface React:

1. **Phaser → React:** o motor do jogo emite eventos (dano, ganho de ouro/XP, cooldowns, drops) e a UI reage em tempo real.
2. **React → Phaser:** cliques em habilidades/relíquias na UI disparam eventos que a cena ativa do Phaser consome para executar efeitos visuais e o dano correspondente.
3. **Atualização direta do DOM:** status de altíssima frequência (barras de HP/Mana) contornam o ciclo de renderização do React e escrevem diretamente nos elementos do DOM, garantindo 60 FPS estáveis mesmo em aparelhos mais antigos.

A camada de domínio (regras de combate, cálculo de atributos, catálogos de itens/inimigos/habilidades) vive isolada em `src/core/`, sem nenhuma dependência de React — apenas lógica pura consumida pelas stores e componentes.

---

## 📂 Estrutura do Projeto

```
src/
├── App.tsx                # Roteamento de telas (menu, seleção de personagem, saves, jogo) + montagem do Phaser
├── main.tsx                # Entry point React
├── bridge/
│   └── GameBridge.ts        # Ponte de eventos Phaser ↔ React
├── core/                     # Lógica de domínio pura (sem React)
│   ├── types.ts               # Tipos e interfaces compartilhados
│   ├── CombatFSM.ts            # Máquina de estados de combate, catálogo de inimigos e relíquias
│   ├── StatEngine.ts            # Cálculo de atributos finais, sets e bônus do bestiário
│   ├── XpEngine.ts               # Curvas de XP e prestígio
│   ├── citadelFormulas.ts         # Fórmulas de produção da Cidadela
│   └── codexData.ts                # Catálogo de lore do Codex
├── store/                     # Estado global (Zustand)
│   ├── useGameStore.ts          # Personagem, classes, habilidades, upgrades de prestígio/transcendência
│   ├── useRelicStore.ts          # Relíquias passivas do Altar
│   └── useTowerStore.ts           # Estado da Torre Infinita
├── components/                # Interface React
│   ├── GameUI.tsx                # Hub principal de abas e painéis do jogo
│   ├── CodexPanel.tsx             # Enciclopédia de lore
│   ├── citadel/                    # Painéis de cada ala da Cidadela Astral
│   └── shared/                      # Componentes e helpers visuais reutilizáveis
├── phaser/
│   └── scenes/CombatScene.ts       # Cena de combate Phaser
└── hooks/                     # Hooks utilitários (hold-repeat, countdown, wake lock)
```

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18 ou superior
- npm (instalado junto com o Node.js)

### 1. Clonar o repositório
```bash
git clone https://github.com/AmaroCostaPRO/AmaroRpgIdle.git
cd AmaroRpgIdle
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O console exibirá o link local (geralmente `http://localhost:5173/`). Abra-o no navegador.

### 4. Gerar a build de produção
```bash
npm run build
```
Os arquivos otimizados para hospedagem estática são gerados em `/dist`.

### 5. Pré-visualizar a build de produção localmente
```bash
npm run preview
```

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite com hot-reload. |
| `npm run build` | Roda a checagem de tipos (`tsc`) e gera a build de produção otimizada. |
| `npm run preview` | Serve localmente a build de produção já gerada, para testes finais. |

---

## 📱 Progressive Web App (PWA) & Instalação Mobile

O jogo é compatível com a especificação **PWA**, permitindo instalação direto na tela inicial do celular ou desktop:

1. **[`manifest.json`](public/manifest.json):** inicialização em modo `standalone` (sem as barras do navegador), cor de tema `#0b0f19` e orientação preferencial em retrato (`portrait-primary`).
2. **[`sw.js`](public/sw.js) (Service Worker):** estratégia **Network-First** com fallback de cache local — novos patches carregam imediatamente quando há conexão, e o jogo continua jogável offline quando não há.
3. **Instalabilidade:** no Chrome/Android o navegador exibe o banner nativo de instalação; no iOS/Safari, o usuário instala via "Compartilhar" → "Adicionar à Tela de Início".

---

## 💾 Persistência e Saves

O progresso é salvo automaticamente no `localStorage` do navegador, com suporte a **múltiplos slots de save** (gerenciados em `src/components/SavesMenu.tsx`), permitindo manter personagens de classes diferentes em paralelo. Alguns marcos de progresso (como o nível máximo já alcançado por classe) são rastreados **globalmente entre todos os saves** do mesmo navegador, e não apenas no save ativo.

---

## 🔍 Otimização de SEO (Search Engine Optimization)

A estrutura de metadados foi otimizada para indexabilidade e compartilhamento social:
- **Metadados primários:** título otimizado, descrição com as palavras-chave do gênero (RPG Idle, incremental, dark fantasy, clicker) e idioma definido como `pt-BR`.
- **Open Graph e Twitter Cards:** cards enriquecidos ao compartilhar o link em Discord, WhatsApp, Twitter/X e Facebook.

---

## 🗺️ Roadmap e Changelog

O histórico técnico detalhado de cada versão (mudanças, balanceamento e decisões de design) é mantido em [`Manual Técnico Amaro RPG Idle.md`](Manual%20T%C3%A9cnico%20Amaro%20RPG%20Idle.md). O jogo está em desenvolvimento ativo, com novo conteúdo lançado em ciclos temáticos que expandem tanto a jogabilidade quanto a lore do Ciclo da Alma Partida — consulte a aba **Codex** dentro do próprio jogo para acompanhar a cronologia narrativa de cada atualização.

---

## 🤝 Contribuindo

Este é atualmente um projeto pessoal de desenvolvimento solo. Sugestões, relatos de bugs e ideias são bem-vindos através das [Issues](https://github.com/AmaroCostaPRO/AmaroRpgIdle/issues) do repositório. Se for propor uma mudança maior, abra uma issue antes para alinhar o escopo antes de investir tempo em um Pull Request.

---

## 📄 Licença

Todos os direitos reservados. Este repositório é privado/proprietário (ver `"private": true` em [`package.json`](package.json)) e não possui, no momento, uma licença open source formal — o código não deve ser redistribuído ou reutilizado sem autorização do autor.

---

<div align="center">

Desenvolvido por **Amaro** — um projeto de RPG Idle construído com React, TypeScript e Phaser 3.

</div>
