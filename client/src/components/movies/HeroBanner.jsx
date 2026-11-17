import styles from './HeroBanner.module.css';

function HeroBanner() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          Trải nghiệm điện ảnh đỉnh cao
          <br />
          <span className={styles.highlightText}>tại PTIT Cinema</span>
        </h1>

        <p className={styles.heroDesc}>
          Hệ thống rạp laser cao cấp với màn chiếu IMAX và chuẩn âm thanh vòm
          Dolby Atmos đa chiều. Đặt vé xem phim tức thì, giữ chỗ trung tâm,
          không lo chờ đợi.
        </p>

        <div className={styles.studentBadge}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e11d48"
            strokeWidth="2"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <span>Đồng giá 55.000đ khi xuất trình thẻ SV</span>
        </div>
      </div>

      {/* Cụm 3 Poster trưng bày bên phải */}
      <div className={styles.posterShowcase}>
        <img
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80"
          alt="Poster 1"
          className={`${styles.showcaseCard} ${styles.cardLeft}`}
        />
        <img
          src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=400&q=80"
          alt="Poster 2"
          className={`${styles.showcaseCard} ${styles.cardCenter}`}
        />
        <img
          src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80"
          alt="Poster 3"
          className={`${styles.showcaseCard} ${styles.cardRight}`}
        />
      </div>
    </section>
  );
}

export default HeroBanner;