import axios from 'axios';
import mockData from '../data/mockData.json';
import { DEFAULT_PTIT_PROMO } from '../store/bookingSlice';

// Địa chỉ gốc của Backend API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const LOCAL_BOOKINGS_KEY = 'ptit_bookings';

// Hàm tạo cấu hình gửi kèm JWT token lên server (nếu người dùng đã đăng nhập)
const getRequestConfig = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    timeout: 4000,
    headers,
  };
};

// Hàm phụ: đọc danh sách vé đã lưu trong localStorage
const readLocalBookings = () => {
  try {
    const savedText = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    if (!savedText) {
      return [];
    }

    const parsedData = JSON.parse(savedText);
    if (Array.isArray(parsedData)) {
      return parsedData;
    }
    return [];
  } catch (error) {
    console.warn('Không thể đọc danh sách vé từ localStorage:', error);
    return [];
  }
};

// Hàm phụ: lưu thêm 1 đơn đặt vé mới vào đầu danh sách trong localStorage
const saveLocalBooking = (newBooking) => {
  try {
    const oldList = readLocalBookings();

    const filteredList = oldList.filter((item) => {
      return String(item.id) !== String(newBooking.id);
    });

    const updatedList = [newBooking, ...filteredList];
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.warn('Không thể lưu vé vào localStorage:', error);
  }
};

// Hàm phụ: lấy ra danh sách mã ghế dạng chuỗi (VD: ['F5', 'F6']) từ mảng ghế
const extractSeatCodes = (seats) => {
  if (!Array.isArray(seats)) {
    return [];
  }

  const codes = seats.map((seat) => {
    if (typeof seat === 'string') {
      return seat;
    }
    if (seat && seat.code) {
      return seat.code;
    }
    return '';
  });

  return codes.filter((code) => code !== '');
};

// Hàm phụ: gom danh sách ghế đã bán từ mockData.json và localStorage khi server chưa chạy
const getFallbackOccupiedSeats = (showtimeId) => {
  let occupiedList = [];

  const showtime = mockData.showtimes.find((item) => {
    return String(item.id) === String(showtimeId);
  });

  if (showtime && Array.isArray(showtime.bookedSeats)) {
    for (const seatCode of showtime.bookedSeats) {
      if (!occupiedList.includes(seatCode)) {
        occupiedList = [...occupiedList, seatCode];
      }
    }
  }

  const localBookings = readLocalBookings();
  for (const booking of localBookings) {
    const isSameShowtime = String(booking.showtimeId) === String(showtimeId);
    const isNotCancelled = booking.status !== 'cancelled';

    if (isSameShowtime && isNotCancelled) {
      const seatCodes = extractSeatCodes(booking.seats);
      for (const code of seatCodes) {
        if (!occupiedList.includes(code)) {
          occupiedList = [...occupiedList, code];
        }
      }
    }
  }

  return occupiedList;
};

// Hàm phụ: sinh mã đơn hàng và mã đặt vé 6 chữ số ngẫu nhiên
const createBookingIdentifiers = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  const shortCode = String(randomNumber);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  return {
    id: `BK-${datePart}-${shortCode}`,
    shortCode,
    bookingCode: `PTIT-${shortCode}`,
  };
};

