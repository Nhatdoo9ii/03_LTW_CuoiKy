import { QRCodeSVG } from 'qrcode.react';
import { Download, MapPin } from 'lucide-react';
import styles from './ElectronicTicket.module.css';

// Hàm phụ: đổi ngày "2026-11-18" thành "Thứ 4, 18/11/2026"
const formatVietnameseDate = (dateStr) => {
  if (!dateStr) {
    return '--/--/----';
  }

  const parts = String(dateStr).split('-');
  if (parts.length !== 3) {
    return dateStr;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return dateStr;
  }

  const dateObj = new Date(year, month - 1, day);
  const weekdays = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  const dayName = weekdays[dateObj.getDay()];
  const dayText = String(day).padStart(2, '0');
  const monthText = String(month).padStart(2, '0');

  return `${dayName}, ${dayText}/${monthText}/${year}`;
};

// Hàm phụ: lấy danh sách mã ghế dạng chuỗi (VD: ['F5', 'F6'])
const getSeatCodeList = (seats) => {
  if (!Array.isArray(seats)) {
    return [];
  }

  const codes = seats.map((seat) => {
    if (typeof seat === 'string') {
      return seat;
    }
    if (seat && seat.code) {
      return seat.code;
    }
    return '';
  });

  return codes.filter((code) => code !== '');
};

// Hàm phụ: kiểm tra trong đơn vé có ghế VIP hay không
const checkHasVipSeat = (seatDetails) => {
  if (!Array.isArray(seatDetails)) {
    return false;
  }

  for (const seat of seatDetails) {
    if (seat && seat.type === 'vip') {
      return true;
    }
  }
  return false;
};

// Hàm phụ: tạo các thanh dọc cho mã vạch SVG dựa theo mã vé
const createBarcodeBars = (barcodeText) => {
  const safeText = String(barcodeText || 'PTIT-TKT-000000-HD');
  let bars = [];
  let currentX = 0;

  for (let i = 0; i < safeText.length; i += 1) {
    const charCode = safeText.charCodeAt(i);

    // Tính độ rộng vạch thứ 1 và khoảng trống dựa trên mã ký tự (luôn cố định)
    const firstWidth = (charCode % 3) + 1;
    const firstGap = (charCode % 2) + 1.5;

    bars = [
      ...bars,
      {
        id: `bar-a-${i}`,
        x: currentX,
        width: firstWidth,
      },
    ];
    currentX = currentX + firstWidth + firstGap;

    // Tạo thêm vạch thứ 2 để mã vạch trông dày và đều
    const secondWidth = ((charCode + 1) % 2) + 1;
    bars = [
      ...bars,
      {
        id: `bar-b-${i}`,
        x: currentX,
        width: secondWidth,
      },
    ];
    currentX = currentX + secondWidth + 1.5;
  }

  let totalWidth = currentX;
  if (totalWidth < 120) {
    totalWidth = 120;
  }

  return { bars, totalWidth };
};

