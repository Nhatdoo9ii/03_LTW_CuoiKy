import axios from 'axios';
import mockData from '../data/mockData.json';
import { DEFAULT_PTIT_PROMO } from '../store/bookingSlice';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const LOCAL_BOOKINGS_KEY = 'ptit_cinema_bookings';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('token');
    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }
  return config;
});

const isServerOfflineError = (error) =>
  !error?.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';

const readLocalBookings = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_BOOKINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('bookingService: không thể đọc localStorage bookings', error);
    return [];
  }
};

const saveLocalBooking = (booking) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = readLocalBookings();
    const updated = [booking, ...existing];
    window.localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('bookingService: không thể lưu booking vào localStorage', error);
  }
};

const normalizeSeatCodes = (seats = []) =>
  seats
    .map((seat) => (typeof seat === 'string' ? seat : seat?.code))
    .filter(Boolean);

const getFallbackOccupiedSeats = (showtimeId) => {
  const showtime = mockData.showtimes.find(
    (item) => String(item.id) === String(showtimeId)
  );
  const mockBooked = Array.isArray(showtime?.bookedSeats)
    ? showtime.bookedSeats
    : [];

  const localBooked = readLocalBookings()
    .filter(
      (booking) =>
        String(booking.showtimeId) === String(showtimeId) &&
        booking.status !== 'cancelled'
    )
    .flatMap((booking) => normalizeSeatCodes(booking.seats));

  return Array.from(new Set([...mockBooked, ...localBooked]));
};

