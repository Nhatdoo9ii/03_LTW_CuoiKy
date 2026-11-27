# ⚙️ PTIT Cinema — Backend API

Dịch vụ RESTful API xây dựng bằng **Node.js (ESM)**, **Express 5** và **MongoDB (Mongoose 9)** chạy mặc định trên cổng **`5001`**.

---

## 📁 Cấu trúc thư mục

```text
server/
├── src/
│   ├── config/
│   │   └── db.js                   # Kết nối MongoDB Atlas / Local
│   ├── controllers/
│   │   ├── authController.js       # Đăng ký, Đăng nhập (JWT), lấy thông tin user (/me)
│   │   ├── movieController.js      # CRUD phim, tìm kiếm $regex, lọc $in, phân trang
│   │   ├── roomController.js       # CRUD phòng chiếu, chặn trùng tên & chặn xóa phòng có lịch
│   │   ├── showtimeController.js   # CRUD suất chiếu, tính endTime & chặn chồng giờ (409)
│   │   ├── bookingController.js    # Đặt vé (chặn trùng ghế 409, QR, PTIT35), lịch sử & hủy vé (>= 2h)
│   │   └── statsController.js      # Thống kê doanh thu theo phim & ngày (Aggregation Pipeline)
│   ├── middlewares/
│   │   ├── authMiddleware.js       # protect (xác thực JWT) và requireRole('admin')
│   │   └── errorMiddleware.js      # notFound (404) và errorHandler tập trung
│   ├── models/
│   │   ├── User.js                 # Schema người dùng (hook băm mật khẩu bcryptjs)
│   │   ├── Movie.js                # Schema phim
│   │   ├── Room.js                 # Schema phòng chiếu
│   │   ├── Showtime.js             # Schema suất chiếu (ref Movie & Room)
│   │   └── Booking.js              # Schema đơn đặt vé (ref User & Showtime)
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── movieRoutes.js          # /api/movies
│   │   ├── roomRoutes.js           # /api/rooms
│   │   ├── showtimeRoutes.js       # /api/showtimes
│   │   ├── bookingRoutes.js        # /api/bookings
│   │   └── statsRoutes.js          # /api/stats
│   ├── seeder.js                   # Script import dữ liệu mẫu từ client/src/data/mockData.json
│   └── server.js                   # Điểm khởi chạy chính của Express
├── .env.example                    # Mẫu biến môi trường
├── .env                            # Biến môi trường thực tế (không commit lên Git)
└── package.json
```

---

## 🔧 Cài đặt & Lệnh chạy

```bash
# Cài đặt dependencies
npm install

# Nạp dữ liệu mẫu ban đầu lên MongoDB
npm run seed

# Chạy chế độ phát triển (tự động reload với nodemon)
npm run dev

# Chạy chế độ sản xuất
npm start
```

