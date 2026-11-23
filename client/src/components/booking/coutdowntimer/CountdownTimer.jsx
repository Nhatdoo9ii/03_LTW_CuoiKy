import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useCountdown } from '../../../hooks/useCountdown';
import {
  HOLD_DURATION_SECONDS,
  expireBookingHold,
  selectHoldExpiresAt,
  selectShowtimeInfo,
} from '../../../store/bookingSlice';
import styles from './CountdownTimer.module.css';

const CountdownTimer = ({
  initialSeconds = HOLD_DURATION_SECONDS,
  targetTimestamp,
  movieId,
  variant = 'card',
  label,
  onExpire,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const holdExpiresAt = useSelector(selectHoldExpiresAt);
  const showtimeInfo = useSelector(selectShowtimeInfo);

  const effectiveTarget =
    targetTimestamp !== undefined ? targetTimestamp : holdExpiresAt;
  const effectiveMovieId =
    movieId || showtimeInfo?.movieId || showtimeInfo?.movie?.id;

  const handleTimerExpire = useCallback(() => {
    dispatch(expireBookingHold());

    if (typeof onExpire === 'function') {
      onExpire();
      return;
    }

    window.alert(
      'Đã hết thời gian giữ ghế (05:00). Hệ thống đã hủy ghế đang chọn và đưa bạn về trang phim.'
    );

    const destination = effectiveMovieId ? `/movies/${effectiveMovieId}` : '/';
    navigate(destination, { replace: true });
  }, [dispatch, navigate, effectiveMovieId, onExpire]);

  const { secondsLeft, formattedTime } = useCountdown(initialSeconds, {
    targetTimestamp: effectiveTarget,
    autoStart: true,
    onExpire: handleTimerExpire,
  });

  const isUrgent = secondsLeft > 0 && secondsLeft <= 60;

  if (variant === 'compact') {
    return (
      <div
        className={`${styles.compactPill} ${isUrgent ? styles.urgent : ''}`}
        role="timer"
        aria-live="polite"
        aria-label={`Thời gian hoàn tất thanh toán còn lại ${formattedTime}`}
      >
        <Clock size={15} className={styles.compactIcon} aria-hidden="true" />
        <span className={styles.compactLabel}>
          {label || 'Thời gian hoàn tất thanh toán:'}
        </span>
        <strong className={styles.compactTime}>{formattedTime}</strong>
      </div>
    );
  }

  return (
    <div
      className={`${styles.timerCard} ${isUrgent ? styles.urgent : ''}`}
      role="timer"
      aria-live="polite"
      aria-label={`Thời gian giữ ghế còn lại ${formattedTime}`}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        <Clock size={20} />
      </div>
      <div className={styles.textWrap}>
        <span className={styles.cardLabel}>{label || 'THỜI GIAN GIỮ GHẾ'}</span>
        <div className={styles.timeRow}>
          <strong className={styles.timeValue}>{formattedTime}</strong>
          <span className={styles.timeUnit}>phút</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;