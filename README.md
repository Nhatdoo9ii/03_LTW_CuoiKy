# 🎬 PTIT Cinema — Hệ thống Đặt vé Xem phim Trực tuyến

Ứng dụng web full-stack quản lý rạp chiếu phim và đặt vé xem phim trực tuyến xây dựng theo kiến trúc **MERN Stack** (MongoDB, Express.js, React, Node.js). Dự án phục vụ đồ án cuối kỳ môn Lập trình Web (Nhóm 03), đáp ứng đầy đủ 3 luồng vai trò: **Khách (Guest)**, **Thành viên (Member)** và **Quản trị viên (Admin)**.

---

## Tính năng chính

### 🌐 Dành cho Khách (Guest)
* **Trang chủ & Lịch chiếu (`/` & `/upcoming`):**
  * Chuyển đổi tab **Phim Đang Chiếu** / **Phim Sắp Chiếu**.
  * Tìm kiếm phim theo tên (`useDebounce` 400ms + `$regex` ở server), lọc theo thể loại (`$in`), lọc theo ngày chiếu và phân trang ở server.
* **Chi tiết phim (`/movies/:id`):**
  * Xem thông tin chi tiết phim, mở modal **Xem Trailer YouTube**, xem danh sách suất chiếu thực tế theo từng ngày từ MongoDB.
* **Khuyến mãi & Giao diện Sáng/Tối (`/promotion`):**
  * Chuyển đổi **Dark / Light Mode** toàn hệ thống qua `ThemeContext` (lưu `localStorage`).

### 👤 Dành cho Thành viên (Member)
* **Xác thực & Bảo vệ Route (`/login`, `/register`):**
  * Đăng ký / Đăng nhập bằng **JWT** (có thời hạn `7d`) + mật khẩu băm `bcryptjs`.
  * Tự động nhận diện sinh viên PTIT qua đuôi email `@stu.ptit.edu.vn` (`isStudent: true`).
* **Chọn ghế trực quan (`/booking/:showtimeId`):**
  * Vẽ sơ đồ ghế động theo cấu hình phòng (`totalRows`, `seatsPerRow`, `vipRows`) và ghế đã bán (`bookedSeats`).
  * Quản lý ghế đang chọn bằng **Redux Toolkit** (tối đa **8 ghế / lần đặt**), tính tổng tiền bằng `useMemo`.
  * Đồng hồ đếm ngược **05:00** giữ ghế (`setInterval` + `clearInterval` cleanup); hết giờ tự động hủy chọn ghế và quay về trang phim bằng `useNavigate`.
* **Xác nhận & Thanh toán (`/checkout`):**
  * Chọn Combo bắp nước, áp dụng mã ưu đãi **`PTIT35`** (giảm 35% tiền vé, chỉ áp dụng cho tài khoản sinh viên PTIT).
  * Hỗ trợ 3 phương thức thanh toán: **MoMo**, **Ngân hàng nội địa** (popup quét mã QR giả lập) và **Tại quầy**.
  * Chống đặt trùng ghế ở server (**`409 Conflict`**) trả kèm `conflictSeats`.
* **Vé điện tử & Lịch sử vé (`/booking-success/:bookingId`, `/my-tickets`):**
  * Hiển thị vé điện tử kèm **mã QR Code** (`qrcode.react`) và hỗ trợ in/xuất PDF.
  * Xem lịch sử vé, lọc theo trạng thái, **hủy vé trước giờ chiếu ít nhất 2 tiếng** (tự động hoàn trả ghế vào suất chiếu).

### 🛠️ Dành cho Quản trị viên (Admin)
* **Quản lý Phim (`/admin/movies`):** Full CRUD (`/api/movies`), form controlled có kiểm tra lỗi hiển thị inline, tìm kiếm/lọc/phân trang.
* **Quản lý Phòng chiếu (`/admin/rooms`):** Thêm/sửa/xóa phòng chiếu, bật/tắt trạng thái bảo trì, chặn trùng tên (`409`) và chặn xóa phòng đang có lịch chiếu (`409`).
* **Quản lý Suất chiếu (`/admin/showtimes`):** Tạo/sửa/xóa suất chiếu, tự tính giờ kết thúc và **chặn tạo 2 suất chồng giờ trong cùng phòng (`409 Conflict`)**.
* **Thống kê doanh thu (`/admin/stats`):** Thống kê doanh thu theo phim và theo ngày bằng **MongoDB Aggregation Pipeline** (`$match`, `$lookup`, `$group`, `$sort`), hỗ trợ lọc theo ngày và xuất báo cáo CSV.

---

## 🧰 Công nghệ sử dụng

