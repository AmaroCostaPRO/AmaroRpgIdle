import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getTransparentImageUrl, peekTransparentImageUrl } from '../../core/imageBackgroundStrip';

/**
 * Chama roxa animada usada como "retrato" da Voz da Alma-Mundo (`alma_mundo`) — ela é uma
 * consciência primordial sem forma física, então em vez de um busto ilustrado ela recebe um efeito
 * puramente em CSS (sem asset de imagem), reforçando a ideia de presença etérea/sem corpo.
 */
export const AlmaMundoFlame: React.FC = () => (
  <div className="alma-mundo-flame">
    <div className="alma-mundo-flame-layer" />
    <div className="alma-mundo-flame-layer" />
    <div className="alma-mundo-flame-layer" />
  </div>
);

const CLASS_SPRITE_FILE: Record<string, string> = {
  warrior: 'hero_sprite.png',
  mage: 'mage_sprite.png',
  ranger: 'ranger_sprite.png',
  paladin: 'paladin_sprite.png',
  cleric: 'cleric_sprite.png',
  rogue: 'rogue_sprite.png',
  necromancer: 'necromancer_sprite.png',
  avatar: 'avatar_sprite.png',
};

const WHITE_KEY = { r: 255, g: 255, b: 255 };

/**
 * Retrato do "Eco do Avatar" (`avatar_echo`, Ato V) — em vez de um sprite próprio, reaproveita o
 * sprite de combate da classe atual do herói (é literalmente o jogador refletido no espelho
 * primordial). Os sprites de combate são de corpo inteiro com fundo BRANCO (convenção Phaser,
 * Seção 3.G) — por isso a chave de recorte aqui é branca, diferente do vermelho usado nos retratos
 * de história. `transform: scale()` + `objectPosition: 'top'` aproxima o enquadramento no
 * peito/rosto, cortando as pernas de fora do círculo. O sprite de combate olha para a direita por
 * padrão (`setFlipX(false)` em CombatScene.ts) — aqui é espelhado horizontalmente (`scaleX(-1)`)
 * para olhar para a esquerda, a direção convencional de retratos em cenas de diálogo.
 */
export const AvatarEchoPortrait: React.FC = () => {
  const classId = useGameStore((s) => s.character.classId) || 'warrior';
  const spriteFile = CLASS_SPRITE_FILE[classId] || CLASS_SPRITE_FILE.warrior;
  const src = `/assets/${spriteFile}`;

  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => peekTransparentImageUrl(src, WHITE_KEY));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResolvedSrc(peekTransparentImageUrl(src, WHITE_KEY));
    setFailed(false);
    getTransparentImageUrl(src, WHITE_KEY)
      .then((dataUrl) => { if (!cancelled) setResolvedSrc(dataUrl); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [src]);

  if (failed || !resolvedSrc) return null;

  return (
    <img
      src={resolvedSrc}
      alt="O Eco do Avatar"
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top center',
        transform: 'scale(1.9) scaleX(-1)',
        transformOrigin: 'top center',
        position: 'relative',
        zIndex: 1,
      }}
    />
  );
};
