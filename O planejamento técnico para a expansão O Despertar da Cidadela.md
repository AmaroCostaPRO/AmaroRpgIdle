O planejamento técnico para a expansão do ecossistema de **Amaro RPG Idle** foi estruturado em atualizações modulares subsequentes à versão 5.0.0. Esta arquitetura estende a store global do Zustand (`useGameStore`) e injeta os modificadores diretamente no `StatEngine` e na `CombatFSM` do Phaser, sem onerar a renderização gráfica da arena de combate.

---

## Atualização v5.1.0 - O Despertar da Cidadela e Coleta de Insumos

Esta versão introduz a mecânica base da Cidadela Astral como uma aba dedicada no React, ativação da coleta procedural de materiais e o sistema de salvamento de equipamentos entre runs.

### A. Liberação da Cidadela e Economia de Materiais

* **Gatilho de Desbloqueio:** A aba da Cidadela é liberada automaticamente assim que o jogador realiza a sua primeira Ascensão (`ascensionCount >= 1`).


* **Estrutura Inicial:** A Cidadela inicia em ruínas, contendo apenas o **Centro de Comando (Nível 1)** liberado de forma gratuita. Este prédio define o limite de nível máximo para as demais estruturas da cidade.
* **Três Novos Materiais Base:** Inseridos na tabela de espólios global de monstros normais e Elites na campanha de combate da `CombatFSM.ts`:


* **Madeira (`wood`):** Dropado com maior probabilidade por inimigos da Floresta e do Deserto (Fases 1, 2, 6 e 7).


* **Pedra (`stone`):** Dropado com maior frequência por Golens, Gárgulas e Armaduras (Fases 1, 3, 5, 6, 8 e 10).


* **Carne (`meat`):** Dropado por monstros orgânicos como Lobos, Serpentes e Escorpiões (Fases 1, 2, 3, 6, 7 e 8).




* **Fórmula de Drop de Materiais:** O ganho é garantido a cada abate e escala de forma linear com base na Fase atual do combate, sem sofrer influência do atributo Sorte para preservar a progressão econômica planejada:



$$\text{Quantidade Ganha} = \max\left(1, \lfloor \text{Fase} \times 0.5 \rfloor\right) \times \text{Multiplicador de Elite}$$



Onde o Multiplicador de Elite é $2.0$ para monstros Elite e $1.0$ para monstros comuns.



### B. Novo Local: O Depósito (Almoxarifado)

* **Custo de Construção:** 50 Madeiras e 50 Pedras.
* **Funcionamento Mecânico:** Permite que o jogador selecione e guarde itens de equipamento não equipados do inventário para que fiquem protegidos contra o reset completo de dados gerado pelo ritual de Ascensão.


* **Evolução por Upgrades:**
* *Nível 1:* Libera 2 slots de armazenamento seguro.
* *Nível 2 a 5:* Cada nível adiciona +2 slots, limitados ao máximo de 10 slots no Nível 5.
* *Regra de Restrição:* O Depósito aceita apenas equipamentos convencionais, Ancestrais e Pandemoníacos. Itens Místicos refinados na Forja não podem ser depositados para evitar a quebra da curva de progressão nas fases iniciais de uma nova rodada.





---

## Atualização v5.2.0 - O Hub de Expedições e a Moeda do Conhecimento

Esta versão foca no reaproveitamento das classes secundárias avançadas do jogador para gerar recursos passivos e moedas de estudo para a progressão de atributos no midgame.

### A. Novo Local: Quartel de Expedições

* **Custo de Construção:** 150 Madeiras, 200 Pedras e 100 Carnes.
* **Funcionamento Mecânico:** O jogador pode alocar suas classes inativas (rastreadas globalmente por `medieval_idle_global_class_levels`) em missões automáticas em background. O herói alocado não pode ser jogado ativamente na campanha principal enquanto estiver na expedição.


* **Nova Moeda - Insígnias de Estudo (`studyInsignias`):** Recurso exclusivo gerado pelas expedições, utilizado como combustível para as pesquisas na Academia.
* Tabela de Eficiência de Alocação por Atributo de Classe:


* *Classes de Força (Guerreiro/Paladino):* Focam na extração e aumentam em +25% a geração de Pedra por hora.


* *Classes de Destreza (Arqueiro/Ladrão):* Focam na caça e aumentam em +25% a geração de Carne e Madeira por hora.


* *Classes de Magia (Mago/Clérigo/Necromante):* Focam em artefatos e aumentam em +30% a geração de Insígnias de Estudo por hora.




