import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  GraduationCap,
  MapPin,
  X,
} from 'lucide-react';
import {
  DEFAULT_PTIT_PROMO,
  applyPromoCode,
  calculateBookingAmounts,
  removePromoCode,
  selectAppliedPromo,
  selectSelectedCombos,
  selectSelectedSeats,
  toggleSeat,
} from '../../../store/bookingSlice';
import { validatePromoCode } from '../../../services/bookingService';
import styles from './BookingSummary.module.css';

const formatVietnameseDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;

  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const weekdays = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];

  const dayLabel = weekdays[dateObj.getDay()];
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dayLabel}, ${dd}/${mm}/${year}`;
};

const formatCompactPrice = (price) => {
  const numeric = Number(price) || 0;
  if (numeric >= 1000 && numeric % 1000 === 0) {
    return `${numeric / 1000}k`;
  }
  return `${numeric.toLocaleString('vi-VN')}đ`;
};

const BookingSummary = ({ showtimeInfo, onProceed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const selectedSeats = useSelector(selectSelectedSeats);
  const selectedCombos = useSelector(selectSelectedCombos);
  const appliedPromo = useSelector(selectAppliedPromo);

  const [promoInput, setPromoInput] = useState(
    () => appliedPromo?.code || DEFAULT_PTIT_PROMO.code
  );
  const [promoFeedback, setPromoFeedback] = useState({
    type: '',
    message: '',
  });
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Tính tạm tính, tiền giảm giá và tổng thanh toán bằng useMemo
  const { ticketSubtotal, discountAmount, totalPrice } = useMemo(
    () => calculateBookingAmounts(selectedSeats, selectedCombos, appliedPromo),
    [selectedSeats, selectedCombos, appliedPromo]
  );

  const movie = showtimeInfo?.movie;
  const room = showtimeInfo?.room;
  const genresText = Array.isArray(movie?.genres)
    ? movie.genres.join(', ')
    : '';

  const handleApplyPromo = async (event) => {
    event.preventDefault();
    setIsValidatingPromo(true);
    setPromoFeedback({ type: '', message: '' });

    try {
      const result = await validatePromoCode(promoInput);
      if (result.valid && result.promo) {
        dispatch(applyPromoCode(result.promo));
        setPromoInput(result.promo.code);
        setPromoFeedback({
          type: 'success',
          message: result.message,
        });
      } else {
        setPromoFeedback({
          type: 'error',
          message: result.message,
        });
      }
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    dispatch(removePromoCode());
    setPromoFeedback({
      type: '',
      message: '',
    });
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;
    if (typeof onProceed === 'function') {
      onProceed();
      return;
    }
    navigate('/checkout');
  };

  return (
    <aside
      className={styles.summaryCard}
      aria-label="Tóm tắt thông tin đặt vé"
    >
      {/* Thông tin phim */}
      <div className={styles.movieHeader}>
        <div className={styles.posterWrap}>
          {movie?.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title || 'Poster phim'}
              className={styles.posterImg}
            />
          ) : (
            <div className={styles.posterFallback}>PTIT</div>
          )}
          {movie?.ageRating && (
            <span className={styles.ageBadge}>{movie.ageRating}</span>
          )}
        </div>

        <div className={styles.movieMeta}>
          <h2 className={styles.movieTitle}>
            {movie?.title || 'Đang tải thông tin phim...'}
          </h2>
          <p className={styles.movieSub}>
            {genresText}
            {movie?.duration ? ` • ${movie.duration} phút` : ''}
          </p>
          <div className={styles.formatTags}>
            <span className={styles.tagMuted}>2D Phụ đề</span>
            <span className={styles.tagAccent}>PTIT Digital</span>
          </div>
        </div>
      </div>

      {/* Thông tin rạp & suất chiếu */}
      <div className={styles.showtimeBox}>
        <div className={styles.infoRow}>
          <MapPin size={16} className={styles.infoIcon} aria-hidden="true" />
          <div>
            <span className={styles.infoLabel}>Rạp chiếu</span>
            <strong className={styles.infoValue}>
              PTIT Cinema Hà Đông – {room?.name || 'Phòng chiếu'}
            </strong>
          </div>
        </div>

        <div className={styles.infoRow}>
          <Clock size={16} className={styles.infoIcon} aria-hidden="true" />
          <div>
            <span className={styles.infoLabel}>Suất chiếu</span>
            <strong className={styles.infoValue}>
              {showtimeInfo?.time || '--:--'} •{' '}
              {formatVietnameseDate(showtimeInfo?.date)}
            </strong>
          </div>
        </div>
      </div>

      {/* Danh sách ghế đã chọn */}
      <div className={styles.seatsSection}>
        <div className={styles.seatsHeader}>
          <span className={styles.seatsLabel}>GHẾ ĐÃ CHỌN:</span>
          <strong className={styles.seatsCount}>
            {selectedSeats.length} ghế
          </strong>
        </div>

        {selectedSeats.length > 0 ? (
          <div className={styles.seatPills}>
            {selectedSeats.map((seat) => (
              <span key={seat.code} className={styles.seatPill}>
                <span>
                  {seat.code}
                  {seat.type === 'vip' ? ' (VIP)' : ''}{' '}
                  <small>{formatCompactPrice(seat.price)}</small>
                </span>
                <button
                  type="button"
                  className={styles.removeSeatBtn}
                  onClick={() => dispatch(toggleSeat(seat))}
                  aria-label={`Bỏ chọn ghế ${seat.code}`}
                  title={`Bỏ chọn ghế ${seat.code}`}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className={styles.emptySeatsHint}>
            Vui lòng chọn ít nhất 1 ghế trên sơ đồ bên trái (tối đa 8 ghế).
          </p>
        )}
      </div>

      {/* Khu vực mã ưu đãi sinh viên PTIT35 */}
      <form className={styles.promoBox} onSubmit={handleApplyPromo}>
        <div className={styles.promoTitleRow}>
          <GraduationCap
            size={18}
            className={styles.promoIcon}
            aria-hidden="true"
          />
          <strong className={styles.promoHeading}>
            Đặc quyền Sinh viên PTIT
          </strong>
        </div>
        <p className={styles.promoDesc}>
          Giảm trực tiếp <strong>35% giá vé</strong> khi áp dụng mã sinh viên{' '}
          <code>PTIT35</code> và xác thực thẻ sinh viên tại cổng rạp.
        </p>

        <label htmlFor="booking-promo-input" className={styles.srOnly}>
          Nhập mã ưu đãi PTIT
        </label>
        <div className={styles.promoInputRow}>
          <input
            id="booking-promo-input"
            type="text"
            value={promoInput}
            onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
            placeholder="Nhập mã (VD: PTIT35)"
            className={styles.promoInput}
          />
          {appliedPromo ? (
            <button
              type="button"
              onClick={handleRemovePromo}
              className={styles.promoRemoveBtn}
            >
              Gỡ mã
            </button>
          ) : (
            <button
              type="submit"
              disabled={isValidatingPromo}
              className={styles.promoApplyBtn}
            >
              {isValidatingPromo ? '...' : 'Áp dụng'}
            </button>
          )}
        </div>

        {promoFeedback.message && (
          <p
            className={`${styles.promoFeedback} ${
              promoFeedback.type === 'error'
                ? styles.feedbackError
                : styles.feedbackSuccess
            }`}
          >
            {promoFeedback.message}
          </p>
        )}
      </form>

      {/* Chi tiết thanh toán */}
      <div className={styles.priceBreakdown}>
        <div className={styles.priceRow}>
          <span>Tạm tính vé xem phim</span>
          <strong>{ticketSubtotal.toLocaleString('vi-VN')}đ</strong>
        </div>

        {appliedPromo && discountAmount > 0 && (
          <div className={`${styles.priceRow} ${styles.discountRow}`}>
            <span>
              Ưu đãi ({appliedPromo.code}
              {appliedPromo.discountType === 'percent'
                ? ` -${appliedPromo.discountValue}%`
                : ''}
              )
            </span>
            <strong>-{discountAmount.toLocaleString('vi-VN')}đ</strong>
          </div>
        )}

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Tổng thanh toán</span>
          <div className={styles.totalAmountGroup}>
            <strong className={styles.totalValue}>
              {totalPrice.toLocaleString('vi-VN')}đ
            </strong>
            {discountAmount > 0 && (
              <span className={styles.savedText}>
                Tiết kiệm {discountAmount.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nút tiếp tục thanh toán */}
      <button
        type="button"
        className={styles.continueBtn}
        onClick={handleContinue}
        disabled={selectedSeats.length === 0}
      >
        <span>Tiếp tục thanh toán</span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </aside>
  );
};

export default BookingSummary;