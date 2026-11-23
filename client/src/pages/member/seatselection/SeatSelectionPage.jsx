import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Armchair,
  RefreshCw,
  X,
} from 'lucide-react';
import SeatGrid from "../../../components/booking/SeatGrid";
import CountdownTimer from "../../../components/booking/CountdownTimer";
import BookingSummary from "../../../components/booking/BookingSummary";
import {
  DEFAULT_PTIT_PROMO,
  MAX_SEATS_PER_BOOKING,
  applyPromoCode,
  clearSeatLimitWarning,
  initBookingSession,
  selectAppliedPromo,
  selectSeatLimitWarning,
  selectSelectedSeats,
  toggleSeat,
} from '../../../store/bookingSlice';
import {
  getCurrentUser,
  getShowtimeDetail,
} from '../../../services/bookingService';
import styles from './SeatSelectionPage.module.css';

const isPtitStudentUser = (user) => {
  if (!user) return false;
  if (user.isStudent) return true;
  const email = String(user.email || '').toLowerCase();
  return email.endsWith('@stu.ptit.edu.vn') || email.endsWith('@ptit.edu.vn');
};

const SeatSelectionPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const selectedSeats = useSelector(selectSelectedSeats);
  const seatLimitWarning = useSelector(selectSeatLimitWarning);
  const appliedPromo = useSelector(selectAppliedPromo);

  const [fetchState, setFetchState] = useState({
    loadedId: null,
    showtime: null,
    error: '',
  });
  const [reloadNonce, setReloadNonce] = useState(0);
  const [conflictNotice, setConflictNotice] = useState(
    () => location.state?.conflictMessage || ''
  );

  const appliedPromoRef = useRef(appliedPromo);
  const autoAppliedShowtimeRef = useRef(null);

  useEffect(() => {
    appliedPromoRef.current = appliedPromo;
  }, [appliedPromo]);

  useEffect(() => {
    let isCancelled = false;

    const loadShowtimeData = async () => {
      try {
        const detail = await getShowtimeDetail(showtimeId);
        if (isCancelled) return;

        if (!detail) {
          setFetchState({
            loadedId: showtimeId,
            showtime: null,
            error: `Không tìm thấy suất chiếu "${showtimeId}". Vui lòng chọn suất chiếu khác.`,
          });
          return;
        }

        setFetchState({
          loadedId: showtimeId,
          showtime: detail,
          error: '',
        });

        dispatch(initBookingSession(detail));

        // Tự động áp dụng mã PTIT35 1 lần đầu cho tài khoản sinh viên PTIT
        if (
          autoAppliedShowtimeRef.current !== showtimeId &&
          !appliedPromoRef.current &&
          isPtitStudentUser(getCurrentUser())
        ) {
          autoAppliedShowtimeRef.current = showtimeId;
          dispatch(applyPromoCode(DEFAULT_PTIT_PROMO));
        }
      } catch (error) {
        if (isCancelled) return;
        setFetchState({
          loadedId: showtimeId,
          showtime: null,
          error:
            error?.message || 'Không thể tải dữ liệu suất chiếu. Vui lòng thử lại.',
        });
      }
    };

    loadShowtimeData();

    return () => {
      isCancelled = true;
    };
  }, [showtimeId, reloadNonce, dispatch]);

  const isLoading = fetchState.loadedId !== showtimeId;
  const showtimeInfo = fetchState.loadedId === showtimeId ? fetchState.showtime : null;
  const loadError = fetchState.loadedId === showtimeId ? fetchState.error : '';

  const handleToggleSeat = useCallback(
    (seat) => {
      dispatch(toggleSeat(seat));
    },
    [dispatch]
  );

  const handleProceedToCheckout = useCallback(() => {
    if (selectedSeats.length === 0) return;
    navigate('/checkout');
  }, [selectedSeats.length, navigate]);

  const handleRefreshSeats = useCallback(() => {
    setReloadNonce((prev) => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <section className={styles.pageWrapper} aria-busy="true">
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.stateText}>Đang tải sơ đồ ghế phòng chiếu...</p>
          </div>
        </div>
      </section>
    );
  }

  if (loadError || !showtimeInfo) {
    return (
      <section className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <AlertCircle size={40} className={styles.errorIcon} aria-hidden="true" />
            <h1 className={styles.stateTitle}>Không thể mở sơ đồ ghế</h1>
            <p className={styles.stateText}>
              {loadError || 'Suất chiếu không tồn tại hoặc đã hết hạn.'}
            </p>
            <div className={styles.stateActions}>
              <Link to="/" className={styles.primaryLinkBtn}>
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Quay về trang chủ</span>
              </Link>
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={handleRefreshSeats}
              >
                <RefreshCw size={16} aria-hidden="true" />
                <span>Thử lại</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const movieId = showtimeInfo.movieId || showtimeInfo.movie?.id;
  const room = showtimeInfo.room;

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Thanh quay lại nhanh */}
        <div className={styles.topNavBar}>
          <Link
            to={movieId ? `/movies/${movieId}` : '/'}
            className={styles.backLink}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại chọn suất chiếu</span>
          </Link>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={handleRefreshSeats}
            title="Cập nhật danh sách ghế đã bán mới nhất"
          >
            <RefreshCw size={15} aria-hidden="true" />
            <span>Làm mới ghế</span>
          </button>
        </div>

        {/* Thông báo xung đột 409 (nếu bị đẩy về từ trang Thanh toán) */}
        {conflictNotice && (
          <div className={styles.alertBanner} role="alert">
            <AlertCircle size={18} className={styles.alertIcon} aria-hidden="true" />
            <span className={styles.alertText}>{conflictNotice}</span>
            <button
              type="button"
              className={styles.alertCloseBtn}
              onClick={() => setConflictNotice('')}
              aria-label="Đóng thông báo"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Thông báo chặn chọn quá 8 ghế */}
        {seatLimitWarning && (
          <div className={styles.alertBanner} role="alert">
            <AlertCircle size={18} className={styles.alertIcon} aria-hidden="true" />
            <span className={styles.alertText}>{seatLimitWarning}</span>
            <button
              type="button"
              className={styles.alertCloseBtn}
              onClick={() => dispatch(clearSeatLimitWarning())}
              aria-label="Đóng cảnh báo giới hạn ghế"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Bố cục chính 2 cột */}
        <div className={styles.bookingLayout}>
          <div className={styles.leftColumn}>
            {/* Header Chọn ghế + Đồng hồ đếm ngược 05:00 */}
            <header className={styles.headerCard}>
              <div className={styles.headerTitleGroup}>
                <h1 className={styles.pageTitle}>Chọn ghế ngồi</h1>
                <p className={styles.roomSubtitle}>
                  <Armchair
                    size={16}
                    className={styles.roomIcon}
                    aria-hidden="true"
                  />
                  <span>
                    {room?.name || 'Phòng chiếu'} – PTIT Cinema (Tối đa{' '}
                    {MAX_SEATS_PER_BOOKING} ghế/lần đặt)
                  </span>
                </p>
              </div>

              <CountdownTimer movieId={movieId} variant="card" />
            </header>

            {/* Sơ đồ ghế sinh động theo phòng */}
            <SeatGrid
              room={room}
              bookedSeats={showtimeInfo.bookedSeats}
              selectedSeats={selectedSeats}
              basePrice={showtimeInfo.basePrice}
              vipPrice={showtimeInfo.vipPrice}
              onToggleSeat={handleToggleSeat}
            />
          </div>

          {/* Cột phải: Tóm tắt đơn đặt vé & mã ưu đãi */}
          <div className={styles.rightColumn}>
            <BookingSummary
              showtimeInfo={showtimeInfo}
              onProceed={handleProceedToCheckout}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeatSelectionPage;