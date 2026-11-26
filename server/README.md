# ⚙️ PTIT Cinema — Backend API 

Dịch vụ RESTful API xây dựng bằng **Node.js**, **Express.js** và **MongoDB (Mongoose)** chạy mặc định trên cổng **`5001`**.

---

## 📁 Cấu trúc thư mục

```text
server/
├── src/
│   ├── config/
│   │   └── db.js                   # Hàm connectDB() kết nối MongoDB
│   ├── controllers/
│   │   ├── roomController.js       # CRUD phòng chiếu, chặn trùng tên & chặn xóa phòng có lịch
│   │   └── showtimeController.js   # CRUD suất chiếu, tính endTime & chặn chồng giờ
│   ├── middlewares/
│   │   ├── authMiddleware.js       # protect (JWT) và requireRole('admin')
│   │   └── errorMiddleware.js      # notFound (404) và errorHandler tập trung
│   ├── models/
│   │   ├── Room.js                 # Schema phòng chiếu
│   │   └── Showtime.js             # Schema suất chiếu (tham chiếu Movie & Room)
│   ├── routes/
│   │   ├── roomRoutes.js           # Định tuyến /api/rooms
│   │   └── showtimeRoutes.js       # Định tuyến /api/showtimes
│   └── server.js                   # Khởi tạo Express, CORS, JSON parser và gắn routes
├── .env                            # Biến môi trường (không commit lên Git)
└── package.json
```

---

## 🔧 Cài đặt & Lệnh chạy

```bash
# Cài đặt dependencies
npm install

# Chạy chế độ phát triển (tự động reload)
npm run dev

# Chạy chế độ sản xuất
npm start
```

### Biến môi trường (`.env`)
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/ptit_cinema
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

---

## 🗄️ Mô hình dữ liệu trọng tâm (Mongoose Models)

### 1. `Room` (`rooms`)
| Trường | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `name` | `String` | *(bắt buộc)* | Tên phòng chiếu (tự động `trim`) |
| `totalRows` | `Number` | `8` | Số hàng ghế (`1–26`, tương ứng `A–Z`) |
| `seatsPerRow` | `Number` | `10` | Số ghế trên mỗi hàng (`1–30`) |
| `vipRows` | `[String]` | `['D', 'E', 'F']` | Danh sách các hàng ghế VIP |
| `isActive` | `Boolean` | `true` | `true`: Đang hoạt động, `false`: Đang bảo trì |

### 2. `Showtime` (`showtimes`)
| Trường | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `movieId` | `ObjectId` | *(ref: `Movie`)* | Khóa ngoại trỏ tới phim |
| `roomId` | `ObjectId` | *(ref: `Room`)* | Khóa ngoại trỏ tới phòng chiếu |
| `date` | `String` | *(bắt buộc)* | Ngày chiếu định dạng `YYYY-MM-DD` |
| `startTime` | `String` | *(bắt buộc)* | Giờ bắt đầu định dạng `HH:mm` |
| `endTime` | `String` | `''` | Giờ kết thúc (tự tính bằng `startTime + movie.duration`) |
| `price` | `Number` | `80000` | Giá vé ghế thường (VNĐ, tối thiểu `30.000đ`) |
| `vipSurcharge` | `Number` | `15000` | Phụ thu ghế VIP (VNĐ, `>= 0`) |
| `bookedSeats` | `[String]` | `[]` | Danh sách mã ghế đã được đặt (VD: `['D4', 'D5']`) |

> **Index:** `showtimeSchema.index({ roomId: 1, date: 1, startTime: 1 })` tối ưu truy vấn kiểm tra trùng lịch theo phòng và ngày.

---

## 🛡️ Bảo mật & Xử lý lỗi

* **`protect` (`authMiddleware.js`):** Đọc token từ header `Authorization: Bearer <token>`, giải mã bằng `jwt.verify`, gán thông tin user (đã loại bỏ `password`) vào `req.user`. Thiếu/sai token trả `401 Unauthorized`.
* **`requireRole('admin')`:** Kiểm tra `req.user.role`. Nếu không đủ quyền trả `403 Forbidden`.
* **`errorHandler` (`errorMiddleware.js`):** Xử lý lỗi tập trung qua `next(error)`, tự động chuyển đổi `CastError` (ID sai định dạng `ObjectId`) và `ValidationError` thành `400 Bad Request`.

---

## Danh sách Endpoints chính

### Kiểm tra hệ thống
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Kiểm tra trạng thái hoạt động của server |

### Quản lý Phòng chiếu (`/api/rooms`)
| Method | Endpoint | Quyền | Mô tả & Nghiệp vụ chính |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rooms` | Public | Lấy danh sách phòng (hỗ trợ `?search=` và `?isActive=true/false`) |
| `GET` | `/api/rooms/:id` | Public | Lấy chi tiết một phòng chiếu theo ID |
| `POST` | `/api/rooms` | Admin | Tạo phòng mới; chuẩn hóa `vipRows`; chặn trùng tên (`409`) |
| `PUT` | `/api/rooms/:id` | Admin | Cập nhật phòng; kiểm tra trùng tên loại trừ chính nó (`$ne`), lọc lại `vipRows` |
| `DELETE` | `/api/rooms/:id` | Admin | Xóa phòng; chặn xóa nếu phòng đang có suất chiếu (`409`) |

### Quản lý Suất chiếu (`/api/showtimes`)
| Method | Endpoint | Quyền | Mô tả & Nghiệp vụ chính |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/showtimes` | Public | Lấy danh sách suất chiếu đã `.populate('movieId')` và `.populate('roomId')` (lọc theo `?movieId=`, `?roomId=`, `?date=`) |
| `GET` | `/api/showtimes/:id` | Public | Lấy chi tiết suất chiếu, cấu hình phòng và `bookedSeats` cho trang Chọn ghế |
| `POST` | `/api/showtimes` | Admin | Tạo suất chiếu; chặn phòng bảo trì (`400`); tự tính `endTime`; chặn trùng giờ (`409`) |
| `PUT` | `/api/showtimes/:id` | Admin | Cập nhật suất chiếu; kiểm tra chồng giờ bỏ qua chính suất đang sửa (`409`) |
| `DELETE` | `/api/showtimes/:id` | Admin | Xóa suất chiếu theo ID |

### Thuật toán chặn trùng giờ chiếu (`findOverlappingShowtime`)
Đổi chuỗi giờ `"HH:mm"` sang tổng số phút tính từ `00:00`. Hai suất chiếu trong cùng phòng và cùng ngày bị coi là xung đột (`409 Conflict`) khi thỏa mãn điều kiện giao nhau:

```text
newStart < existingEnd  &&  newEnd > existingStart
```