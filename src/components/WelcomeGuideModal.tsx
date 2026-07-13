import React, { useState } from 'react';
import { AudioManager } from '../core/AudioManager';

interface GuideItem {
  icon: string;
  title: string;
  desc: string;
}

interface GuidePage {
  icon: string;
  title: string;
  accent: string;
  intro?: string;
  items: GuideItem[];
}

const PAGES: GuidePage[] = [
  {
    icon: '⚔️',
    title: 'Combate Automático & Toques Ativos',
    accent: '#f59e0b',
    items: [
      { icon: '🤖', title: 'Combate 100% Automático', desc: 'Seu herói se move e ataca sozinho em cada fase, sem necessidade de comandos constantes.' },
      { icon: '👆', title: 'Toques Ativos', desc: 'Toque ou clique na arena para causar dano de Toque adicional, que também pode ser Crítico e desencadear combos de Frenesi.' },
      { icon: '🎯', title: 'Esquiva & Crítico', desc: 'Destreza aumenta sua chance de esquivar de ataques inimigos. Sorte aumenta a chance e o dano crítico, tanto do Toque quanto dos ataques globais.' },
      { icon: '⏩', title: 'Velocidade da Simulação', desc: 'Use os botões 1x/2x/3x para acelerar o ritmo do combate (2x libera na 1ª Ascensão, 3x na 5ª).' },
    ],
  },
  {
    icon: '◆',
    title: 'Atributos, Classes & Maestria',
    accent: '#38bdf8',
    items: [
      { icon: '💪', title: '5 Atributos Primários', desc: 'Força, Magia, Destreza, Constituição e Sorte. Distribua os pontos ganhos a cada nível na aba Atributos.' },
      { icon: '🎯', title: 'Atributo Principal', desc: 'Cada classe escala seu dano básico a partir de um atributo principal (ex.: Guerreiro usa Força, Mago usa Magia).' },
      { icon: '🧬', title: '8 Classes Jogáveis', desc: '3 classes iniciais (Guerreiro, Mago, Arqueiro) e 5 avançadas desbloqueadas por progresso: Paladino, Clérigo, Ladrão, Necromante e a suprema Avatar.' },
      { icon: '🔓', title: 'Progresso Persistente', desc: 'O nível de cada classe é salvo globalmente — desbloqueios avançados valem para todos os seus personagens e slots de save.' },
    ],
  },
  {
    icon: '⚙️',
    title: 'Habilidades & Auto-Cast',
    accent: '#a78bfa',
    items: [
      { icon: '🌳', title: 'Árvore de Habilidades', desc: 'Compre e evolua habilidades ativas e passivas exclusivas da sua classe usando Pontos de Habilidade.' },
      { icon: '💚', title: 'Cura', desc: 'Toda classe possui a habilidade comum de Cura, restaurando parte da vida máxima ao custo de mana.' },
      { icon: '🤖', title: 'Conjuração Automática', desc: 'Ative o Auto-Cast para que o jogo use suas habilidades e cure automaticamente. Ajuste o limite de vida para curar na engrenagem ao lado.' },
      { icon: '💥', title: 'Habilidades Ultimate', desc: 'Liberadas no Inferno (Fase 11+) a partir do Nível 15, causam dano massivo com cooldowns longos e efeitos visuais únicos por classe.' },
    ],
  },
  {
    icon: '🎒',
    title: 'Equipamentos, Raridades & Conjuntos',
    accent: '#fbbf24',
    items: [
      { icon: '🎒', title: '6 Slots de Equipamento', desc: 'Cabeça, Torso, Pernas, Mãos, Arma e Colar — cada peça concede atributos ou, no caso do Colar, passivos utilitários únicos.' },
      { icon: '💎', title: 'Raridades', desc: 'Comum, Raro, Lendário, Ancestral (pós-Ascensão) e Celestial (endgame do Purgatório) — quanto maior a raridade, mais atributos e maior escala.' },
      { icon: '🛡️', title: 'Bônus de Conjunto (Sets)', desc: 'Equipe peças do mesmo conjunto temático da sua classe para liberar bônus extras com 2, 3 e 5 peças equipadas.' },
      { icon: '♻️', title: 'Desmonte', desc: 'Converta itens sobressalentes em Fragmentos de Forja diretamente pelo modal de detalhes do inventário.' },
    ],
  },
  {
    icon: '🔨',
    title: 'Altar de Forja Mística',
    accent: '#fb923c',
    items: [
      { icon: '🔨', title: 'Fusão de Itens', desc: 'Combine dois itens do mesmo slot e conjunto no Altar de Forja Mística para criar um item Místico mais poderoso.' },
      { icon: '⚗️', title: 'Fórmula Assimétrica', desc: 'O atributo maior entre os dois itens é preservado integralmente, e o menor contribui com metade do seu valor — combine peças complementares!' },
      { icon: '📈', title: 'Até Nível Místico +8', desc: 'Funda itens Místicos entre si (do mesmo nível) repetidamente para evoluí-los até o teto atual de +8.' },
    ],
  },
  {
    icon: '📖',
    title: 'Bestiário',
    accent: '#4ade80',
    items: [
      { icon: '📖', title: 'Catálogo de Monstros', desc: 'Cada monstro derrotado o número de vezes exigido entra para o Bestiário, com ilustração e contagem de abates.' },
      { icon: '📈', title: 'Bônus Permanente de Dano', desc: 'Completar monstros e fases concede bônus cumulativos de Dano Geral, com um bônus extra por completar o álbum inteiro.' },
    ],
  },
  {
    icon: '👑',
    title: 'Ascensão da Alma (Prestígio)',
    accent: '#facc15',
    items: [
      { icon: '👑', title: 'Reinicie para Evoluir', desc: 'Quando o avanço ficar difícil, Ascenda: seu nível, fase e equipamentos são resetados em troca de Pontos de Prestígio (PP) permanentes.' },
      { icon: '🌟', title: 'Upgrades Permanentes', desc: 'Gaste PP em melhorias definitivas de atributos, Poder do Toque, Crítico e no Robô Assistente de cliques automáticos.' },
      { icon: '🔓', title: 'Desbloqueios', desc: 'A primeira Ascensão libera a velocidade 2x, a Cidadela Astral e os equipamentos de raridade Ancestral.' },
    ],
  },
  {
    icon: '🗼',
    title: 'A Torre Infinita',
    accent: '#22d3ee',
    items: [
      { icon: '🗼', title: 'Modo Alternativo', desc: 'Use Chaves da Torre para escalar andares infinitos com dificuldade crescente, à parte do progresso da campanha principal.' },
      { icon: '🔑', title: 'Obtendo Chaves', desc: 'As chaves dropam de monstros comuns, elites e chefes da campanha, ou são fabricadas passivamente pela Torre de Vigia Astral da Cidadela.' },
    ],
  },
  {
    icon: '🌌',
    title: 'Transcendência, Ecoterra & Avatar',
    accent: '#c084fc',
    items: [
      { icon: '🍃', title: 'Espelho da Ecoterra', desc: 'Enfrente versões fortalecidas das fases 1 a 20 sob penalidades arcanas para coletar Essência de Transcendência (ET).' },
      { icon: '🌌', title: 'Ritual de Transcendência', desc: 'Com o Modo Pandemônio liberado, a Fase 50 na Torre e 500 PP vitalícios acumulados, realize o reset mais profundo do jogo.' },
      { icon: '🌟', title: 'Classe Avatar', desc: 'Desbloqueie a classe suprema, que escala com o maior atributo entre todos, comprando o talento Avatar Pleno na árvore de Transcendência.' },
    ],
  },
  {
    icon: '🏯',
    title: 'Cidadela Astral & Relíquias',
    accent: '#2dd4bf',
    items: [
      { icon: '🏯', title: 'Base de Gerenciamento', desc: 'Liberada na 1ª Ascensão, a Cidadela roda em segundo plano enquanto você combate, produzindo materiais e recursos passivamente.' },
      { icon: '🏛️', title: 'Centro de Comando', desc: 'Construção central da Cidadela: cada nível aumenta a quantidade de Madeira, Pedra e Carne coletada em combate, e define o teto de nível que todas as outras construções podem alcançar (ex: o Depósito só sobe ao Nível 2 depois do Centro de Comando).' },
      { icon: '🏗️', title: 'Construções', desc: 'Depósito, Quartel de Expedições, Academia Militar, Torre de Vigia, Oficina da Forja, Sifão Cósmico, Altar de Sincronia e Laboratório de Relíquias.' },
      { icon: '💠', title: 'Sistema de Relíquias', desc: 'Colete Fragmentos de Alma Instável de chefes e forje-os no Altar da Alma para desbloquear relíquias com bônus permanentes.' },
    ],
  },
  {
    icon: '💰',
    title: 'Economia, Loja & Opções',
    accent: '#34d399',
    items: [
      { icon: '💰', title: 'Ouro', desc: 'Ganhe ouro derrotando monstros e use-o para fundir itens na Forja e comprar na Loja.' },
      { icon: '🛒', title: 'Loja & Loja Celestial', desc: 'Compre poções e boosters na Loja, e itens especiais de endgame com Essência de Transcendência na Loja Celestial.' },
      { icon: '⚙️', title: 'Aba Opções', desc: 'Personalize áudio, console de combate, abreviação de números grandes e automações de auto-venda de equipamentos dropados.' },
      { icon: '💾', title: 'Saves', desc: 'Seis slots de save independentes, com suporte a Importação/Exportação por criptografia textual leve.' },
    ],
  },
];

