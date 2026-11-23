import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TicketCard from '../../components/tickets-admin/TicketCard';
import mockData from '../../data/mockData.json';
import styles from './MyTicketsPage.module.css';

// Hàm tách ngày (YYYY-MM-DD) và giờ (HH:MM) theo giờ địa phương từ mốc thời gian bất kỳ
const getLocalDateAndTime = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    startTime: `${hours}:${minutes}`,
  };
};

const MyTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all | confirmed | cancelled

  // State quản lý Modal xác nhận hủy vé và thông báo kết quả
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Khởi tạo danh sách vé của user hiện tại (kết hợp mockData + localStorage)
  useEffect(() => {
    if (!user) return;

    const savedBookings = JSON.parse(localStorage.getItem('ptit_bookings') || 'null');

    if (!savedBookings) {
      const tomorrowSlot = getLocalDateAndTime(new Date(Date.now() + 24 * 60 * 60 * 1000)); // +24h (Hủy được)
      const nearShowSlot = getLocalDateAndTime(new Date(Date.now() + 60 * 60 * 1000));      // +1h (Khóa vì < 2h)
      const yesterdaySlot = getLocalDateAndTime(new Date(Date.now() - 24 * 60 * 60 * 1000)); // -24h (Đã chiếu)

      const enrichedMockBookings = (mockData.bookings || []).map((b) => {
        const showtime = mockData.showtimes?.find((s) => s.id === b.showtimeId) || {};
        const movie = mockData.movies?.find((m) => m.id === showtime.movieId) || {};
        const room = mockData.rooms?.find((r) => r.id === showtime.roomId) || {};
        return {
          id: b.id,
          bookingCode: b.id.toUpperCase(),
          userId: b.userId,
          movieTitle: movie.title || 'Phim chiếu rạp PTIT',
          posterUrl: movie.posterUrl || '',
          roomName: room.name || 'Phòng 01',
          date: showtime.date || tomorrowSlot.date,
          startTime: showtime.startTime || '19:30',
          seats: b.seats || ['D5', 'D6'],
          totalAmount: b.totalAmount || 110000,
          status: b.status || 'confirmed',
        };
      });

      const sampleMovie1 = mockData.movies?.[0] || { title: 'Chiến Dịch Bóng Đêm: Tái Đấu', posterUrl: '' };
      const sampleMovie2 = mockData.movies?.[1] || { title: 'Vương Quốc Diệu Kỳ & Xứ Sở Phép Thuật', posterUrl: '' };
      const sampleMovie3 = mockData.movies?.[2] || { title: 'Dune: Hành Tinh Cát 2', posterUrl: '' };

      const demoTicketsForLong = [
        {
          id: 'bk_long_01',
          bookingCode: 'PTIT-8891',
          userId: 'u_longtb',
          movieTitle: sampleMovie1.title,
          posterUrl: sampleMovie1.posterUrl,
          roomName: 'Phòng Chiếu 01',
          date: tomorrowSlot.date,
          startTime: tomorrowSlot.startTime,
          seats: ['E5', 'E6'],
          totalAmount: 130000,
          status: 'confirmed',
        },
        {
          id: 'bk_long_02',
          bookingCode: 'PTIT-7420',
          userId: 'u_longtb',
          movieTitle: sampleMovie2.title,
          posterUrl: sampleMovie2.posterUrl,
          roomName: 'Phòng IMAX PTIT',
          date: nearShowSlot.date,
          startTime: nearShowSlot.startTime,
          seats: ['F4'],
          totalAmount: 75000,
          status: 'confirmed',
        },
        {
          id: 'bk_long_03',
          bookingCode: 'PTIT-6105',
          userId: 'u_longtb',
          movieTitle: sampleMovie3.title,
          posterUrl: sampleMovie3.posterUrl,
          roomName: 'Phòng Chiếu 02',
          date: yesterdaySlot.date,
          startTime: yesterdaySlot.startTime,
          seats: ['C3', 'C4'],
          totalAmount: 110000,
          status: 'confirmed',
        },
      ];

      const initialAll = [...demoTicketsForLong, ...enrichedMockBookings];
      localStorage.setItem('ptit_bookings', JSON.stringify(initialAll));
      setTickets(initialAll.filter((item) => item.userId === user.id));
    } else {
      setTickets(savedBookings.filter((item) => item.userId === user.id));
    }
  }, [user]);

  // Tự động tắt thông báo toast sau 3 giây
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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

  // Thực hiện hủy vé khi người dùng bấm xác nhận trong Modal
  const handleConfirmCancel = () => {
    if (!ticketToCancel) return;

    const allBookings = JSON.parse(localStorage.getItem('ptit_bookings') || '[]');
    const updatedAll = allBookings.map((item) =>
      item.id === ticketToCancel.id ? { ...item, status: 'cancelled' } : item
    );

    localStorage.setItem('ptit_bookings', JSON.stringify(updatedAll));
    setTickets(updatedAll.filter((item) => item.userId === user.id));
    setToastMessage(`Đã hủy thành công vé #${ticketToCancel.bookingCode}`);
    setTicketToCancel(null);
  };

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Thông báo nhanh sau khi hủy vé */}
        {toastMessage && (
          <div className={styles.toastBanner} role="status">
            ✓ {toastMessage}
          </div>
        )}

        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Vé của tôi</h1>
            <p className={styles.pageSubtitle}>
              Xin chào <strong>{user?.fullName || 'Trần Bảo Long'}</strong>, quản lý lịch sử đặt vé của bạn tại đây.
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

        {filteredTickets.length > 0 ? (
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
          onClick={() => setTicketToCancel(null)}
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
                onClick={() => setTicketToCancel(null)}
              >
                Giữ lại vé
              </button>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                onClick={handleConfirmCancel}
              >
                Xác nhận hủy vé
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyTicketsPage;