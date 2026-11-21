import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TicketCard from '../../components/tickets-admin/TicketCard';
import mockData from '../../data/mockData.json';
import styles from './MyTicketsPage.module.css';

const MyTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all | confirmed | cancelled

  // Khởi tạo danh sách vé của user hiện tại (kết hợp mockData + localStorage)
  useEffect(() => {
    if (!user) return;

    const savedBookings = JSON.parse(localStorage.getItem('ptit_bookings') || 'null');

    // Nếu chưa có dữ liệu trong localStorage thì tạo sẵn dữ liệu mẫu để test được ngay
    if (!savedBookings) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Ghép thông tin chi tiết từ mockData (phim, phòng, suất chiếu)
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
          date: showtime.date || tomorrow,
          startTime: showtime.startTime || '19:30',
          seats: b.seats || ['D5', 'D6'],
          totalAmount: b.totalAmount || 110000,
          status: b.status || 'confirmed',
        };
      });

      // Tạo thêm 2 vé mẫu riêng cho tài khoản Trần Bảo Long (1 vé hủy được, 1 vé sát giờ bị khóa)
      const sampleMovie1 = mockData.movies?.[0] || { title: 'Mai', posterUrl: '' };
      const sampleMovie2 = mockData.movies?.[1] || { title: 'Dune: Hành Tinh Cát 2', posterUrl: '' };

      const demoTicketsForLong = [
        {
          id: 'bk_long_01',
          bookingCode: 'PTIT-8891',
          userId: 'u_longtb',
          movieTitle: sampleMovie1.title,
          posterUrl: sampleMovie1.posterUrl,
          roomName: 'Phòng Chiếu 01',
          date: tomorrow, // Ngày mai -> còn > 2 tiếng nên nút Hủy vé hoạt động
          startTime: '20:00',
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
          date: today, // Giờ đã qua -> nút Hủy vé tự động bị khóa
          startTime: '08:00',
          seats: ['F4'],
          totalAmount: 75000,
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

  // Lọc vé theo tab trạng thái bằng useMemo
  const filteredTickets = useMemo(() => {
    if (filterStatus === 'all') return tickets;
    return tickets.filter((t) => t.status === filterStatus);
  }, [tickets, filterStatus]);

  // Xử lý hủy vé
  const handleCancelTicket = (ticketId) => {
    const isConfirm = window.confirm('Bạn có chắc chắn muốn hủy vé này không?');
    if (!isConfirm) return;

    const allBookings = JSON.parse(localStorage.getItem('ptit_bookings') || '[]');
    const updatedAll = allBookings.map((item) =>
      item.id === ticketId ? { ...item, status: 'cancelled' } : item
    );

    localStorage.setItem('ptit_bookings', JSON.stringify(updatedAll));
    setTickets(updatedAll.filter((item) => item.userId === user.id));
  };

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Tiêu đề trang */}
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Vé của tôi</h1>
            <p className={styles.pageSubtitle}>
              Xin chào <strong>{user?.fullName || 'Trần Bảo Long'}</strong>, quản lý lịch sử đặt vé của bạn tại đây.
            </p>
          </div>

          {/* Bộ lọc trạng thái */}
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

        {/* Danh sách vé */}
        {filteredTickets.length > 0 ? (
          <div className={styles.ticketList}>
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onCancelTicket={handleCancelTicket}
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
    </section>
  );
};

export default MyTicketsPage;