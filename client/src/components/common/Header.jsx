import { NavLink, Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  const getLinkClass = ({ isActive }) => (isActive ? styles.activeLink : styles.link);

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>PTIT Cinema</Link>
      <nav className={styles.nav}>
        <NavLink to="/" className={getLinkClass}>Trang chủ</NavLink>
        <NavLink to="/my-tickets" className={getLinkClass}>Vé của tôi</NavLink>
        <NavLink to="/admin/movies" className={getLinkClass}>Quản trị</NavLink>
        <NavLink to="/login" className={getLinkClass}>Đăng nhập</NavLink>
        <NavLink to="/register" className={getLinkClass}>Đăng ký</NavLink>
      </nav>
    </header>
  );
};

export default Header;