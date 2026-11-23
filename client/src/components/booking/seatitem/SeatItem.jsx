import { memo } from 'react';
import { Check, X } from 'lucide-react';
import styles from './SeatItem.module.css';

const SeatItem = ({ seat, isSelected, isBooked, onToggle }) => {
  const { code, colNumber, type, price } = seat;
  const isVip = type === 'vip';

  const statusText = isBooked ? 'Đã bán' : 
    isSelected
      ? 'Đang chọn'
      : isVip
        ? 'Ghế VIP'
        : 'Ghế thường';

  const seatClassName = [
    styles.seatBtn,
    isVip ? styles.vip : styles.standard,
    isSelected ? styles.selected : '',
    isBooked ? styles.booked : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (isBooked) return;
    onToggle(seat);
  };

  return (
    <button
      type="button"
      className={seatClassName}
      onClick={handleClick}
      disabled={isBooked}
      aria-pressed={isSelected}
      aria-label={`Ghế ${code} - ${statusText} - ${price.toLocaleString('vi-VN')}đ`}
      title={`Ghế ${code} (${statusText}) - ${price.toLocaleString('vi-VN')}đ`}
    >
      {isBooked ? (
        <X size={15} strokeWidth={2.4} aria-hidden="true" />
      ) : isSelected ? (
        <Check size={15} strokeWidth={2.8} aria-hidden="true" />
      ) : (
        <span className={styles.seatNumber}>{colNumber}</span>
      )}
    </button>
  );
};

export default memo(SeatItem);