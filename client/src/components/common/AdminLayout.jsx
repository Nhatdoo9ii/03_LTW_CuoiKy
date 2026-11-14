import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSideBar';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  return (
    <div className={styles.container}>
      <AdminSidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;