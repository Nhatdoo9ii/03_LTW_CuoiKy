import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, GraduationCap, MapPin, X } from 'lucide-react';
import {
  DEFAULT_PTIT_PROMO,
  applyPromoCode,
  calculateBookingAmounts,
  removePromoCode,
  selectAppliedPromo,
  selectSelectedCombos,
  selectSelectedSeats,
  toggleSeat,
} from '../../store/bookingSlice';
import { validatePromoCode } from '../../services/bookingService';
import styles from './BookingSummary.module.css';

// Hàm phụ: đổi ngày "2026-11-18" thành "Thứ Tư, 18/11/2026"
const formatVietnameseDate = (dateStr) => {
  if (!dateStr) {
    return '';
  }

  const parts = String(dateStr).split('-');
  if (parts.length !== 3) {
    return dateStr;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return dateStr;
  }

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

  const dayName = weekdays[dateObj.getDay()];
  const dayText = String(day).padStart(2, '0');
  const monthText = String(month).padStart(2, '0');

  return `${dayName}, ${dayText}/${monthText}/${year}`;
};

// Hàm phụ: rút gọn giá hiển thị trên thẻ ghế (VD: 100000 -> "100k")
const formatCompactPrice = (price) => {
  const numericPrice = Number(price) || 0;
  if (numericPrice >= 1000 && numericPrice % 1000 === 0) {
    return `${numericPrice / 1000}k`;
  }
  return `${numericPrice.toLocaleString('vi-VN')}đ`;
};

