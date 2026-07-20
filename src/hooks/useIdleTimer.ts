import { useState, useEffect, useRef, useCallback } from 'react';
import { useTVEventHandler } from 'react-native';

export function useIdleTimer(timeoutMs: number = 4000) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const timerRef = useRef<any>(null);

  const resetTimer = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Show the overlay
    setIsVisible(true);

    // Set a new timer to hide the overlay
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, timeoutMs);
  }, [timeoutMs]);

  const showOverlay = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Use the built-in React Native hook to listen to TV remote event triggers
  useTVEventHandler((event) => {
    if (event) {
      resetTimer();
    }
  });

  useEffect(() => {
    // Reset timer on mount
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer]);

  return { isVisible, showOverlay, resetTimer };
}