* **Evolução por Upgrades:** Upgradear o Quartel aumenta a quantidade de expedições simultâneas (Nível 1 = 1 slot de herói; Nível 3 = 2 slots; Nível 5 = 3 slots máximos) e reduz o tempo de retorno dos materiais.

### B. Novo Local: A Academia Militar

* **Custo de Construção:** 300 Pedras, 200 Madeiras e 50 Insígnias de Estudo.
* **Funcionamento Mecânico:** Centraliza o consumo de Insígnias de Estudo para a pesquisa de melhorias permanentes de combate que são injetadas diretamente na classe `StatEngine.ts`. Diferente dos atributos normais e de prestígio, estes bônus são universais para todas as classes do slot de save.


* **Projetos de Pesquisa Disponíveis:**
1. *Táticas de Combate Avançadas:* Aumenta o Dano Geral em +1.5% por nível de pesquisa.
2. *Condicionamento Físico Extremo:* Aumenta a Vida Máxima (HP) em +2% por nível de pesquisa.
3. *Exercícios de Agilidade:* Aumenta a Velocidade de Ataque em +1% por nível de pesquisa.


* **Evolução por Upgrades:** Cada nível da estrutura da Academia libera novas tecnologias e expande o limite máximo de nível de cada pesquisa (Nível 1 da Academia limita pesquisas ao nível 5; Nível 5 expande o teto das pesquisas para o nível 25).

---

## Atualização v5.3.0 - Automação Industrial e Logística da Torre

Esta atualização cria uma ponte direta entre a Cidadela e os modos secundários do jogo (Torre Infinita e Altar da Forja), diminuindo o microgerenciamento de ouro e chaves do midgame.

### A. Novo Local: Torre de Vigia Astral

* **Custo de Construção:** 500 Madeiras, 500 Pedras e 300 Carnes.
* **Funcionamento Mecânico:** Passa a vigiar as fendas temporais para fabricar e consolidar passivamente **Chaves da Torre Infinita** (`tower_key`), compensando a taxa de drop reduzida na campanha principal.


* **Evolução por Upgrades:**
* *Nível 1:* Produz 1 Chave da Torre a cada 24 horas de tempo real (calculado por delta de timestamp offline).


* *Nível 3:* Reduz o tempo de fabricação para 12 horas por chave.
* *Nível 5:* Reduz o tempo para 6 horas por chave e expande a capacidade máxima de armazenamento interno da estrutura para até 4 chaves (evita desperdício se o jogador ficar horas sem coletar).



### B. Novo Local: Oficina de Automação da Forja

* **Custo de Construção:** 600 Madeiras, 800 Pedras e 150 Insígnias de Estudo.
* **Funcionamento Mecânico:** Transforma materiais excedentes coletados no combate sidescrolling em **Fragmentos de Forja** (`forgeFragments`) de forma passiva, auxiliando no custo das fusões místicas.


* **Evolução por Upgrades:**
* *Nível 1:* Permite converter Ouro e Madeiras em Fragmentos de Forja de forma passiva através de ordens de serviço de 1 hora.


* *Nível 5 (Mestre Forjador):* Desbloqueia o recurso de QoL "Desmonte Automatizado". Equipamentos de raridade Comum e Rara dropados em combate são destruídos instantaneamente em background e convertidos diretamente em Fragmentos de Forja sem passar pelo inventário, otimizando o espaço das runs.





---

## Atualização v5.4.0 - O Despertar Cósmico (Sistemas de Fim de Jogo)

Esta atualização introduz as estruturas focadas na quebra da escala exponencial de HP dos monstros do Modo Pandemônio e na otimização da classe Avatar e da zona espelho Ecoterra.

### A. Novo Local: Sifão de Essência Cósmica

* **Custo de Construção:** 1500 Pedras, 1000 Madeiras e 50 Essências de Transcendência (ET).


* **Funcionamento Mecânico:** Atua como um estabilizador ambiental focado em neutralizar as penalidades sofridas pelo herói ao combater na zona espelho da Ecoterra.


* **Evolução por Upgrades:**
* *Nível 1:* Mitiga a perda contínua de mana na Ecoterra de 1.5% para 1.2% por segundo e reduz a penalidade de erosão nos cooldowns de habilidades de +15% para +12%.


* *Nível 5 (Sincronia Perfeita):* Zera completamente a drenagem de mana ambiental da Ecoterra e neutraliza a penalidade de recarga de habilidades, permitindo que o herói lute com 100% de sua capacidade técnica original na dimensão espelhada.





### B. Novo Local: Altar de Sincronia Elemental

* **Custo de Construção:** 2000 Pedras, 200 Essências de Transcendência e 500 Insígnias de Estudo.


