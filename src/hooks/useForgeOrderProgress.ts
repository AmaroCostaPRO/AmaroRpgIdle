import { useEffect, useState } from 'react';

// Progresso reativo (0-100) do ciclo de 1h de ordens de serviço da Oficina da Forja, atualizado a
// cada segundo. Diferente de `useCountdown` (que conta até um `completesAt` fixo), aqui o ciclo se
// repete indefinidamente a partir de `lastTick` — por isso usamos o resto da divisão pelo tamanho
// do ciclo em vez de uma contagem regressiva única.
export const useForgeOrderProgress = (lastTick: number, cycleMs: number): { progressPct: number; remainingLabel: string } => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.max(0, now - lastTick);
  const elapsedInCycle = elapsed % cycleMs;
  const progressPct = (elapsedInCycle / cycleMs) * 100;
  const remainingMs = cycleMs - elapsedInCycle;
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const remainingLabel = `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  return { progressPct, remainingLabel };
};
