import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div>
    <h1>404 - Không tìm thấy trang</h1>
    <p>Đường dẫn bạn truy cập không tồn tại.</p>
    <Link to="/">Quay về Trang chủ</Link>
  </div>
);

export default NotFoundPage;