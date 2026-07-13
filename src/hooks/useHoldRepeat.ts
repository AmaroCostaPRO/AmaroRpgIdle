import { useCallback, useEffect, useRef } from 'react';

const INITIAL_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 100;

// Retorna handlers de mouse/touch para segurar um botão e repetir a ação continuamente.
export function useHoldRepeat(callback: () => void, disabled: boolean = false) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);
  // Depois de um touchstart/touchend, o navegador ainda dispara um mousedown/mouseup
  // "fantasma" (sintético) alguns instantes depois, para compatibilidade com sites que só
  // escutam mouse. Num toque rápido (tap), o touchend já chama stop() e libera activeRef
  // antes desse mousedown fantasma chegar, então ele passava pela trava e somava +1 extra.
  // Aqui ignoramos qualquer início via mouse por um tempo curto após o último toque.
  const suppressMouseUntilRef = useRef(0);
  const GHOST_MOUSE_SUPPRESS_MS = 800;

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((isTouch: boolean) => {
    if (disabled) return;
    if (!isTouch && Date.now() < suppressMouseUntilRef.current) return;
    // Evita disparo duplicado quando o toque gera também um mousedown sintético.
    if (activeRef.current) return;
    activeRef.current = true;
    callbackRef.current();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, REPEAT_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }, [disabled]);

  const markTouch = useCallback(() => {
    suppressMouseUntilRef.current = Date.now() + GHOST_MOUSE_SUPPRESS_MS;
  }, []);

  const handleTouchStart = useCallback(() => {
    markTouch();
    start(true);
  }, [markTouch, start]);

  const handleTouchEnd = useCallback(() => {
    markTouch();
    stop();
  }, [markTouch, stop]);

  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  useEffect(() => stop, [stop]);

  return {
    onMouseDown: () => start(false),
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };
}