const generateBookingIdentifiers = () => {
  const randomDigits = String(Math.floor(100000 + Math.random() * 900000));
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}${String(now.getDate()).padStart(2, '0')}`;

  return {
    id: `BK-${datePart}-${randomDigits}`,
    bookingCode: randomDigits,
    orderCode: `PTIT-${randomDigits}`,
  };
};

/**
 * Lấy thông tin người dùng hiện tại từ localStorage (fallback sang tài khoản demo PTIT trong mockData).
 */
export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = window.localStorage.getItem('user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.warn('bookingService: lỗi đọc thông tin user từ localStorage', error);
    }
  }
  return mockData.users[0] || null;
};

/**
 * Lấy danh sách mã ghế đã được đặt của một suất chiếu.
 * Gọi API GET /api/bookings/showtime/:showtimeId/occupied-seats, fallback sang mockData + localStorage.
 */
export const getOccupiedSeats = async (showtimeId) => {
  try {
    const response = await apiClient.get(
      `/bookings/showtime/${encodeURIComponent(showtimeId)}/occupied-seats`
    );
    const apiSeats = response.data?.occupiedSeats ?? response.data?.data ?? [];
    return Array.isArray(apiSeats) ? apiSeats : [];
  } catch (error) {
    if (!isServerOfflineError(error)) {
      console.warn(
        'bookingService: API occupied-seats trả lỗi, chuyển sang dữ liệu cục bộ',
        error.response?.status
      );
    }
    return getFallbackOccupiedSeats(showtimeId);
  }
};

/**
 * Lấy đầy đủ thông tin suất chiếu, phim, phòng chiếu và danh sách ghế đã bán.
 */
export const getShowtimeDetail = async (showtimeId) => {
  const showtime = mockData.showtimes.find(
    (item) => String(item.id) === String(showtimeId)
  );

  if (!showtime) {
    return null;
  }

  const movie =
    mockData.movies.find((item) => String(item.id) === String(showtime.movieId)) ||
    null;
  const rawRoom =
    mockData.rooms.find((item) => String(item.id) === String(showtime.roomId)) ||
    null;

  const room = rawRoom
    ? {
        ...rawRoom,
        rows: rawRoom.rows ?? rawRoom.totalRows ?? 8,
        cols: rawRoom.cols ?? rawRoom.seatsPerRow ?? 10,
        vipRows: Array.isArray(rawRoom.vipRows) ? rawRoom.vipRows : [],
      }
    : null;

  const bookedSeats = await getOccupiedSeats(showtimeId);
  const basePrice = Number(showtime.basePrice) || 85000;
  const vipSurcharge = Number(showtime.vipSurcharge) || 15000;

  return {
    ...showtime,
    basePrice,
    vipSurcharge,
    vipPrice: basePrice + vipSurcharge,
    movie,
    room,
    bookedSeats,
  };
};

/**
 * Kiểm tra mã ưu đãi nhập ở bước Chọn ghế / Thanh toán (hỗ trợ mặc định PTIT35 giảm 35%).
 */
export const validatePromoCode = async (rawCode) => {
  const normalizedCode = String(rawCode || '').trim().toUpperCase();

  if (!normalizedCode) {
    return {
      valid: false,
      promo: null,
      message: 'Vui lòng nhập mã ưu đãi.',
    };
  }

  if (normalizedCode === DEFAULT_PTIT_PROMO.code) {
    return {
      valid: true,
      promo: DEFAULT_PTIT_PROMO,
      message: 'Áp dụng thành công ưu đãi sinh viên PTIT giảm 35% giá vé!',
    };
  }

  return {
    valid: false,
    promo: null,
    message: `Mã "${normalizedCode}" không hợp lệ. Gợi ý: dùng mã PTIT35 cho sinh viên PTIT.`,
  };
};

/**
 * Tạo đơn đặt vé mới.
 * - Gọi POST /api/bookings khi server hoạt động.
 * - Nếu server trả 409 Conflict (trùng ghế) hoặc lỗi 4xx, ném lỗi ngay để UI thông báo chính xác.
 * - Chỉ fallback lưu localStorage khi server offline (kèm kiểm tra trùng ghế cục bộ chuẩn 409).
 */
export const createBooking = async (bookingPayload) => {
  try {
    const response = await apiClient.post('/bookings', bookingPayload);
    const created = response.data?.booking ?? response.data?.data ?? response.data;
    saveLocalBooking(created);
    return {
      booking: created,
      source: 'api',
    };
  } catch (error) {
    // Không fallback nếu server đã phản hồi lỗi nghiệp vụ (VD: 409 trùng ghế, 400, 401, 403)
    if (!isServerOfflineError(error)) {
      const apiError = new Error(
        error.response?.data?.message || 'Đặt vé thất bại. Vui lòng thử lại.'
      );
      apiError.status = error.response?.status || 500;
      apiError.conflictSeats = error.response?.data?.conflictSeats || [];
      throw apiError;
    }

    // Fallback khi server chưa chạy: vẫn kiểm tra trùng ghế giống logic 409 ở server
    const requestedSeatCodes = normalizeSeatCodes(bookingPayload.seats);
    const currentOccupied = getFallbackOccupiedSeats(bookingPayload.showtimeId);
    const conflictSeats = requestedSeatCodes.filter((code) =>
      currentOccupied.includes(code)
    );

    if (conflictSeats.length > 0) {
      const conflictError = new Error(
        `Ghế ${conflictSeats.join(', ')} vừa có người đặt! Vui lòng chọn ghế khác.`
      );
      conflictError.status = 409;
      conflictError.conflictSeats = conflictSeats;
      throw conflictError;
    }

    const { id, bookingCode, orderCode } = generateBookingIdentifiers();
    const currentUser = getCurrentUser();

    const offlineBooking = {
      id,
      bookingCode,
      orderCode,
      userId: bookingPayload.userId || currentUser?.id || 'u1',
      userName: bookingPayload.customerName || currentUser?.fullName || 'Khách hàng PTIT',
      userEmail: bookingPayload.customerEmail || currentUser?.email || '',
      userPhone: bookingPayload.customerPhone || currentUser?.phone || '',
      showtimeId: bookingPayload.showtimeId,
      movieId: bookingPayload.movieId,
      movieTitle: bookingPayload.movieTitle,
      originalTitle: bookingPayload.originalTitle || '',
      ageRating: bookingPayload.ageRating || 'P',
      posterUrl: bookingPayload.posterUrl || '',
      roomId: bookingPayload.roomId || '',
      roomName: bookingPayload.roomName || '',
      date: bookingPayload.date || '',
      time: bookingPayload.time || '',
      seats: requestedSeatCodes,
      seatDetails: Array.isArray(bookingPayload.seats) ? bookingPayload.seats : [],
      combos: Array.isArray(bookingPayload.combos) ? bookingPayload.combos : [],
      promoCode: bookingPayload.promoCode || null,
      subtotal: Number(bookingPayload.subtotal) || 0,
      discountAmount: Number(bookingPayload.discountAmount) || 0,
      totalPrice: Number(bookingPayload.totalPrice) || 0,
      paymentMethod: bookingPayload.paymentMethod || 'MoMo',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    saveLocalBooking(offlineBooking);

    return {
      booking: offlineBooking,
      source: 'local',
    };
  }
};

/**
 * Lấy chi tiết đơn đặt vé theo ID (ưu tiên API, fallback localStorage rồi đến mockData).
 */
export const getBookingById = async (bookingId) => {
  if (!bookingId) return null;

  try {
    const response = await apiClient.get(
      `/bookings/${encodeURIComponent(bookingId)}`
    );
    return response.data?.booking ?? response.data?.data ?? response.data;
  } catch (error) {
    if (!isServerOfflineError(error) && error.response?.status === 403) {
      const forbiddenError = new Error('Bạn không có quyền xem vé này.');
      forbiddenError.status = 403;
      throw forbiddenError;
    }

    const localMatch = readLocalBookings().find(
      (item) =>
        String(item.id) === String(bookingId) ||
        String(item._id) === String(bookingId) ||
        String(item.bookingCode) === String(bookingId)
    );
    if (localMatch) return localMatch;

    const mockMatch = mockData.bookings.find(
      (item) => String(item.id) === String(bookingId)
    );
    return mockMatch || null;
  }
};