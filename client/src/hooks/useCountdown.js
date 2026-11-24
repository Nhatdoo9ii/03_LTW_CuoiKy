import { useState, useEffect, useRef } from 'react';

// Hàm phụ: tính số giây còn lại từ initialSeconds hoặc mốc thời gian targetTimestamp
const getRemainingSeconds = (initialSeconds, targetTimestamp) => {
  if (targetTimestamp) {
    const diffMs = targetTimestamp - Date.now();
    const diffSeconds = Math.ceil(diffMs / 1000);

    if (diffSeconds > 0) {
      return diffSeconds;
    }
    return 0;
  }

  if (initialSeconds > 0) {
    return Math.floor(initialSeconds);
  }
  return 0;
};

// Hàm phụ: đổi tổng số giây (VD: 300) sang chuỗi "05:00"
const formatTime = (totalSeconds) => {
  let safeSeconds = totalSeconds;
  if (safeSeconds < 0) {
    safeSeconds = 0;
  }

  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  let minuteText = String(minutes);
  if (minutes < 10) {
    minuteText = '0' + minuteText;
  }

  let secondText = String(seconds);
  if (seconds < 10) {
    secondText = '0' + secondText;
  }

  return `${minuteText}:${secondText}`;
};

// Custom hook đếm ngược thời gian giữ ghế (mặc định 300 giây = 5 phút)
export const useCountdown = (initialSeconds = 300, options = {}) => {
  const targetTimestamp = options.targetTimestamp || null;
  const autoStart = options.autoStart !== undefined ? options.autoStart : true;
  const onExpire = options.onExpire || null;
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return getRemainingSeconds(initialSeconds, targetTimestamp);
  });
  const [isRunning, setIsRunning] = useState(autoStart);
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const isExpired = secondsLeft <= 0;

  // Chạy setInterval đếm ngược mỗi 1 giây và dọn dẹp bằng clearInterval
  useEffect(() => {

    if (!isRunning || isExpired) {
      return;
    }

    const timerId = setInterval(() => {
      if (targetTimestamp) {
        const remaining = getRemainingSeconds(initialSeconds, targetTimestamp);
        setSecondsLeft(remaining);
      } else {
        setSecondsLeft((prevSeconds) => {
          if (prevSeconds <= 1) {
            return 0;
          }
          return prevSeconds - 1;
        });
      }
    }, 1000);

    // Cleanup: hủy bộ đếm khi component bị gỡ khỏi màn hình để tránh rò rỉ bộ nhớ
    return () => {
      clearInterval(timerId);
    };
  }, [isRunning, isExpired, initialSeconds, targetTimestamp]);

  // Khi đồng hồ về 00:00 thì gọi hàm onExpire đúng 1 lần
  useEffect(() => {
    if (isExpired && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      if (onExpireRef.current) {
        onExpireRef.current();
      }
    }
  }, [isExpired]);

  // Đặt lại đồng hồ về số giây mới (hoặc giá trị ban đầu)
  const resetTimer = (customSeconds) => {
    let nextSeconds = getRemainingSeconds(initialSeconds, targetTimestamp);
    if (typeof customSeconds === 'number') {
      nextSeconds = Math.max(0, Math.floor(customSeconds));
    }

    hasExpiredRef.current = false;
    setSecondsLeft(nextSeconds);
    setIsRunning(autoStart);
  };

  // Tiếp tục chạy đồng hồ
  const startTimer = () => {
    if (secondsLeft > 0) {
      hasExpiredRef.current = false;
      setIsRunning(true);
    }
  };

  // Tạm dừng đồng hồ
  const pauseTimer = () => {
    setIsRunning(false);
  };

  return {
    secondsLeft,
    formattedTime: formatTime(secondsLeft),
    isExpired,
    isRunning: isRunning && !isExpired,
    resetTimer,
    startTimer,
    pauseTimer,
  };
};

export default useCountdown;