// Component hiển thị chiếc vé điện tử kèm mã QR, mã vạch và nút tải PDF
const ElectronicTicket = ({ booking, onDownloadPdf }) => {
  if (!booking) {
    return null;
  }

  // Bước 1: Chuẩn bị danh sách ghế, mã đặt vé 6 số và tổng tiền
  const seatCodes = getSeatCodeList(booking.seats);
  const hasVipSeat = checkHasVipSeat(booking.seatDetails);

  let shortBookingCode = booking.shortCode || '';
  if (!shortBookingCode) {
    const rawCode = String(booking.bookingCode || booking.id || '');
    const digitsOnly = rawCode.replace(/\D/g, '');
    shortBookingCode = digitsOnly.slice(-6) || '892401';
  }

  const showtimeText = booking.startTime || booking.time || '--:--';

  let totalAmount = 0;
  if (booking.totalPrice !== undefined) {
    totalAmount = Number(booking.totalPrice);
  } else if (booking.totalAmount !== undefined) {
    totalAmount = Number(booking.totalAmount);
  }

  let combos = [];
  if (Array.isArray(booking.combos)) {
    combos = booking.combos;
  }

  // Bước 2: Tạo chuỗi mã vạch và dữ liệu JSON nhúng bên trong mã QR
  const barcodeText = `PTIT-TKT-${shortBookingCode}-HD`;
  const barcodeData = createBarcodeBars(barcodeText);

  const qrContent = JSON.stringify({
    code: booking.bookingCode || booking.id,
    ticket: shortBookingCode,
    movie: booking.movieTitle || '',
    room: booking.roomName || '',
    date: booking.date || '',
    time: showtimeText,
    seats: seatCodes,
  });

  // Bước 3: Xử lý bấm nút "Tải vé PDF" (mở hộp thoại in của trình duyệt)
  const handlePrintPdf = () => {
    if (typeof onDownloadPdf === 'function') {
      onDownloadPdf();
      return;
    }
    window.print();
  };

  // Chuẩn bị các chuỗi hiển thị cho gọn gàng trong JSX
  let seatTitleLabel = 'GHẾ NGỒI';
  if (hasVipSeat) {
    seatTitleLabel = 'GHẾ NGỒI VIP';
  }

  let seatCodesText = '--';
  if (seatCodes.length > 0) {
    seatCodesText = seatCodes.join(', ');
  }

  let statusLabel = 'Đã xác nhận';
  if (booking.status === 'cancelled') {
    statusLabel = 'Đã hủy';
  }

  const comboText = combos
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(' • ');

  const discountAmount = Number(booking.discountAmount) || 0;

  return (
    <article className={styles.ticketCard} aria-label="Vé điện tử PTIT Cinema">
      <div className={styles.topAccentBar} aria-hidden="true" />

      <div className={styles.upperSection}>
        <div className={styles.brandHeader}>
          <span className={styles.brandDot} aria-hidden="true" />
          <span className={styles.brandLabel}>PTIT CINEMA CINEPHILE LOUNGE</span>
        </div>

        <div className={styles.movieBlock}>
          <div className={styles.posterBox}>
            {booking.posterUrl ? (
              <img
                src={booking.posterUrl}
                alt={booking.movieTitle || 'Poster phim'}
                className={styles.posterImg}
              />
            ) : (
              <div className={styles.posterFallback}>PTIT</div>
            )}

            {booking.ageRating && (
              <span className={styles.ageBadge}>{booking.ageRating}</span>
            )}
          </div>

          <div className={styles.movieInfo}>
            <h2 className={styles.movieTitle}>
              {booking.movieTitle || 'Phim chiếu rạp PTIT Cinema'}
            </h2>

            {booking.originalTitle && (
              <p className={styles.originalTitle}>{booking.originalTitle}</p>
            )}

            <p className={styles.cinemaLocation}>
              <MapPin size={14} aria-hidden="true" />
              <span>PTIT Cinema Hà Đông (Trụ sở chính)</span>
            </p>
          </div>
        </div>


        <div className={styles.infoGrid}>
          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>PHÒNG CHIẾU</span>
            <strong className={styles.tileValue}>
              {booking.roomName || 'Phòng 01'}
            </strong>
            <span className={styles.tileSubAccent}>PTIT Digital</span>
          </div>

          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>{seatTitleLabel}</span>
            <strong className={styles.tileValueAccent}>{seatCodesText}</strong>
            <span className={styles.tileSubMuted}>
              {seatCodes.length} ghế đã chọn
            </span>
          </div>

          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>THỜI GIAN</span>
            <strong className={styles.tileValue}>{showtimeText}</strong>
            <span className={styles.tileSubMuted}>
              {formatVietnameseDate(booking.date)}
            </span>
          </div>

          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>MÃ ĐẶT VÉ</span>
            <strong className={styles.tileValue}>{shortBookingCode}</strong>
            <span className={styles.tileSubSuccess}>{statusLabel}</span>
          </div>
        </div>

   
        {combos.length > 0 && (
          <div className={styles.comboSummary}>
            <span className={styles.comboLabel}>Bắp & Nước:</span>
            <span className={styles.comboItems}>{comboText}</span>
          </div>
        )}

      
        <div className={styles.totalLine}>
          <span className={styles.totalLabel}>Tổng thanh toán:</span>
          <strong className={styles.totalValue}>
            {totalAmount.toLocaleString('vi-VN')}đ
          </strong>

          {booking.promoCode && discountAmount > 0 && (
            <span className={styles.promoTag}>
              Mã {booking.promoCode} (-{discountAmount.toLocaleString('vi-VN')}đ)
            </span>
          )}
        </div>
      </div>

    
      <div className={styles.tearDivider} aria-hidden="true">
        <span className={styles.notchLeft} />
        <span className={styles.dashedLine} />
        <span className={styles.notchRight} />
      </div>

   
      <div className={styles.lowerSection}>
        <div className={styles.qrFrame}>
          <span
            className={`${styles.corner} ${styles.cornerTL}`}
            aria-hidden="true"
          />
          <span
            className={`${styles.corner} ${styles.cornerTR}`}
            aria-hidden="true"
          />
          <span
            className={`${styles.corner} ${styles.cornerBL}`}
            aria-hidden="true"
          />
          <span
            className={`${styles.corner} ${styles.cornerBR}`}
            aria-hidden="true"
          />

          <div className={styles.qrInner}>
            <QRCodeSVG
              value={qrContent}
              size={176}
              level="H"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
            <span className={styles.qrCenterLogo} aria-hidden="true">
              P
            </span>
          </div>
        </div>

        <p className={styles.qrGuide}>
          Quét mã QR tại cổng kiểm soát hoặc Kiosk tự phục vụ để vào phòng chiếu
          mà không cần in vé giấy.
        </p>

        {/* Mã vạch SVG */}
        <div
          className={styles.barcodeBox}
          aria-label={`Mã vạch vé ${barcodeText}`}
        >
          <svg
            viewBox={`0 0 ${barcodeData.totalWidth} 36`}
            className={styles.barcodeSvg}
            role="img"
            aria-hidden="true"
          >
            {barcodeData.bars.map((bar) => (
              <rect
                key={bar.id}
                x={bar.x}
                y={0}
                width={bar.width}
                height={36}
                fill="currentColor"
              />
            ))}
          </svg>
          <span className={styles.barcodeCaption}>{barcodeText}</span>
        </div>

        <button
          type="button"
          className={styles.downloadBtn}
          onClick={handlePrintPdf}
        >
          <Download size={16} aria-hidden="true" />
          <span>Tải vé PDF</span>
        </button>
      </div>
    </article>
  );
};

export default ElectronicTicket;