* **Funcionamento Mecânico:** Criado especificamente para maximizar o teto de dano da classe suprema Avatar, cuja mecânica ofensiva se baseia no Maior Atributo Ativo do momento.


* **Evolução por Upgrades:** Permite injetar uma porcentagem dos atributos primários menores/secundários diretamente no cálculo do atributo principal do Avatar antes do tick de ataque físico ou conjuração de habilidades:



$$\text{Atributo Efetivo Final} = \max(\text{Str}, \text{Mag}, \text{Dex}, \text{Con}, \text{Luk}) + \lfloor \text{Soma dos Demais Atributos} \times (\text{Nível do Altar} \times 0.03) \rfloor$$



Com o Altar no Nível 5, o Avatar passa a somar 15% de toda a pontuação de seus atributos secundários ao valor do seu atributo principal ativo, quebrando as barreiras de HP milionárias do loop infinito de Pandemônio.



### C. Novo Local: Laboratório de Relíquias Místicas

* **Custo de Construção:** 3000 Pedras, 2000 Madeiras e 100 Fragmentos de Alma Instável.


* **Funcionamento Mecânico:** Interage diretamente com o Altar de Relíquias. Permite que relíquias que já atingiram o nível máximo 5 sofram um processo de "Superaquecimento de Alma" para amplificar seus efeitos Capstone.


* **Evolução por Upgrades:** Cada nível do Laboratório libera o superaquecimento de 2 relíquias específicas, exigindo o pagamento de Ouro, Materiais e Fragmentos de Alma Instável por processo. A relíquia *Luz da Alma Partida*, por exemplo, vê seu bônus Capstone de Multiplicador de Dano Crítico saltar de +10% para +25% de forma definitiva.



---

## 18. Modelo de Dados e Persistência da Cidadela (`useGameStore.ts`)

Para garantir a integridade estrutural e compatibilidade com os seis slots de salvamento existentes, os estados da Cidadela são serializados de forma limpa no nó JSON do personagem ativo:

```typescript
interface BuildingState {
  level: number;
  lastTick: number; // Registro Unix timestamp para processamento de produção offline
}

interface Character {
  // ... Propriedades existentes no manual técnico[cite: 1]
  materials: {
    wood: number;
    stone: number;
    meat: number;
    studyInsignias: number; // Nova moeda da academia
  };
  citadel: {
    commandCenter: BuildingState;
    vault: BuildingState;
    expeditions: BuildingState & { allocatedClassIds: string[] };
    academy: BuildingState & {
      researchDmgLevel: number;
      researchHpLevel: number;
      researchSpeedLevel: number;
    };
    watchTower: BuildingState;
    forgeWorkshop: BuildingState;
    cosmicSiphon: BuildingState;
    synchronyAltar: BuildingState;
    relicLab: BuildingState;
  };
}

```

Toda a lógica de ganho passivo de materiais por hora realiza a validação de segurança comparando o `Date.now()` no carregamento do save contra a propriedade `lastTick` de cada estrutura, aplicando a recomposição de fundos instantaneamente com complexidade de tempo de execução $O(1)$.



-------------------------------------------------------


Expandir a aba da Cidadela para ocupar toda a *viewport* (tela cheia) transforma a mecânica em um módulo imersivo de gerenciamento, limpando a poluição visual do combate sidescrolling enquanto o jogador toma decisões estratégicas.

Como o jogo utiliza **React 18** para a interface e **Zustand** para o estado global, implementar essa transição é uma tarefa direta de manipulação de fluxo CSS (`z-index`) e desacoplamento de estado, sem necessidade de alterar o Canvas do Phaser 3.

Abaixo está o detalhamento técnico de como engenhar essa transição de tela cheia, a composição visual dinâmica das construções e o gerenciamento do motor gráfico em background.

---

### 1. Arquitetura do Viewport Full-Screen (React + Tailwind CSS)

Para fazer a Cidadela "engolir" a tela, você não precisa desmontar o canvas do Phaser (o que causaria perda de contexto WebGL e *overhead* de recarregamento de texturas). Em vez disso, utilize uma camada de sobreposição absoluta controlada pelo estado `activeTab` do Zustand.

Quando `activeTab === 'citadel'`, o React renderiza o contêiner da Cidadela com propriedades de fixação total, posicionando-o acima de qualquer elemento do jogo (incluindo o header global e a arena do Phaser).

#### Exemplo de Estrutura do Componente React:

