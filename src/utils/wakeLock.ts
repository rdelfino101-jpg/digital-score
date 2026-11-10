import { useEffect, useRef } from 'react';

/**
 * Screen WakeLock hook to prevent displays (such as project screen / external monitor)
 * from dimming or going to sleep during live events.
 * Automatically re-acquires the lock on `visibilitychange` when the tab returns to foreground.
 */
export function useScreenWakeLock(enabled: boolean = true): { isSupported: boolean } {
  const wakeLockRef = useRef<any>(null);
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  useEffect(() => {
    if (!enabled || !isSupported) return;

    let isCancelled = false;

    const requestLock = async () => {
      try {
        if (document.visibilityState === 'visible' && !isCancelled) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('[WakeLock] Unable to acquire screen wake lock:', err);
      }
    };

    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isCancelled) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {
          // ignore
        }
        wakeLockRef.current = null;
      }
    };
  }, [enabled, isSupported]);

  return { isSupported };
}
