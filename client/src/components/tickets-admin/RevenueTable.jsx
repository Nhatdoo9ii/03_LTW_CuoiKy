import styles from './RevenueTable.module.css';

const RevenueTable = ({ statsData, totalRevenue }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (!statsData || statsData.length === 0) {
    return (
      <div className={styles.emptyState}>
        Chưa có dữ liệu doanh thu phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  const totalTicketsSold = statsData.reduce((sum, item) => sum + item.ticketsSold, 0);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên phim</th>
            <th>Số suất chiếu</th>
            <th>Số vé đã bán</th>
            <th>Doanh thu</th>
            <th>Tỷ trọng</th>
          </tr>
        </thead>
        <tbody>
          {statsData.map((row, index) => {
            const sharePercent =
              totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(1) : 0;

            return (
              <tr key={row.movieId}>
                <td className={styles.centerCell}>{index + 1}</td>
                <td className={styles.movieCell}>
                  <span className={styles.movieTitle}>{row.movieTitle}</span>
                  <span className={styles.movieGenre}>{row.genre}</span>
                </td>
                <td className={styles.centerCell}>{row.showtimeCount}</td>
                <td className={styles.centerCell}>
                  <span className={styles.ticketBadge}>{row.ticketsSold} vé</span>
                </td>
                <td className={styles.revenueCell}>{formatCurrency(row.revenue)}</td>
                <td className={styles.shareCell}>
                  <div className={styles.progressBox}>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${sharePercent}%` }}
                      />
                    </div>
                    <span className={styles.percentText}>{sharePercent}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={styles.summaryRow}>
            <td colSpan="3">Tổng cộng</td>
            <td className={styles.centerCell}>{totalTicketsSold} vé</td>
            <td className={styles.revenueCell}>{formatCurrency(totalRevenue)}</td>
            <td className={styles.centerCell}>100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default RevenueTable;