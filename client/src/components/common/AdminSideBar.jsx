import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoPtit from '../../assets/logo-ptit.png';
import styles from './AdminSidebar.module.css';

function AdminSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Lấy thông tin Admin hiện tại từ AuthContext
  const adminUser = user || {
    fullName: 'Admin Cinephile',
    role: 'Super Administrator',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      {/* 1. PHẦN THƯƠNG HIỆU ADMIN */}
      <div className={styles.topSection}>
        <Link to="/" className={styles.brand} title="Về trang chủ khách hàng">
          <img src={logoPtit} alt="PTIT Logo" className={styles.logoImg} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>PTIT CINEMA</span>
            <span className={styles.brandBadge}>ADMIN PORTAL</span>
          </div>
        </Link>

        {/* 2. MENU ĐIỀU HƯỚNG QUẢN LÝ */}
        <div className={styles.menuGroup}>
          <span className={styles.menuLabel}>QUẢN LÝ ĐIỀU HÀNH</span>

          <nav className={styles.navList}>
            <NavLink
              to="/admin/movies"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeItem : ''}`
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
              <span>Quản lý Phim</span>
            </NavLink>

            <NavLink
              to="/admin/rooms"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeItem : ''}`
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
                <path d="M5 18v2" />
                <path d="M19 18v2" />
              </svg>
              <span>Quản lý Phòng rạp</span>
            </NavLink>

            <NavLink
              to="/admin/showtimes"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeItem : ''}`
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Quản lý Suất chiếu</span>
            </NavLink>

            <NavLink
              to="/admin/stats"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeItem : ''}`
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Thống kê doanh thu</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* 3. THÔNG TIN ADMIN & ĐĂNG XUẤT Ở ĐÁY SIDEBAR */}
      <div className={styles.bottomSection}>
        <div className={styles.adminProfile}>
          <div className={styles.adminAvatar}>
            {adminUser.fullName ? adminUser.fullName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className={styles.adminInfo}>
            <span className={styles.adminName}>
              {adminUser.fullName || 'Admin Cinephile'}
            </span>
            <span className={styles.adminRole}>Super Administrator</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
          title="Đăng xuất khỏi trang quản trị"
          aria-label="Đăng xuất"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;