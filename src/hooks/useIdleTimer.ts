import { useState, useEffect, useRef, useCallback } from 'react';

export function useIdleTimer(timeoutMs: number = 4000) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHideTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, timeoutMs);
  }, [timeoutMs]);

  // Show overlay and start the auto-hide countdown
  const showOverlay = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsVisible(true);
    startHideTimer();
  }, [startHideTimer]);

  // Hide overlay immediately (e.g. after channel switch)
  const hideOverlay = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Show briefly on mount, then auto-hide
    showOverlay();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [showOverlay]);

  return { isVisible, showOverlay, hideOverlay };
}
