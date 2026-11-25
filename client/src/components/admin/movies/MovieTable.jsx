import Pagination from '../../common/Pagination';
import styles from '../../../pages/admin/AdminMoviesPage.module.css';

function MovieTable({
  movies,
  onDeleteMovie,
  currentPage,
  totalPages,
  onPageChange,
}) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Poster</th>
              <th>Thông tin tác phẩm</th>
              <th>Thể loại</th>
              <th>Thời lượng</th>
              <th>Khởi chiếu</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {movies.length > 0 ? (
              movies.map((movie) => (
                <tr key={movie.id}>
                  <td>
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className={styles.posterImg}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </td>
                  <td>
                    <div className={styles.movieTitleWrap}>
                      <span className={styles.movieTitle}>{movie.title}</span>
                      {movie.ageRating && (
                        <span className={styles.ageTag}>{movie.ageRating}</span>
                      )}
                    </div>
                    {movie.originalTitle && (
                      <div className={styles.originalTitle}>{movie.originalTitle}</div>
                    )}
                    <div className={styles.directorActors}>
                      ĐD: {movie.director || 'Chưa rõ'}
                    </div>
                  </td>
                  <td>
                    <div className={styles.genreBadges}>
                      {movie.genres?.map((g, idx) => (
                        <span key={idx} className={styles.genreBadge}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className={styles.durationWrap}>⏱ {movie.duration} phút</div>
                  </td>
                  <td>
                    <div className={styles.releaseDateWrap}>{movie.releaseDate}</div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusTag} ${
                        movie.status === 'now-showing'
                          ? styles.statusNowShowing
                          : styles.statusComingSoon
                      }`}
                    >
                      ● {movie.status === 'now-showing' ? 'Đang chiếu' : 'Sắp chiếu'}
                    </span>
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      type="button"
                      onClick={() => onDeleteMovie(movie.id, movie.title)}
                      className={styles.deleteBtn}
                      title="Xóa phim khỏi danh mục"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  Không tìm thấy phim nào phù hợp với điều kiện tìm kiếm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tái sử dụng component Pagination ở common */}
      {totalPages > 1 && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default MovieTable;
