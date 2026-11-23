import styles from '../../../pages/admin/AdminMoviesPage.module.css';

const GENRE_OPTIONS = [
  'Hành Động',
  'Điệp Viên',
  'Hoạt Hình',
  'Phiêu Lưu',
  'Hài Hước',
  'Kinh Dị',
  'Tâm Lý',
  'Tình Cảm',
  'Lãng Mạn',
  'Viễn Tưởng',
];

function MovieFilterBar({
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedStatus,
  onStatusChange,
  onReset,
}) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Tìm theo tên phim tiếng Việt, tiếng Anh, đạo diễn..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <select
        value={selectedGenre}
        onChange={(e) => onGenreChange(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="">Thể loại: Tất cả</option>
        {GENRE_OPTIONS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="">Trạng thái: Tất cả</option>
        <option value="now-showing">Đang chiếu</option>
        <option value="coming-soon">Sắp chiếu</option>
      </select>

      <button
        type="button"
        onClick={onReset}
        className={styles.filterResetBtn}
        title="Đặt lại bộ lọc"
      >
        ↻
      </button>
    </div>
  );
}

export default MovieFilterBar;
