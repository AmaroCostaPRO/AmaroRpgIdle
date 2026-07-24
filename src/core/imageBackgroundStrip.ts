/**
 * Remove o fundo sólido de uma imagem via canvas, no lado do DOM/React.
 *
 * Usa uma cor de chave (chroma key) EXPLÍCITA em vez de auto-detectar a
 * cor de fundo pela borda da imagem (como `CombatScene.makeTextureTransparent`
 * faz no Phaser). A auto-detecção por linha y=0 quebra quando a imagem tem
 * uma borda/linha divisória fina de outra cor entre quadrantes de um grid
 * (caso das spritesheets 2x2 de evolução das construções da Cidadela, que
 * têm um contorno preto fino ao redor e entre os quadrantes) — nesse caso,
 * a cor "detectada" na borda seria o preto do contorno, não o vermelho de
 * fundo, e o algoritmo apagaria todo o contorno preto real da arte pixel
 * art (que é a maior parte do desenho) em vez do fundo.
 *
 * Resultado cacheado por `src`+`keyColor` (Promise compartilhada) para que
 * múltiplos componentes usando a mesma imagem só paguem o custo do
 * processamento de canvas uma única vez.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** Cor de fundo padrão usada nas artes geradas por IA da Cidadela (vermelho puro). */
export const DEFAULT_CHROMA_KEY: RgbColor = { r: 254, g: 2, b: 1 };

// Largura (na mesma escala de distância Manhattan 0-765 usada por `tolerance`) da faixa de
// transição logo além do corte de fundo — em vez de virar opaca de uma vez, essa faixa recebe
// alpha gradual (rampa 0→255) + supressão do canal dominante da cor-chave ("despill", mesma
// técnica de chroma key profissional). Sem isso, os pixels de anti-aliasing da própria arte
// (mistura entre o desenho e o vermelho de fundo) ficam perto demais do vermelho pra sumir com
// o corte binário, mas longe o bastante pra não ser tratados como fundo — resultando numa linha
// vermelha fina contornando o sprite.
const DEFAULT_FEATHER_WIDTH = 40;

const cache = new Map<string, Promise<string>>();
// Espelha `cache` com o valor já resolvido (síncrono), para que componentes que montam
// depois do processamento (ex: reabrir a aba da Cidadela) possam pintar a arte real já
// no primeiro render, sem o "flash" do ícone de fallback enquanto a Promise resolve de novo.
const resolvedCache = new Map<string, string>();

function stripBackground(image: HTMLImageElement, keyColor: RgbColor, tolerance: number, featherWidth: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return image.src;

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Canal que domina a cor-chave (vermelho, no caso do chroma key padrão do jogo) — é esse
  // canal que "vaza" para os pixels de borda parcialmente transparentes, então é ele que a
  // supressão de spill puxa para baixo.
  const keyChannels: [number, number, number] = [keyColor.r, keyColor.g, keyColor.b];
  const dominantIdx = keyChannels[0] >= keyChannels[1] && keyChannels[0] >= keyChannels[2] ? 0
    : keyChannels[1] >= keyChannels[2] ? 1 : 2;
  const featherEnd = tolerance + featherWidth;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = Math.abs(keyColor.r - r) + Math.abs(keyColor.g - g) + Math.abs(keyColor.b - b);

    if (dist < tolerance) {
      // Fundo "puro" — some por completo, como antes.
      data[i + 3] = 0;
      continue;
    }

    if (dist < featherEnd) {
      // Faixa de transição: rampa de alpha (perto do fundo = quase transparente) e despill do
      // canal dominante da cor-chave, proporcional a quão perto do fundo o pixel está.
      const t = (dist - tolerance) / featherWidth; // 0 = colado no fundo … 1 = já é arte
      const spill = 1 - t;
      data[i + 3] = Math.round(t * 255);

      const rgb = [r, g, b];
      const otherA = rgb[(dominantIdx + 1) % 3];
      const otherB = rgb[(dominantIdx + 2) % 3];
      const maxOther = Math.max(otherA, otherB);
      const dominantVal = rgb[dominantIdx];
      data[i + dominantIdx] = Math.round(dominantVal - (dominantVal - maxOther) * spill);
    }
    // dist >= featherEnd: pixel de arte legítimo, mantém como veio (opaco, cor original).
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Carrega `src`, remove o fundo pela cor de chave e resolve com uma data
 * URL PNG transparente. Rejeita se a imagem não existir/falhar ao carregar
 * (para que o chamador possa cair no fallback normalmente).
 */
export function getTransparentImageUrl(
  src: string,
  keyColor: RgbColor = DEFAULT_CHROMA_KEY,
  tolerance = 50,
  featherWidth = DEFAULT_FEATHER_WIDTH
): Promise<string> {
  const cacheKey = `${src}|${keyColor.r},${keyColor.g},${keyColor.b}|${tolerance}|${featherWidth}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const promise = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const dataUrl = stripBackground(image, keyColor, tolerance, featherWidth);
        resolvedCache.set(cacheKey, dataUrl);
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };
    image.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
    image.src = src;
  });

  cache.set(cacheKey, promise);
  return promise;
}

/**
 * Retorna a data URL já processada para `src`, se o processamento já tiver
 * terminado antes (ex: por um `getTransparentImageUrl` anterior/preload).
 * Não dispara nenhum carregamento — use para evitar o flash do ícone de
 * fallback ao montar um componente cuja imagem já está pronta.
 */
export function peekTransparentImageUrl(
  src: string,
  keyColor: RgbColor = DEFAULT_CHROMA_KEY,
  tolerance = 50,
  featherWidth = DEFAULT_FEATHER_WIDTH
): string | null {
  const cacheKey = `${src}|${keyColor.r},${keyColor.g},${keyColor.b}|${tolerance}|${featherWidth}`;
  return resolvedCache.get(cacheKey) ?? null;
}
