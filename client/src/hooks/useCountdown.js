import { useState, useEffect, useCallback, useRef } from 'react';

const formatSecondsToMMSS = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const useCountdown = (initialSeconds = 300, options = {}) => {
  const { targetTimestamp = null, autoStart = true, onExpire } = options;
  const hasTarget =
    typeof targetTimestamp === 'number' && Number.isFinite(targetTimestamp);

  const [timerState, setTimerState] = useState(() => {
    const safeInitial = Math.max(0, Math.floor(Number(initialSeconds) || 0));
    return {
      secondsLeft: safeInitial,
      isRunning: !hasTarget && Boolean(autoStart && safeInitial > 0),
      hasInitialized: !hasTarget,
    };
  });

  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);
  const hasCountedRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Đồng bộ theo mốc hết hạn (targetTimestamp) qua callback bất đồng bộ
  useEffect(() => {
    if (!hasTarget) return undefined;

    const syncId = window.setTimeout(() => {
      const remaining = Math.max(
        0,
        Math.ceil((targetTimestamp - Date.now()) / 1000)
      );
      hasExpiredRef.current = false;
      hasCountedRef.current = remaining > 0;
      setTimerState({
        secondsLeft: remaining,
        isRunning: Boolean(autoStart && remaining > 0),
        hasInitialized: true,
      });
    }, 0);

    return () => {
      window.clearTimeout(syncId);
    };
  }, [hasTarget, targetTimestamp, autoStart]);

  // Đếm ngược từng giây bằng setInterval + cleanup clearInterval
  useEffect(() => {
    if (!timerState.isRunning) return undefined;

    const intervalId = window.setInterval(() => {
      setTimerState((prev) => {
        const nextSeconds = hasTarget
          ? Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000))
          : Math.max(0, prev.secondsLeft - 1);

        return {
          secondsLeft: nextSeconds,
          isRunning: nextSeconds > 0,
          hasInitialized: true,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timerState.isRunning, hasTarget, targetTimestamp]);

  // Kích hoạt callback onExpire đúng 1 lần khi chạm 00:00
  useEffect(() => {
    if (!timerState.hasInitialized) return;

    if (timerState.secondsLeft > 0) {
      hasCountedRef.current = true;
      hasExpiredRef.current = false;
      return;
    }

    if (
      timerState.secondsLeft <= 0 &&
      (hasCountedRef.current || hasTarget) &&
      !hasExpiredRef.current
    ) {
      hasExpiredRef.current = true;
      if (typeof onExpireRef.current === 'function') {
        onExpireRef.current();
      }
    }
  }, [timerState.secondsLeft, timerState.hasInitialized, hasTarget]);

  const resetTimer = useCallback(
    (customSeconds) => {
      const nextSeconds =
        typeof customSeconds === 'number'
          ? Math.max(0, Math.floor(customSeconds))
          : hasTarget
            ? Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000))
            : Math.max(0, Math.floor(Number(initialSeconds) || 0));

      hasExpiredRef.current = false;
      hasCountedRef.current = nextSeconds > 0;
      setTimerState({
        secondsLeft: nextSeconds,
        isRunning: Boolean(autoStart && nextSeconds > 0),
        hasInitialized: true,
      });
    },
    [initialSeconds, hasTarget, targetTimestamp, autoStart]
  );

  const startTimer = useCallback(() => {
    setTimerState((prev) => {
      if (prev.secondsLeft <= 0) return prev;
      hasExpiredRef.current = false;
      return { ...prev, isRunning: true };
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState((prev) =>
      prev.isRunning ? { ...prev, isRunning: false } : prev
    );
  }, []);

  const isExpired = timerState.hasInitialized && timerState.secondsLeft <= 0;
  const formattedTime = formatSecondsToMMSS(timerState.secondsLeft);

  return {
    secondsLeft: timerState.secondsLeft,
    formattedTime,
    isExpired,
    isRunning: timerState.isRunning,
    resetTimer,
    startTimer,
    pauseTimer,
  };
};

export default useCountdown;