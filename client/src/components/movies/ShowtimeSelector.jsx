import { Link } from 'react-router-dom';
import styles from './ShowtimeSelector.module.css';

function ShowtimeSelector({
  status,
  releaseDate,
  dates,
  selectedDate,
  onSelectDate,
  showtimes,
  onSelectSlot,
}) {
  return (
    <section id="showtimes-section" className={styles.showtimesSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Lịch Chiếu & Chọn Suất</h2>
          <p className={styles.sectionSubtitle}>
            Ưu đãi giảm trực tiếp 35% cho sinh viên đăng nhập bằng email @stu.ptit.edu.vn
          </p>
        </div>

        {status === 'coming-soon' ? (
          <div className={styles.comingSoonBox}>
            <h3>Phim sắp khởi chiếu vào ngày {releaseDate}</h3>
            <p>
              Hệ thống sẽ mở bán vé sớm trước 3 ngày công chiếu. Vui lòng quay lại sau!
            </p>
            <Link to="/" className={styles.backHomeBtn}>
              Xem các phim đang chiếu
            </Link>
          </div>
        ) : (
          <>
            {/* Thanh chọn ngày */}
            <div className={styles.dateSelector}>
              {dates.map((d) => {
                const isSelected = selectedDate === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onSelectDate(d.id)}
                    className={`${styles.dateCard} ${
                      isSelected ? styles.dateCardActive : ''
                    }`}
                  >
                    <span className={styles.dayName}>{d.dayName}</span>
                    <span className={styles.dateNumber}>{d.dateLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Danh sách khung giờ chiếu trong ngày */}
            <div className={styles.scheduleCard}>
              <div className={styles.scheduleHeader}>
                <span className={styles.cinemaName}>Rạp PTIT Cinema - Hà Nội</span>
                <span className={styles.slotCount}>
                  {showtimes.length} suất chiếu khả dụng
                </span>
              </div>

              {showtimes.length > 0 ? (
                <div className={styles.slotsGrid}>
                  {showtimes.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      className={styles.slotBtn}
                    >
                      <span className={styles.slotTime}>{slot.time}</span>
                      <span className={styles.slotRoom}>{slot.roomName}</span>
                      <span className={styles.slotSeats}>
                        Còn {slot.availableSeats}/{slot.totalSeats} ghế
                      </span>
                      <span className={styles.slotPrice}>
                        Từ {slot.basePrice.toLocaleString('vi-VN')}đ
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.noShowtime}>
                  Chưa có suất chiếu cho ngày này. Vui lòng chọn ngày khác!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default ShowtimeSelector;