import styles from '../../../pages/admin/AdminMoviesPage.module.css';

function MovieStatsCards({ totalCount, nowShowingCount, comingSoonCount }) {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div>
          <span className={styles.statLabel}>Tổng số phim</span>
          <div className={styles.statValue}>{totalCount}</div>
        </div>
        <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>🎬</div>
      </div>

      <div className={styles.statCard}>
        <div>
          <span className={styles.statLabel}>Đang chiếu</span>
          <div className={styles.statValue}>{nowShowingCount}</div>
        </div>
        <div className={`${styles.statIcon} ${styles.statIconSuccess}`}>▶</div>
      </div>

      <div className={styles.statCard}>
        <div>
          <span className={styles.statLabel}>Sắp chiếu</span>
          <div className={styles.statValue}>{comingSoonCount}</div>
        </div>
        <div className={`${styles.statIcon} ${styles.statIconInfo}`}>⏳</div>
      </div>
    </div>
  );
}

export default MovieStatsCards;
