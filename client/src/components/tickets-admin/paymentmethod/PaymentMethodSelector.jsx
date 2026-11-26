import { CreditCard, Store, Wallet } from 'lucide-react';
import styles from './PaymentMethodSelector.module.css';

// Danh sách 3 phương thức thanh toán giả lập của hệ thống
// eslint-disable-next-line react-refresh/only-export-components
export const PAYMENT_METHODS = [
  {
    id: 'MoMo',
    name: 'Ví điện tử MoMo',
    description:
      'Quét mã QR qua ứng dụng MoMo để thanh toán tức thì, bảo mật và hưởng hoàn tiền trực tiếp vào tài khoản.',
    iconType: 'momo',
  },
  {
    id: 'Ngân hàng nội địa',
    name: 'Thẻ ngân hàng nội địa / Quốc tế',
    description:
      'Hỗ trợ ATM nội địa, Napas, thẻ Visa, Mastercard, JCB qua cổng thanh toán bảo mật OnePay / VNPay.',
    iconType: 'card',
  },
  {
    id: 'Tại quầy',
    name: 'Thanh toán tại quầy vé',
    description:
      'Vui lòng xuất trình mã đặt chỗ trước giờ chiếu ít nhất 30 phút tại quầy vé PTIT Cinema Hà Đông.',
    iconType: 'counter',
  },
];

// Hàm phụ: hiển thị biểu tượng tương ứng cho từng phương thức thanh toán
const renderMethodIcon = (iconType, isSelected) => {
  if (iconType === 'momo') {
    return (
      <span
        className={`${styles.iconBox} ${styles.momoBadge}`}
        aria-hidden="true"
      >
        M
      </span>
    );
  }

  let boxClassName = styles.iconBox;
  if (isSelected) {
    boxClassName = `${styles.iconBox} ${styles.iconActive}`;
  }

  if (iconType === 'card') {
    return (
      <span className={boxClassName} aria-hidden="true">
        <CreditCard size={18} />
      </span>
    );
  }

  return (
    <span className={boxClassName} aria-hidden="true">
      <Store size={18} />
    </span>
  );
};

// Component cho phép người dùng chọn 1 trong 3 hình thức thanh toán
const PaymentMethodSelector = ({ selectedMethod, onSelectMethod }) => {
  return (
    <section className={styles.card} aria-labelledby="payment-method-heading">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <Wallet size={18} className={styles.titleIcon} aria-hidden="true" />
          <h2 id="payment-method-heading" className={styles.title}>
            Phương thức thanh toán
          </h2>
        </div>
        <span className={styles.helperText}>Chọn 1 phương thức</span>
      </div>

      <div
        className={styles.optionsList}
        role="radiogroup"
        aria-label="Phương thức thanh toán"
      >
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;

          let cardClassName = styles.optionCard;
          let radioClassName = styles.radioVisual;

          if (isSelected) {
            cardClassName = `${styles.optionCard} ${styles.optionCardSelected}`;
            radioClassName = `${styles.radioVisual} ${styles.radioVisualSelected}`;
          }

          return (
            <label key={method.id} className={cardClassName}>
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={isSelected}
                onChange={() => onSelectMethod(method.id)}
                className={styles.radioInput}
              />

              <span className={radioClassName} aria-hidden="true">
                {isSelected && <span className={styles.radioDot} />}
              </span>

              {renderMethodIcon(method.iconType, isSelected)}

              <div className={styles.optionContent}>
                <strong className={styles.optionTitle}>{method.name}</strong>
                <p className={styles.optionDesc}>{method.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
};

export default PaymentMethodSelector;