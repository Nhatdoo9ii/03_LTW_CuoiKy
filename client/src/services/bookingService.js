import axios from 'axios';
import mockData from '../data/mockData.json';
import { DEFAULT_PTIT_PROMO } from '../store/bookingSlice';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Dùng chung key với MyTicketsPage.jsx để vé mới đặt hiển thị ngay ở "Vé của tôi"
export const LOCAL_BOOKINGS_KEY = 'ptit_bookings';

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
  !error?.response ||
  error.code === 'ERR_NETWORK' ||
  error.code === 'ECONNABORTED';

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
    const deduped = existing.filter((item) => String(item.id) !== String(booking.id));
    const updated = [booking, ...deduped];
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
    shortCode: randomDigits,
    bookingCode: `PTIT-${randomDigits}`,
  };
};

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

const normalizeSavedBooking = (raw, fallbackPayload, currentUser) => {
  const seatCodes = normalizeSeatCodes(raw?.seats || fallbackPayload?.seats);
  const total = Number(raw?.totalPrice ?? raw?.totalAmount ?? fallbackPayload?.totalPrice) || 0;
  const showTimeStr = raw?.startTime || raw?.time || fallbackPayload?.time || '';

  return {
    ...raw,
    id: raw?.id || raw?._id,
    bookingCode: raw?.bookingCode || raw?.orderCode || raw?.id,
    shortCode:
      raw?.shortCode ||
      String(raw?.bookingCode || raw?.id || '').replace(/\D/g, '').slice(-6) ||
      '000000',
    userId: raw?.userId || fallbackPayload?.userId || currentUser?.id || 'u1',
    userName: raw?.userName || fallbackPayload?.customerName || currentUser?.fullName || '',
    userEmail: raw?.userEmail || fallbackPayload?.customerEmail || currentUser?.email || '',
    userPhone: raw?.userPhone || fallbackPayload?.customerPhone || currentUser?.phone || '',
    showtimeId: raw?.showtimeId || fallbackPayload?.showtimeId || '',
    movieId: raw?.movieId || fallbackPayload?.movieId || '',
    movieTitle: raw?.movieTitle || fallbackPayload?.movieTitle || '',
    originalTitle: raw?.originalTitle || fallbackPayload?.originalTitle || '',
    ageRating: raw?.ageRating || fallbackPayload?.ageRating || 'P',
    posterUrl: raw?.posterUrl || fallbackPayload?.posterUrl || '',
    roomId: raw?.roomId || fallbackPayload?.roomId || '',
    roomName: raw?.roomName || fallbackPayload?.roomName || '',
    date: raw?.date || fallbackPayload?.date || '',
    time: showTimeStr,
    startTime: showTimeStr,
    seats: seatCodes,
    seatDetails:
      raw?.seatDetails ||
      (Array.isArray(fallbackPayload?.seats) ? fallbackPayload.seats : []),
    combos: raw?.combos || (Array.isArray(fallbackPayload?.combos) ? fallbackPayload.combos : []),
    promoCode: raw?.promoCode ?? fallbackPayload?.promoCode ?? null,
    subtotal: Number(raw?.subtotal ?? fallbackPayload?.subtotal) || total,
    discountAmount: Number(raw?.discountAmount ?? fallbackPayload?.discountAmount) || 0,
    totalPrice: total,
    totalAmount: total,
    paymentMethod: raw?.paymentMethod || fallbackPayload?.paymentMethod || 'MoMo',
    status: raw?.status || 'confirmed',
    createdAt: raw?.createdAt || new Date().toISOString(),
  };
};

export const createBooking = async (bookingPayload) => {
  const currentUser = getCurrentUser();

  try {
    const response = await apiClient.post('/bookings', bookingPayload);
    const apiBooking = response.data?.booking ?? response.data?.data ?? response.data;
    const normalized = normalizeSavedBooking(apiBooking, bookingPayload, currentUser);
    saveLocalBooking(normalized);
    return {
      booking: normalized,
      source: 'api',
    };
  } catch (error) {
    if (!isServerOfflineError(error)) {
      const apiError = new Error(
        error.response?.data?.message || 'Đặt vé thất bại. Vui lòng thử lại.'
      );
      apiError.status = error.response?.status || 500;
      apiError.conflictSeats = error.response?.data?.conflictSeats || [];
      throw apiError;
    }

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

    const { id, shortCode, bookingCode } = generateBookingIdentifiers();
    const offlineBooking = normalizeSavedBooking(
      {
        id,
        shortCode,
        bookingCode,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      },
      bookingPayload,
      currentUser
    );

    saveLocalBooking(offlineBooking);

    return {
      booking: offlineBooking,
      source: 'local',
    };
  }
};

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
        String(item.bookingCode) === String(bookingId) ||
        String(item.shortCode) === String(bookingId)
    );
    if (localMatch) return localMatch;

    const mockMatch = mockData.bookings.find(
      (item) => String(item.id) === String(bookingId)
    );
    return mockMatch || null;
  }
};