# 🎬 PTIT Cinema — Hệ thống Đặt vé Xem phim Trực tuyến

Ứng dụng web quản lý rạp chiếu phim và đặt vé xem phim trực tuyến xây dựng theo kiến trúc **MERN Stack** (MongoDB, Express.js, ReactJS, Node.js). Dự án phục vụ đồ án cuối kỳ, bao gồm đầy đủ luồng trải nghiệm của khách hàng (chọn phim, chọn ghế theo sơ đồ động, thanh toán QR giả lập, xuất vé điện tử) và hệ thống quản trị dành cho Admin (quản lý phòng chiếu, xếp lịch suất chiếu chống trùng giờ).

---

## Tính năng chính

### 👤 Dành cho Khách hàng (Member)
* **Xem lịch chiếu & Chi tiết phim:** Tra cứu thông tin phim, thời lượng, phân loại độ tuổi và danh sách suất chiếu thực tế từ MongoDB.
* **Chọn ghế trực quan (`/booking/:showtimeId`):**
  * Tự động vẽ sơ đồ ghế động dựa trên cấu hình phòng chiếu (`totalRows`, `seatsPerRow`, `vipRows`) và danh sách ghế đã bán (`bookedSeats`).
  * Giới hạn tối đa **8 ghế / lần đặt**, hỗ trợ nút làm mới trạng thái ghế từ máy chủ.
  * Đồng hồ đếm ngược **05:00** giữ ghế xuyên suốt quá trình đặt vé.
  * Tự động áp dụng mã ưu đãi sinh viên **`PTIT35`** (giảm 35% tiền vé) cho tài khoản thuộc hệ thống PTIT (`@stu.ptit.edu.vn`, `@ptit.edu.vn`).
* **Xác nhận & Thanh toán (`/checkout`):**
  * Kiểm tra hợp lệ thông tin người nhận vé (Họ tên, SĐT 10 số, Email).
  * Chọn thêm Combo bắp nước, áp dụng/đổi mã khuyến mãi và tính toán hóa đơn tự động.
  * Hỗ trợ 3 phương thức thanh toán: **MoMo**, **Ngân hàng nội địa** (hiển thị popup quét mã QR thanh toán giả lập) và **Tại quầy**.
  * Xử lý xung đột trùng ghế (`409 Conflict`) và hướng dẫn quay lại chọn ghế khác.
* **Vé điện tử (`/booking-success/:bookingId`):**
  * Hiển thị thông tin vé, mã QR (`qrcode.react`) và mã vạch SVG.
  * Hỗ trợ in / xuất vé ra file **PDF** sạch đẹp (`window.print()` kết hợp `@media print`).
  * Bảo vệ quyền riêng tư: chỉ chủ sở hữu vé hoặc Admin mới có quyền xem vé (`403 Forbidden`).

### 🛠️ Dành cho Quản trị viên (Admin)
* **Quản lý Phòng chiếu (`/admin/rooms`):**
  * Giao diện lưới thẻ 2 cột (Card Grid) kèm 4 chỉ số thống kê tổng quan.
  * Thêm, sửa cấu hình phòng (số hàng `1–26`, số ghế/hàng `1–30`, chọn hàng VIP động theo số hàng).
  * Chuyển nhanh trạng thái **Hoạt động / Bảo trì** trực tiếp trên thẻ phòng.
  * Kiểm tra trùng tên phòng không phân biệt hoa thường (`409`) và chặn xóa phòng đang có lịch chiếu (`409`).
* **Quản lý Suất chiếu (`/admin/showtimes`):**
  * Nối trực tiếp 3 nguồn dữ liệu thật: Phim, Phòng chiếu và Suất chiếu.
  * Tự động tính giờ kết thúc dự kiến dựa theo thời lượng phim (`startTime + movie.duration`).
  * **Thuật toán chặn trùng giờ chiếu (`409 Conflict`)** trong cùng một phòng và cùng ngày.
  * Chặn xếp lịch vào các phòng đang bảo trì (`isActive: false`).
  * Lọc theo tab ngày, tìm kiếm có `debounce`, phân trang và hiển thị thanh tiến độ tỷ lệ lấp đầy ghế.

---

## 🧰 Công nghệ sử dụng

