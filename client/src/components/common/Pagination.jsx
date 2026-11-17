import styles from './Pagination.module.css';

function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  // Ẩn thanh phân trang nếu chỉ có 1 trang duy nhất
  if (totalPages <= 1) return null;

  // Hàm tính danh sách các nút trang cần hiển thị (kèm dấu '...')
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Luôn hiện trang đầu tiên
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // Các trang lân cận trang hiện tại
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // Luôn hiện trang cuối cùng
    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className={styles.pagination} aria-label="Phân trang dữ liệu">
      {/* Nút Trang trước */}
      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
      >
        &lt;
      </button>

      {/* Danh sách số trang */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`dots-${index}`} className={styles.dots}>
              ...
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            className={`${styles.pageBtn} ${isActive ? styles.activeBtn : ''}`}
            onClick={() => onPageChange(page)}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Nút Trang sau */}
      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
      >
        &gt;
      </button>
    </nav>
  );
}

export default Pagination;