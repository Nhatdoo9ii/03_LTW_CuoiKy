import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Armchair,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import SeatGrid from '../../../components/booking/seatgrid/SeatGrid';
import CountdownTimer from '../../../components/booking/coutdowntimer/CountdownTimer';
import BookingSummary from '../../../components/booking/bookingsummary/BookingSummary';
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
import { getShowtimeById } from '../../../services/showtimeService';
import styles from './SeatSelectionPage.module.css';

// Hàm phụ: kiểm tra tài khoản hiện tại có phải sinh viên/cán bộ PTIT không
const isPtitStudentUser = (user) => {
  if (!user) {
    return false;
  }
  if (user.isStudent) {
    return true;
  }

  const email = String(user.email || '').toLowerCase();
  if (email.endsWith('@stu.ptit.edu.vn') || email.endsWith('@ptit.edu.vn')) {
    return true;
  }
  return false;
};

// Trang chọn ghế ngồi cho một suất chiếu (/booking/:showtimeId)
const SeatSelectionPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();

  // Lấy danh sách ghế đang chọn, cảnh báo giới hạn 8 ghế và mã giảm giá từ Redux
  const selectedSeats = useSelector(selectSelectedSeats);
  const seatLimitWarning = useSelector(selectSeatLimitWarning);
  const appliedPromo = useSelector(selectAppliedPromo);

  // Các state quản lý dữ liệu suất chiếu tải từ GET /api/showtimes/:id
  const [loadedShowtimeId, setLoadedShowtimeId] = useState(null);
  const [showtimeInfo, setShowtimeInfo] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  // Nhận thông báo trùng ghế 409 nếu bị đẩy ngược từ trang Thanh toán về
  const [conflictNotice, setConflictNotice] = useState(() => {
    if (location.state && location.state.conflictMessage) {
      return location.state.conflictMessage;
    }
    return '';
  });

  // Dùng useRef để đánh dấu chỉ tự động áp dụng mã PTIT35 đúng 1 lần khi mới vào suất chiếu
  const autoAppliedShowtimeRef = useRef(null);
  const hasAppliedPromoRef = useRef(Boolean(appliedPromo));

  useEffect(() => {
    hasAppliedPromoRef.current = Boolean(appliedPromo);
  }, [appliedPromo]);

  // Gọi API GET /api/showtimes/:id để lấy thông tin phim, cấu hình phòng và danh sách bookedSeats
  useEffect(() => {
    let isCancelled = false;

    const loadShowtimeData = async () => {
      try {
        const detail = await getShowtimeById(showtimeId);
        if (isCancelled) {
          return;
        }

        if (!detail) {
          setShowtimeInfo(null);
          setLoadError(
            `Không tìm thấy suất chiếu "${showtimeId}". Vui lòng chọn suất chiếu khác.`
          );
          setLoadedShowtimeId(showtimeId);
          return;
        }

        setShowtimeInfo(detail);
        setLoadError('');
        setLoadedShowtimeId(showtimeId);

        // Khởi tạo phiên chọn ghế và bộ đếm giữ ghế 5 phút trong Redux
        dispatch(initBookingSession(detail));

        // Tự động áp dụng mã PTIT35 (1 lần duy nhất) nếu là sinh viên PTIT và chưa áp mã nào
        const isFirstTimeForShowtime =
          autoAppliedShowtimeRef.current !== showtimeId;

        if (
          isFirstTimeForShowtime &&
          !hasAppliedPromoRef.current &&
          isPtitStudentUser(user)
        ) {
          autoAppliedShowtimeRef.current = showtimeId;
          dispatch(applyPromoCode(DEFAULT_PTIT_PROMO));
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setShowtimeInfo(null);
        setLoadError(
          error.message || 'Không thể tải dữ liệu suất chiếu. Vui lòng thử lại.'
        );
        setLoadedShowtimeId(showtimeId);
      }
    };

    loadShowtimeData();

    // Cleanup: tránh cập nhật state nếu người dùng rời trang trước khi API trả về
    return () => {
      isCancelled = true;
    };
  }, [showtimeId, reloadCount, user, dispatch]);

  // Đang tải khi mã suất chiếu đã tải xong khác với mã trên URL hiện tại
  const isLoading = loadedShowtimeId !== showtimeId;

  // Xử lý chọn hoặc bỏ chọn 1 ghế trên sơ đồ
  const handleSelectSeat = (seat) => {
    dispatch(toggleSeat(seat));
  };

  // Xử lý bấm nút chuyển sang trang Xác nhận & Thanh toán
  const handleGoToCheckout = () => {
    if (selectedSeats.length === 0) {
      return;
    }
    navigate('/checkout');
  };

  // Xử lý bấm nút "Làm mới ghế" để gọi lại GET /api/showtimes/:id lấy bookedSeats mới nhất
  const handleRefreshSeats = () => {
    setLoadedShowtimeId(null);
    setReloadCount(reloadCount + 1);
  };

  // Đóng thông báo trùng ghế 409
  const handleCloseConflictNotice = () => {
    setConflictNotice('');
  };

  // Đóng thông báo cảnh báo chọn quá 8 ghế
  const handleCloseLimitWarning = () => {
    dispatch(clearSeatLimitWarning());
  };

  // Trường hợp 1: Đang tải dữ liệu suất chiếu từ server
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

  // Trường hợp 2: Lỗi tải hoặc không tìm thấy suất chiếu
  if (loadError || !showtimeInfo) {
    return (
      <section className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <AlertCircle
              size={40}
              className={styles.errorIcon}
              aria-hidden="true"
            />
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

  // Trường hợp 3: Đã tải xong dữ liệu -> hiển thị sơ đồ ghế và khung tóm tắt
  let movieId = '';
  if (showtimeInfo.movieId) {
    movieId = showtimeInfo.movieId;
  } else if (showtimeInfo.movie && showtimeInfo.movie.id) {
    movieId = showtimeInfo.movie.id;
  }

  let backToMovieUrl = '/';
  if (movieId) {
    backToMovieUrl = `/movies/${movieId}`;
  }

  const room = showtimeInfo.room;
  const roomName = room && room.name ? room.name : 'Phòng chiếu';
  const isRoomUnderMaintenance = room && room.isActive === false;

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Thanh quay lại trang chi tiết phim và nút làm mới danh sách ghế đã bán */}
        <div className={styles.topNavBar}>
          <Link to={backToMovieUrl} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại chọn suất chiếu</span>
          </Link>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={handleRefreshSeats}
            title="Cập nhật danh sách ghế đã bán mới nhất từ máy chủ"
          >
            <RefreshCw size={15} aria-hidden="true" />
            <span>Làm mới ghế</span>
          </button>
        </div>

        {/* Cảnh báo nếu phòng chiếu đang tạm ngưng bảo trì */}
        {isRoomUnderMaintenance && (
          <div className={styles.alertBanner} role="alert">
            <AlertCircle
              size={18}
              className={styles.alertIcon}
              aria-hidden="true"
            />
            <span className={styles.alertText}>
              {roomName} hiện đang tạm ngưng bảo trì. Vui lòng chọn suất chiếu ở
              phòng khác.
            </span>
          </div>
        )}

        {/* Cảnh báo khi có ghế vừa bị người khác đặt (lỗi 409) */}
        {conflictNotice && (
          <div className={styles.alertBanner} role="alert">
            <AlertCircle
              size={18}
              className={styles.alertIcon}
              aria-hidden="true"
            />
            <span className={styles.alertText}>{conflictNotice}</span>
            <button
              type="button"
              className={styles.alertCloseBtn}
              onClick={handleCloseConflictNotice}
              aria-label="Đóng thông báo"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Cảnh báo khi người dùng chọn vượt quá 8 ghế */}
        {seatLimitWarning && (
          <div className={styles.alertBanner} role="alert">
            <AlertCircle
              size={18}
              className={styles.alertIcon}
              aria-hidden="true"
            />
            <span className={styles.alertText}>{seatLimitWarning}</span>
            <button
              type="button"
              className={styles.alertCloseBtn}
              onClick={handleCloseLimitWarning}
              aria-label="Đóng cảnh báo giới hạn ghế"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Bố cục chính 2 cột: Trái là sơ đồ ghế, Phải là cột tóm tắt đơn vé */}
        <div className={styles.bookingLayout}>
          <div className={styles.leftColumn}>
            {/* Tiêu đề phòng chiếu + Đồng hồ đếm ngược 05:00 */}
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
                    {roomName} – PTIT Cinema (Tối đa {MAX_SEATS_PER_BOOKING}{' '}
                    ghế/lần đặt)
                  </span>
                </p>
              </div>

              <CountdownTimer movieId={movieId} variant="card" />
            </header>

            {/* Sơ đồ ghế sinh động theo cấu hình phòng từ MongoDB */}
            <SeatGrid
              room={room}
              bookedSeats={showtimeInfo.bookedSeats}
              selectedSeats={selectedSeats}
              basePrice={showtimeInfo.basePrice}
              vipPrice={showtimeInfo.vipPrice}
              onToggleSeat={handleSelectSeat}
            />
          </div>

          {/* Cột phải: Tóm tắt đơn đặt vé và mã ưu đãi PTIT35 */}
          <div className={styles.rightColumn}>
            <BookingSummary
              showtimeInfo={showtimeInfo}
              onProceed={handleGoToCheckout}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeatSelectionPage;