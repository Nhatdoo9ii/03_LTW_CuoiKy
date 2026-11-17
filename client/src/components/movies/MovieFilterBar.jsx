import styles from './MovieFilterBar.module.css';

function MovieFilterBar({
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedDate,
  onDateChange,
  onFilterSubmit,
  onReset,
}) {
  return (
    <div className={styles.filterBox}>
      {/* Thanh tìm kiếm từ khóa trên cùng */}
      <div className={styles.searchRow}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          className={styles.searchIcon}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm tên phim, diễn viên, đạo diễn..."
          className={styles.searchInput}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className={styles.clearBtn}
            title="Xóa từ khóa"
          >
            ✕
          </button>
        )}
      </div>

      {/* Hàng bộ lọc dưới */}
      <div className={styles.controlsRow}>
        <div className={styles.selectGroup}>
          <label className={styles.label}>Thể loại</label>
          <select
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Tất cả thể loại</option>
            <option value="Hành Động">Hành Động</option>
            <option value="Hoạt Hình">Hoạt Hình</option>
            <option value="Kinh Dị">Kinh Dị</option>
            <option value="Tình Cảm">Tình Cảm</option>
            <option value="Viễn Tưởng">Viễn Tưởng</option>
            <option value="Hài Hước">Hài Hước</option>
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.label}>Ngày chiếu</label>
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Tất cả các ngày</option>
            <option value="24/10">Hôm nay (24/10)</option>
            <option value="25/10">Ngày mai (25/10)</option>
            <option value="26/10">Thứ Bảy (26/10)</option>
            <option value="27/10">Chủ Nhật (27/10)</option>
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={onFilterSubmit}
            className={styles.submitBtn}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>Lọc kết quả</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className={styles.resetBtn}
            title="Đặt lại bộ lọc"
          >
            ↻
          </button>
        </div>
      </div>
    </div>
  );
}

export default MovieFilterBar;