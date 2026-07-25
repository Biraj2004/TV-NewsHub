import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

async function verifyActiveInternet(timeoutMs = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status === 204 || res.status === 200;
  } catch (_e) {
    return false;
  }
}

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const isOnlineRef = useRef<boolean>(true);
  isOnlineRef.current = isOnline;

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    const checkStatus = async (netState?: NetInfoState) => {
      const currentNet = netState || (await NetInfo.fetch());

      if (currentNet.isConnected === false) {
        if (isOnlineRef.current !== false) setIsOnline(false);
        return;
      }

      if (currentNet.isInternetReachable === false) {
        if (isOnlineRef.current !== false) setIsOnline(false);
        return;
      }

      const pingOk = await verifyActiveInternet();
      if (pingOk) {
        if (isOnlineRef.current !== true) setIsOnline(true);
      } else {
        if (isOnlineRef.current !== false) setIsOnline(false);
      }
    };

    checkStatus();

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      checkStatus(state);
    });

    timerId = setInterval(() => {
      checkStatus();
    }, 4000);

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkStatus();
      }
    };

    const subscriptionAppState = AppState.addEventListener('change', handleAppState);

    return () => {
      unsubscribeNetInfo();
      subscriptionAppState.remove();
      if (timerId) clearInterval(timerId);
    };
  }, []);

  return isOnline;
}