const TOTAL_PAGES = PAGES.length + 1; // +1 pela capa de boas-vindas

interface WelcomeGuideModalProps {
  onClose: (dontShowAgain: boolean) => void;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({ onClose }) => {
  const [page, setPage] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isCover = page === 0;
  const isLast = page === TOTAL_PAGES - 1;
  const contentPage = !isCover ? PAGES[page - 1] : null;

  const goTo = (target: number) => {
    AudioManager.getInstance().playClick();
    setPage(Math.max(0, Math.min(TOTAL_PAGES - 1, target)));
  };

  const handleFinish = () => {
    AudioManager.getInstance().playClick();
    onClose(dontShowAgain);
  };

  const handleSkip = () => {
    AudioManager.getInstance().playClick();
    onClose(dontShowAgain);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '1rem',
      pointerEvents: 'all',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1d1f1f 0%, #161717 100%)',
        border: '2px solid var(--gold-400)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '480px',
        height: 'min(540px, 88vh)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.6), 0 0 40px rgba(212, 175, 55, 0.08)',
      }}>

        {!isCover && (
          <div style={{ flex: '0 0 auto' }}>
            <h3 className="font-heading" style={{
              fontSize: '1.05rem', fontWeight: 800, color: contentPage!.accent,
              borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem', margin: 0,
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <span>{contentPage!.icon}</span> {contentPage!.title}
            </h3>
            <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', marginTop: '0.3rem' }}>
              Página {page} de {TOTAL_PAGES - 1}
            </span>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {isCover ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '3rem', lineHeight: 1, filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }}>🛡️</div>
              <h1 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--gold-400)', margin: 0, letterSpacing: '0.02em', textShadow: '0 0 20px rgba(212,175,55,0.35)' }}>
                Bem-vindo ao<br />Amaro RPG Idle
              </h1>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                Guia Rápido & Tutorial
              </p>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0.5rem 0 0 0', maxWidth: '360px' }}>
                Prepare-se para enfrentar hordas de monstros e ascender sua alma. Este guia interativo apresenta, em algumas páginas rápidas, os principais sistemas do jogo — combate, classes, equipamentos, ascensão e muito mais.
              </p>
              <p style={{ fontSize: '0.68rem', color: '#64748b', margin: 0 }}>
                Use os botões abaixo ou as bolinhas para navegar livremente.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {contentPage!.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</span>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.72rem' }}>{item.title}</strong>
                    <p style={{ color: '#94a3b8', fontSize: '0.68rem', margin: '0.1rem 0 0 0', lineHeight: 1.35 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Indicador de páginas (bolinhas) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {Array.from({ length: TOTAL_PAGES }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Ir para a página ${idx + 1}`}
              style={{
                width: idx === page ? '18px' : '7px',
                height: '7px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: idx === page ? 'var(--gold-400)' : 'rgba(255,255,255,0.18)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Navegação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {isLast && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.68rem', color: '#94a3b8', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--gold-500)' }}
              />
              Não mostrar esta mensagem novamente
            </label>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isCover && (
              <button
                onClick={() => goTo(page - 1)}
                className="btn btn-sm"
                style={{ flex: '0 0 auto', padding: '0.5rem 0.9rem', fontWeight: 700 }}
              >
                ← Voltar
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => goTo(page + 1)}
                className="btn btn-sm btn-gold"
                style={{ flex: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {isCover ? 'Começar Guia →' : 'Avançar →'}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="btn btn-sm btn-gold"
                style={{ flex: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Começar Aventura!
              </button>
            )}
          </div>

          {!isLast && (
            <button
              onClick={handleSkip}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline', padding: '0.15rem', alignSelf: 'center' }}
            >
              Pular introdução
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
