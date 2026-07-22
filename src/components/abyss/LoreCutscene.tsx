import React, { useEffect, useState } from 'react';
import { AudioManager } from '../../core/AudioManager';

/**
 * v10.4.0 "O Leviatã do Ciclo" — sistema MÍNIMO de cutscene (o primeiro do jogo, de propósito
 * humilde, per Anexo 2 §3.1): overlay fullscreen preto, sequência de painéis com texto (e imagem
 * opcional — os painéis rodam só com texto se as artes de apoio não existirem), avanço por
 * toque/clique, botão "Pular" discreto após o 2º painel. Dispara 1x na 1ª morte do Leviatã
 * (`Character.leviathanCutsceneSeen`), rejogável depois via qualquer tela que a monte de novo.
 */

interface CutscenePanel {
  image?: string;   // opcional — cai para só-texto se a arte não existir/falhar ao carregar
  text: string;
  holdMs: number;   // tempo mínimo antes de permitir avançar (evita pular sem ler)
}

// Painel 6 ganha uma linha extra se o jogador já resgatou 12+ Ecos Afogados quando a cutscene
// dispara (Anexo 2 §3.4 — "barata de implementar", o único ponto dinâmico do roteiro).
const buildPanels = (choirComplete: boolean): CutscenePanel[] => [
  { text: 'A água parou.\n\nPela primeira vez em mil anos, o Trono Afundado ficou em silêncio.', holdMs: 1800 },
  {
    text: 'O Leviatã não caiu como caem os monstros.\n\nCaiu como cai uma sentinela — rendida, não derrotada.\nDevagar. Quase agradecida.',
    holdMs: 2200,
  },
  { text: 'E do peito da fera, a luz que ela carregou por dez ciclos\nescorreu de volta para o mundo.', holdMs: 1800 },
  {
    image: '/assets/cutscene_shard.png',
    text: 'Um caco. Do tamanho de um coração.\n\nAceso como a primeira manhã do primeiro ciclo.\nO pedaço da Alma que escolheu o mar — ou que o mar escolheu esconder.',
    holdMs: 2200,
  },
  {
    text: 'Foi então que o herói entendeu o que enfrentara.\n\nQuando a cidadela afundou, seu guardião mergulhou atrás do Caco.\nE, não podendo carregá-lo de volta, fez a única coisa que um juramento permite:\nengoliu a luz, e virou a tranca.\n\nMil anos de pressão fazem de qualquer sentinela uma fera.\nNinguém guarda algo por tanto tempo sem esquecer o porquê.',
    holdMs: 3200,
  },
  {
    image: '/assets/cutscene_choir.png',
    text: `Ao redor, os Ecos Afogados se reuniram nas sacadas da cidade.\n\nE cantaram.\n\nNão o lamento que o mar decorou —\no canto que a cidadela cantava quando ainda tinha sol.${choirComplete ? '\n\nE desta vez, o coro estava completo.' : ''}`,
    holdMs: 2600,
  },
  {
    text: 'O herói estendeu a mão.\n\nO Caco recuou — não por medo.\nPor peso.\n\nUm caco da Alma não se carrega.\nSe merece.\nE dez ciclos ainda não eram o bastante.',
    holdMs: 2400,
  },
  {
    text: 'Mas o Caco cantou uma nota. Uma só.\n\nE a nota subiu pela água, atravessou a superfície,\ncruzou o céu que a cidadela não via há mil anos —\n\ne em algum lugar acima, muito acima das nuvens,\nalguma outra coisa partida... respondeu.',
    holdMs: 2800,
  },
  {
    text: 'O Trono tem um novo guardião agora. Ele conhece o caminho de volta à superfície.\n\n— Fim do Décimo Ciclo —\n\nO Ciclo da Alma Partida continuará.',
    holdMs: 3000,
  },
];

export const LoreCutscene: React.FC<{ onClose: () => void; choirComplete?: boolean }> = ({ onClose, choirComplete = false }) => {
  const [panelIndex, setPanelIndex] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const PANELS = React.useMemo(() => buildPanels(choirComplete), [choirComplete]);

  const panel = PANELS[panelIndex];
  const isLast = panelIndex === PANELS.length - 1;

  useEffect(() => {
    setCanAdvance(false);
    setImageFailed(false);
    const timer = window.setTimeout(() => setCanAdvance(true), panel.holdMs);
    return () => window.clearTimeout(timer);
  }, [panelIndex, panel.holdMs]);

  const handleAdvance = () => {
    if (!canAdvance) return;
    AudioManager.getInstance().playClick();
    if (isLast) {
      onClose();
    } else {
      setPanelIndex((i) => i + 1);
    }
  };

  return (
    <div
      onClick={handleAdvance}
      style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 10000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: canAdvance ? 'pointer' : 'default', padding: '2rem', textAlign: 'center',
      }}
    >
      {panel.image && !imageFailed && (
        <img
          src={panel.image}
          onError={() => setImageFailed(true)}
          style={{ maxWidth: '60vw', maxHeight: '40vh', marginBottom: '1.5rem', opacity: canAdvance ? 1 : 0.85, transition: 'opacity 0.6s' }}
          alt=""
        />
      )}
      <p style={{
        color: '#fff', fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-line', maxWidth: '640px',
        opacity: canAdvance ? 1 : 0.7, transition: 'opacity 0.8s',
      }}>
        {panel.text}
      </p>
      {canAdvance && (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '2rem' }}>
          {isLast ? 'Toque para fechar' : 'Toque para continuar'}
        </p>
      )}
      {panelIndex >= 2 && (
        <button
          onClick={(e) => { e.stopPropagation(); AudioManager.getInstance().playClick(); onClose(); }}
          className="btn btn-xs"
          style={{ position: 'absolute', bottom: '1.2rem', right: '1.2rem', fontSize: '0.68rem', opacity: 0.6 }}
        >
          Pular
        </button>
      )}
    </div>
  );
};
