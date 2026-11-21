import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PromotionPage.module.css';

function PromotionsPage() {
  const [copiedEmailSample, setCopiedEmailSample] = useState(false);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText('@stu.ptit.edu.vn');
    setCopiedEmailSample(true);
    setTimeout(() => setCopiedEmailSample(false), 2000);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 1. HERO BANNER KHUYẾN MÃI ĐỘC QUYỀN */}
      <section className={styles.heroBanner}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroText}>
              <span className={styles.exclusiveBadge}>
                ƯU ĐÃI ĐỘC QUYỀN TẠI PTIT CINEMA
              </span>
              <h1 className={styles.heroTitle}>
                Đặc Quyền Sinh Viên PTIT
                <span className={styles.highlightPercent}>Giảm Ngay 35%</span>
                Toàn Bộ Giá Vé
              </h1>
              <p className={styles.heroDesc}>
                Đồng hành cùng sinh viên Học viện Công nghệ Bưu chính Viễn thông.
                Chỉ cần sử dụng email trường <strong>@stu.ptit.edu.vn</strong>,
                hệ thống tự động giảm trực tiếp 35% mọi suất chiếu, mọi khung giờ.
              </p>

              <div className={styles.heroActions}>
                <Link to="/register" className={styles.primaryBtn}>
                  Đăng ký bằng Email PTIT
                </Link>
                <Link to="/" className={styles.secondaryBtn}>
                  Đặt vé ngay
                </Link>
              </div>
            </div>

            {/* Thẻ minh họa mức giảm trực quan */}
            <div className={styles.promoCard}>
              <div className={styles.promoCardTop}>
                <span className={styles.cardTag}>PTIT STUDENT PASS</span>
                <span className={styles.cardDiscount}>-35%</span>
              </div>

              <div className={styles.priceComparison}>
                <div className={styles.priceRow}>
                  <span>Vé thường (85.000đ)</span>
                  <div className={styles.priceValues}>
                    <del>85.000đ</del>
                    <strong>55.250đ</strong>
                  </div>
                </div>
                <div className={styles.priceRow}>
                  <span>Vé cuối tuần (95.000đ)</span>
                  <div className={styles.priceValues}>
                    <del>95.000đ</del>
                    <strong>61.750đ</strong>
                  </div>
                </div>
                <div className={styles.priceRow}>
                  <span>Ghế VIP trung tâm (115.000đ)</span>
                  <div className={styles.priceValues}>
                    <del>115.000đ</del>
                    <strong>74.750đ</strong>
                  </div>
                </div>
              </div>

              <div className={styles.domainBox}>
                <span>Đuôi email hợp lệ:</span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className={styles.copyBtn}
                >
                  {copiedEmailSample ? '✓ Đã sao chép' : '@stu.ptit.edu.vn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUY TRÌNH 3 BƯỚC NHẬN ƯU ĐÃI */}
      <section className={styles.stepsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>3 Bước Nhận Ưu Đãi Tự Động</h2>
            <p className={styles.sectionSubtitle}>
              Không cần săn mã, không giới hạn khung giờ vàng
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>01</span>
              <h3>Đăng ký tài khoản PTIT</h3>
              <p>
                Tạo tài khoản hoặc đăng nhập bằng địa chỉ email có đuôi{' '}
                <strong>@stu.ptit.edu.vn</strong> hoặc{' '}
                <strong>@ptit.edu.vn</strong>.
              </p>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>02</span>
              <h3>Chọn phim & ghế ngồi</h3>
              <p>
                Truy cập trang chủ, chọn bộ phim yêu thích, khung giờ chiếu phù
                hợp và chọn vị trí ghế trên sơ đồ rạp.
              </p>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>03</span>
              <h3>Tự động trừ 35% khi thanh toán</h3>
              <p>
                Tại bước thanh toán, hệ thống tự động trừ thẳng 35% hóa đơn và
                xuất mã vé điện tử ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PromotionsPage;