| Tầng | Công nghệ / Thư viện |
| :--- | :--- |
| **Frontend** | React 18 (Vite), React Router DOM, Redux Toolkit, Axios, CSS Modules, Lucide React, `qrcode.react` |
| **Backend** | Node.js (ESM), Express.js, Mongoose, JSON Web Token (`jsonwebtoken`), CORS, Dotenv |
| **Cơ sở dữ liệu** | MongoDB |

---

## 📁 Cấu trúc thư mục dự án

```text
03_LTW_CuoiKy/
├── client/                     # Ứng dụng Frontend (React + Vite, cổng 5173)
│   ├── src/
│   │   ├── components/         # Các component dùng chung (Booking, Admin, Pagination...)
│   │   ├── context/            # AuthContext (xác thực người dùng)
│   │   ├── hooks/              # Custom hooks (useCountdown, useDebounce, useLocalStorage)
│   │   ├── pages/              # Trang Member & Admin
│   │   ├── services/           # Tầng gọi API Axios (roomService, showtimeService, bookingService...)
│   │   └── store/              # Redux Toolkit (store.js, bookingSlice.js)
│   └── README.md               # Tài liệu chi tiết Frontend
│
├── server/                     # Ứng dụng Backend (Express + MongoDB, cổng 5001)
│   ├── src/
│   │   ├── config/             # Kết nối MongoDB
│   │   ├── controllers/        # Xử lý nghiệp vụ (roomController, showtimeController...)
│   │   ├── middlewares/        # authMiddleware (JWT/Role) & errorMiddleware
│   │   ├── models/             # Mongoose Schemas (Room, Showtime, Movie, User, Booking)
│   │   ├── routes/             # Định tuyến RESTful API
│   │   └── server.js           # Điểm khởi chạy chính
│   └── README.md               # Tài liệu chi tiết Backend API
│
└── README.md                   # Tài liệu tổng quan dự án
```

---

## ⚙️ Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu môi trường
* **Node.js** phiên bản `18.x` trở lên
* **MongoDB** (Local hoặc MongoDB Atlas)

### Bước 1: Clone dự án
```bash
git clone <url-repository-cua-nhom>
cd 03_LTW_CuoiKy
```

### Bước 2: Cài đặt và chạy Backend (`server/`)
1. Di chuyển vào thư mục `server` và cài thư viện:
   ```bash
   cd server
   npm install
   ```
2. Tạo file `.env` trong thư mục `server/` với nội dung mẫu:
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/ptit_cinema
   JWT_SECRET=ptit_cinema_secret_key
   CLIENT_URL=http://localhost:5173
   ```
3. Khởi chạy server phát triển:
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
2. Tạo file `.env` trong thư mục `client/` (tùy chọn, mặc định đã trỏ về cổng `5001`):
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```
3. Khởi chạy ứng dụng web:
   ```bash
   npm run dev
   ```
   Truy cập ứng dụng tại: `http://localhost:5173`

---

## Quy ước mã phản hồi HTTP

| Mã HTTP | Ý nghĩa | Trường hợp tiêu biểu trong hệ thống |
| :--- | :--- | :--- |
| `200 OK` | Thành công | Lấy danh sách, xem chi tiết, cập nhật, xóa thành công |
| `201 Created` | Tạo mới thành công | Tạo phòng chiếu, tạo suất chiếu hoặc tạo đơn đặt vé mới |
| `400 Bad Request` | Dữ liệu không hợp lệ | ID sai định dạng `ObjectId`, giá vé `< 30.000đ`, phòng đang bảo trì |
| `401 Unauthorized` | Chưa xác thực | Thiếu token hoặc JWT token không hợp lệ / hết hạn |
| `403 Forbidden` | Không đủ quyền | Tài khoản `member` gọi API `admin` hoặc xem vé của người khác |
| `404 Not Found` | Không tìm thấy | Sai đường dẫn API hoặc không tìm thấy bản ghi theo ID |
| `409 Conflict` | Xung đột nghiệp vụ | Trùng tên phòng, xóa phòng đang có lịch, trùng giờ chiếu hoặc trùng ghế |

---

## 📖 Tài liệu chi tiết từng phân hệ
* Xem chi tiết API & Cơ sở dữ liệu tại: [`server/README.md`](./server/README.md)
* Xem chi tiết UI, Redux & Custom Hooks tại: [`client/README.md`](./client/README.md)