// Hàm phụ: chuẩn hóa object vé để tương thích cả trang Thành công lẫn trang Vé của tôi
const buildSavedBooking = (rawData, payload, currentUser) => {
  const source = rawData || {};
  const input = payload || {};
  const user = currentUser || {};

  const seatCodes = extractSeatCodes(source.seats || input.seats);

  // eslint-disable-next-line no-useless-assignment
  let finalTotal = 0;
  if (source.totalPrice !== undefined) {
    finalTotal = Number(source.totalPrice);
  } else if (source.totalAmount !== undefined) {
    finalTotal = Number(source.totalAmount);
  } else {
    finalTotal = Number(input.totalPrice) || 0;
  }

  const bookingId = source.id || source._id || '';
  const bookingCode = source.bookingCode || source.orderCode || bookingId;

  let shortCode = source.shortCode || '';
  if (!shortCode) {
    const digitsOnly = String(bookingCode).replace(/\D/g, '');
    shortCode = digitsOnly.slice(-6) || '000000';
  }

  const showtimeHour = source.startTime || source.time || input.time || '';
  const seatDetails = Array.isArray(source.seatDetails)
    ? source.seatDetails
    : Array.isArray(input.seats)
      ? input.seats
      : [];
  const combos = Array.isArray(source.combos)
    ? source.combos
    : Array.isArray(input.combos)
      ? input.combos
      : [];

  return {
    id: bookingId,
    bookingCode,
    shortCode,
    userId: source.userId || input.userId || user.id || 'u1',
    userName: source.userName || input.customerName || user.fullName || '',
    userEmail: source.userEmail || input.customerEmail || user.email || '',
    userPhone: source.userPhone || input.customerPhone || user.phone || '',
    showtimeId: source.showtimeId || input.showtimeId || '',
    movieId: source.movieId || input.movieId || '',
    movieTitle: source.movieTitle || input.movieTitle || '',
    originalTitle: source.originalTitle || input.originalTitle || '',
    ageRating: source.ageRating || input.ageRating || 'P',
    posterUrl: source.posterUrl || input.posterUrl || '',
    roomId: source.roomId || input.roomId || '',
    roomName: source.roomName || input.roomName || '',
    date: source.date || input.date || '',
    time: showtimeHour,
    startTime: showtimeHour,
    seats: seatCodes,
    seatDetails,
    combos,
    promoCode: source.promoCode || input.promoCode || null,
    subtotal: Number(source.subtotal || input.subtotal) || finalTotal,
    discountAmount:
      Number(source.discountAmount || input.discountAmount) || 0,
    totalPrice: finalTotal,
    totalAmount: finalTotal,
    paymentMethod: source.paymentMethod || input.paymentMethod || 'MoMo',
    status: source.status || 'confirmed',
    createdAt: source.createdAt || new Date().toISOString(),
  };
};

// 1. Lấy thông tin người dùng hiện đang đăng nhập từ localStorage
export const getCurrentUser = () => {
  try {
    const savedUserText = localStorage.getItem('user');
    if (savedUserText) {
      return JSON.parse(savedUserText);
    }
  } catch (error) {
    console.warn('Lỗi đọc thông tin người dùng từ localStorage:', error);
  }

  return mockData.users[0] || null;
};

