import styles from './TicketCard.module.css';

const TicketCard = ({ ticket, onCancelTicket }) => {
  // Kiểm tra xem vé còn được phép hủy không (chỉ hủy được khi chưa hủy và trước giờ chiếu >= 2 tiếng)
  const checkCanCancel = () => {
    if (ticket.status === 'cancelled') {
      return { allowed: false, reason: 'Vé đã được hủy' };
    }

    const showDateTime = new Date(`${ticket.date}T${ticket.startTime}:00`);
    const now = new Date();
    const diffHours = (showDateTime - now) / (1000 * 60 * 60);

    if (diffHours <= 0) {
      return { allowed: false, reason: 'Suất chiếu đã diễn ra' };
    }
    if (diffHours < 2) {
      return { allowed: false, reason: 'Chỉ được hủy trước giờ chiếu 2 tiếng' };
    }
    return { allowed: true, reason: '' };
  };

  const { allowed, reason } = checkCanCancel();

  // Format tiền VND cho gọn
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <article className={`${styles.card} ${ticket.status === 'cancelled' ? styles.cancelledCard : ''}`}>
      {/* Cột trái: Poster phim */}
      <div className={styles.posterBox}>
        <img
          src={ticket.posterUrl || 'https://via.placeholder.com/120x170?text=PTIT+Cinema'}
          alt={ticket.movieTitle}
          className={styles.poster}
        />
      </div>

      {/* Cột giữa: Thông tin chi tiết vé */}
      <div className={styles.infoBox}>
        <div className={styles.topRow}>
          <span className={styles.bookingCode}>Mã vé: #{ticket.bookingCode || ticket.id}</span>
          <span
            className={`${styles.statusBadge} ${
              ticket.status === 'cancelled' ? styles.statusCancelled : styles.statusConfirmed
            }`}
          >
            {ticket.status === 'cancelled' ? 'Đã hủy' : 'Đã xác nhận'}
          </span>
        </div>

        <h3 className={styles.movieTitle}>{ticket.movieTitle}</h3>

        <div className={styles.metaGrid}>
          <p className={styles.metaItem}>
            <strong>Phòng chiếu:</strong> {ticket.roomName}
          </p>
          <p className={styles.metaItem}>
            <strong>Suất chiếu:</strong> {ticket.startTime} - {ticket.date}
          </p>
          <p className={styles.metaItem}>
            <strong>Ghế đã chọn:</strong>{' '}
            <span className={styles.seatHighlight}>{ticket.seats.join(', ')}</span>
          </p>
          <p className={styles.metaItem}>
            <strong>Tổng thanh toán:</strong>{' '}
            <span className={styles.priceHighlight}>{formatCurrency(ticket.totalAmount)}</span>
          </p>
        </div>
      </div>

      {/* Cột phải: Hành động hủy vé */}
      <div className={styles.actionBox}>
        {allowed ? (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => onCancelTicket(ticket.id)}
          >
            Hủy vé
          </button>
        ) : (
          <div className={styles.lockedBox}>
            <button type="button" className={styles.disabledBtn} disabled>
              Không thể hủy
            </button>
            <span className={styles.lockReason}>{reason}</span>
          </div>
        )}
      </div>
    </article>
  );
};

export default TicketCard;