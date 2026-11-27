import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoPtit from '../../assets/logo-ptit.png';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Nếu đã đăng nhập rồi thì tự đẩy về trang chủ (không cho vào lại trang login)
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/movies' : '/'} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Xóa thông báo lỗi của ô đang nhập
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  // Kiểm tra dữ liệu đầu vào trước khi submit
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email của bạn';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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
      const loggedInUser = await login(formData.email, formData.password);
      navigate(loggedInUser.role === 'admin' ? '/admin/movies' : '/', {
        replace: true,
      });
    } catch (err) {
      setServerError(err.message || 'Đăng nhập thất bại, vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Điền nhanh tài khoản mẫu để test cho lẹ
  const fillDemoAccount = (demoEmail) => {
    setFormData({
      email: demoEmail,
      password: '123456',
    });
    setErrors({});
    setServerError('');
  };

  return (
    <section className={styles.authWrapper}>
      <div className={styles.authCard}>
        {/* Phần tiêu đề & logo */}
        <div className={styles.headerBox}>
          <img src={logoPtit} alt="PTIT Cinema" className={styles.logo} />
          <h1 className={styles.title}>Đăng nhập PTIT Cinema</h1>
          <p className={styles.subtitle}>
            Chào mừng bạn quay lại! Đăng nhập để đặt vé và nhận ưu đãi sinh viên.
          </p>
        </div>

        {/* Thông báo lỗi chung từ hệ thống */}
        {serverError && (
          <div className={styles.errorAlert} role="alert">
            {serverError}
          </div>
        )}

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email đăng nhập
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="VD: nhatddm.b24cn123@stu.ptit.edu.vn"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Mật khẩu
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              />
              <button
                type="button"
                className={styles.togglePwdBtn}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Khu vực bấm nhanh tài khoản mẫu để test */}
        <div className={styles.demoBox}>
          <span className={styles.demoTitle}>Tài khoản dùng thử nhanh (MK: 123456):</span>
          <div className={styles.demoActions}>
            <button
              type="button"
              onClick={() => fillDemoAccount('nhatddm.b24cn123@stu.ptit.edu.vn')}
              className={styles.demoBtn}
            >
              Sinh viên PTIT
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@ptit.edu.vn')}
              className={styles.demoBtn}
            >
              Quản trị viên (Admin)
            </button>
          </div>
        </div>

        {/* Chuyển sang trang đăng ký */}
        <p className={styles.switchText}>
          Chưa có tài khoản thành viên?{' '}
          <Link to="/register" className={styles.switchLink}>
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;