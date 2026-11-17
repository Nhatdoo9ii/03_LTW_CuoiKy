import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import logoPtit from '../../assets/logo-ptit.png';
import styles from './Header.module.css';

function Header() {
  const navigate = useNavigate();

  // State quản lý chế độ Sáng / Tối
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('ptit_theme') === 'dark';
  });

  // State quản lý menu mobile và dropdown user
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Giả lập lấy thông tin user từ localStorage (sau này thay bằng Redux/AuthContext)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Đồng bộ theme lên thẻ <html> mỗi khi bấm nút Sáng/Tối
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ptit_theme', theme);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className={`${styles.header} ${isDarkMode ? styles.headerDark : ''}`}>
      <div className={styles.container}>
        {/* 1. CỤM LOGO BÊN TRÁI */}
        <Link to="/" className={styles.brand} onClick={() => setIsMobileMenuOpen(false)}>
          <img src={logoPtit} alt="PTIT Logo" className={styles.logoImg} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>PTIT CINEMA</span>
            <span className={styles.brandSubtitle}>CINEPHILE LOUNGE</span>
          </div>
        </Link>

        {/* 2. MENU ĐIỀU HƯỚNG Ở GIỮA */}
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Phim đang chiếu
          </NavLink>

          <NavLink
            to="/upcoming"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Phim sắp chiếu
          </NavLink>

          <NavLink
            to="/promotion"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Khuyến mãi
          </NavLink>

          {user && (
            <NavLink
              to="/my-tickets"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeLink : ''}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Vé của tôi
            </NavLink>
          )}
        </nav>

        {/* 3. CỤM HÀNH ĐỘNG BÊN PHẢI (SÁNG/TỐI + TÀI KHOẢN) */}
        <div className={styles.actions}>
          {/* Nút chuyển Sáng / Tối */}
          <button
            type="button"
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              /* Icon Mặt trời (Light mode) */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Icon Mặt trăng (Dark mode) */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {!user ? (
            /* Trạng thái CHƯA ĐĂNG NHẬP */
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.loginBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Đăng nhập</span>
              </Link>
              <Link to="/register" className={styles.registerBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>Đăng ký</span>
              </Link>
            </div>
          ) : (
            /* Trạng thái ĐÃ ĐĂNG NHẬP */
            <div className={styles.userArea}>
              <button type="button" className={styles.notifyBtn} title="Thông báo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className={styles.notifyDot}></span>
              </button>

              <div className={styles.profileWrapper}>
                <button
                  type="button"
                  className={styles.profileTrigger}
                  onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                >
                  <div className={styles.avatar}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.fullName || 'Nguyễn Văn A'}</span>
                    <span className={styles.userRole}>
                      {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên PTIT'}
                    </span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isUserDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link
                      to="/my-tickets"
                      className={styles.dropdownItem}
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Vé của tôi
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin/movies"
                        className={styles.dropdownItem}
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Trang quản trị (Admin)
                      </Link>
                    )}
                    <hr className={styles.dropdownDivider} />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nút Hamburger cho Mobile */}
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Mở menu"
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;