/* eslint-disable preserve-caught-error */
import axios from 'axios';
import mockData from '../data/mockData.json';
import { normalizeRoom } from './roomService';

// Địa chỉ gốc của Backend API (cổng 5001 khớp với server)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Khóa lưu danh sách suất chiếu trong localStorage khi server chưa bật
export const LOCAL_SHOWTIMES_KEY = 'ptit_showtimes';

// Hàm phụ: tạo cấu hình gửi kèm JWT token lên server (dành cho quyền Admin)
const getRequestConfig = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    timeout: 5000,
    headers,
  };
};

// Hàm phụ: đổi chuỗi giờ "18:30" thành tổng số phút tính từ 00:00 (VD: 1110 phút)
export const timeToMinutes = (timeStr) => {
  if (!timeStr) {
    return 0;
  }

  const parts = String(timeStr).split(':');
  if (parts.length < 2) {
    return 0;
  }

  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  return hours * 60 + minutes;
};

// Hàm phụ: tính giờ kết thúc từ giờ bắt đầu và thời lượng phim
export const calculateEndTime = (startTime, durationMinutes) => {
  if (!startTime) {
    return '--:--';
  }

  const startTotalMinutes = timeToMinutes(startTime);
  const duration = Number(durationMinutes) || 120;
  const endTotalMinutes = startTotalMinutes + duration;

  const endHours = Math.floor(endTotalMinutes / 60) % 24;
  const endMinutes = endTotalMinutes % 60;

  const hourText = String(endHours).padStart(2, '0');
  const minuteText = String(endMinutes).padStart(2, '0');

  return `${hourText}:${minuteText}`;
};

