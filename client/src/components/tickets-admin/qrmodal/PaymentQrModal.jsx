import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, QrCode, X } from 'lucide-react';
import styles from './PaymentQrModal.module.css';

// Component Popup hiển thị mã QR thanh toán giả lập trước khi chốt đơn
const PaymentQrModal = ({
  isOpen = false,
  paymentMethod = 'MoMo',
  totalPrice = 0,
  customerPhone = '',
  isSubmitting = false,
  onConfirmPaid,
  onClose,
}) => {
  // Nếu chưa mở thì không vẽ gì lên màn hình
  if (!isOpen) {
    return null;
  }

  // Tạo nội dung chuyển khoản ngắn gọn
  const cleanPhone = String(customerPhone || '').trim();
  const transferContent = cleanPhone
    ? `PTIT CINEMA ${cleanPhone}`
    : 'PTIT CINEMA DAT VE';

  // Chuỗi dữ liệu mã hóa vào mã QR
  const qrPayload = JSON.stringify({
    merchant: 'PTIT CINEMA',
    method: paymentMethod,
    amount: Number(totalPrice) || 0,
    note: transferContent,
  });

  // Đóng popup khi bấm nền mờ (chặn đóng nếu đang gửi API)
  const handleBackdropClick = () => {
    if (!isSubmitting && typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-qr-title"
    >
      <div
        className={styles.modalBox}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Tiêu đề popup */}
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <span className={styles.iconBadge} aria-hidden="true">
              <QrCode size={18} />
            </span>
            <h2 id="payment-qr-title" className={styles.title}>
              Quét mã QR thanh toán
            </h2>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ thanh toán"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Nội dung chính: Phương thức + Mã QR + Thông tin số tiền */}
        <div className={styles.body}>
          <span className={styles.methodBadge}>
            Phương thức: <strong>{paymentMethod}</strong>
          </span>

          {/* Khung mã QR giữ nền trắng cố định kể cả ở Dark Mode để máy quét đọc được */}
          <div className={styles.qrFrame}>
            <QRCodeSVG
              value={qrPayload}
              size={190}
              level="M"
              includeMargin={false}
            />
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Số tiền cần thanh toán</span>
              <strong className={styles.amountText}>
                {(Number(totalPrice) || 0).toLocaleString('vi-VN')}đ
              </strong>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Nội dung chuyển khoản</span>
              <strong className={styles.memoText}>{transferContent}</strong>
            </div>
          </div>

          <p className={styles.noteText}>
            Mở ứng dụng {paymentMethod} để quét mã. Sau khi chuyển khoản xong,
            bấm nút xác nhận bên dưới để xuất vé điện tử.
          </p>
        </div>

        {/* Hàng nút bấm Hủy và Xác nhận đã thanh toán */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy / Quay lại
          </button>

          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirmPaid}
            disabled={isSubmitting}
          >
            <CheckCircle2 size={17} aria-hidden="true" />
            <span>
              {isSubmitting ? 'Đang xuất vé...' : 'Tôi đã thanh toán'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentQrModal;