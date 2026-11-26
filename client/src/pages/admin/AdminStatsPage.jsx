import { useState, useMemo } from 'react';
import RevenueTable from '../../components/tickets-admin/RevenueTable';
import mockData from '../../data/mockData.json';
import styles from './AdminStatsPage.module.css';

const AdminStatsPage = () => {
  const [searchMovie, setSearchMovie] = useState('');
  const [sortBy, setSortBy] = useState('revenue-desc'); // revenue-desc | revenue-asc | tickets-desc

  // Tổng hợp dữ liệu doanh thu từ mockData + vé phát sinh thực tế trong localStorage
  const { movieStats, summary } = useMemo(() => {
    const movies = mockData.movies || [];
    const showtimes = mockData.showtimes || [];
    const mockBookings = mockData.bookings || [];
    const localBookings = JSON.parse(localStorage.getItem('ptit_bookings') || '[]');

    // Gộp danh sách đơn hợp lệ (không tính vé đã hủy)
    const validMockBookings = mockBookings.filter((b) => b.status !== 'cancelled');
    const validLocalBookings = localBookings.filter((b) => b.status !== 'cancelled');

    let totalRevenue = 0;
    let totalTickets = 0;

    const statsList = movies.map((movie) => {
      const movieShowtimes = showtimes.filter((s) => s.movieId === movie.id);
      const showtimeIds = movieShowtimes.map((s) => s.id);

      // Tính doanh thu từ mockData
      const bookingsFromMock = validMockBookings.filter((b) =>
        showtimeIds.includes(b.showtimeId)
      );
      const mockRev = bookingsFromMock.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const mockTix = bookingsFromMock.reduce(
        (sum, b) => sum + (Array.isArray(b.seats) ? b.seats.length : 1),
        0
      );

      // Cộng thêm doanh thu từ các vé đặt mới lưu trong localStorage khớp tên phim
      const bookingsFromLocal = validLocalBookings.filter(
        (b) => b.movieTitle?.toLowerCase() === movie.title.toLowerCase()
      );
      const localRev = bookingsFromLocal.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const localTix = bookingsFromLocal.reduce(
        (sum, b) => sum + (Array.isArray(b.seats) ? b.seats.length : 1),
        0
      );

      const revenue = mockRev + localRev;
      const ticketsSold = mockTix + localTix;

      totalRevenue += revenue;
      totalTickets += ticketsSold;

      return {
        movieId: movie.id,
        movieTitle: movie.title,
        genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Phim rạp',
        showtimeCount: movieShowtimes.length,
        ticketsSold,
        revenue,
      };
    });

    // Tìm phim có doanh thu cao nhất
    const topMovie = [...statsList].sort((a, b) => b.revenue - a.revenue)[0];

    return {
      movieStats: statsList,
      summary: {
        totalRevenue,
        totalTickets,
        totalMovies: movies.length,
        topMovieTitle: topMovie && topMovie.revenue > 0 ? topMovie.movieTitle : 'Chưa có dữ liệu',
      },
    };
  }, []);

  // Lọc và sắp xếp bảng doanh thu
  const filteredAndSortedStats = useMemo(() => {
    const filtered = movieStats.filter((item) =>
      item.movieTitle.toLowerCase().includes(searchMovie.trim().toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortBy === 'revenue-asc') return a.revenue - b.revenue;
      if (sortBy === 'tickets-desc') return b.ticketsSold - a.ticketsSold;
      return b.revenue - a.revenue;
    });
  }, [movieStats, searchMovie, sortBy]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Xuất file CSV báo cáo nhanh cho Admin
  const handleExportCSV = () => {
    const headers = ['STT,Ten phim,The loai,So suat chieu,So ve ban,Doanh thu (VND)'];
    const rows = filteredAndSortedStats.map(
      (item, idx) =>
        `${idx + 1},"${item.movieTitle}","${item.genre}",${item.showtimeCount},${item.ticketsSold},${item.revenue}`
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bao-cao-doanh-thu-ptit-cinema.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.statsWrapper}>
      {/* Tiêu đề trang */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Thống kê doanh thu</h1>
          <p className={styles.subtitle}>
            Tổng hợp hiệu quả bán vé và doanh thu theo từng bộ phim tại PTIT Cinema.
          </p>
        </div>

        <button type="button" onClick={handleExportCSV} className={styles.exportBtn}>
          ↓ Xuất báo cáo CSV
        </button>
      </header>

      {/* 4 thẻ KPI tổng quan */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Tổng doanh thu</span>
          <strong className={styles.kpiValuePrimary}>
            {formatCurrency(summary.totalRevenue)}
          </strong>
          <span className={styles.kpiNote}>Không bao gồm các vé đã hủy</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Tổng số vé đã bán</span>
          <strong className={styles.kpiValue}>{summary.totalTickets} vé</strong>
          <span className={styles.kpiNote}>Tính trên toàn hệ thống rạp</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Số phim đang quản lý</span>
          <strong className={styles.kpiValue}>{summary.totalMovies} phim</strong>
          <span className={styles.kpiNote}>Đang chiếu & sắp chiếu</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Phim doanh thu cao nhất</span>
          <strong className={styles.kpiMovieTitle} title={summary.topMovieTitle}>
            {summary.topMovieTitle}
          </strong>
          <span className={styles.kpiNote}>Dẫn đầu phòng vé PTIT</span>
        </div>
      </div>

      {/* Thanh tìm kiếm & sắp xếp */}
      <div className={styles.toolbar}>
        <input
          type="text"
          value={searchMovie}
          onChange={(e) => setSearchMovie(e.target.value)}
          placeholder="Tìm kiếm theo tên phim..."
          className={styles.searchInput}
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={styles.sortSelect}
        >
          <option value="revenue-desc">Doanh thu: Cao đến thấp</option>
          <option value="revenue-asc">Doanh thu: Thấp đến cao</option>
          <option value="tickets-desc">Số vé bán nhiều nhất</option>
        </select>
      </div>

      {/* Bảng thống kê chi tiết */}
      <RevenueTable
        statsData={filteredAndSortedStats}
        totalRevenue={summary.totalRevenue}
      />
    </section>
  );
};

export default AdminStatsPage;