// Hàm phụ: đọc danh sách suất chiếu cục bộ (dùng khi server chưa bật)
const readLocalShowtimes = () => {
  try {
    const savedText = localStorage.getItem(LOCAL_SHOWTIMES_KEY);
    if (savedText) {
      const parsed = JSON.parse(savedText);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Không thể đọc danh sách suất chiếu cục bộ:', error);
  }

  const initialList = (mockData.showtimes || []).map((item) => ({ ...item }));
  localStorage.setItem(LOCAL_SHOWTIMES_KEY, JSON.stringify(initialList));
  return initialList;
};

// Hàm phụ: lưu danh sách suất chiếu cục bộ vào localStorage
const saveLocalShowtimes = (showtimes) => {
  try {
    localStorage.setItem(LOCAL_SHOWTIMES_KEY, JSON.stringify(showtimes));
  } catch (error) {
    console.warn('Không thể lưu danh sách suất chiếu cục bộ:', error);
  }
};

// Hàm phụ: chuẩn hóa 1 bản ghi suất chiếu từ MongoDB (đã populate) hoặc mockData về cùng 1 cấu trúc
export const normalizeShowtime = (rawShowtime) => {
  if (!rawShowtime) {
    return null;
  }

  // Bước 1: Tách mã phim (movieId dạng chuỗi) và thông tin đầy đủ của phim (object movie)
  let movieId = '';
  let movie = null;

  if (rawShowtime.movieId && typeof rawShowtime.movieId === 'object') {
    const populatedMovie = rawShowtime.movieId;
    movieId = String(populatedMovie._id || populatedMovie.id || '');
    movie = {
      ...populatedMovie,
      id: movieId,
    };
  } else {
    movieId = rawShowtime.movieId ? String(rawShowtime.movieId) : '';
    const mockMovie = (mockData.movies || []).find((m) => {
      return String(m.id) === movieId;
    });
    if (mockMovie) {
      movie = { ...mockMovie };
    }
  }

  // Bước 2: Tách mã phòng (roomId dạng chuỗi) và thông tin phòng chuẩn hóa (object room)
  let roomId = '';
  let room = null;

  if (rawShowtime.roomId && typeof rawShowtime.roomId === 'object') {
    const populatedRoom = normalizeRoom(rawShowtime.roomId);
    roomId = String(populatedRoom.id || '');
    room = populatedRoom;
  } else {
    roomId = rawShowtime.roomId ? String(rawShowtime.roomId) : '';
    const mockRoom = (mockData.rooms || []).find((r) => {
      return String(r.id) === roomId;
    });
    if (mockRoom) {
      room = normalizeRoom(mockRoom);
    }
  }

  // Bước 3: Chuẩn hóa giờ bắt đầu, giờ kết thúc và giá vé Thường / VIP
  const startTime = rawShowtime.startTime || rawShowtime.time || '09:00';
  const duration = movie && movie.duration ? Number(movie.duration) : 120;
  const endTime =
    rawShowtime.endTime || calculateEndTime(startTime, duration);

  let basePrice = 85000;
  if (rawShowtime.price !== undefined) {
    basePrice = Number(rawShowtime.price);
  } else if (rawShowtime.basePrice !== undefined) {
    basePrice = Number(rawShowtime.basePrice);
  }

  let vipSurcharge = 15000;
  if (rawShowtime.vipSurcharge !== undefined) {
    vipSurcharge = Number(rawShowtime.vipSurcharge);
  } else if (rawShowtime.vipPrice !== undefined) {
    vipSurcharge = Math.max(0, Number(rawShowtime.vipPrice) - basePrice);
  }

  const vipPrice = basePrice + vipSurcharge;

  // Bước 4: Tính số ghế đã bán và phần trăm lấp đầy phòng chiếu
  const bookedSeats = Array.isArray(rawShowtime.bookedSeats)
    ? rawShowtime.bookedSeats
    : [];
  const totalSeats = room && room.totalSeats ? Number(room.totalSeats) : 80;
  const bookedCount = bookedSeats.length;

  let fillPercent = 0;
  if (totalSeats > 0) {
    fillPercent = Math.round((bookedCount / totalSeats) * 100);
    if (fillPercent > 100) {
      fillPercent = 100;
    }
  }

  const showtimeId = String(rawShowtime._id || rawShowtime.id || '');

  return {
    id: showtimeId,
    _id: showtimeId,
    movieId,
    roomId,
    date: rawShowtime.date || '',
    time: startTime,
    startTime,
    endTime,
    price: basePrice,
    basePrice,
    vipSurcharge,
    vipPrice,
    movie,
    room,
    bookedSeats,
    bookedCount,
    totalSeats,
    fillPercent,
  };
};

// Hàm phụ: kiểm tra chồng giờ chiếu khi chạy chế độ offline (server đã tự kiểm tra khi online)
export const findOverlappingShowtime = (
  candidate,
  existingShowtimes,
  ignoreId = null
) => {
  const candidateMovie = (mockData.movies || []).find((item) => {
    return String(item.id) === String(candidate.movieId);
  });
  const candidateDuration = candidateMovie
    ? Number(candidateMovie.duration)
    : 120;
  const candidateStart = timeToMinutes(candidate.startTime || candidate.time);
  const candidateEnd = candidateStart + candidateDuration;

  for (const item of existingShowtimes) {
    if (ignoreId && String(item.id) === String(ignoreId)) {
      continue;
    }

    const isSameRoom = String(item.roomId) === String(candidate.roomId);
    const isSameDate = String(item.date) === String(candidate.date);

    if (isSameRoom && isSameDate) {
      const existingMovie = (mockData.movies || []).find((m) => {
        return String(m.id) === String(item.movieId);
      });
      const existingDuration = existingMovie
        ? Number(existingMovie.duration)
        : 120;
      const existingStart = timeToMinutes(item.startTime || item.time);
      const existingEnd = existingStart + existingDuration;

      if (candidateStart < existingEnd && candidateEnd > existingStart) {
        return {
          movieTitle: existingMovie ? existingMovie.title : 'Suất chiếu khác',
          time: item.startTime || item.time,
          endTime: calculateEndTime(
            item.startTime || item.time,
            existingDuration
          ),
        };
      }
    }
  }

  return null;
};

// 1. Lấy danh sách toàn bộ suất chiếu (hỗ trợ lọc theo movieId, roomId, date)
export const getAllShowtimes = async (filters = {}) => {
  const url = `${API_BASE_URL}/showtimes`;
  const config = getRequestConfig();
  config.params = filters;

  try {
    const response = await axios.get(url, config);
    const data = response.data;
    const rawList = data.data || data.showtimes || [];

    if (Array.isArray(rawList)) {
      return rawList.map((item) => normalizeShowtime(item));
    }
    return [];
  } catch (error) {
    // Nếu server đang chạy nhưng trả lỗi nghiệp vụ thì báo lỗi lên giao diện
    if (error.response) {
      const serverData = error.response.data || {};
       
      throw new Error(
        serverData.message || 'Không thể tải danh sách suất chiếu.'
      );
    }

    // Nếu server tắt thì dùng dữ liệu cục bộ
    console.warn('Server offline, lấy danh sách suất chiếu cục bộ');
    const localList = readLocalShowtimes();
    return localList.map((item) => normalizeShowtime(item));
  }
};

// 2. Lấy chi tiết 1 suất chiếu theo ID (GET /api/showtimes/:id)
export const getShowtimeById = async (showtimeId) => {
  const url = `${API_BASE_URL}/showtimes/${showtimeId}`;

  try {
    const response = await axios.get(url, getRequestConfig());
    const raw = response.data.data || response.data;
    return normalizeShowtime(raw);
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404 || error.response.status === 400) {
        return null;
      }
      const serverData = error.response.data || {};
       
      throw new Error(
        serverData.message || 'Không thể tải thông tin suất chiếu.'
      );
    }

    // Fallback khi server chưa chạy: tìm trong localStorage / mockData
    const localList = readLocalShowtimes();
    const found = localList.find((item) => {
      return String(item.id) === String(showtimeId);
    });

    return found ? normalizeShowtime(found) : null;
  }
};

