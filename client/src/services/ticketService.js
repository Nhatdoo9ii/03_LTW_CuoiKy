import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Chuẩn hóa dữ liệu vé trả về từ Backend để khớp với TicketCard và MyTicketsPage
const normalizeTicket = (raw) => {
  const showtime =
    raw.showtimeId && typeof raw.showtimeId === 'object' ? raw.showtimeId : {};
  const movie =
    showtime.movieId && typeof showtime.movieId === 'object'
      ? showtime.movieId
      : {};
  const room =
    showtime.roomId && typeof showtime.roomId === 'object'
      ? showtime.roomId
      : {};

  const seatCodes = Array.isArray(raw.seats)
    ? raw.seats
        .map((s) => (typeof s === 'string' ? s : s?.seatId || s?.code || ''))
        .filter(Boolean)
    : [];

  return {
    ...raw,
    id: String(raw.id || raw._id || ''),
    bookingCode: raw.bookingCode || String(raw._id || '').slice(-6).toUpperCase(),
    movieTitle: raw.movieTitle || movie.title || 'Phim chiếu rạp PTIT',
    posterUrl: raw.posterUrl || movie.posterUrl || '',
    roomName: raw.roomName || room.name || 'Phòng chiếu',
    date: raw.date || showtime.date || '',
    startTime: raw.startTime || showtime.startTime || '',
    seats: seatCodes,
    totalAmount:
      raw.totalAmount !== undefined
        ? Number(raw.totalAmount)
        : Number(raw.totalPrice) || 0,
    status: raw.status || 'confirmed',
  };
};

// Lấy danh sách vé của người dùng đang đăng nhập (GET /api/bookings/my-tickets)
export const getMyTickets = async () => {
  try {
    const response = await apiClient.get('/bookings/my-tickets', {
      headers: getAuthHeaders(),
    });
    const list = response.data?.data || [];
    return list.map(normalizeTicket);
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.response
        ? 'Không thể tải danh sách vé của bạn.'
        : 'Không thể kết nối tới máy chủ để tải lịch sử vé.');
    throw new Error(message, { cause: error });
  }
};

// Hủy vé trước giờ chiếu >= 2 tiếng (PATCH /api/bookings/:id/cancel)
export const cancelMyTicket = async (bookingId) => {
  try {
    const response = await apiClient.patch(
      `/bookings/${bookingId}/cancel`,
      {},
      { headers: getAuthHeaders() }
    );
    return {
      message: response.data?.message || 'Hủy vé thành công',
      ticket: response.data?.data ? normalizeTicket(response.data.data) : null,
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.response
        ? 'Không thể hủy vé này.'
        : 'Không thể kết nối tới máy chủ khi hủy vé.');
    throw new Error(message, { cause: error });
  }
};

// Lấy thống kê doanh thu Admin qua MongoDB Aggregation (GET /api/stats/revenue)
export const getRevenueStats = async (params = {}) => {
  try {
    const cleanParams = {};
    if (params.fromDate) cleanParams.fromDate = params.fromDate;
    if (params.toDate) cleanParams.toDate = params.toDate;

    const response = await apiClient.get('/stats/revenue', {
      params: cleanParams,
      headers: getAuthHeaders(),
    });
    const payload = response.data?.data || {};
    const byMovie = (payload.byMovie || []).map((item) => ({
      ...item,
      movieId: String(item.movieId || item._id || ''),
      genre: Array.isArray(item.genres)
        ? item.genres.join(', ')
        : item.genre || 'Phim rạp',
    }));

    return {
      summary: payload.summary || {
        totalRevenue: 0,
        totalTickets: 0,
        totalMovies: 0,
        topMovieTitle: 'Chưa có dữ liệu',
      },
      byMovie,
      byDate: payload.byDate || [],
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.response
        ? 'Không thể tải dữ liệu thống kê doanh thu.'
        : 'Không thể kết nối tới máy chủ để tải thống kê.');
    throw new Error(message, { cause: error });
  }
};
