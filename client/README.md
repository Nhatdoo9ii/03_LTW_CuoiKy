# 💻 PTIT Cinema — Frontend Application 

Giao diện người dùng xây dựng bằng **ReactJS**, **Vite**, **Redux Toolkit**, **React Router** và **CSS Modules**, chạy mặc định trên cổng **`5173`**.

---

## 📁 Cấu trúc thư mục (`client/src/`)

```text
src/
├── components/
│   ├── booking/
│   │   ├── bookingsummary/BookingSummary.jsx   # Cột tóm tắt đơn, mã PTIT35 & tính tiền
│   │   ├── coutdowntimer/CountdownTimer.jsx    # Đồng hồ đếm ngược 05:00 giữ ghế
│   │   ├── seatgrid/SeatGrid.jsx               # Vẽ sơ đồ ghế động theo cấu hình phòng
│   │   └── seatitem/SeatItem.jsx               # Ô ghế đơn lẻ (Thường / VIP / Chọn / Đã bán)
│   ├── common/
│   │   └── Pagination.jsx                      # Thanh phân trang dùng chung
│   └── tickets-admin/
│       ├── ElectronicTicket.jsx                # Vé điện tử QR + mã vạch SVG + in PDF
│       ├── PaymentMethodSelector.jsx           # Chọn MoMo / Ngân hàng / Tại quầy
│       ├── PaymentQrModal.jsx                  # Popup quét mã QR thanh toán giả lập
│       ├── RoomForm.jsx                        # Form thêm/sửa phòng chiếu
│       └── ShowtimeForm.jsx                    # Form thêm/sửa suất chiếu
├── hooks/
│   ├── useCountdown.js                         # Đếm ngược theo mốc targetTimestamp + cleanup
│   ├── useDebounce.js                          # Trì hoãn tìm kiếm (300–400ms) chống lag
│   └── useLocalStorage.js                      # Đồng bộ state với localStorage
├── pages/
│   ├── admin/
│   │   ├── AdminRoomsPage.jsx                  # Trang Quản lý Phòng chiếu (/admin/rooms)
│   │   └── AdminShowtimesPage.jsx              # Trang Quản lý Suất chiếu (/admin/showtimes)
│   └── member/
│       ├── bookingsuccess/BookingSuccessPage.jsx # Trang Đặt vé thành công (/booking-success/:id)
│       ├── checkout/CheckoutPage.jsx           # Trang Xác nhận & Thanh toán (/checkout)
│       └── seatselection/SeatSelectionPage.jsx # Trang Chọn ghế (/booking/:showtimeId)
├── services/
│   ├── roomService.js                          # Gọi API /api/rooms + chuẩn hóa dữ liệu phòng
│   ├── showtimeService.js                      # Gọi API /api/showtimes + tách dữ liệu populate
│   └── bookingService.js                       # Gọi API đặt vé và kiểm tra mã khuyến mãi
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

### 1. Quản lý State xuyên suốt bằng Redux Toolkit (`bookingSlice.js`)
Dữ liệu giỏ đặt vé (`showtimeInfo`, `selectedSeats`, `selectedCombos`, `appliedPromo`, `holdExpiresAt`, `lastCompletedBooking`) được quản lý tập trung để đồng bộ liên tục qua 3 trang:
* **`/booking/:showtimeId`** $\rightarrow$ **`/checkout`** $\rightarrow$ **`/booking-success/:bookingId`**.
* Giới hạn tối đa **8 ghế** (`MAX_SEATS_PER_BOOKING = 8`) và thời gian giữ ghế **300 giây** (`HOLD_DURATION_SECONDS = 300`).
* Hàm thuần `calculateBookingAmounts` tách riêng tiền ghế, tiền combo và áp phạm vi giảm giá (`tickets` hoặc `all`).

### 2. Custom Hooks (`src/hooks/`)
* **`useCountdown`:** Tính thời gian còn lại dựa trên mốc tuyệt đối `targetTimestamp - Date.now()` để đồng hồ không bị reset khi chuyển trang, luôn dọn dẹp `clearInterval` trong cleanup của `useEffect`.
* **`useDebounce`:** Hủy `setTimeout` cũ khi người dùng gõ liên tiếp, chỉ lọc danh sách Admin sau khi ngừng gõ `300ms`.
* **`useLocalStorage`:** Lưu và khôi phục state an toàn bằng `JSON.stringify` / `JSON.parse`.

### 3. Tầng gọi API & Chuẩn hóa dữ liệu (`src/services/`)
* Tự động đọc `token` từ `localStorage` gắn vào header `Authorization: Bearer <token>` cho các thao tác Admin.
* **`normalizeRoom` / `normalizeShowtime`:** Chuyển đổi cấu trúc `_id`, tách đối tượng `movieId` / `roomId` sau khi Backend `.populate()`, đồng thời tính sẵn `totalSeats`, `vipPrice`, `bookedCount` và `fillPercent`.

### 4. Luồng thanh toán & Vé điện tử
* **Route Guard tại `CheckoutPage`:** Tự động điều hướng về `/` nếu người dùng truy cập trực tiếp `/checkout` hoặc F5 khi chưa có ghế trong giỏ.
* **Rẽ nhánh thanh toán:** Chọn **Tại quầy** tạo đơn ngay; chọn **MoMo** hoặc **Ngân hàng nội địa** bật `PaymentQrModal` (nền trắng cố định tương thích Dark Mode) để xác nhận chuyển khoản trước khi xuất vé.
* **Khôi phục & Bảo vệ vé tại `BookingSuccessPage`:** Lấy dữ liệu theo 3 tầng (`location.state` $\rightarrow$ Redux $\rightarrow$ `getBookingById`) và kiểm tra quyền sở hữu (`canViewBooking`) để chặn xem vé người khác.