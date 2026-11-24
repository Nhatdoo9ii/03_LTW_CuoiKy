import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CupSoda,
  Info,
  MapPin,
  Minus,
  Plus,
  QrCode,
  Tag,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import CountdownTimer from '../../components/booking/CountdownTimer';
import PaymentMethodSelector from '../../../components/tickets-admin/PaymentMethodSelector';
import {
  AVAILABLE_COMBOS,
  applyPromoCode,
  calculateBookingAmounts,
  removeConflictSeats,
  removePromoCode,
  selectAppliedPromo,
  selectSelectedCombos,
  selectSelectedSeats,
  selectShowtimeInfo,
  setLastCompletedBooking,
  updateComboQuantity,
} from '../../../store/bookingSlice';
import {
  createBooking,
  validatePromoCode,
} from '../../../services/bookingService';
import styles from './CheckoutPage.module.css';

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

  return `${weekdays[dateObj.getDay()]}, ${String(day).padStart(
    2,
    '0'
  )}/${String(month).padStart(2, '0')}/${year}`;
};

const validateCustomerForm = (values) => {
  const errors = {};
  const trimmedName = values.fullName.trim();
  const trimmedPhone = values.phone.replace(/\s+/g, '');
  const trimmedEmail = values.email.trim();

  if (trimmedName.length < 2) {
    errors.fullName = 'Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự).';
  }

  if (!/^0\d{9}$/.test(trimmedPhone)) {
    errors.phone = 'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
  }

  return errors;
};

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const showtimeInfo = useSelector(selectShowtimeInfo);
  const selectedSeats = useSelector(selectSelectedSeats);
  const selectedCombos = useSelector(selectSelectedCombos);
  const appliedPromo = useSelector(selectAppliedPromo);

  const [customerInfo, setCustomerInfo] = useState(() => ({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  }));
  const [formErrors, setFormErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('MoMo');

  const [isEditingPromo, setIsEditingPromo] = useState(() => !appliedPromo);
  const [promoInput, setPromoInput] = useState(() => appliedPromo?.code || '');
  const [promoStatus, setPromoStatus] = useState({ type: '', message: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [conflictSeats, setConflictSeats] = useState([]);

  const { subtotal, discountAmount, totalPrice } = useMemo(
    () => calculateBookingAmounts(selectedSeats, selectedCombos, appliedPromo),
    [selectedSeats, selectedCombos, appliedPromo]
  );

  // Gom nhóm ghế Thường & ghế VIP để in chi tiết hóa đơn gọn gàng
  const seatSummaryGroups = useMemo(() => {
    const standardSeats = selectedSeats.filter((s) => s.type !== 'vip');
    const vipSeats = selectedSeats.filter((s) => s.type === 'vip');
    const groups = [];

    if (vipSeats.length > 0) {
      groups.push({
        key: 'vip',
        label: `${vipSeats.length}x Ghế VIP (${vipSeats
          .map((s) => s.code)
          .join(', ')})`,
        unitPrice: vipSeats[0].price,
        total: vipSeats.reduce((sum, s) => sum + s.price, 0),
      });
    }

    if (standardSeats.length > 0) {
      groups.push({
        key: 'standard',
        label: `${standardSeats.length}x Ghế Thường (${standardSeats
          .map((s) => s.code)
          .join(', ')})`,
        unitPrice: standardSeats[0].price,
        total: standardSeats.reduce((sum, s) => sum + s.price, 0),
      });
    }

    return groups;
  }, [selectedSeats]);

  // Bảo vệ luồng: F5 hoặc vào thẳng /checkout khi chưa chọn ghế -> đẩy về Trang chủ
  if (!hasCompleted && (selectedSeats.length === 0 || !showtimeInfo)) {
    return <Navigate to="/" replace />;
  }

  const movie = showtimeInfo?.movie;
  const room = showtimeInfo?.room;
  const genresText = Array.isArray(movie?.genres)
    ? movie.genres.join(', ')
    : '';

  const getComboQuantity = (comboId) => {
    const found = selectedCombos.find((item) => item.id === comboId);
    return found ? found.quantity : 0;
  };

  const handleInputChange = (field) => (event) => {
    const nextValue = event.target.value;
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleApplyPromo = async (event) => {
    event.preventDefault();
    const result = await validatePromoCode(promoInput);

    if (result.valid && result.promo) {
      dispatch(applyPromoCode(result.promo));
      setPromoInput(result.promo.code);
      setIsEditingPromo(false);
      setPromoStatus({ type: 'success', message: result.message });
    } else {
      setPromoStatus({ type: 'error', message: result.message });
    }
  };

  const handleRemovePromo = () => {
    dispatch(removePromoCode());
    setPromoInput('');
    setIsEditingPromo(true);
    setPromoStatus({ type: '', message: '' });
  };

  const handleConfirmPayment = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setConflictSeats([]);

    const validationErrors = validateCustomerForm(customerInfo);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId: user?.id || 'u1',
        customerName: customerInfo.fullName.trim(),
        customerPhone: customerInfo.phone.replace(/\s+/g, ''),
        customerEmail: customerInfo.email.trim(),
        showtimeId: showtimeInfo.id,
        movieId: showtimeInfo.movieId || movie?.id,
        movieTitle: movie?.title || 'Phim chiếu rạp PTIT',
        originalTitle: movie?.originalTitle || '',
        ageRating: movie?.ageRating || 'P',
        posterUrl: movie?.posterUrl || '',
        roomId: showtimeInfo.roomId || room?.id,
        roomName: room?.name || 'Phòng chiếu 01',
        date: showtimeInfo.date,
        time: showtimeInfo.time,
        seats: selectedSeats,
        combos: selectedCombos,
        promoCode: appliedPromo?.code || null,
        subtotal,
        discountAmount,
        totalPrice,
        paymentMethod,
      };

      const { booking } = await createBooking(payload);

      setHasCompleted(true);
      dispatch(setLastCompletedBooking(booking));
      navigate(`/booking-success/${encodeURIComponent(booking.id)}`, {
        replace: true,
        state: { booking },
      });
    } catch (error) {
      setSubmitError(
        error?.message || 'Không thể hoàn tất thanh toán. Vui lòng thử lại.'
      );

      if (error?.status === 409 && Array.isArray(error.conflictSeats)) {
        setConflictSeats(error.conflictSeats);
        dispatch(removeConflictSeats(error.conflictSeats));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Thanh trên cùng: Quay lại chọn ghế + Đồng hồ đếm ngược */}
        <div className={styles.topBar}>
          <Link
            to={`/booking/${showtimeInfo.id}`}
            className={styles.backLink}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại chọn ghế</span>
          </Link>

          <CountdownTimer
            movieId={showtimeInfo.movieId || movie?.id}
            variant="compact"
            label="Thời gian hoàn tất thanh toán:"
          />
        </div>

        <h1 className={styles.pageTitle}>Xác nhận & Thanh toán</h1>

        {/* Thông báo lỗi (bao gồm 409 Conflict trùng ghế) */}
        {submitError && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} className={styles.alertIcon} aria-hidden="true" />
            <div className={styles.alertBody}>
              <p className={styles.alertMessage}>{submitError}</p>
              {conflictSeats.length > 0 && (
                <Link
                  to={`/booking/${showtimeInfo.id}`}
                  state={{ conflictMessage: submitError }}
                  className={styles.backToSeatsLink}
                >
                  Quay lại sơ đồ ghế để chọn ghế khác →
                </Link>
              )}
            </div>
          </div>
        )}

        <form className={styles.checkoutGrid} onSubmit={handleConfirmPayment} noValidate>
          {/* CỘT TRÁI */}
          <div className={styles.leftColumn}>
            {/* 1. Thông tin người nhận vé */}
            <section className={styles.card} aria-labelledby="customer-info-heading">
              <div className={styles.cardHeader}>
                <UserCheck size={18} className={styles.cardIcon} aria-hidden="true" />
                <h2 id="customer-info-heading" className={styles.cardTitle}>
                  Thông tin người nhận vé
                </h2>
              </div>

              <div className={styles.formRow3}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="checkout-fullname" className={styles.fieldLabel}>
                    Họ và tên
                  </label>
                  <input
                    id="checkout-fullname"
                    type="text"
                    value={customerInfo.fullName}
                    onChange={handleInputChange('fullName')}
                    placeholder="Nguyễn Văn A"
                    className={`${styles.fieldInput} ${
                      formErrors.fullName ? styles.fieldInputError : ''
                    }`}
                  />
                  {formErrors.fullName && (
                    <span className={styles.fieldError}>{formErrors.fullName}</span>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="checkout-phone" className={styles.fieldLabel}>
                    Số điện thoại
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={handleInputChange('phone')}
                    placeholder="0912345678"
                    className={`${styles.fieldInput} ${
                      formErrors.phone ? styles.fieldInputError : ''
                    }`}
                  />
                  {formErrors.phone && (
                    <span className={styles.fieldError}>{formErrors.phone}</span>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="checkout-email" className={styles.fieldLabel}>
                    Email sinh viên
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={customerInfo.email}
                    onChange={handleInputChange('email')}
                    placeholder="ten.sv@stu.ptit.edu.vn"
                    className={`${styles.fieldInput} ${
                      formErrors.email ? styles.fieldInputError : ''
                    }`}
                  />
                  {formErrors.email && (
                    <span className={styles.fieldError}>{formErrors.email}</span>
                  )}
                </div>
              </div>

              <p className={styles.infoNote}>
                <Info size={14} aria-hidden="true" />
                <span>
                  Mã vé điện tử & hóa đơn VAT sẽ tự động gửi tới email nhận vé trên.
                </span>
              </p>
            </section>

            {/* 2. Chọn thêm Combo bắp nước (gọn nhẹ) */}
            <section className={styles.card} aria-labelledby="combo-heading">
              <div className={styles.cardHeaderBetween}>
                <div className={styles.cardHeader}>
                  <CupSoda size={18} className={styles.cardIcon} aria-hidden="true" />
                  <h2 id="combo-heading" className={styles.cardTitle}>
                    Combo Bắp & Nước (Tùy chọn)
                  </h2>
                </div>
                <span className={styles.cardSubHint}>Thêm nhanh vào đơn</span>
              </div>

              <div className={styles.comboList}>
                {AVAILABLE_COMBOS.map((combo) => {
                  const qty = getComboQuantity(combo.id);
                  return (
                    <article
                      key={combo.id}
                      className={`${styles.comboItem} ${
                        qty > 0 ? styles.comboItemActive : ''
                      }`}
                    >
                      <div className={styles.comboMeta}>
                        <strong className={styles.comboName}>{combo.name}</strong>
                        <p className={styles.comboDesc}>{combo.description}</p>
                        <span className={styles.comboPrice}>
                          {combo.price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      <div className={styles.qtyControl}>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() =>
                            dispatch(updateComboQuantity({ combo, delta: -1 }))
                          }
                          disabled={qty === 0}
                          aria-label={`Giảm số lượng ${combo.name}`}
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>
                        <span className={styles.qtyValue} aria-live="polite">
                          {qty}
                        </span>
                        <button
                          type="button"
                          className={styles.qtyBtnPrimary}
                          onClick={() =>
                            dispatch(updateComboQuantity({ combo, delta: 1 }))
                          }
                          aria-label={`Tăng số lượng ${combo.name}`}
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* 3. Phương thức thanh toán */}
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
            />

            {/* 4. Mã khuyến mãi & Ưu đãi PTIT */}
            <section className={styles.card} aria-labelledby="promo-heading">
              <div className={styles.cardHeaderBetween}>
                <div className={styles.cardHeader}>
                  <Ticket size={18} className={styles.cardIcon} aria-hidden="true" />
                  <h2 id="promo-heading" className={styles.cardTitle}>
                    Mã khuyến mãi & Ưu đãi PTIT
                  </h2>
                </div>
                {appliedPromo && (
                  <span className={styles.promoActiveBadge}>
                    1 mã đang áp dụng
                  </span>
                )}
              </div>

              {!isEditingPromo && appliedPromo ? (
                <>
                  <div className={styles.appliedPromoBar}>
                    <div className={styles.appliedCodeBox}>
                      <Tag size={15} className={styles.mutedIcon} aria-hidden="true" />
                      <strong>{appliedPromo.code}</strong>
                      <span className={styles.validChip}>
                        <CheckCircle2 size={13} aria-hidden="true" />
                        <span>Hợp lệ</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      className={styles.changePromoBtn}
                      onClick={() => setIsEditingPromo(true)}
                    >
                      Đổi mã khác
                    </button>
                  </div>

                  <div className={styles.promoSummaryBox}>
                    <div className={styles.promoPercentCircle} aria-hidden="true">
                      %
                    </div>
                    <div className={styles.promoSummaryText}>
                      <strong>{appliedPromo.title}</strong>
                      <span>
                        Áp dụng cho {selectedSeats.length} vé xem phim của tài khoản{' '}
                        {customerInfo.email || 'PTIT'}
                      </span>
                    </div>
                    <strong className={styles.promoAmount}>
                      -{discountAmount.toLocaleString('vi-VN')}đ
                    </strong>
                  </div>
                </>
              ) : (
                <div className={styles.promoEditArea}>
                  <label htmlFor="checkout-promo-input" className={styles.srOnly}>
                    Nhập mã khuyến mãi
                  </label>
                  <div className={styles.promoEditRow}>
                    <input
                      id="checkout-promo-input"
                      type="text"
                      value={promoInput}
                      onChange={(event) =>
                        setPromoInput(event.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã ưu đãi (VD: PTIT35)"
                      className={styles.fieldInput}
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className={styles.applyPromoBtn}
                    >
                      Áp dụng
                    </button>
                    {appliedPromo && (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className={styles.removePromoBtn}
                      >
                        Gỡ mã
                      </button>
                    )}
                  </div>

                  {promoStatus.message && (
                    <p
                      className={
                        promoStatus.type === 'error'
                          ? styles.fieldError
                          : styles.promoSuccessText
                      }
                    >
                      {promoStatus.message}
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <aside className={styles.summaryColumn} aria-label="Tóm tắt đơn hàng">
            <div className={styles.summaryCard}>
              <div className={styles.summaryAccentBar} aria-hidden="true" />

              <div className={styles.summaryContent}>
                {/* Thông tin phim */}
                <div className={styles.movieRow}>
                  <div className={styles.posterBox}>
                    {movie?.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title || 'Poster phim'}
                        className={styles.posterImg}
                      />
                    ) : (
                      <div className={styles.posterPlaceholder}>PTIT</div>
                    )}
                    {movie?.ageRating && (
                      <span className={styles.ageTag}>{movie.ageRating}</span>
                    )}
                  </div>

                  <div className={styles.movieDetails}>
                    <h2 className={styles.movieName}>{movie?.title}</h2>
                    <p className={styles.movieInfoLine}>
                      {movie?.duration ? `Thời lượng: ${movie.duration} phút` : ''}
                      {genresText ? ` • ${genresText}` : ''}
                    </p>
                    <p className={styles.cinemaLocation}>
                      <MapPin size={14} aria-hidden="true" />
                      <span>
                        PTIT Cinema Hà Đông – {room?.name || 'Phòng chiếu'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Suất chiếu & Ghế */}
                <div className={styles.metaBoxes}>
                  <div className={styles.metaTile}>
                    <span className={styles.metaLabel}>
                      <CalendarClock size={13} aria-hidden="true" />
                      <span>Suất chiếu</span>
                    </span>
                    <strong className={styles.metaStrong}>{showtimeInfo.time}</strong>
                    <span className={styles.metaSub}>
                      {formatVietnameseDate(showtimeInfo.date)}
                    </span>
                  </div>

                  <div className={styles.metaTile}>
                    <span className={styles.metaLabel}>Ghế đã chọn</span>
                    <strong className={styles.metaSeats}>
                      {selectedSeats.map((seat) => seat.code).join(', ')}
                    </strong>
                    <span className={styles.metaSub}>
                      {selectedSeats.length} ghế
                    </span>
                  </div>
                </div>

                <hr className={styles.dashedDivider} />

                {/* Bảng tính tiền chi tiết */}
                <div className={styles.invoiceLines}>
                  {seatSummaryGroups.map((group) => (
                    <div key={group.key} className={styles.invoiceRow}>
                      <span>{group.label}</span>
                      <strong>{group.total.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  ))}

                  {selectedCombos.map((combo) => (
                    <div key={combo.id} className={styles.invoiceRow}>
                      <span>
                        {combo.quantity}x {combo.name}
                        <small className={styles.comboSubNote}>
                          {combo.description}
                        </small>
                      </span>
                      <strong>
                        {(combo.price * combo.quantity).toLocaleString('vi-VN')}đ
                      </strong>
                    </div>
                  ))}

                  <div className={styles.invoiceRow}>
                    <span>Tạm tính</span>
                    <strong>{subtotal.toLocaleString('vi-VN')}đ</strong>
                  </div>

                  {appliedPromo && discountAmount > 0 && (
                    <div className={`${styles.invoiceRow} ${styles.discountLine}`}>
                      <span className={styles.discountLabel}>
                        <Tag size={13} aria-hidden="true" />
                        <span>
                          Ưu đãi sinh viên PTIT (-{appliedPromo.discountValue}%)
                        </span>
                      </span>
                      <strong>-{discountAmount.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  )}
                </div>

                {/* Hộp tổng thanh toán */}
                <div className={styles.totalBox}>
                  <div>
                    <span className={styles.totalHeading}>TỔNG THANH TOÁN</span>
                    {discountAmount > 0 && (
                      <span className={styles.totalSaved}>
                        Tiết kiệm {discountAmount.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                  <strong className={styles.totalPriceValue}>
                    {totalPrice.toLocaleString('vi-VN')}đ
                  </strong>
                </div>

                {/* Nút xác nhận thanh toán */}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting || selectedSeats.length === 0}
                >
                  <span>
                    {isSubmitting
                      ? 'Đang xử lý thanh toán...'
                      : `Xác nhận thanh toán ${totalPrice.toLocaleString('vi-VN')}đ`}
                  </span>
                  {!isSubmitting && <ArrowRight size={18} aria-hidden="true" />}
                </button>

                <div className={styles.termsNote}>
                  <QrCode size={22} className={styles.qrHintIcon} aria-hidden="true" />
                  <p>
                    Bằng việc bấm Xác nhận, bạn đồng ý với{' '}
                    <strong>Điều khoản thanh toán</strong> &{' '}
                    <strong>Quy định đổi trả vé</strong> của PTIT Cinema.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
};

export default CheckoutPage;