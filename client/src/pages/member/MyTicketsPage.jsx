import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TicketCard from '../../components/tickets-admin/TicketCard';
import { cancelMyTicket, getMyTickets } from '../../services/ticketService';
import styles from './MyTicketsPage.module.css';

const MyTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all | confirmed | cancelled
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State quản lý Modal xác nhận hủy vé và thông báo kết quả
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const list = await getMyTickets();
      setTickets(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách vé của bạn.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isCancelled = false;

    const loadInitialTickets = async () => {
      try {
        const list = await getMyTickets();
        if (!isCancelled) {
          setTickets(list);
          setError('');
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Không thể tải danh sách vé của bạn.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialTickets();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Tự động tắt thông báo toast sau 3 giây
  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => setToast({ type: 'success', message: '' }), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredTickets = useMemo(() => {
    if (filterStatus === 'all') return tickets;
    return tickets.filter((t) => t.status === filterStatus);
  }, [tickets, filterStatus]);

  // Mở Modal xác nhận khi người dùng bấm nút Hủy vé trên TicketCard
  const handleOpenCancelModal = (ticketId) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (targetTicket) {
      setTicketToCancel(targetTicket);
    }
  };

  // Gọi API hủy vé khi người dùng xác nhận trong Modal
  const handleConfirmCancel = async () => {
    if (!ticketToCancel || isCancelling) return;

    setIsCancelling(true);
    try {
      await cancelMyTicket(ticketToCancel.id);
      setTickets((prev) =>
        prev.map((item) =>
          item.id === ticketToCancel.id ? { ...item, status: 'cancelled' } : item
        )
      );
      setToast({
        type: 'success',
        message: `Đã hủy thành công vé #${ticketToCancel.bookingCode}`,
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Không thể hủy vé này.',
      });
    } finally {
      setIsCancelling(false);
      setTicketToCancel(null);
    }
  };

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Thông báo nhanh sau khi hủy vé */}
        {toast.message && (
          <div
            className={`${styles.toastBanner} ${
              toast.type === 'error' ? styles.toastError : ''
            }`}
            role="status"
          >
            {toast.type === 'error' ? '!' : '✓'} {toast.message}
          </div>
        )}

        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Vé của tôi</h1>
            <p className={styles.pageSubtitle}>
              Xin chào <strong>{user?.fullName || 'Thành viên'}</strong>, quản lý lịch sử đặt vé của bạn tại đây.
            </p>
          </div>

          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${filterStatus === 'all' ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Tất cả ({tickets.length})
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${filterStatus === 'confirmed' ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus('confirmed')}
            >
              Đã xác nhận ({tickets.filter((t) => t.status === 'confirmed').length})
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${filterStatus === 'cancelled' ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus('cancelled')}
            >
              Đã hủy ({tickets.filter((t) => t.status === 'cancelled').length})
            </button>
          </div>
        </header>

        {loading ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyText}>Đang tải lịch sử đặt vé từ máy chủ...</p>
          </div>
        ) : error ? (
          <div className={styles.emptyBox} role="alert">
            <p className={styles.errorText}>{error}</p>
            <button type="button" onClick={fetchTickets} className={styles.bookNowBtn}>
              Thử lại
            </button>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className={styles.ticketList}>
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onCancelTicket={handleOpenCancelModal}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyBox}>
            <p className={styles.emptyText}>Bạn chưa có vé nào trong mục này.</p>
            <Link to="/" className={styles.bookNowBtn}>
              Đặt vé xem phim ngay
            </Link>
          </div>
        )}
      </div>

      {/* Modal xác nhận hủy vé */}
      {ticketToCancel && (
        <div
          className={styles.modalBackdrop}
          onClick={() => !isCancelling && setTicketToCancel(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>!</div>
            <h2 className={styles.modalTitle}>Xác nhận hủy vé?</h2>
            <p className={styles.modalDesc}>
              Bạn có chắc chắn muốn hủy vé xem phim dưới đây không? Thao tác này không thể hoàn tác.
            </p>

            <div className={styles.modalTicketInfo}>
              <p>
                <strong>Phim:</strong> {ticketToCancel.movieTitle}
              </p>
              <p>
                <strong>Mã vé:</strong> #{ticketToCancel.bookingCode} • <strong>Ghế:</strong>{' '}
                {ticketToCancel.seats.join(', ')}
              </p>
              <p>
                <strong>Suất chiếu:</strong> {ticketToCancel.startTime} ({ticketToCancel.date})
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.keepBtn}
                disabled={isCancelling}
                onClick={() => setTicketToCancel(null)}
              >
                Giữ lại vé
              </button>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                disabled={isCancelling}
                onClick={handleConfirmCancel}
              >
                {isCancelling ? 'Đang hủy vé...' : 'Xác nhận hủy vé'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyTicketsPage;
