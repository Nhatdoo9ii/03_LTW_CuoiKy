import { useMemo } from 'react';
import { Check, DoorOpen, Star, Video, X } from 'lucide-react';
import SeatItem from '../seatitem/SeatItem';
import styles from './SeatGrid.module.css';

const SeatGrid = ({
  room,
  bookedSeats = [],
  selectedSeats = [],
  basePrice = 85000,
  vipPrice = 100000,
  onToggleSeat,
}) => {
  const totalRows = room?.rows ?? room?.totalRows ?? 8;
  const seatsPerRow = room?.cols ?? room?.seatsPerRow ?? 10;
  const aisleIndex = Math.ceil(seatsPerRow / 2);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const vipRowSet = useMemo(() => {
    const rawVipRows = Array.isArray(room?.vipRows) ? room.vipRows : [];
    return new Set(rawVipRows.map((label) => String(label).toUpperCase()));
  }, [room?.vipRows]);

  const bookedSet = useMemo(
    () => new Set(bookedSeats.map((code) => String(code).toUpperCase())),
    [bookedSeats]
  );

  const selectedSet = useMemo(
    () =>
      new Set(
        selectedSeats.map((seat) =>
          String(typeof seat === 'string' ? seat : seat.code).toUpperCase()
        )
      ),
    [selectedSeats]
  );

  const seatRows = useMemo(() => {
    return Array.from({ length: totalRows }, (_, rowIndex) => {
      const rowLabel = String.fromCharCode(65 + rowIndex);
      const isVipRow = vipRowSet.has(rowLabel);
      const seatType = isVipRow ? 'vip' : 'standard';
      const seatPrice = isVipRow ? vipPrice : basePrice;

      const seats = Array.from({ length: seatsPerRow }, (_, colIndex) => {
        const colNumber = colIndex + 1;
        return {
          code: `${rowLabel}${colNumber}`,
          rowLabel,
          colNumber,
          type: seatType,
          price: seatPrice,
        };
      });

      return {
        rowLabel,
        isVipRow,
        leftSeats: seats.slice(0, aisleIndex),
        rightSeats: seats.slice(aisleIndex),
      };
    });
  }, [totalRows, seatsPerRow, aisleIndex, vipRowSet, basePrice, vipPrice]);

  const selectedLabelsText = useMemo(() => {
    if (selectedSeats.length === 0) return 'Chưa chọn';
    return selectedSeats
      .map((seat) => (typeof seat === 'string' ? seat : seat.code))
      .join(', ');
  }, [selectedSeats]);

  if (!room) {
    return (
      <section className={styles.gridCard}>
        <p className={styles.emptyMessage}>
          Không tìm thấy thông tin sơ đồ phòng chiếu.
        </p>
      </section>
    );
  }

  return (
    <section
      className={styles.gridCard}
      aria-label={`Sơ đồ ghế ${room.name || 'phòng chiếu'}`}
    >
      {/* Màn hình cong & lối ra */}
      <div className={styles.screenArea}>
        <div className={styles.screenCurve} aria-hidden="true" />
        <div className={styles.screenLabel}>
          <Video size={15} className={styles.screenIcon} aria-hidden="true" />
          <span>MÀN HÌNH CHIẾU / SCREEN</span>
        </div>

        <div className={styles.exitsRow}>
          <span className={styles.exitTag}>
            <DoorOpen size={15} aria-hidden="true" />
            <span>Lối ra A</span>
          </span>
          <span className={styles.exitTag}>
            <DoorOpen size={15} aria-hidden="true" />
            <span>Lối ra B</span>
          </span>
        </div>
      </div>

      {/* Sơ đồ hàng ghế sinh tự động */}
      <div className={styles.matrixScroll}>
        <div className={styles.matrixWrapper}>
          {seatRows.map((row) => (
            <div key={row.rowLabel} className={styles.seatRow}>
              <span
                className={`${styles.rowLabel} ${
                  row.isVipRow ? styles.rowLabelVip : ''
                }`}
              >
                {row.rowLabel}
              </span>

              <div className={styles.seatBlock}>
                {row.leftSeats.map((seat) => (
                  <SeatItem
                    key={seat.code}
                    seat={seat}
                    isBooked={bookedSet.has(seat.code)}
                    isSelected={selectedSet.has(seat.code)}
                    onToggle={onToggleSeat}
                  />
                ))}
              </div>

              <span className={styles.aisleMarker} aria-hidden="true" />

              <div className={styles.seatBlock}>
                {row.rightSeats.map((seat) => (
                  <SeatItem
                    key={seat.code}
                    seat={seat}
                    isBooked={bookedSet.has(seat.code)}
                    isSelected={selectedSet.has(seat.code)}
                    onToggle={onToggleSeat}
                  />
                ))}
              </div>

              <span
                className={`${styles.rowLabel} ${
                  row.isVipRow ? styles.rowLabelVip : ''
                }`}
              >
                {row.rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chú thích 4 trạng thái ghế */}
      <div className={styles.legendBar} role="list" aria-label="Chú thích loại ghế">
        <div className={styles.legendItem} role="listitem">
          <span className={`${styles.legendSwatch} ${styles.swatchStandard}`}>
            1
          </span>
          <div className={styles.legendText}>
            <strong>Ghế Thường</strong>
            <span>{basePrice.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <div className={styles.legendItem} role="listitem">
          <span className={`${styles.legendSwatch} ${styles.swatchVip}`}>
            <Star size={12} fill="currentColor" aria-hidden="true" />
          </span>
          <div className={styles.legendText}>
            <strong className={styles.vipTitle}>Ghế VIP</strong>
            <span>{vipPrice.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <div className={styles.legendItem} role="listitem">
          <span className={`${styles.legendSwatch} ${styles.swatchSelected}`}>
            <Check size={13} strokeWidth={2.8} aria-hidden="true" />
          </span>
          <div className={styles.legendText}>
            <strong className={styles.selectedTitle}>Đang chọn</strong>
            <span className={styles.selectedSeatsPreview}>
              {selectedLabelsText}
            </span>
          </div>
        </div>

        <div className={styles.legendItem} role="listitem">
          <span className={`${styles.legendSwatch} ${styles.swatchBooked}`}>
            <X size={13} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <div className={styles.legendText}>
            <strong>Đã bán</strong>
            <span>Khóa</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeatGrid;