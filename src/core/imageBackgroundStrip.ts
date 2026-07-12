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

const cache = new Map<string, Promise<string>>();

function stripBackground(image: HTMLImageElement, keyColor: RgbColor, tolerance: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return image.src;

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isBackground = Math.abs(keyColor.r - r) + Math.abs(keyColor.g - g) + Math.abs(keyColor.b - b) < tolerance;
    if (isBackground) {
      data[i + 3] = 0;
    }
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
  tolerance = 50
): Promise<string> {
  const cacheKey = `${src}|${keyColor.r},${keyColor.g},${keyColor.b}|${tolerance}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const promise = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        resolve(stripBackground(image, keyColor, tolerance));
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