// Component cột tóm tắt đơn đặt vé ở bên phải trang Chọn ghế
const BookingSummary = ({ showtimeInfo, onProceed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Lấy danh sách ghế, combo và mã ưu đãi từ Redux store
  const selectedSeats = useSelector(selectSelectedSeats);
  const selectedCombos = useSelector(selectSelectedCombos);
  const appliedPromo = useSelector(selectAppliedPromo);

  // State quản lý ô nhập mã ưu đãi và thông báo phản hồi
  const [promoInput, setPromoInput] = useState(() => {
    if (appliedPromo && appliedPromo.code) {
      return appliedPromo.code;
    }
    return DEFAULT_PTIT_PROMO.code;
  });
  const [promoFeedback, setPromoFeedback] = useState({
    type: '',
    message: '',
  });
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Dùng useMemo để tính lại tiền vé, tiền giảm giá và tổng thanh toán khi ghế/mã thay đổi
  const bookingAmounts = useMemo(() => {
    return calculateBookingAmounts(selectedSeats, selectedCombos, appliedPromo);
  }, [selectedSeats, selectedCombos, appliedPromo]);

  const { ticketSubtotal, discountAmount, totalPrice } = bookingAmounts;

  // Trích xuất thông tin phim và phòng chiếu cho dễ đọc trong JSX
  const movie = showtimeInfo ? showtimeInfo.movie : null;
  const room = showtimeInfo ? showtimeInfo.room : null;

  let genresText = '';
  if (movie && Array.isArray(movie.genres)) {
    genresText = movie.genres.join(', ');
  }

  let movieSubtitle = genresText;
  if (movie && movie.duration) {
    movieSubtitle = `${genresText} • ${movie.duration} phút`;
  }

  const roomName = room && room.name ? room.name : 'Phòng chiếu';
  const showtimeHour = showtimeInfo && showtimeInfo.time ? showtimeInfo.time : '--:--';
  const showtimeDate = showtimeInfo ? formatVietnameseDate(showtimeInfo.date) : '';

  // Xử lý bấm nút "Áp dụng" mã giảm giá
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
    } catch (error) {
      setPromoFeedback({
        type: 'error',
        message: error.message || 'Không thể kiểm tra mã ưu đãi.',
      });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Xử lý bấm nút "Gỡ mã" ưu đãi
  const handleRemovePromo = () => {
    dispatch(removePromoCode());
    setPromoFeedback({
      type: '',
      message: '',
    });
  };

  // Xử lý bấm nút "Tiếp tục thanh toán"
  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      return;
    }

    if (typeof onProceed === 'function') {
      onProceed();
      return;
    }

    navigate('/checkout');
  };

  // Tạo nhãn hiển thị cho dòng giảm giá (VD: "Ưu đãi (PTIT35 -35%)")
  let discountLabel = '';
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percent') {
      discountLabel = `Ưu đãi (${appliedPromo.code} -${appliedPromo.discountValue}%)`;
    } else {
      discountLabel = `Ưu đãi (${appliedPromo.code})`;
    }
  }

  // Chọn class màu cho câu thông báo mã ưu đãi (xanh nếu đúng, đỏ nếu lỗi)
  let feedbackClassName = styles.promoFeedback;
  if (promoFeedback.type === 'error') {
    feedbackClassName = `${styles.promoFeedback} ${styles.feedbackError}`;
  } else if (promoFeedback.type === 'success') {
    feedbackClassName = `${styles.promoFeedback} ${styles.feedbackSuccess}`;
  }

  return (
    <aside className={styles.summaryCard} aria-label="Tóm tắt thông tin đặt vé">
      {/* 1. Thông tin poster và tên phim */}
      <div className={styles.movieHeader}>
        <div className={styles.posterWrap}>
          {movie && movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title || 'Poster phim'}
              className={styles.posterImg}
            />
          ) : (
            <div className={styles.posterFallback}>PTIT</div>
          )}

          {movie && movie.ageRating && (
            <span className={styles.ageBadge}>{movie.ageRating}</span>
          )}
        </div>

        <div className={styles.movieMeta}>
          <h2 className={styles.movieTitle}>
            {movie && movie.title ? movie.title : 'Đang tải thông tin phim...'}
          </h2>
          <p className={styles.movieSub}>{movieSubtitle}</p>
          <div className={styles.formatTags}>
            <span className={styles.tagMuted}>2D Phụ đề</span>
            <span className={styles.tagAccent}>PTIT Digital</span>
          </div>
        </div>
      </div>

      {/* 2. Thông tin rạp chiếu và khung giờ */}
      <div className={styles.showtimeBox}>
        <div className={styles.infoRow}>
          <MapPin size={16} className={styles.infoIcon} aria-hidden="true" />
          <div>
            <span className={styles.infoLabel}>Rạp chiếu</span>
            <strong className={styles.infoValue}>
              PTIT Cinema Hà Đông – {roomName}
            </strong>
          </div>
        </div>

        <div className={styles.infoRow}>
          <Clock size={16} className={styles.infoIcon} aria-hidden="true" />
          <div>
            <span className={styles.infoLabel}>Suất chiếu</span>
            <strong className={styles.infoValue}>
              {showtimeHour} • {showtimeDate}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Danh sách ghế người dùng đang chọn */}
      <div className={styles.seatsSection}>
        <div className={styles.seatsHeader}>
          <span className={styles.seatsLabel}>GHẾ ĐÃ CHỌN:</span>
          <strong className={styles.seatsCount}>{selectedSeats.length} ghế</strong>
        </div>

        {selectedSeats.length > 0 ? (
          <div className={styles.seatPills}>
            {selectedSeats.map((seat) => {
              let seatLabel = seat.code;
              if (seat.type === 'vip') {
                seatLabel = `${seat.code} (VIP)`;
              }

              return (
                <span key={seat.code} className={styles.seatPill}>
                  <span>
                    {seatLabel} <small>{formatCompactPrice(seat.price)}</small>
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
              );
            })}
          </div>
        ) : (
          <p className={styles.emptySeatsHint}>
            Vui lòng chọn ít nhất 1 ghế trên sơ đồ bên trái (tối đa 8 ghế).
          </p>
        )}
      </div>

      {/* 4. Form nhập mã ưu đãi sinh viên PTIT35 */}
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
            onChange={(event) => {
              setPromoInput(event.target.value.toUpperCase());
            }}
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
          <p className={feedbackClassName}>{promoFeedback.message}</p>
        )}
      </form>

      {/* 5. Bảng tính tiền chi tiết */}
      <div className={styles.priceBreakdown}>
        <div className={styles.priceRow}>
          <span>Tạm tính vé xem phim</span>
          <strong>{ticketSubtotal.toLocaleString('vi-VN')}đ</strong>
        </div>

        {appliedPromo && discountAmount > 0 && (
          <div className={`${styles.priceRow} ${styles.discountRow}`}>
            <span>{discountLabel}</span>
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

      {/* 6. Nút chuyển sang trang Thanh toán */}
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