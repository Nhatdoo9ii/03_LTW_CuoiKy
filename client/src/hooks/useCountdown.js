import { useState, useEffect, useCallback, useRef } from 'react';

const calculateRemainingSeconds = (initialSeconds, targetTimestamp) => {
  if (typeof targetTimestamp === 'number' && Number.isFinite(targetTimestamp)) {
    return Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
  }
  return Math.max(0, Math.floor(Number(initialSeconds) || 0));
};

const formatSecondsToMMSS = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Custom hook đếm ngược thời gian theo giây bằng setInterval + cleanup clearInterval.
 * Hỗ trợ đếm theo số giây (initialSeconds) hoặc đồng bộ theo mốc hết hạn (targetTimestamp)
 * để giữ nguyên thời gian khi chuyển từ trang Chọn ghế sang trang Thanh toán.
 *
 * @param {number} [initialSeconds=300] - Số giây đếm ngược mặc định (300s = 05:00)
 * @param {object} [options]
 * @param {number | null} [options.targetTimestamp=null] - Timestamp (ms) thời điểm hết hạn
 * @param {boolean} [options.autoStart=true] - Tự chạy ngay khi mount
 * @param {() => void} [options.onExpire] - Callback gọi đúng 1 lần khi về 00:00
 */
export const useCountdown = (initialSeconds = 300, options = {}) => {
  const { targetTimestamp = null, autoStart = true, onExpire } = options;

  const [secondsLeft, setSecondsLeft] = useState(() =>
    calculateRemainingSeconds(initialSeconds, targetTimestamp)
  );
  const [isRunning, setIsRunning] = useState(
    () =>
      autoStart &&
      calculateRemainingSeconds(initialSeconds, targetTimestamp) > 0
  );

  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Đồng bộ lại đồng hồ khi targetTimestamp thay đổi (ví dụ tạo phiên giữ ghế mới trong Redux)
  useEffect(() => {
    if (typeof targetTimestamp === 'number' && Number.isFinite(targetTimestamp)) {
      const remaining = calculateRemainingSeconds(initialSeconds, targetTimestamp);
      setSecondsLeft(remaining);
      hasExpiredRef.current = remaining <= 0;
      setIsRunning(autoStart && remaining > 0);
    }
  }, [targetTimestamp, initialSeconds, autoStart]);

  // Chạy setInterval đếm ngược theo từng giây và luôn dọn dẹp bằng clearInterval
  useEffect(() => {
    if (!isRunning) return undefined;

    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (
          typeof targetTimestamp === 'number' &&
          Number.isFinite(targetTimestamp)
        ) {
          return Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isRunning, targetTimestamp]);

  // Gọi callback onExpire an toàn sau khi render commit khi đồng hồ chạm 00:00
  useEffect(() => {
    if (secondsLeft <= 0 && isRunning) {
      setIsRunning(false);
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        if (typeof onExpireRef.current === 'function') {
          onExpireRef.current();
        }
      }
    }
  }, [secondsLeft, isRunning]);

  const resetTimer = useCallback(
    (customSeconds) => {
      const nextSeconds =
        typeof customSeconds === 'number'
          ? Math.max(0, Math.floor(customSeconds))
          : calculateRemainingSeconds(initialSeconds, targetTimestamp);

      hasExpiredRef.current = false;
      setSecondsLeft(nextSeconds);
      setIsRunning(autoStart && nextSeconds > 0);
    },
    [initialSeconds, targetTimestamp, autoStart]
  );

  const startTimer = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev > 0) {
        hasExpiredRef.current = false;
        setIsRunning(true);
      }
      return prev;
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const isExpired = secondsLeft <= 0;
  const formattedTime = formatSecondsToMMSS(secondsLeft);

  return {
    secondsLeft,
    formattedTime,
    isExpired,
    isRunning,
    resetTimer,
    startTimer,
    pauseTimer,
  };
};

export default useCountdown;