import { useEffect, useState } from 'react';

// Contagem regressiva reativa até `completesAt` (timestamp Unix em ms), atualizada a cada segundo.
// Usado pelos painéis da Cidadela para exibir o tempo restante de upgrades de estrutura em andamento.
export const useCountdown = (completesAt: number | undefined): string | null => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!completesAt || completesAt <= Date.now()) return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= completesAt) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [completesAt]);

  if (!completesAt) return null;
  const remainingMs = Math.max(0, completesAt - now);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
};
