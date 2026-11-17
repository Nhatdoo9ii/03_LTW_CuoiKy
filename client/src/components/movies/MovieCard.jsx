import { Link } from 'react-router-dom';
import styles from './MovieCard.module.css';

function MovieCard({ movie }) {
  return (
    <article className={styles.card}>
      {/* Khung Poster & Nhãn góc trên */}
      <Link to={`/movies/${movie.id}`} className={styles.posterLink}>
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className={styles.posterImg}
        />
        <div className={styles.topBadges}>
          <span
            className={`${styles.ageBadge} ${
              movie.ageRating === 'T18'
                ? styles.ageT18
                : movie.ageRating === 'T16'
                ? styles.ageT16
                : styles.ageP
            }`}
          >
            {movie.ageRating || 'P'}
          </span>
          <span className={styles.formatBadge}>
            {movie.format || '2D Phụ đề'}
          </span>
        </div>
      </Link>

      {/* Thông tin phim bên dưới */}
      <div className={styles.cardBody}>
        <Link to={`/movies/${movie.id}`} className={styles.movieTitle}>
          {movie.title}
        </Link>

        <p className={styles.genreText}>
          {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}
        </p>

        <div className={styles.metaRow}>
          <span className={styles.duration}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {movie.duration} phút
          </span>

          <span className={styles.rating}>
            ★ {movie.rating || '9.0'}/10
          </span>
        </div>

        <Link to={`/movies/${movie.id}`} className={styles.buyBtn}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          </svg>
          <span>Mua vé</span>
        </Link>
      </div>
    </article>
  );
}

export default MovieCard;