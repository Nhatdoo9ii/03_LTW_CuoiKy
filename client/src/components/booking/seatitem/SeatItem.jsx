import { Check, X } from 'lucide-react';
import styles from './SeatItem.module.css';

// Hàm phụ: trả về tên trạng thái ghế để hiển thị khi rê chuột (tooltip)
const getSeatStatusText = (isBooked, isSelected, isVip) => {
  if (isBooked) {
    return 'Đã bán';
  }
  if (isSelected) {
    return 'Đang chọn';
  }
  if (isVip) {
    return 'Ghế VIP';
  }
  return 'Ghế thường';
};

// Hàm phụ: ghép danh sách class CSS tương ứng với trạng thái của ghế
const getSeatClassName = (isBooked, isSelected, isVip) => {
  let className = styles.seatBtn;

  if (isVip) {
    className = `${className} ${styles.vip}`;
  } else {
    className = `${className} ${styles.standard}`;
  }

  if (isSelected) {
    className = `${className} ${styles.selected}`;
  }

  if (isBooked) {
    className = `${className} ${styles.booked}`;
  }

  return className;
};

// Component hiển thị 1 ô ghế đơn lẻ trên sơ đồ phòng chiếu
const SeatItem = ({ seat, isSelected, isBooked, onToggle }) => {
  const { code, colNumber, type, price } = seat;
  const isVip = type === 'vip';

  const statusText = getSeatStatusText(isBooked, isSelected, isVip);
  const seatClassName = getSeatClassName(isBooked, isSelected, isVip);
  const formattedPrice = price.toLocaleString('vi-VN');

  // Khi người dùng bấm vào ghế: nếu ghế đã bán thì bỏ qua, ngược lại gọi hàm chọn/bỏ chọn
  const handleSelectSeat = () => {
    if (isBooked) {
      return;
    }
    onToggle(seat);
  };

  // Xác định nội dung hiển thị bên trong nút ghế (dấu X, dấu tích, hay số ghế)
  let seatContent = <span className={styles.seatNumber}>{colNumber}</span>;
  if (isBooked) {
    seatContent = <X size={15} strokeWidth={2.4} aria-hidden="true" />;
  } else if (isSelected) {
    seatContent = <Check size={15} strokeWidth={2.8} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className={seatClassName}
      onClick={handleSelectSeat}
      disabled={isBooked}
      aria-pressed={isSelected}
      aria-label={`Ghế ${code} - ${statusText} - ${formattedPrice}đ`}
      title={`Ghế ${code} (${statusText}) - ${formattedPrice}đ`}
    >
      {seatContent}
    </button>
  );
};

export default SeatItem;