```tsx
// src/components/citadel/CitadelPanel.tsx
import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CitadelOverview } from './CitadelOverview';
import { ExpeditionPanel } from './ExpeditionPanel';
import { AcademyPanel } from './AcademyPanel';

export const CitadelPanel: React.FC = () => {
  const { activeTab, citadelSubTab, setCitadelSubTab } = useGameStore();

  if (activeTab !== 'citadel') return null;

  return (
    <div className="fixed inset-0 z-[100] w-full h-full bg-[#161717] flex flex-col animate-tabFade">
      {/* Header Interno da Cidadela (Moedas locais e botão de Fechar/Voltar) */}
      <header className="h-16 border-b border-[#252727] bg-[#1D1F1F] px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-[#00e5ff] tracking-wide">🌌 CIDADELA ASTRAL</h1>
          {/* Indicadores de Recursos Locais (Madeira, Pedra, Carne, Insígnias) */}
          <div className="flex gap-4 text-sm">
            {/* Componentes de exibição de saldo de materiais */}
          </div>
        </div>
        
        {/* Botão de Fechar que retorna ao combate sidescrolling */}
        <button 
          onClick={() => useGameStore.getState().setActiveTab('combat')}
          className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded transition-colors"
        >
          Voltar ao Combate ⚔️
        </button>
      </header>

      {/* Área de Conteúdo Splitada: Mapa Superior / Sub-Abas Inferiores */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-Navegação interna da Cidadela */}
        <nav className="flex bg-[#1D1F1F] border-b border-[#252727]">
          <button onClick={() => setCitadelSubTab('overview')} className={`px-6 py-3 border-b-2 text-sm font-medium ${citadelSubTab === 'overview' ? 'border-[#00e5ff] text-white' : 'border-transparent text-gray-400'}`}>Visão Geral</button>
          <button onClick={() => setCitadelSubTab('expeditions')} className={`px-6 py-3 border-b-2 text-sm font-medium ${citadelSubTab === 'expeditions' ? 'border-[#00e5ff] text-white' : 'border-transparent text-gray-400'}`}>Expedições</button>
          <button onClick={() => setCitadelSubTab('academy')} className={`px-6 py-3 border-b-2 text-sm font-medium ${citadelSubTab === 'academy' ? 'border-[#00e5ff] text-white' : 'border-transparent text-gray-400'}`}>Academia</button>
        </nav>

        {/* Renderização Condicional dos Sub-módulos */}
        <div className="flex-1 overflow-y-auto p-6">
          {citadelSubTab === 'overview' && <CitadelOverview />}
          {citadelSubTab === 'expeditions' && <ExpeditionPanel />}
          {citadelSubTab === 'academy' && <AcademyPanel />}
        </div>
      </div>
    </div>
  );
};

```

---

### 2. Gerenciamento do Motor Phaser no Background (Otimização)

Com a Cidadela cobrindo a tela inteira (`fixed inset-0 z-[100]`), o Canvas do Phaser continuará processando o loop de renderização e a lógica da `CombatFSM` por baixo. Em jogos idle, o comportamento esperado é que **o herói continue lutando, dropando materiais e acumulando XP** enquanto o jogador gerencia a cidade.

No entanto, renderizar gráficos 2D invisíveis causa desperdício de processamento da GPU. Você deve aplicar uma otimização via `GameBridge` para instruir o Phaser a suspender as renderizações pesadas (como sistemas de partículas e rolagens parallax) mantendo apenas os cronômetros lógicos ativos.

#### Na Store do Zustand (`useGameStore.ts`):

```typescript
setActiveTab: (tab: string) => {
  set({ activeTab: tab });
  // Notifica o Phaser sobre a mudança de contexto de aba
  GameBridge.emit(GameEvent.TAB_CHANGED, { tab });
}

```

#### No Motor do Phaser 3 (`CombatScene.ts`):

```typescript
this.gameBridge.on(GameEvent.TAB_CHANGED, (data: { tab: string }) => {
  if (data.tab === 'citadel') {
    // Reduz o peso gráfico sem pausar a lógica de simulação/ticks
    this.background.stopScroll(); 
    this.particleEmitter.stop();
    // Opcional: Reduz o framerate alvo do ciclo de renderização do Phaser para economizar hardware
    this.game.loop.targetFps = 15; 
  } else {
    // Restaura o desempenho total ao voltar para a tela de combate
    this.background.startScroll();
    this.game.loop.targetFps = 60;
  }
});

```

---

### 3. Composição Visual Dinâmica por Camadas (Layered Rendering)

Sua ideia de compor o visual sobrepondo imagens é a mais eficiente. Utilizar um canvas ou um mapa completo em Phaser aqui adicionaria complexidade desnecessária. Montar essa ilustração utilizando **posicionamento absoluto em CSS** aproveita a aceleração de hardware nativa do navegador para renderizar os assets PNG transparentes.

