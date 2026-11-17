import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* PHẦN TRÊN: CHIA 4 CỘT */}
        <div className={styles.topGrid}>
          {/* Cột 1: Thông tin thương hiệu & Hotline */}
          <div className={styles.brandCol}>
            <h3 className={styles.brandTitle}>PTIT CINEMA</h3>
            <p className={styles.brandDesc}>
              Hệ thống rạp chiếu phim chuẩn quốc tế trực thuộc Học viện Công nghệ
              Bưu chính Viễn thông. Nơi kiến tạo trải nghiệm điện ảnh chân thực,
              hiện đại và giàu cảm xúc.
            </p>
            <div className={styles.hotline}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e11d48"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>
                Hotline hỗ trợ: <strong>1900 6868</strong>
              </span>
            </div>
          </div>

          {/* Cột 2: Khám phá */}
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>KHÁM PHÁ</h4>
            <ul className={styles.linkList}>
              <li>
                <Link to="/" className={styles.linkItem}>
                  Phim Đang Chiếu
                </Link>
              </li>
              <li>
                <Link to="/?status=coming-soon" className={styles.linkItem}>
                  Phim Sắp Chiếu
                </Link>
              </li>
              <li>
                <Link to="/promotions" className={styles.linkItem}>
                  Suất Chiếu Đặc Biệt
                </Link>
              </li>
              <li>
                <Link to="/promotions" className={styles.linkItem}>
                  Giá Vé &amp; Ưu Đãi HSSV
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Chính sách & Hỗ trợ */}
          <div className={styles.linkCol}>
            <h4 className={styles.colHeading}>CHÍNH SÁCH &amp; HỖ TRỢ</h4>
            <ul className={styles.linkList}>
              <li>
                <Link to="/promotions" className={styles.linkItem}>
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/promotions" className={styles.linkItem}>
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/promotions" className={styles.linkItem}>
                  Quy định rạp chiếu
                </Link>
              </li>
              <li>
                <Link to="/promotions" className={styles.linkItem}>
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Đối tác thanh toán & Kết nối */}
          <div className={styles.partnerCol}>
            <h4 className={styles.colHeading}>ĐỐI TÁC THANH TOÁN</h4>
            <div className={styles.paymentBadges}>
              <span className={styles.badge}>MoMo</span>
              <span className={styles.badge}>VNPAY</span>
              <span className={styles.badge}>ZaloPay</span>
              <span className={styles.badge}>Visa</span>
              <span className={styles.badge}>Mastercard</span>
            </div>

            <h4 className={`${styles.colHeading} ${styles.connectHeading}`}>
              KẾT NỐI
            </h4>
            <div className={styles.socialLinks}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className={styles.socialItem}
              >
                Facebook
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className={styles.socialItem}
              >
                TikTok
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className={styles.socialItem}
              >
                Instagram
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className={styles.socialItem}
              >
                YouTube
              </a>
            </div>
          </div>
        </div>

        {/* PHẦN DƯỚI: DẢI BẢN QUYỀN */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © 2026 PTIT Cinema. Thuộc Học viện Công nghệ Bưu chính Viễn thông.
            Bảo lưu mọi quyền.
          </p>
          <div className={styles.bottomLinks}>
            <Link to="/promotions" className={styles.bottomLink}>
              Bảo mật thông tin
            </Link>
            <Link to="/promotions" className={styles.bottomLink}>
              Liên hệ hợp tác
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;