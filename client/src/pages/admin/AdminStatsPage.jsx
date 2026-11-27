import { useState, useEffect, useMemo, useCallback } from 'react';
import RevenueTable from '../../components/tickets-admin/RevenueTable';
import { getRevenueStats } from '../../services/ticketService';
import styles from './AdminStatsPage.module.css';

const AdminStatsPage = () => {
  const [searchMovie, setSearchMovie] = useState('');
  const [sortBy, setSortBy] = useState('revenue-desc'); // revenue-desc | revenue-asc | tickets-desc
  const [viewMode, setViewMode] = useState('byMovie'); // byMovie | byDate
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [statsData, setStatsData] = useState({
    summary: {
      totalRevenue: 0,
      totalTickets: 0,
      totalMovies: 0,
      topMovieTitle: 'Chưa có dữ liệu',
    },
    byMovie: [],
    byDate: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRevenueStats({ fromDate, toDate });
      setStatsData(data);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu thống kê doanh thu.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    let isCancelled = false;

    const fetchInitialStats = async () => {
      try {
        const data = await getRevenueStats({ fromDate, toDate });
        if (!isCancelled) {
          setStatsData(data);
          setError('');
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Không thể tải dữ liệu thống kê doanh thu.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchInitialStats();

    return () => {
      isCancelled = true;
    };
  }, [fromDate, toDate]);

  const { summary, byMovie, byDate } = statsData;

  // Lọc và sắp xếp bảng doanh thu theo phim
  const filteredAndSortedStats = useMemo(() => {
    const keyword = searchMovie.trim().toLowerCase();
    const filtered = byMovie.filter((item) =>
      item.movieTitle.toLowerCase().includes(keyword)
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === 'revenue-asc') return a.revenue - b.revenue;
      if (sortBy === 'tickets-desc') return b.ticketsSold - a.ticketsSold;
      return b.revenue - a.revenue;
    });
  }, [byMovie, searchMovie, sortBy]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  // Xuất file CSV báo cáo nhanh cho Admin
  const handleExportCSV = () => {
    const isDaily = viewMode === 'byDate';
    const headers = isDaily
      ? ['STT,Ngay chieu,So don dat ve,So ve ban,Doanh thu (VND)']
      : ['STT,Ten phim,The loai,So suat chieu,So ve ban,Doanh thu (VND)'];

    const rows = isDaily
      ? byDate.map(
          (item, idx) =>
            `${idx + 1},"${item.date}",${item.bookingCount},${item.ticketsSold},${item.revenue}`
        )
      : filteredAndSortedStats.map(
          (item, idx) =>
            `${idx + 1},"${item.movieTitle}","${item.genre}",${item.showtimeCount},${item.ticketsSold},${item.revenue}`
        );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      isDaily
        ? 'bao-cao-doanh-thu-theo-ngay-ptit-cinema.csv'
        : 'bao-cao-doanh-thu-theo-phim-ptit-cinema.csv'
    );
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
            Tổng hợp hiệu quả bán vé và doanh thu theo từng bộ phim và theo ngày tại PTIT Cinema.
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

      {/* Bộ lọc chế độ xem + ngày chiếu + tìm kiếm */}
      <div className={styles.toolbar}>
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeBtn} ${viewMode === 'byMovie' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('byMovie')}
          >
            Theo phim ({byMovie.length})
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${viewMode === 'byDate' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('byDate')}
          >
            Theo ngày ({byDate.length})
          </button>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="stats-from-date" className={styles.dateLabel}>
            Từ
            <input
              id="stats-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={styles.dateInput}
            />
          </label>
          <label htmlFor="stats-to-date" className={styles.dateLabel}>
            Đến
            <input
              id="stats-to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={styles.dateInput}
            />
          </label>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className={styles.clearDateBtn}
            >
              Xóa lọc ngày
            </button>
          )}
        </div>
      </div>

      {viewMode === 'byMovie' && (
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
      )}

      {loading ? (
        <div className={styles.stateBox}>Đang tải thống kê doanh thu từ máy chủ...</div>
      ) : error ? (
        <div className={styles.stateBox} role="alert">
          <p className={styles.errorText}>{error}</p>
          <button type="button" onClick={loadStats} className={styles.exportBtn}>
            Thử lại
          </button>
        </div>
      ) : viewMode === 'byMovie' ? (
        <RevenueTable
          statsData={filteredAndSortedStats}
          totalRevenue={summary.totalRevenue}
        />
      ) : byDate.length === 0 ? (
        <div className={styles.stateBox}>
          Chưa có dữ liệu doanh thu theo ngày phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.dailyTable}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Ngày chiếu</th>
                <th>Số đơn đặt vé</th>
                <th>Số vé đã bán</th>
                <th>Doanh thu</th>
                <th>Tỷ trọng</th>
              </tr>
            </thead>
            <tbody>
              {byDate.map((row, index) => {
                const sharePercent =
                  summary.totalRevenue > 0
                    ? ((row.revenue / summary.totalRevenue) * 100).toFixed(1)
                    : 0;
                return (
                  <tr key={row.date}>
                    <td className={styles.centerCell}>{index + 1}</td>
                    <td className={styles.dateCell}>{row.date}</td>
                    <td className={styles.centerCell}>{row.bookingCount} đơn</td>
                    <td className={styles.centerCell}>{row.ticketsSold} vé</td>
                    <td className={styles.revenueCell}>{formatCurrency(row.revenue)}</td>
                    <td className={styles.centerCell}>{sharePercent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AdminStatsPage;
