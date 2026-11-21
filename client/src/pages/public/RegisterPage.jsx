import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoPtit from '../../assets/logo-ptit.png';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user, register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State quản lý màn hình thông báo sau khi đăng ký thành công
  const [registeredUser, setRegisteredUser] = useState(null);
  const [countdown, setCountdown] = useState(3);

  // Đếm ngược 3 giây rồi tự chuyển sang trang đăng nhập 
  useEffect(() => {
    if (!registeredUser) return;

    if (countdown <= 0) {
      navigate('/login');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [registeredUser, countdown, navigate]);

  // Đã đăng nhập rồi thì không cho vào trang đăng ký nữa
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/movies' : '/'} replace />;
  }

  const isPtitStudent = formData.email.trim().toLowerCase().endsWith('@stu.ptit.edu.vn');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  // Kiểm tra hợp lệ các trường nhập liệu
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên quá ngắn';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Mật khẩu nhập lại không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const createdUser = await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      // Chuyển sang giao diện chúc mừng thay vì dùng alert mặc định
      setRegisteredUser(createdUser);
    } catch (err) {
      setServerError(err.message || 'Đăng ký thất bại, vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.authWrapper}>
      <div className={styles.authCard}>
        {registeredUser ? (
          /* Giao diện thông báo đăng ký thành công */
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Đăng ký thành công!</h2>
            <p className={styles.successDesc}>
              Chào mừng <strong>{registeredUser.fullName}</strong> đến với PTIT Cinema.
            </p>

            {registeredUser.isStudent && (
              <div className={styles.studentSuccessTag}>
                🎓 Tài khoản Sinh viên PTIT — Đã kích hoạt ưu đãi vé 55.000đ
              </div>
            )}

            <p className={styles.redirectNote}>
              Tự động chuyển sang trang đăng nhập sau <strong>{countdown}s</strong>...
            </p>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className={styles.submitBtn}
              style={{ width: '100%' }}
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : (
          /* Giao diện Form đăng ký */
          <>
            <div className={styles.headerBox}>
              <img src={logoPtit} alt="PTIT Cinema" className={styles.logo} />
              <h1 className={styles.title}>Đăng ký thành viên</h1>
              <p className={styles.subtitle}>
                Tạo tài khoản PTIT Cinema để đặt vé online nhanh chóng và tích điểm.
              </p>
            </div>

            {serverError && (
              <div className={styles.errorAlert} role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="VD: Trần Bảo Long"
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                />
                {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="VD: longtb.b25cc130@stu.ptit.edu.vn"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                />
                {isPtitStudent && (
                  <span className={styles.studentBadge}>
                    ✓ Nhận diện email sinh viên PTIT (Áp dụng ưu đãi vé đồng giá 55k)
                  </span>
                )}
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="VD: 0912345678"
                  className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                />
                {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
              </div>

              <div className={styles.rowTwoCols}>
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>
                    Mật khẩu
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Ít nhất 6 ký tự"
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  />
                  {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Nhập lại mật khẩu
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  />
                  {errors.confirmPassword && (
                    <span className={styles.errorText}>{errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
              </button>
            </form>

            <p className={styles.switchText}>
              Đã có tài khoản?{' '}
              <Link to="/login" className={styles.switchLink}>
                Đăng nhập ngay
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default RegisterPage;