#### Como estruturar as artes:

1. **Imagem de Fundo Base (`citadel_ground.png`):** Uma paisagem limpa mostrando o terreno da cidadela com estradas vazias e marcações de lotes.
2. **Sprites das Estruturas:** Para cada prédio (ex: Depósito, Academia, Quartel), você precisa de variações gráficas baseadas em tiers de evolução (Nível 0/Bloqueado = Lote vazio ou apenas andaimes; Nível 1-2 = Construção básica; Nível 3-4 = Avançado; Nível 5 = Estrutura Suprema/Resplandecente).

#### Implementação no Componente `CitadelOverview.tsx`:

```tsx
import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const CitadelOverview: React.FC = () => {
  const { citadel, materials } = useGameStore();

  // Função utilitária para mapear o arquivo gráfico com base no nível da estrutura
  const getBuildingAsset = (buildingKey: string, level: number) => {
    if (level === 0) return '/assets/citadel/building_blueprint.png';
    if (level < 3) return `/assets/citadel/${buildingKey}_tier1.png`;
    if (level < 5) return `/assets/citadel/${buildingKey}_tier2.png`;
    return `/assets/citadel/${buildingKey}_tier3.png`; // Nível Máximo (Tier Supremo)
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* COLUNA ESQUERDA: O Mapa Visual Dinâmico */}
      <div className="relative w-full lg:w-[600px] h-[400px] bg-[#252727] rounded-lg overflow-hidden border border-[#303232] shadow-inner">
        {/* Camada 0: Terreno de Fundo */}
        <img 
          src="/assets/citadel/citadel_ground.png" 
          className="absolute inset-0 w-full h-full object-cover"
          alt="Terreno Cidadela"
        />

        {/* Camada 1: O Depósito (Posicionado na coordenada exata X/Y do mapa) */}
        <div className="absolute top-[25%] left-[15%] w-24 h-24 group cursor-pointer">
          <img 
            src={getBuildingAsset('vault', citadel.vault.level)} 
            className="w-full h-full object-contain transition-transform group-hover:scale-105" 
            alt="Depósito"
          />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-mono border border-gray-700">
            Depósito Nvl.{citadel.vault.level}
          </span>
        </div>

        {/* Camada 2: A Academia Militar */}
        <div className="absolute top-[40%] left-[50%] w-28 h-28 group cursor-pointer">
          <img 
            src={getBuildingAsset('academy', citadel.academy.level)} 
            className="w-full h-full object-contain transition-transform group-hover:scale-105"
            alt="Academia"
          />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-[#00e5ff] font-mono border border-[#00e5ff]/30">
            Academia Nvl.{citadel.academy.level}
          </span>
        </div>

        {/* Camada 3: Quartel de Expedições */}
        <div className="absolute top-[15%] left-[70%] w-26 h-26 group cursor-pointer">
          <img 
            src={getBuildingAsset('expeditions', citadel.expeditions.level)} 
            className="w-full h-full object-contain transition-transform group-hover:scale-105"
            alt="Quartel"
          />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-mono border border-gray-700">
            Quartel Nvl.{citadel.expeditions.level}
          </span>
        </div>
      </div>

      {/* COLUNA DIREITA: Painel de Controle de Upgrades (Lista de Prédios e Custos) */}
      <div className="flex-1 bg-[#1D1F1F] p-4 rounded-lg border border-[#252727]">
        <h3 className="text-lg font-bold text-white mb-4 border-b border-[#252727] pb-2">Gerenciar Construções</h3>
        {/* Mapeamento de botões de upgrade consumindo madeira, pedra e carne */}
        {/* Exemplo de card de upgrade de Prédio com verificação de saldo de materiais */}
      </div>
    </div>
  );
};

```

### Resumo das Vantagens Técnicas dessa abordagem:

1. **Mudança de Ritmo:** O jogador sente que entrou em uma área de planejamento calmo, quebrando o cansaço visual da rolagem contínua do combate sidescrolling.
2. **Performance Limpa:** Como são apenas tags HTML `<img>` renderizadas condicionalmente por estado, a interface do React processa as atualizações de nível instantaneamente, sem gerar concorrência de CPU com os loops físicos do Phaser que continuam rodando por baixo de forma otimizada.
3. **Manutenção Modular:** Adicionar um novo prédio futuramente resume-se a criar uma nova propriedade na estrutura da store do Zustand e adicionar uma nova tag `<div>` absoluta com a coordenada gráfica correspondente.