### Biến môi trường (`server/.env`)
```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ptit_cinema?retryWrites=true&w=majority
JWT_SECRET=ptit_cinema_super_secret_jwt_key_2026
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

---

## 🗄️ Mô hình dữ liệu (5 Collections MongoDB)

1. **`User` (`users`):** `fullName`, `email` (unique), `phone`, `password` (`select: false`, tự động hash bằng `bcryptjs` trong hook `pre('save')`), `role` (`'member' | 'admin'`), `isStudent`, `avatar`.
2. **`Movie` (`movies`):** `title`, `originalTitle`, `director`, `actors`, `genres` (`[String]`), `duration`, `releaseDate`, `language`, `ageRating`, `rating`, `votes`, `status` (`'now-showing' | 'coming-soon' | 'ended'`), `posterUrl`, `bannerUrl`, `trailerUrl`, `synopsis`.
3. **`Room` (`rooms`):** `name`, `totalRows` (`1–26`), `seatsPerRow` (`1–30`), `vipRows` (`[String]`), `isActive`.
4. **`Showtime` (`showtimes`):** `movieId` (`ref: Movie`), `roomId` (`ref: Room`), `date` (`YYYY-MM-DD`), `startTime` (`HH:mm`), `endTime`, `price`, `vipSurcharge`, `bookedSeats` (`[String]`).
5. **`Booking` (`bookings`):** `bookingCode` (unique), `userId` (`ref: User`), `showtimeId` (`ref: Showtime`), `seats` (`[{ seatId, type, price }]`), `combos`, `originalPrice`, `discountAmount`, `promoCode`, `totalPrice`, `paymentMethod`, `status` (`'confirmed' | 'cancelled'`), `qrCode`.

---

## 🛡️ Bảo mật & Xử lý lỗi

* **`protect` (`authMiddleware.js`):** Đọc token từ `Authorization: Bearer <token>`, xác thực bằng `jwt.verify`, gắn `req.user` (ẩn `password`). Thiếu/sai token trả `401 Unauthorized`.
* **`requireRole('admin')`:** Kiểm tra `req.user.role`. Không đủ quyền trả `403 Forbidden`.
* **`errorHandler` (`errorMiddleware.js`):** Xử lý lỗi tập trung qua `next(error)`, chuẩn hóa `CastError` và `ValidationError` thành `400 Bad Request`.

---

## 📡 Danh sách Endpoints API

### 1. Hệ thống & Xác thực (`/api/health`, `/api/auth`)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Kiểm tra trạng thái hoạt động của server |
| `POST` | `/api/auth/register` | Public | Đăng ký thành viên mới (tự check `@stu.ptit.edu.vn`), trả JWT |
| `POST` | `/api/auth/login` | Public | Đăng nhập bằng email & mật khẩu, trả JWT (`7d`) |
| `GET` | `/api/auth/me` | Private | Lấy thông tin tài khoản hiện tại từ JWT |

### 2. Quản lý Phim (`/api/movies`)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies` | Public | Lấy danh sách phim (`?search=` `$regex`, `?genre=` `$in`, `?status=`, `?date=`, `?page=`, `?limit=`) |
| `GET` | `/api/movies/:id` | Public | Lấy chi tiết phim kèm danh sách suất chiếu đã `.populate('roomId')` |
| `POST` | `/api/movies` | Admin | Thêm phim mới |
| `PUT` | `/api/movies/:id` | Admin | Cập nhật thông tin phim |
| `DELETE` | `/api/movies/:id` | Admin | Xóa phim |

### 3. Quản lý Phòng chiếu (`/api/rooms`)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rooms` | Public | Lấy danh sách phòng (`?search=`, `?isActive=`) |
| `GET` | `/api/rooms/:id` | Public | Lấy chi tiết phòng chiếu |
| `POST` | `/api/rooms` | Admin | Tạo phòng mới, chặn trùng tên (`409`) |
| `PUT` | `/api/rooms/:id` | Admin | Cập nhật phòng chiếu (`$ne` loại trừ chính nó) |
| `DELETE` | `/api/rooms/:id` | Admin | Xóa phòng (chặn xóa nếu đang có suất chiếu `409`) |

### 4. Quản lý Suất chiếu (`/api/showtimes`)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/showtimes` | Public | Lấy danh sách suất chiếu (`?movieId=`, `?roomId=`, `?date=`) |
| `GET` | `/api/showtimes/:id` | Public | Lấy chi tiết suất chiếu, cấu hình phòng & `bookedSeats` |
| `POST` | `/api/showtimes` | Admin | Tạo suất chiếu; chặn phòng bảo trì (`400`); chặn chồng giờ (`409`) |
| `PUT` | `/api/showtimes/:id` | Admin | Cập nhật suất chiếu; kiểm tra chồng giờ (`409`) |
| `DELETE` | `/api/showtimes/:id` | Admin | Xóa suất chiếu |

### 5. Đặt vé & Thống kê (`/api/bookings`, `/api/stats`)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Private | Đặt vé (tối đa 8 ghế, atomic `$nin` chặn trùng ghế `409`, mã `PTIT35` chỉ dành cho SV PTIT, sinh `qrCode`) |
| `GET` | `/api/bookings/my-tickets` | Private | Lấy lịch sử đặt vé của người dùng đang đăng nhập |
| `GET` | `/api/bookings/:id` | Private | Xem chi tiết 1 vé (chỉ chủ vé hoặc Admin `403`) |
| `PATCH` | `/api/bookings/:id/cancel` | Private | Hủy vé (chỉ cho phép trước giờ chiếu `>= 2` tiếng) và `$pull` hoàn ghế |
| `GET` | `/api/stats/revenue` | Admin | Thống kê doanh thu theo phim & theo ngày dùng **Aggregation Pipeline** (`?fromDate=`, `?toDate=`) |