| Tầng | Công nghệ / Thư viện |
| :--- | :--- |
| **Frontend** | React 19 (Vite 8), React Router v7, Redux Toolkit, Context API, Axios, CSS Modules, Lucide React, `qrcode.react` |
| **Backend** | Node.js (ESM `"type": "module"`), Express 5, Mongoose 9, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv` |
| **Cơ sở dữ liệu** | MongoDB Atlas (5 Collections: `users`, `movies`, `rooms`, `showtimes`, `bookings`) |

---

## 📁 Cấu trúc thư mục dự án

```text
03_LTW_CuoiKy/
├── client/                     # Ứng dụng Frontend (React + Vite, cổng 5173)
│   ├── src/
│   │   ├── components/         # common/, movies/, booking/, tickets-admin/, admin/movies/
│   │   ├── context/            # AuthContext.jsx, ThemeContext.jsx
│   │   ├── hooks/              # useFetch.js, useDebounce.js, useCountdown.js, useLocalStorage.js
│   │   ├── pages/              # public/, member/, admin/
│   │   ├── services/           # movieService.js, roomService.js, showtimeService.js, bookingService.js, ticketService.js
│   │   └── store/              # store.js, bookingSlice.js
│   └── README.md               # Tài liệu chi tiết Frontend
│
├── server/                     # Ứng dụng Backend (Express + MongoDB, cổng 5001)
│   ├── src/
│   │   ├── config/             # db.js (Kết nối MongoDB)
│   │   ├── controllers/        # auth, movie, room, showtime, booking, stats
│   │   ├── middlewares/        # authMiddleware.js (JWT/Role) & errorMiddleware.js
│   │   ├── models/             # User, Movie, Room, Showtime, Booking
│   │   ├── routes/             # authRoutes, movieRoutes, roomRoutes, showtimeRoutes, bookingRoutes, statsRoutes
│   │   ├── seeder.js           # Script nạp dữ liệu mẫu từ mockData.json vào MongoDB
│   │   └── server.js           # Điểm khởi chạy chính Express
│   └── README.md               # Tài liệu chi tiết Backend API
│
└── README.md                   # Tài liệu tổng quan dự án
```

---

## ⚙️ Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu môi trường
* **Node.js** phiên bản `18.x` trở lên (khuyến nghị `20+`)
* **MongoDB** (MongoDB Atlas hoặc MongoDB Local)

### Bước 1: Clone dự án
```bash
git clone <url-repository-cua-nhom>
cd 03_LTW_CuoiKy
```

### Bước 2: Cài đặt, nạp dữ liệu mẫu và chạy Backend (`server/`)
1. Di chuyển vào thư mục `server` và cài thư viện:
   ```bash
   cd server
   npm install
   ```
2. Tạo file `server/.env` (copy từ `server/.env.example`):
   ```env
   PORT=5001
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ptit_cinema?retryWrites=true&w=majority
   JWT_SECRET=ptit_cinema_super_secret_jwt_key_2026
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:5173
   ```
3. Nạp dữ liệu mẫu ban đầu vào MongoDB (tùy chọn khi khởi tạo DB mới hoặc reset dữ liệu):
   ```bash
   npm run seed
   ```
4. Khởi chạy server phát triển:
   ```bash
   npm run dev
   ```
   Kiểm tra hoạt động tại: `http://localhost:5001/api/health`

### Bước 3: Cài đặt và chạy Frontend (`client/`)
1. Mở terminal mới, di chuyển vào thư mục `client` và cài thư viện:
   ```bash
   cd client
   npm install
   ```
2. Kiểm tra file `client/.env` (đã có sẵn):
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```
3. Khởi chạy ứng dụng web:
   ```bash
   npm run dev
   ```
   Truy cập ứng dụng tại: `http://localhost:5173`

---

## 🔑 Tài khoản Demo (Mật khẩu mặc định: `123456`)

| Vai trò | Email | Quyền hạn |
| :--- | :--- | :--- |
| **Admin** | `admin@ptit.edu.vn` | Quản lý Phim, Phòng chiếu, Suất chiếu, Thống kê doanh thu |
| **Sinh viên PTIT (Member)** | `nhatddm.b24cn123@stu.ptit.edu.vn` | Đặt vé, áp mã giảm giá 35% (`PTIT35`), xem & hủy vé |

---

## Quy ước mã phản hồi HTTP

| Mã HTTP | Ý nghĩa | Trường hợp tiêu biểu trong hệ thống |
| :--- | :--- | :--- |
| `200 OK` | Thành công | Lấy danh sách, xem chi tiết, cập nhật, xóa, hủy vé thành công |
| `201 Created` | Tạo mới thành công | Đăng ký, thêm phim/phòng/suất chiếu, tạo đơn đặt vé mới |
| `400 Bad Request` | Dữ liệu không hợp lệ | ID sai `ObjectId`, thiếu trường bắt buộc, hủy vé dưới 2h, quá 8 ghế |
| `401 Unauthorized` | Chưa xác thực | Thiếu token hoặc JWT không hợp lệ / hết hạn |
| `403 Forbidden` | Không đủ quyền | `member` gọi API `admin`, xem/hủy vé người khác, không phải SV dùng `PTIT35` |
| `404 Not Found` | Không tìm thấy | Sai đường dẫn API hoặc không tìm thấy bản ghi theo ID |
| `409 Conflict` | Xung đột nghiệp vụ | Trùng email, trùng tên phòng, trùng giờ chiếu hoặc đặt trùng ghế |

---

## 📖 Tài liệu chi tiết từng phân hệ
* Xem chi tiết API & Cơ sở dữ liệu tại: [`server/README.md`](./server/README.md)
* Xem chi tiết UI, Redux, Context & Custom Hooks tại: [`client/README.md`](./client/README.md)
