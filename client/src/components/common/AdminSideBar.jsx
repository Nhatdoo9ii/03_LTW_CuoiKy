import { NavLink, Link } from 'react-router-dom';
import styles from './AdminSidebar.module.css';

const AdminSidebar = () => {
  const getLinkClass = ({ isActive }) => (isActive ? styles.activeLink : styles.link);

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.title}>Admin Panel</h3>
      <nav className={styles.nav}>
        <NavLink to="/admin/movies" className={getLinkClass}>Quản lý Phim</NavLink>
        <NavLink to="/admin/rooms" className={getLinkClass}>Quản lý Phòng</NavLink>
        <NavLink to="/admin/showtimes" className={getLinkClass}>Suất chiếu</NavLink>
        <NavLink to="/admin/stats" className={getLinkClass}>Thống kê doanh thu</NavLink>
      </nav>
      <hr className={styles.divider} />
      <Link to="/" className={styles.backLink}>← Về trang khách</Link>
    </aside>
  );
};

export default AdminSidebar;