# 💻 PTIT Cinema — Frontend Application

Giao diện người dùng xây dựng bằng **React 19**, **Vite 8**, **Redux Toolkit**, **Context API**, **React Router v7** và **CSS Modules**, chạy mặc định trên cổng **`5173`**.

---

## 📁 Cấu trúc thư mục (`client/src/`)

```text
src/
├── components/
│   ├── admin/movies/                           # MovieStatsCards, MovieForm, MovieFilterBar, MovieTable
│   ├── booking/
│   │   ├── bookingsummary/BookingSummary.jsx   # Cột tóm tắt đơn, mã PTIT35 & tính tiền
│   │   ├── coutdowntimer/CountdownTimer.jsx    # Đồng hồ đếm ngược 05:00 giữ ghế
│   │   ├── seatgrid/SeatGrid.jsx               # Vẽ sơ đồ ghế động theo cấu hình phòng
│   │   └── seatitem/SeatItem.jsx               # Ô ghế đơn lẻ (Thường / VIP / Chọn / Đã bán)
│   ├── common/                                 # Header, Footer, MainLayout, AdminLayout, AdminSideBar, ProtectedRoute, Pagination
│   ├── movies/                                 # HeroBanner, MovieCard, MovieFilterBar, MovieDetailHero, ShowtimeSelector, TrailerModal
│   └── tickets-admin/                          # ElectronicTicket, PaymentMethodSelector, PaymentQrModal, RoomForm, ShowtimeForm, TicketCard, RevenueTable
├── context/
│   ├── AuthContext.jsx                         # Quản lý đăng nhập, đăng ký, JWT token & phân quyền
│   └── ThemeContext.jsx                        # Quản lý giao diện Sáng / Tối (data-theme="dark")
├── hooks/
│   ├── useFetch.js                             # Gọi API GET dùng chung kèm AbortController cleanup
│   ├── useDebounce.js                          # Trì hoãn tìm kiếm (300–400ms) tránh spam API
│   ├── useCountdown.js                         # Đếm ngược theo targetTimestamp + clearInterval cleanup
│   └── useLocalStorage.js                      # Đồng bộ state an toàn với localStorage
├── pages/
│   ├── public/                                 # HomePage, MovieDetailPage, PromotionPage, LoginPage, RegisterPage, NotFoundPage
│   ├── member/
│   │   ├── seatselection/SeatSelectionPage.jsx # Trang Chọn ghế (/booking/:showtimeId)
│   │   ├── checkout/CheckoutPage.jsx           # Trang Xác nhận & Thanh toán (/checkout)
│   │   ├── bookingsuccess/BookingSuccessPage.jsx # Trang Vé điện tử (/booking-success/:bookingId)
│   │   └── MyTicketsPage.jsx                   # Trang Lịch sử vé & Hủy vé (/my-tickets)
│   └── admin/
│       ├── AdminMoviesPage.jsx                 # Quản lý Phim (/admin/movies)
│       ├── AdminRoomsPage.jsx                  # Quản lý Phòng chiếu (/admin/rooms)
│       ├── AdminShowtimesPage.jsx              # Quản lý Suất chiếu (/admin/showtimes)
│       └── AdminStatsPage.jsx                  # Thống kê doanh thu (/admin/stats)
├── services/
│   ├── movieService.js                         # API /api/movies + chuẩn hóa _id -> id
│   ├── roomService.js                          # API /api/rooms + chuẩn hóa dữ liệu phòng
│   ├── showtimeService.js                      # API /api/showtimes + tách dữ liệu populate
│   ├── bookingService.js                       # API /api/bookings + kiểm tra mã PTIT35
│   └── ticketService.js                        # API vé của tôi, hủy vé & thống kê doanh thu
└── store/
    ├── store.js                                # Khởi tạo Redux Store
    └── bookingSlice.js                         # Trạng thái giỏ đặt vé dùng chung 3 trang
```

---

## 🔧 Cài đặt & Lệnh chạy

```bash
# Cài đặt dependencies
npm install

# Khởi chạy môi trường phát triển (cổng 5173)
npm run dev

# Kiểm tra lỗi cú pháp ESLint
npm run lint

# Build bản sản xuất (production)
npm run build
```

### Biến môi trường (`.env`)
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 🧠 Kiến trúc & Cơ chế quan trọng

### 1. Context API (`src/context/`)
* **`AuthContext`:** Lưu thông tin người dùng và JWT `token` thật từ `/api/auth/login` và `/api/auth/register`, cung cấp `login`, `register`, `logout` cho toàn bộ ứng dụng (`Header`, `AdminSideBar`, `ProtectedRoute`, các trang đặt vé).
* **`ThemeContext`:** Quản lý chế độ Sáng / Tối, gắn thuộc tính `data-theme="dark"` vào `<html>` và đồng bộ qua CSS Variables.

### 2. Quản lý State đặt vé bằng Redux Toolkit (`bookingSlice.js`)
* Dữ liệu giỏ đặt vé (`showtimeInfo`, `selectedSeats`, `selectedCombos`, `appliedPromo`, `holdExpiresAt`, `lastCompletedBooking`) được chia sẻ qua 3 trang:
  `/booking/:showtimeId` → `/checkout` → `/booking-success/:bookingId`.
* Giới hạn tối đa **8 ghế** (`MAX_SEATS_PER_BOOKING = 8`) và giữ ghế **300 giây** (`HOLD_DURATION_SECONDS = 300`).

### 3. Custom Hooks (`src/hooks/`)
* **`useFetch`:** Tự động gọi API GET khi endpoint/params đổi và hủy request bằng `AbortController` trong cleanup.
* **`useDebounce`:** Hủy `setTimeout` cũ khi người dùng gõ liên tiếp, chỉ gọi tìm kiếm sau khi ngừng gõ `300–400ms`.
* **`useCountdown`:** Tính thời gian còn lại theo `targetTimestamp - Date.now()`, dọn dẹp `clearInterval` khi unmount.
* **`useLocalStorage`:** Lưu và khôi phục state an toàn bằng `JSON.stringify` / `JSON.parse`.

### 4. Tầng gọi API (`src/services/`)
* Gắn header `Authorization: Bearer <token>` từ `localStorage` cho các endpoint cần xác thực/Admin.
* Chuẩn hóa dữ liệu `_id` của MongoDB sang `id` thống nhất trên toàn bộ giao diện.
