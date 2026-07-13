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

  const start = useCallback(() => {
    if (disabled) return;
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

  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  useEffect(() => stop, [stop]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
  };
}
