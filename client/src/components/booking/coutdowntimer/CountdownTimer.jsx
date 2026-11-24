import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import {
  HOLD_DURATION_SECONDS,
  expireBookingHold,
  selectHoldExpiresAt,
  selectShowtimeInfo,
} from '../../store/bookingSlice';
import styles from './CountdownTimer.module.css';

// Component đồng hồ đếm ngược 5 phút (dùng cho cả trang Chọn ghế và trang Thanh toán)
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

  let effectiveTarget = holdExpiresAt;
  if (targetTimestamp !== undefined) {
    effectiveTarget = targetTimestamp;
  }

  let effectiveMovieId = movieId;
  if (!effectiveMovieId && showtimeInfo) {
    if (showtimeInfo.movieId) {
      effectiveMovieId = showtimeInfo.movieId;
    } else if (showtimeInfo.movie && showtimeInfo.movie.id) {
      effectiveMovieId = showtimeInfo.movie.id;
    }
  }

  // Hàm xử lý khi đồng hồ đếm ngược chạm 00:00
  const handleTimerExpire = () => {
    dispatch(expireBookingHold());

    if (typeof onExpire === 'function') {
      onExpire();
      return;
    }

    window.alert(
      'Đã hết thời gian giữ ghế (05:00). Hệ thống đã hủy ghế đang chọn và đưa bạn về trang phim.'
    );

    if (effectiveMovieId) {
      navigate(`/movies/${effectiveMovieId}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Gọi custom hook useCountdown để đếm ngược theo từng giây
  const { secondsLeft, formattedTime } = useCountdown(initialSeconds, {
    targetTimestamp: effectiveTarget,
    autoStart: true,
    onExpire: handleTimerExpire,
  });

  // Bật hiệu ứng cảnh báo nhấp nháy khi còn từ 60 giây trở xuống
  const isUrgent = secondsLeft > 0 && secondsLeft <= 60;

  if (variant === 'compact') {
    let pillClassName = styles.compactPill;
    if (isUrgent) {
      pillClassName = `${styles.compactPill} ${styles.urgent}`;
    }

    const compactLabel = label || 'Thời gian hoàn tất thanh toán:';

    return (
      <div
        className={pillClassName}
        role="timer"
        aria-live="polite"
        aria-label={`Thời gian hoàn tất thanh toán còn lại ${formattedTime}`}
      >
        <Clock size={15} className={styles.compactIcon} aria-hidden="true" />
        <span className={styles.compactLabel}>{compactLabel}</span>
        <strong className={styles.compactTime}>{formattedTime}</strong>
      </div>
    );
  }

  let cardClassName = styles.timerCard;
  if (isUrgent) {
    cardClassName = `${styles.timerCard} ${styles.urgent}`;
  }

  const cardLabel = label || 'THỜI GIAN GIỮ GHẾ';

  return (
    <div
      className={cardClassName}
      role="timer"
      aria-live="polite"
      aria-label={`Thời gian giữ ghế còn lại ${formattedTime}`}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        <Clock size={20} />
      </div>
      <div className={styles.textWrap}>
        <span className={styles.cardLabel}>{cardLabel}</span>
        <div className={styles.timeRow}>
          <strong className={styles.timeValue}>{formattedTime}</strong>
          <span className={styles.timeUnit}>phút</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;