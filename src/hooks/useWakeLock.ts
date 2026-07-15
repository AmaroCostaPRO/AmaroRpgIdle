import { useEffect, useRef } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}

// Mantém a tela ligada enquanto `active` for true, usando a Screen Wake Lock
// API nativa do navegador. O lock é liberado automaticamente pelo SO quando a
// aba fica oculta, então readquirimos ao voltar (visibilitychange).
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;

    let cancelled = false;

    const requestLock = async () => {
      try {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        // O SO/navegador pode liberar o lock sozinho (ex.: Android após um
        // tempo) sem disparar visibilitychange; sem isso a ref fica presa
        // num sentinela já liberado e nunca é readquirido.
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
          }
        });
      } catch (e) {
        console.warn('[useWakeLock] Falha ao adquirir wake lock:', e);
      }
    };

    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Reforço: readquire o lock em qualquer toque na tela caso o SO tenha
    // liberado o lock sem que a aba tenha ficado invisível.
    const handleUserGesture = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        requestLock();
      }
    };
    document.addEventListener('touchstart', handleUserGesture, { passive: true });
    document.addEventListener('pointerdown', handleUserGesture);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', handleUserGesture);
      document.removeEventListener('pointerdown', handleUserGesture);
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, [active]);
}
