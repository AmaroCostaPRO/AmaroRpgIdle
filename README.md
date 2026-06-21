# Amaro RPG Idle ⚔️🛡️

Um jogo de RPG Idle (incremental) com estética AAA Dark Fantasy Medieval. Apresenta mecânicas Roguelite de progressão, combate contínuo automatizado desenvolvido em Phaser 3 e uma interface de usuário rica e moderna construída em React.

---

## 🎮 Funcionalidades Principais

* **Combate Sidescrolling (Phaser 3):** Combates automáticos fluidos contra monstros normais e chefes, divididos em estágios incrementais (Fase 1 a 10).
* **Seis Classes Disponíveis:**
  * **Guerreiro:** Combatente corporal robusto (dano baseado em Força).
  * **Mago:** Conjurador de magias destrutivas arcanas e de fogo (dano baseado em Magia).
  * **Arqueiro:** Atirador ágil de flechas precisas e venenosas (dano baseado em Destreza).
  * **Paladino:** Guerreiro sagrado defensor da luz (dano baseado em Constituição).
  * **Clérigo:** Servo divino que cura ferimentos e bane infiéis (dano baseado em Magia).
  * **Ladrão:** Assassino furtivo focado em acertos críticos letais (dano baseado em Destreza).
* **Árvore de Habilidades:** Árvore gráfica interativa em React para desbloquear e aprimorar até 6 habilidades ativas e passivas específicas por classe (com caminhos de pré-requisitos e ramificações).
* **Ascensão Roguelite (Prestígio):** Reinicie seu nível e fase atual em troca de Pontos de Prestígio (Almas) para adquirir melhorias permanentes em atributos na árvore com layout de diamante.
* **Bestiário (Álbum de Monstros):** Sistema de álbum de figurinhas onde monstros e chefes de cada fase são catalogados. Ao derrotar um monstro 10 vezes (ou um chefe 3 vezes), a silhueta esmaecida revela a arte em cores e desbloqueia dados ricos sobre seus atributos, multiplicadores e descrição narrativa.
* **Layout Mobile Responsivo:** Redimensionamento inteligente do Canvas Phaser na proporção nativa de `4:3` (`100vw` de largura por `75vw` de altura) e reposicionamento vertical automático da interface de menus abaixo do jogo em telas móveis com suporte a toque (touch) ergonômico e deslizamento (scroll) horizontal fluido.

---

## 🛠️ Stack Tecnológica

* **Core:** React 18, TypeScript, Vite.
* **Motor Gráfico:** Phaser 3 (Canvas e física de combate sidescrolling).
* **Estilização:** CSS3 Vanilla com variáveis de Design System (tema Dark Fantasy, Glassmorphism, sombreados brilhantes e animações dinâmicas).
* **Gerenciamento de Estado:** Zustand (para saves do personagem, atributos, estágios e progresso da árvore de prestígio).
* **Persistência:** Salvamento automático local no `localStorage` do navegador.

---

## 📐 Arquitetura da Aplicação (Ponte de Alta Performance)

O jogo utiliza o padrão de projeto **Bridge (Ponte de Eventos)** por meio da classe `GameBridge`. Isso permite a comunicação bidirecional de baixíssima latência entre a simulação física do Phaser 3 e a renderização de menus do React:

1. **Phaser para React:** O motor do jogo emite eventos (como ganho de ouro, XP, ativação de Cooldowns de habilidades) e a interface React reage a esses eventos em tempo real.
2. **React para Phaser:** O clique em habilidades na UI envia eventos de ativação para a cena ativa do Phaser executar os efeitos visuais e o dano físico correspondente.
3. **Atualização DOM Direta (Direct DOM updates):** Status críticos e de alta frequência (como as barras de HP e Mana) ignoram o ciclo de renderização e estado do React. Eles atualizam diretamente os elementos do DOM via seletores nativos para garantir estabilidade e 60 FPS consistentes mesmo em celulares mais antigos.

---

## 📱 Progressive Web App (PWA) & Instalação Mobile

O jogo é compatível com a especificação **PWA (Progressive Web App)**, permitindo que os jogadores o instalem e joguem diretamente na tela inicial do celular ou do desktop:

1. **Manifesto Web (`manifest.json`):** Configura a inicialização no modo `standalone` (sem as barras do navegador), define a cor do tema (`#0b0f19`) e orienta o display prioritariamente na vertical (`portrait-primary`).
2. **Registro de Service Worker (`sw.js`):** Implementa um Service Worker baseado na estratégia **Network-First** com fallback de cache local, garantindo que novos patches do jogo sejam carregados imediatamente ao mesmo tempo em que permite a inicialização off-line do game.
3. **Instalabilidade:** Em dispositivos Android, o navegador Chrome exibirá o banner nativo de instalação. No iOS/Safari, o usuário pode instalar clicando no botão "Compartilhar" -> "Adicionar à Tela de Início".

---

## 🔍 Otimização de SEO (Search Engine Optimization)

A estrutura de metadados do jogo foi otimizada para máxima indexabilidade e compartilhamento social:
* **Metadados Primários:** Title otimizado, descrição detalhada contendo as palavras-chave principais do gênero (RPG Idle, incremental, dark fantasy, clicker) e definição de idioma (`pt-BR`).
* **Tags Open Graph e Twitter Cards:** Configuração completa para exibição de cards enriquecidos ao compartilhar o link do jogo em redes sociais (como Discord, WhatsApp, Twitter/X e Facebook).

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
* Node.js instalado (versão 18 ou superior recomendada).

### 1. Instalar as Dependências
Abra o terminal na pasta do projeto e execute:
```bash
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento
Inicie a aplicação local rodando:
```bash
npm run dev
```
O console exibirá o link local (geralmente `http://localhost:5173/`). Abra-o no navegador.

### 3. Gerar a Build de Produção
Para compilar e otimizar o projeto para publicação:
```bash
npm run build
```
Os arquivos finais prontos para hospedagem estática serão gerados no diretório `/dist`.

