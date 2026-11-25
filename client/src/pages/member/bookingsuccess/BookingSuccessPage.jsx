import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AlertCircle, Check, Home, ShieldAlert, Ticket } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import ElectronicTicket from '../../../components/tickets-admin/ElectronicTicket';
import { selectLastCompletedBooking } from '../../../store/bookingSlice';
import { getBookingById } from '../../../services/bookingService';
import styles from './BookingSuccessPage.module.css';

// Hàm phụ: kiểm tra xem 1 đơn vé có khớp với bookingId trên thanh địa chỉ không
const isMatchingBooking = (booking, targetId) => {
  if (!booking || !targetId) {
    return false;
  }

  const target = String(targetId);

  if (String(booking.id) === target) {
    return true;
  }
  if (String(booking._id) === target) {
    return true;
  }
  if (String(booking.bookingCode) === target) {
    return true;
  }
  if (String(booking.shortCode) === target) {
    return true;
  }

  return false;
};

// Hàm phụ: đổi thời điểm tạo đơn thành dạng "17:18 – 24/11/2026"
const formatTransactionTime = (isoString) => {
  let dateObj = new Date();
  if (isoString) {
    dateObj = new Date(isoString);
  }

  if (Number.isNaN(dateObj.getTime())) {
    return '';
  }

  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${hours}:${minutes} – ${day}/${month}/${year}`;
};

// Hàm phụ: kiểm tra tài khoản hiện tại có quyền xem chiếc vé này hay không
const canViewBooking = (booking, user) => {
  if (!booking || !user) {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  if (!booking.userId) {
    return true;
  }

  return String(booking.userId) === String(user.id);
};

// Trang Đặt vé thành công (/booking-success/:bookingId)
const BookingSuccessPage = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const lastCompletedBooking = useSelector(selectLastCompletedBooking);

  // Bước 1: Kiểm tra xem vé vừa đặt đã có sẵn từ trang Thanh toán hoặc Redux chưa
  let immediateBooking = null;
  if (
    location.state &&
    isMatchingBooking(location.state.booking, bookingId)
  ) {
    immediateBooking = location.state.booking;
  } else if (isMatchingBooking(lastCompletedBooking, bookingId)) {
    immediateBooking = lastCompletedBooking;
  }

  // Các state cơ bản dùng khi người dùng F5 hoặc mở trực tiếp link vé cũ
  const [loadedId, setLoadedId] = useState(null);
  const [fetchedBooking, setFetchedBooking] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [errorStatus, setErrorStatus] = useState(200);

  // Bước 2: Nếu chưa có sẵn vé trong state/Redux thì gọi service tìm theo bookingId
  useEffect(() => {
    if (immediateBooking || !bookingId) {
      return;
    }

    let isCancelled = false;

    const loadBookingDetail = async () => {
      try {
        const result = await getBookingById(bookingId);
        if (isCancelled) {
          return;
        }

        if (!result) {
          setFetchedBooking(null);
          setLoadError(`Không tìm thấy thông tin vé cho mã "${bookingId}".`);
          setErrorStatus(404);
          setLoadedId(bookingId);
          return;
        }

        setFetchedBooking(result);
        setLoadError('');
        setErrorStatus(200);
        setLoadedId(bookingId);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setFetchedBooking(null);
        setLoadError(error.message || 'Không thể tải thông tin vé điện tử.');
        setErrorStatus(error.status || 500);
        setLoadedId(bookingId);
      }
    };

    loadBookingDetail();

    return () => {
      isCancelled = true;
    };
  }, [bookingId, immediateBooking]);

  // Bước 3: Xác định trạng thái đang tải và dữ liệu vé cuối cùng cần hiển thị
  const isLoading = !immediateBooking && loadedId !== bookingId;

  let booking = immediateBooking;
  if (!booking && loadedId === bookingId) {
    booking = fetchedBooking;
  }

  let activeError = '';
  let activeStatus = 200;
  if (!immediateBooking && loadedId === bookingId) {
    activeError = loadError;
    activeStatus = errorStatus;
  }

  // Trường hợp 1: Đang tải thông tin vé
  if (isLoading) {
    return (
      <section className={styles.pageWrapper} aria-busy="true">
        <div className={styles.container}>
          <div className={styles.stateBox}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.stateText}>Đang tải vé điện tử của bạn...</p>
          </div>
        </div>
      </section>
    );
  }

  // Trường hợp 2: Bảo vệ trang - Chặn xem vé thuộc tài khoản khác (403)
  if (activeStatus === 403 || (booking && !canViewBooking(booking, user))) {
    return (
      <section className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.stateBox} role="alert">
            <ShieldAlert
              size={44}
              className={styles.errorIcon}
              aria-hidden="true"
            />
            <h1 className={styles.stateTitle}>Không có quyền xem vé này</h1>
            <p className={styles.stateText}>
              Vé điện tử này thuộc về một tài khoản khác. Vui lòng đăng nhập đúng
              tài khoản đã đặt vé để xem thông tin chi tiết.
            </p>
            <div className={styles.stateActions}>
              <Link to="/my-tickets" className={styles.primaryBtnLink}>
                <Ticket size={16} aria-hidden="true" />
                <span>Xem vé của tôi</span>
              </Link>
              <Link to="/" className={styles.secondaryBtnLink}>
                <Home size={16} aria-hidden="true" />
                <span>Về trang chủ</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Trường hợp 3: Không tìm thấy mã đơn hàng hoặc lỗi tải
  if (activeError || !booking) {
    return (
      <section className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.stateBox} role="alert">
            <AlertCircle
              size={44}
              className={styles.errorIcon}
              aria-hidden="true"
            />
            <h1 className={styles.stateTitle}>Không tìm thấy vé điện tử</h1>
            <p className={styles.stateText}>
              {activeError ||
                'Đơn hàng không tồn tại hoặc đã bị xóa khỏi hệ thống.'}
            </p>
            <div className={styles.stateActions}>
              <Link to="/my-tickets" className={styles.primaryBtnLink}>
                <Ticket size={16} aria-hidden="true" />
                <span>Kiểm tra lịch sử vé</span>
              </Link>
              <Link to="/" className={styles.secondaryBtnLink}>
                <Home size={16} aria-hidden="true" />
                <span>Về trang chủ</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Trường hợp 4: Hiển thị thông báo thành công và vé điện tử đầy đủ
  const displayOrderCode = booking.bookingCode || booking.id;
  const customerEmail =
    booking.userEmail || (user && user.email ? user.email : 'khachhang@ptit.edu.vn');
  const paymentMethodLabel = booking.paymentMethod || 'Ví MoMo';

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Phần tiêu đề xác nhận giao dịch thành công */}
        <header className={styles.heroHeader}>
          <div className={styles.successCircle} aria-hidden="true">
            <Check size={30} strokeWidth={3} />
          </div>

          <span className={styles.verifiedBadge}>GIAO DỊCH ĐÃ XÁC THỰC</span>

          <h1 className={styles.pageTitle}>Đặt vé thành công!</h1>

          <p className={styles.pageSubtitle}>
            Cảm ơn bạn đã lựa chọn PTIT Cinema. Thông tin vé điện tử và hóa đơn
            VAT đã được gửi tới hộp thư <strong>{customerEmail}</strong>.
          </p>

          <div className={styles.metaPillBar}>
            <span>
              Mã đơn hàng: <strong>#{displayOrderCode}</strong>
            </span>
            <span className={styles.separator} aria-hidden="true">
              •
            </span>
            <span>{formatTransactionTime(booking.createdAt)}</span>
            <span className={styles.separator} aria-hidden="true">
              •
            </span>
            <span className={styles.paymentChip}>
              <span className={styles.paymentDot} aria-hidden="true" />
              <span>{paymentMethodLabel}</span>
            </span>
          </div>
        </header>

        <ElectronicTicket booking={booking} />

        <div className={styles.bottomActions}>
          <Link to="/" className={styles.homePrimaryBtn}>
            <Home size={18} aria-hidden="true" />
            <span>Về trang chủ</span>
          </Link>

          <Link to="/my-tickets" className={styles.myTicketsLink}>
            <Ticket size={16} aria-hidden="true" />
            <span>Xem danh sách Vé của tôi</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BookingSuccessPage;