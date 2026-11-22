import { Link } from 'react-router-dom';
import styles from './MovieDetailHero.module.css';

function MovieDetailHero({ movie, onOpenTrailer }) {
  return (
    <section className={styles.heroSection}>
      <div
        className={styles.backdropImage}
        style={{ backgroundImage: `url(${movie.bannerUrl})` }}
      />
      <div className={styles.backdropOverlay} />

      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink}>
            Trang chủ
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link
            to={movie.status === 'coming-soon' ? '/upcoming' : '/'}
            className={styles.breadcrumbLink}
          >
            {movie.status === 'coming-soon' ? 'Phim sắp chiếu' : 'Phim đang chiếu'}
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{movie.title}</span>
        </nav>

        <div className={styles.heroContent}>
          <div className={styles.posterBox}>
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className={styles.posterImg}
            />
            <span
              className={`${styles.ageBadge} ${
                movie.ageRating === 'T18'
                  ? styles.ageT18
                  : movie.ageRating === 'T16' || movie.ageRating === 'T13'
                  ? styles.ageT16
                  : styles.ageP
              }`}
            >
              {movie.ageRating}
            </span>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.tagRow}>
              <span className={styles.durationTag}>{movie.duration} phút</span>
              <span className={styles.ratingTag}>
                ★ {movie.rating}/10 ({movie.votes} đánh giá)
              </span>
            </div>

            <h1 className={styles.movieTitle}>{movie.title}</h1>
            <p className={styles.originalTitle}>{movie.originalTitle}</p>
            <p className={styles.synopsis}>{movie.synopsis}</p>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Đạo diễn:</span>
                <span className={styles.metaValue}>{movie.director}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Thể loại:</span>
                <span className={styles.metaValue}>{movie.genres.join(', ')}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Thời lượng:</span>
                <span className={styles.metaValue}>{movie.duration} phút</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Khởi chiếu:</span>
                <span className={styles.metaValue}>{movie.releaseDate}</span>
              </div>
              <div className={styles.metaItemFull}>
                <span className={styles.metaLabel}>Diễn viên:</span>
                <span className={styles.metaValue}>{movie.actors}</span>
              </div>
              <div className={styles.metaItemFull}>
                <span className={styles.metaLabel}>Ngôn ngữ:</span>
                <span className={styles.metaValue}>{movie.language}</span>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.trailerBtn}
                onClick={onOpenTrailer}
              >
                ▶ Xem Trailer
              </button>
              {movie.status === 'now-showing' && (
                <a href="#showtimes-section" className={styles.scrollBookBtn}>
                  Chọn suất chiếu bên dưới
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MovieDetailHero;