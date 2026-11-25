import { Check, DoorOpen, Star, Video, X } from 'lucide-react';
import SeatItem from '../seatitem/SeatItem';
import styles from './SeatGrid.module.css';

// Hàm phụ: chuyển mảng ghế (dạng chuỗi hoặc object) sang mảng mã chữ in hoa (VD: ['F5', 'F6'])
const getUpperCaseCodes = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item) => {
    if (typeof item === 'string') {
      return item.toUpperCase();
    }
    if (item && item.code) {
      return String(item.code).toUpperCase();
    }
    return '';
  });
};

// Hàm phụ: tự động sinh danh sách các hàng ghế từ số hàng, số cột và danh sách hàng VIP
const buildSeatRows = (totalRows, seatsPerRow, vipRowList, basePrice, vipPrice) => {
  const aisleIndex = Math.ceil(seatsPerRow / 2);
  let rows = [];

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    const rowLabel = String.fromCharCode(65 + rowIndex);
    const isVipRow = vipRowList.includes(rowLabel);

    let seatType = 'standard';
    let seatPrice = basePrice;
    if (isVipRow) {
      seatType = 'vip';
      seatPrice = vipPrice;
    }

    let seatsInRow = [];
    for (let colIndex = 0; colIndex < seatsPerRow; colIndex += 1) {
      const colNumber = colIndex + 1;
      const newSeat = {
        code: `${rowLabel}${colNumber}`,
        rowLabel,
        colNumber,
        type: seatType,
        price: seatPrice,
      };
      seatsInRow = [...seatsInRow, newSeat];
    }

    const rowData = {
      rowLabel,
      isVipRow,
      leftSeats: seatsInRow.slice(0, aisleIndex),
      rightSeats: seatsInRow.slice(aisleIndex),
    };

    rows = [...rows, rowData];
  }

  return rows;
};

// Component sơ đồ ghế sinh động theo cấu hình từng phòng chiếu
const SeatGrid = ({
  room,
  bookedSeats = [],
  selectedSeats = [],
  basePrice = 85000,
  vipPrice = 100000,
  onToggleSeat,
}) => {
  if (!room) {
    return (
      <section className={styles.gridCard}>
        <p className={styles.emptyMessage}>
          Không tìm thấy thông tin sơ đồ phòng chiếu.
        </p>
      </section>
    );
  }

  let totalRows = 8;
  if (room.rows) {
    totalRows = room.rows;
  } else if (room.totalRows) {
    totalRows = room.totalRows;
  }

  let seatsPerRow = 10;
  if (room.cols) {
    seatsPerRow = room.cols;
  } else if (room.seatsPerRow) {
    seatsPerRow = room.seatsPerRow;
  }

  // Bước 2: Chuẩn hóa các danh sách mã ghế sang chữ in hoa để so sánh bằng .includes()
  const vipRowList = getUpperCaseCodes(room.vipRows);
  const bookedCodeList = getUpperCaseCodes(bookedSeats);
  const selectedCodeList = getUpperCaseCodes(selectedSeats);

  // Bước 3: Sinh danh sách hàng ghế cho phòng chiếu hiện tại
  const seatRows = buildSeatRows(
    totalRows,
    seatsPerRow,
    vipRowList,
    basePrice,
    vipPrice
  );

  // Chuỗi hiển thị nhanh các ghế đang chọn ở thanh chú thích phía dưới
  let selectedLabelsText = 'Chưa chọn';
  if (selectedCodeList.length > 0) {
    selectedLabelsText = selectedCodeList.join(', ');
  }

  const roomName = room.name || 'phòng chiếu';

  return (
    <section className={styles.gridCard} aria-label={`Sơ đồ ghế ${roomName}`}>
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

      <div className={styles.matrixScroll}>
        <div className={styles.matrixWrapper}>
          {seatRows.map((row) => {
            let rowLabelClass = styles.rowLabel;
            if (row.isVipRow) {
              rowLabelClass = `${styles.rowLabel} ${styles.rowLabelVip}`;
            }

            return (
              <div key={row.rowLabel} className={styles.seatRow}>
                <span className={rowLabelClass}>{row.rowLabel}</span>
                <div className={styles.seatBlock}>
                  {row.leftSeats.map((seat) => (
                    <SeatItem
                      key={seat.code}
                      seat={seat}
                      isBooked={bookedCodeList.includes(seat.code)}
                      isSelected={selectedCodeList.includes(seat.code)}
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
                      isBooked={bookedCodeList.includes(seat.code)}
                      isSelected={selectedCodeList.includes(seat.code)}
                      onToggle={onToggleSeat}
                    />
                  ))}
                </div>

                <span className={rowLabelClass}>{row.rowLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={styles.legendBar}
        role="list"
        aria-label="Chú thích loại ghế"
      >
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