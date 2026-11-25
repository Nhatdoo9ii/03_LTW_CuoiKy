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
import CountdownTimer from '../../../components/booking/coutdowntimer/CountdownTimer';
import PaymentMethodSelector from '../../../components/tickets-admin/paymentmethod/PaymentMethodSelector';
import PaymentQrModal from '../../../components/tickets-admin/qrmodal/PaymentQrModal';
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

// Hàm phụ: đổi ngày "2026-11-18" sang "Thứ Tư, 18/11/2026"
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

// Hàm phụ: kiểm tra dữ liệu người nhận vé trước khi gửi thanh toán
const validateCustomerForm = (fullName, phone, email) => {
  const errors = {};
  const cleanName = fullName.trim();
  const cleanPhone = phone.replace(/\s+/g, '');
  const cleanEmail = email.trim();

  if (cleanName.length < 2) {
    errors.fullName = 'Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự).';
  }

  // Số điện thoại Việt Nam cơ bản gồm 10 số, bắt đầu bằng số 0
  if (!/^0\d{9}$/.test(cleanPhone)) {
    errors.phone =
      'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
  }

  return errors;
};

// Hàm phụ: gom ghế VIP và ghế Thường thành từng dòng riêng cho bảng hóa đơn
const groupSeatsForInvoice = (selectedSeats) => {
  const vipSeats = selectedSeats.filter((seat) => seat.type === 'vip');
  const standardSeats = selectedSeats.filter((seat) => seat.type !== 'vip');

  let groups = [];

  if (vipSeats.length > 0) {
    let vipTotal = 0;
    let vipCodes = [];

    for (const seat of vipSeats) {
      vipTotal = vipTotal + seat.price;
      vipCodes = [...vipCodes, seat.code];
    }

    groups = [
      ...groups,
      {
        key: 'vip',
        label: `${vipSeats.length}x Ghế VIP (${vipCodes.join(', ')})`,
        total: vipTotal,
      },
    ];
  }

  if (standardSeats.length > 0) {
    let standardTotal = 0;
    let standardCodes = [];

    for (const seat of standardSeats) {
      standardTotal = standardTotal + seat.price;
      standardCodes = [...standardCodes, seat.code];
    }

    groups = [
      ...groups,
      {
        key: 'standard',
        label: `${standardSeats.length}x Ghế Thường (${standardCodes.join(', ')})`,
        total: standardTotal,
      },
    ];
  }

  return groups;
};

// Trang Xác nhận & Thanh toán (/checkout)
const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lấy dữ liệu giỏ đặt vé từ Redux store
  const showtimeInfo = useSelector(selectShowtimeInfo);
  const selectedSeats = useSelector(selectSelectedSeats);
  const selectedCombos = useSelector(selectSelectedCombos);
  const appliedPromo = useSelector(selectAppliedPromo);

  // State thông tin người nhận vé (tự động điền sẵn từ tài khoản đang đăng nhập)
  const [fullName, setFullName] = useState(
    user && user.fullName ? user.fullName : ''
  );
  const [phone, setPhone] = useState(user && user.phone ? user.phone : '');
  const [email, setEmail] = useState(user && user.email ? user.email : '');
  const [formErrors, setFormErrors] = useState({});

  // State phương thức thanh toán và bật/tắt popup QR
  const [showQrModal, setShowQrModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MoMo');

  // State cho khu vực đổi mã khuyến mãi
  const [isEditingPromo, setIsEditingPromo] = useState(!appliedPromo);
  const [promoInput, setPromoInput] = useState(
    appliedPromo && appliedPromo.code ? appliedPromo.code : ''
  );
  const [promoStatus, setPromoStatus] = useState({ type: '', message: '' });

  // State xử lý khi bấm nút "Xác nhận thanh toán"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [conflictSeats, setConflictSeats] = useState([]);

  // Dùng useMemo tính tạm tính, giảm giá và tổng thanh toán
  const bookingAmounts = useMemo(() => {
    return calculateBookingAmounts(selectedSeats, selectedCombos, appliedPromo);
  }, [selectedSeats, selectedCombos, appliedPromo]);

  const { subtotal, discountAmount, totalPrice } = bookingAmounts;

  // Bảo vệ luồng: nếu người dùng F5 hoặc gõ thẳng /checkout khi chưa chọn ghế -> về Trang chủ
  if (!hasCompleted && (selectedSeats.length === 0 || !showtimeInfo)) {
    return <Navigate to="/" replace />;
  }

  // Trích xuất thông tin phim, phòng và danh sách hóa đơn cho rõ ràng
  const movie = showtimeInfo ? showtimeInfo.movie : null;
  const room = showtimeInfo ? showtimeInfo.room : null;
  const seatSummaryGroups = groupSeatsForInvoice(selectedSeats);
  const selectedSeatCodesText = selectedSeats.map((seat) => seat.code).join(', ');

  let genresText = '';
  if (movie && Array.isArray(movie.genres)) {
    genresText = movie.genres.join(', ');
  }

  let movieMetaText = '';
  if (movie && movie.duration) {
    movieMetaText = `Thời lượng: ${movie.duration} phút`;
  }
  if (genresText) {
    if (movieMetaText) {
      movieMetaText = `${movieMetaText} • ${genresText}`;
    } else {
      movieMetaText = genresText;
    }
  }

  // Hàm phụ: lấy số lượng hiện tại của 1 combo trong giỏ Redux
  const getComboQuantity = (comboId) => {
    const foundCombo = selectedCombos.find((item) => item.id === comboId);
    if (foundCombo) {
      return foundCombo.quantity;
    }
    return 0;
  };

  // Các hàm cập nhật ô nhập thông tin người nhận vé và xóa lỗi ngay khi gõ lại
  const handleFullNameChange = (event) => {
    setFullName(event.target.value);
    if (formErrors.fullName) {
      setFormErrors({ ...formErrors, fullName: '' });
    }
  };

  const handlePhoneChange = (event) => {
    setPhone(event.target.value);
    if (formErrors.phone) {
      setFormErrors({ ...formErrors, phone: '' });
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (formErrors.email) {
      setFormErrors({ ...formErrors, email: '' });
    }
  };

  // Xử lý bấm nút "Áp dụng" mã khuyến mãi mới
  const handleApplyPromo = async () => {
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

  // Xử lý bấm nút "Gỡ mã" khuyến mãi
  const handleRemovePromo = () => {
    dispatch(removePromoCode());
    setPromoInput('');
    setIsEditingPromo(true);
    setPromoStatus({ type: '', message: '' });
  };

  // Hàm thực sự gửi đơn đặt vé lên service (gọi trực tiếp nếu Tại quầy, hoặc sau khi xác nhận QR)
  const submitBookingOrder = async () => {
    setSubmitError('');
    setConflictSeats([]);
    setIsSubmitting(true);

    try {
      const payload = {
        userId: user && user.id ? user.id : 'u1',
        customerName: fullName.trim(),
        customerPhone: phone.replace(/\s+/g, ''),
        customerEmail: email.trim(),
        showtimeId: showtimeInfo.id,
        movieId: showtimeInfo.movieId || (movie ? movie.id : ''),
        movieTitle: movie && movie.title ? movie.title : 'Phim chiếu rạp PTIT',
        originalTitle: movie && movie.originalTitle ? movie.originalTitle : '',
        ageRating: movie && movie.ageRating ? movie.ageRating : 'P',
        posterUrl: movie && movie.posterUrl ? movie.posterUrl : '',
        roomId: showtimeInfo.roomId || (room ? room.id : ''),
        roomName: room && room.name ? room.name : 'Phòng chiếu 01',
        date: showtimeInfo.date,
        time: showtimeInfo.time,
        seats: selectedSeats,
        combos: selectedCombos,
        promoCode: appliedPromo ? appliedPromo.code : null,
        subtotal,
        discountAmount,
        totalPrice,
        paymentMethod,
      };

      const result = await createBooking(payload);
      const createdBooking = result.booking;

      setHasCompleted(true);
      dispatch(setLastCompletedBooking(createdBooking));
      navigate(`/booking-success/${createdBooking.id}`, {
        replace: true,
        state: { booking: createdBooking },
      });
    } catch (error) {
      setSubmitError(
        error.message || 'Không thể hoàn tất thanh toán. Vui lòng thử lại.'
      );

      // Nếu bị trùng ghế (409 Conflict) thì xóa các ghế bị trùng khỏi Redux
      if (error.status === 409 && Array.isArray(error.conflictSeats)) {
        setConflictSeats(error.conflictSeats);
        dispatch(removeConflictSeats(error.conflictSeats));
      }
    } finally {
      setIsSubmitting(false);
      setShowQrModal(false);
    }
  };

  // Xử lý khi bấm nút "Xác nhận thanh toán"
  const handleConfirmPayment = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setConflictSeats([]);

    // Bước 1: Kiểm tra hợp lệ họ tên, số điện thoại, email
    const errors = validateCustomerForm(fullName, phone, email);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Bước 2: Tại quầy thì tạo đơn ngay; MoMo / Ngân hàng thì mở popup quét mã QR
    if (paymentMethod === 'Tại quầy') {
      await submitBookingOrder();
    } else {
      setShowQrModal(true);
    }
  };

  // Xác định class cho từng ô input khi có lỗi validate
  const fullNameInputClass = formErrors.fullName
    ? `${styles.fieldInput} ${styles.fieldInputError}`
    : styles.fieldInput;
  const phoneInputClass = formErrors.phone
    ? `${styles.fieldInput} ${styles.fieldInputError}`
    : styles.fieldInput;
  const emailInputClass = formErrors.email
    ? `${styles.fieldInput} ${styles.fieldInputError}`
    : styles.fieldInput;

  const movieId = showtimeInfo.movieId || (movie ? movie.id : '');
  const roomName = room && room.name ? room.name : 'Phòng chiếu';

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Thanh trên cùng: Quay lại chọn ghế + Đồng hồ đếm ngược */}
        <div className={styles.topBar}>
          <Link to={`/booking/${showtimeInfo.id}`} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại chọn ghế</span>
          </Link>

          <CountdownTimer
            movieId={movieId}
            variant="compact"
            label="Thời gian hoàn tất thanh toán:"
          />
        </div>

        <h1 className={styles.pageTitle}>Xác nhận & Thanh toán</h1>

        {/* Thông báo lỗi thanh toán hoặc trùng ghế 409 */}
        {submitError && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle
              size={18}
              className={styles.alertIcon}
              aria-hidden="true"
            />
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

        <form
          className={styles.checkoutGrid}
          onSubmit={handleConfirmPayment}
          noValidate
        >
          {/* CỘT TRÁI: THÔNG TIN NGƯỜI NHẬN, COMBO, THANH TOÁN, MÃ ƯU ĐÃI */}
          <div className={styles.leftColumn}>
            {/* 1. Thông tin người nhận vé */}
            <section
              className={styles.card}
              aria-labelledby="customer-info-heading"
            >
              <div className={styles.cardHeader}>
                <UserCheck
                  size={18}
                  className={styles.cardIcon}
                  aria-hidden="true"
                />
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
                    value={fullName}
                    onChange={handleFullNameChange}
                    placeholder="Nguyễn Văn A"
                    className={fullNameInputClass}
                  />
                  {formErrors.fullName && (
                    <span className={styles.fieldError}>
                      {formErrors.fullName}
                    </span>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="checkout-phone" className={styles.fieldLabel}>
                    Số điện thoại
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="0912345678"
                    className={phoneInputClass}
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
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="ten.sv@stu.ptit.edu.vn"
                    className={emailInputClass}
                  />
                  {formErrors.email && (
                    <span className={styles.fieldError}>{formErrors.email}</span>
                  )}
                </div>
              </div>

              <p className={styles.infoNote}>
                <Info size={14} aria-hidden="true" />
                <span>
                  Mã vé điện tử & hóa đơn VAT sẽ tự động gửi tới email nhận vé
                  trên.
                </span>
              </p>
            </section>

            {/* 2. Chọn thêm Combo bắp nước (tùy chọn gọn nhẹ) */}
            <section className={styles.card} aria-labelledby="combo-heading">
              <div className={styles.cardHeaderBetween}>
                <div className={styles.cardHeader}>
                  <CupSoda
                    size={18}
                    className={styles.cardIcon}
                    aria-hidden="true"
                  />
                  <h2 id="combo-heading" className={styles.cardTitle}>
                    Combo Bắp & Nước (Tùy chọn)
                  </h2>
                </div>
                <span className={styles.cardSubHint}>Thêm nhanh vào đơn</span>
              </div>

              <div className={styles.comboList}>
                {AVAILABLE_COMBOS.map((combo) => {
                  const quantity = getComboQuantity(combo.id);

                  let comboItemClass = styles.comboItem;
                  if (quantity > 0) {
                    comboItemClass = `${styles.comboItem} ${styles.comboItemActive}`;
                  }

                  return (
                    <article key={combo.id} className={comboItemClass}>
                      <div className={styles.comboMeta}>
                        <strong className={styles.comboName}>
                          {combo.name}
                        </strong>
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
                          disabled={quantity === 0}
                          aria-label={`Giảm số lượng ${combo.name}`}
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>

                        <span className={styles.qtyValue} aria-live="polite">
                          {quantity}
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

            {/* 3. Chọn phương thức thanh toán */}
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
            />

            {/* 4. Mã khuyến mãi & Ưu đãi PTIT */}
            <section className={styles.card} aria-labelledby="promo-heading">
              <div className={styles.cardHeaderBetween}>
                <div className={styles.cardHeader}>
                  <Ticket
                    size={18}
                    className={styles.cardIcon}
                    aria-hidden="true"
                  />
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
                      <Tag
                        size={15}
                        className={styles.mutedIcon}
                        aria-hidden="true"
                      />
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
                    <div
                      className={styles.promoPercentCircle}
                      aria-hidden="true"
                    >
                      %
                    </div>
                    <div className={styles.promoSummaryText}>
                      <strong>{appliedPromo.title}</strong>
                      <span>
                        Áp dụng cho {selectedSeats.length} vé xem phim của tài
                        khoản {email || 'PTIT'}
                      </span>
                    </div>
                    <strong className={styles.promoAmount}>
                      -{discountAmount.toLocaleString('vi-VN')}đ
                    </strong>
                  </div>
                </>
              ) : (
                <div className={styles.promoEditArea}>
                  <label
                    htmlFor="checkout-promo-input"
                    className={styles.srOnly}
                  >
                    Nhập mã khuyến mãi
                  </label>
                  <div className={styles.promoEditRow}>
                    <input
                      id="checkout-promo-input"
                      type="text"
                      value={promoInput}
                      onChange={(event) => {
                        setPromoInput(event.target.value.toUpperCase());
                      }}
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
                    {movie && movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title || 'Poster phim'}
                        className={styles.posterImg}
                      />
                    ) : (
                      <div className={styles.posterPlaceholder}>PTIT</div>
                    )}
                    {movie && movie.ageRating && (
                      <span className={styles.ageTag}>{movie.ageRating}</span>
                    )}
                  </div>

                  <div className={styles.movieDetails}>
                    <h2 className={styles.movieName}>
                      {movie ? movie.title : ''}
                    </h2>
                    <p className={styles.movieInfoLine}>{movieMetaText}</p>
                    <p className={styles.cinemaLocation}>
                      <MapPin size={14} aria-hidden="true" />
                      <span>PTIT Cinema Hà Đông – {roomName}</span>
                    </p>
                  </div>
                </div>

                {/* Suất chiếu & danh sách ghế */}
                <div className={styles.metaBoxes}>
                  <div className={styles.metaTile}>
                    <span className={styles.metaLabel}>
                      <CalendarClock size={13} aria-hidden="true" />
                      <span>Suất chiếu</span>
                    </span>
                    <strong className={styles.metaStrong}>
                      {showtimeInfo.time}
                    </strong>
                    <span className={styles.metaSub}>
                      {formatVietnameseDate(showtimeInfo.date)}
                    </span>
                  </div>

                  <div className={styles.metaTile}>
                    <span className={styles.metaLabel}>Ghế đã chọn</span>
                    <strong className={styles.metaSeats}>
                      {selectedSeatCodesText}
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

                  {selectedCombos.map((combo) => {
                    const comboLineTotal = combo.price * combo.quantity;
                    return (
                      <div key={combo.id} className={styles.invoiceRow}>
                        <span>
                          {combo.quantity}x {combo.name}
                          <small className={styles.comboSubNote}>
                            {combo.description}
                          </small>
                        </span>
                        <strong>{comboLineTotal.toLocaleString('vi-VN')}đ</strong>
                      </div>
                    );
                  })}

                  <div className={styles.invoiceRow}>
                    <span>Tạm tính</span>
                    <strong>{subtotal.toLocaleString('vi-VN')}đ</strong>
                  </div>

                  {appliedPromo && discountAmount > 0 && (
                    <div
                      className={`${styles.invoiceRow} ${styles.discountLine}`}
                    >
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
                  <QrCode
                    size={22}
                    className={styles.qrHintIcon}
                    aria-hidden="true"
                  />
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

      {/* Popup quét mã QR thanh toán cho MoMo và Ngân hàng nội địa */}
      <PaymentQrModal
        isOpen={showQrModal}
        paymentMethod={paymentMethod}
        totalPrice={totalPrice}
        customerPhone={phone}
        isSubmitting={isSubmitting}
        onConfirmPaid={submitBookingOrder}
        onClose={() => setShowQrModal(false)}
      />
    </section>
  );
};

export default CheckoutPage;