// 2. Lấy danh sách ghế đã có người đặt của 1 suất chiếu
export const getOccupiedSeats = async (showtimeId) => {
  const url = `${API_BASE_URL}/bookings/showtime/${showtimeId}/occupied-seats`;

  try {
    const response = await axios.get(url, getRequestConfig());
    const data = response.data;

    if (data && Array.isArray(data.occupiedSeats)) {
      return data.occupiedSeats;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    // Nếu backend chưa chạy hoặc lỗi mạng thì lấy dữ liệu mẫu cục bộ
    console.warn('Chuyển sang lấy ghế đã bán từ dữ liệu cục bộ:', error.message);
    return getFallbackOccupiedSeats(showtimeId);
  }
};

// 3. Lấy đầy đủ thông tin suất chiếu, phim, phòng chiếu và danh sách ghế đã bán
export const getShowtimeDetail = async (showtimeId) => {
  const showtime = mockData.showtimes.find((item) => {
    return String(item.id) === String(showtimeId);
  });

  if (!showtime) {
    return null;
  }

  const movie =
    mockData.movies.find((item) => String(item.id) === String(showtime.movieId)) ||
    null;
  const rawRoom =
    mockData.rooms.find((item) => String(item.id) === String(showtime.roomId)) ||
    null;

  let room = null;
  if (rawRoom) {
    room = {
      ...rawRoom,
      rows: rawRoom.rows || rawRoom.totalRows || 8,
      cols: rawRoom.cols || rawRoom.seatsPerRow || 10,
      vipRows: Array.isArray(rawRoom.vipRows) ? rawRoom.vipRows : [],
    };
  }

  // Lấy danh sách ghế đã bán mới nhất
  const bookedSeats = await getOccupiedSeats(showtimeId);

  const basePrice = Number(showtime.basePrice) || 85000;
  const vipSurcharge = Number(showtime.vipSurcharge) || 15000;
  const vipPrice = basePrice + vipSurcharge;

  return {
    ...showtime,
    basePrice,
    vipSurcharge,
    vipPrice,
    movie,
    room,
    bookedSeats,
  };
};

// 4. Kiểm tra mã ưu đãi người dùng nhập (hỗ trợ mã sinh viên PTIT35 giảm 35%)
export const validatePromoCode = async (rawCode) => {
  const cleanCode = String(rawCode || '').trim().toUpperCase();

  if (!cleanCode) {
    return {
      valid: false,
      promo: null,
      message: 'Vui lòng nhập mã ưu đãi.',
    };
  }

  if (cleanCode === DEFAULT_PTIT_PROMO.code) {
    return {
      valid: true,
      promo: DEFAULT_PTIT_PROMO,
      message: 'Áp dụng thành công ưu đãi sinh viên PTIT giảm 35% giá vé!',
    };
  }

  return {
    valid: false,
    promo: null,
    message: `Mã "${cleanCode}" không hợp lệ. Gợi ý: nhập PTIT35 cho sinh viên PTIT.`,
  };
};

// 5. Gửi yêu cầu tạo đơn đặt vé mới (ưu tiên gọi API, fallback localStorage nếu server tắt)
export const createBooking = async (bookingPayload) => {
  const currentUser = getCurrentUser();
  const url = `${API_BASE_URL}/bookings`;

  try {
    const response = await axios.post(url, bookingPayload, getRequestConfig());
    const data = response.data;
    const rawBooking = data.booking || data.data || data;

    const savedBooking = buildSavedBooking(
      rawBooking,
      bookingPayload,
      currentUser
    );
    saveLocalBooking(savedBooking);

    return {
      booking: savedBooking,
      source: 'api',
    };
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      const message =
        serverData.message || 'Đặt vé thất bại. Vui lòng thử lại.';

      const apiError = new Error(message);
      apiError.status = error.response.status;
      apiError.conflictSeats = serverData.conflictSeats || [];
      throw apiError;
    }

    const requestedCodes = extractSeatCodes(bookingPayload.seats);
    const currentOccupied = getFallbackOccupiedSeats(bookingPayload.showtimeId);

    const conflictSeats = requestedCodes.filter((code) => {
      return currentOccupied.includes(code);
    });

    if (conflictSeats.length > 0) {
      const conflictError = new Error(
        `Ghế ${conflictSeats.join(', ')} vừa có người đặt! Vui lòng chọn ghế khác.`
      );
      conflictError.status = 409;
      conflictError.conflictSeats = conflictSeats;
      throw conflictError;
    }

    const identifiers = createBookingIdentifiers();
    const offlineBooking = buildSavedBooking(
      {
        id: identifiers.id,
        shortCode: identifiers.shortCode,
        bookingCode: identifiers.bookingCode,
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

// 6. Lấy chi tiết 1 vé theo mã bookingId (ưu tiên API, fallback localStorage rồi mockData)
export const getBookingById = async (bookingId) => {
  if (!bookingId) {
    return null;
  }

  const url = `${API_BASE_URL}/bookings/${bookingId}`;

  try {
    const response = await axios.get(url, getRequestConfig());
    const data = response.data;
    return data.booking || data.data || data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const forbiddenError = new Error('Bạn không có quyền xem vé này.');
      forbiddenError.status = 403;
      throw forbiddenError;
    }

    const targetId = String(bookingId);
    const localBookings = readLocalBookings();
    const localFound = localBookings.find((item) => {
      return (
        String(item.id) === targetId ||
        String(item._id) === targetId ||
        String(item.bookingCode) === targetId ||
        String(item.shortCode) === targetId
      );
    });

    if (localFound) {
      return localFound;
    }

    const mockFound = mockData.bookings.find((item) => {
      return String(item.id) === targetId;
    });

    return mockFound || null;
  }
};