// 3. Tạo suất chiếu mới (POST /api/showtimes - gửi đúng tên trường của Showtime.js)
export const createShowtime = async (formData) => {
  const url = `${API_BASE_URL}/showtimes`;
  const price = Number(formData.basePrice);
  const vipPrice = Number(formData.vipPrice);
  const vipSurcharge = Math.max(0, vipPrice - price);

  const payload = {
    movieId: formData.movieId,
    roomId: formData.roomId,
    date: formData.date,
    startTime: formData.time,
    price,
    vipSurcharge,
  };

  try {
    const response = await axios.post(url, payload, getRequestConfig());
    const created = response.data.data || response.data;
    return normalizeShowtime(created);
  } catch (error) {
    // Nếu server báo lỗi (VD: 409 trùng giờ chiếu, 400, 401, 403) thì hiển thị ngay
    if (error.response) {
      const serverData = error.response.data || {};
       
      throw new Error(
        serverData.message || 'Không thể tạo suất chiếu. Vui lòng thử lại.'
      );
    }

    // Fallback khi server chưa bật
    const currentList = readLocalShowtimes();
    const conflict = findOverlappingShowtime(payload, currentList);

    if (conflict) {
      throw new Error(
        `Phòng chiếu đã bị trùng giờ với phim "${conflict.movieTitle}" (${conflict.time} → ${conflict.endTime}). Vui lòng chọn giờ hoặc phòng khác!`
      );
    }

    const newShowtime = {
      id: `st-${Date.now()}`,
      movieId: payload.movieId,
      roomId: payload.roomId,
      date: payload.date,
      time: payload.startTime,
      startTime: payload.startTime,
      basePrice: price,
      price,
      vipSurcharge,
      bookedSeats: [],
    };

    saveLocalShowtimes([newShowtime, ...currentList]);
    return normalizeShowtime(newShowtime);
  }
};

// 4. Cập nhật suất chiếu (PUT /api/showtimes/:id)
export const updateShowtime = async (showtimeId, formData) => {
  const url = `${API_BASE_URL}/showtimes/${showtimeId}`;
  const price = Number(formData.basePrice);
  const vipPrice = Number(formData.vipPrice);
  const vipSurcharge = Math.max(0, vipPrice - price);

  const payload = {
    movieId: formData.movieId,
    roomId: formData.roomId,
    date: formData.date,
    startTime: formData.time,
    price,
    vipSurcharge,
  };

  try {
    const response = await axios.put(url, payload, getRequestConfig());
    const updated = response.data.data || response.data;
    return normalizeShowtime(updated);
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      throw new Error(
        serverData.message || 'Không thể cập nhật suất chiếu. Vui lòng thử lại.'
      );
    }

    const currentList = readLocalShowtimes();
    const conflict = findOverlappingShowtime(payload, currentList, showtimeId);

    if (conflict) {
      throw new Error(
        `Phòng chiếu đã bị trùng giờ với phim "${conflict.movieTitle}" (${conflict.time} → ${conflict.endTime}). Vui lòng chọn giờ hoặc phòng khác!`
      );
    }

    let updatedRaw = null;
    const updatedList = currentList.map((item) => {
      if (String(item.id) === String(showtimeId)) {
        updatedRaw = {
          ...item,
          movieId: payload.movieId,
          roomId: payload.roomId,
          date: payload.date,
          time: payload.startTime,
          startTime: payload.startTime,
          basePrice: price,
          price,
          vipSurcharge,
        };
        return updatedRaw;
      }
      return item;
    });

    if (!updatedRaw) {
      throw new Error('Không tìm thấy suất chiếu cần chỉnh sửa.');
    }

    saveLocalShowtimes(updatedList);
    return normalizeShowtime(updatedRaw);
  }
};

// 5. Xóa suất chiếu (DELETE /api/showtimes/:id)
export const deleteShowtime = async (showtimeId) => {
  const url = `${API_BASE_URL}/showtimes/${showtimeId}`;

  try {
    await axios.delete(url, getRequestConfig());
    return true;
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      throw new Error(
        serverData.message || 'Không thể xóa suất chiếu. Vui lòng thử lại.'
      );
    }

    const currentList = readLocalShowtimes();
    const remaining = currentList.filter((item) => {
      return String(item.id) !== String(showtimeId);
    });

    saveLocalShowtimes(remaining);
    return true;
  }
};