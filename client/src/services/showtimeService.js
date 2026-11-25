import axios from 'axios';
import mockData from '../data/mockData.json';

// Địa chỉ gốc của Backend API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Khóa lưu danh sách suất chiếu trong localStorage khi server chưa bật
export const LOCAL_SHOWTIMES_KEY = 'ptit_showtimes';

// Khóa lưu danh sách vé để đếm số ghế đã bán thực tế của từng suất chiếu
const LOCAL_BOOKINGS_KEY = 'ptit_bookings';

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
    timeout: 4000,
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

// Hàm phụ: tính giờ kết thúc từ giờ bắt đầu và thời lượng phim (VD: "18:30" + 142 phút -> "20:52")
export const calculateEndTime = (startTime, durationMinutes) => {
  if (!startTime) {
    return '--:--';
  }

  const startTotalMinutes = timeToMinutes(startTime);
  const duration = Number(durationMinutes) || 120;
  const endTotalMinutes = startTotalMinutes + duration;

  // Lấy phần dư cho 24 giờ đề phòng suất chiếu đêm qua 00:00
  const endHours = Math.floor(endTotalMinutes / 60) % 24;
  const endMinutes = endTotalMinutes % 60;

  const hourText = String(endHours).padStart(2, '0');
  const minuteText = String(endMinutes).padStart(2, '0');

  return `${hourText}:${minuteText}`;
};

// Hàm phụ: đọc danh sách suất chiếu lưu trong localStorage (nếu chưa có thì nạp từ mockData.json)
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
    console.warn('Không thể đọc danh sách suất chiếu từ localStorage:', error);
  }

  // Lần đầu tiên: sao chép dữ liệu mẫu từ mockData.json và lưu lại
  const initialList = mockData.showtimes.map((item) => ({ ...item }));
  localStorage.setItem(LOCAL_SHOWTIMES_KEY, JSON.stringify(initialList));
  return initialList;
};

// Hàm phụ: ghi danh sách suất chiếu vào localStorage
const saveLocalShowtimes = (showtimes) => {
  try {
    localStorage.setItem(LOCAL_SHOWTIMES_KEY, JSON.stringify(showtimes));
  } catch (error) {
    console.warn('Không thể lưu danh sách suất chiếu vào localStorage:', error);
  }
};

// Hàm phụ: đếm số ghế đã bán của 1 suất chiếu (gộp cả mockData và vé đặt ở localStorage)
const getBookedSeatsForShowtime = (showtime) => {
  let seatList = [];

  // Bước 1: Lấy các ghế đã bán sẵn trong dữ liệu suất chiếu
  if (Array.isArray(showtime.bookedSeats)) {
    for (const code of showtime.bookedSeats) {
      if (!seatList.includes(code)) {
        seatList = [...seatList, code];
      }
    }
  }

  // Bước 2: Cộng thêm các ghế khách mới đặt lưu trong ptit_bookings (bỏ qua vé đã hủy)
  try {
    const savedBookingsText = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    if (savedBookingsText) {
      const bookings = JSON.parse(savedBookingsText);
      if (Array.isArray(bookings)) {
        for (const booking of bookings) {
          const isSameShowtime =
            String(booking.showtimeId) === String(showtime.id);
          const isActive = booking.status !== 'cancelled';

          if (isSameShowtime && isActive && Array.isArray(booking.seats)) {
            for (const seat of booking.seats) {
              const seatCode = typeof seat === 'string' ? seat : seat.code;
              if (seatCode && !seatList.includes(seatCode)) {
                seatList = [...seatList, seatCode];
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Không thể đọc vé cục bộ để tính tỷ lệ lấp đầy:', error);
  }

  return seatList;
};

// Hàm phụ: gắn thêm thông tin phim, phòng, giờ kết thúc, giá VIP và tỷ lệ bán cho từng suất chiếu
const enrichShowtime = (showtime) => {
  const movie =
    mockData.movies.find((item) => String(item.id) === String(showtime.movieId)) ||
    null;
  const room =
    mockData.rooms.find((item) => String(item.id) === String(showtime.roomId)) ||
    null;

  const startTime = showtime.time || showtime.startTime || '09:00';
  const duration = movie ? Number(movie.duration) : 120;
  const endTime = calculateEndTime(startTime, duration);

  const basePrice = Number(showtime.basePrice) || 85000;
  let vipPrice = basePrice + 15000;
  if (showtime.vipPrice !== undefined) {
    vipPrice = Number(showtime.vipPrice);
  } else if (showtime.vipSurcharge !== undefined) {
    vipPrice = basePrice + Number(showtime.vipSurcharge);
  }

  const bookedSeats = getBookedSeatsForShowtime(showtime);
  const totalSeats = room && room.totalSeats ? Number(room.totalSeats) : 80;
  const bookedCount = bookedSeats.length;

  let fillPercent = 0;
  if (totalSeats > 0) {
    fillPercent = Math.round((bookedCount / totalSeats) * 100);
    if (fillPercent > 100) {
      fillPercent = 100;
    }
  }

  return {
    ...showtime,
    id: showtime.id || showtime._id,
    time: startTime,
    startTime,
    endTime,
    basePrice,
    vipPrice,
    vipSurcharge: Math.max(0, vipPrice - basePrice),
    movie,
    room,
    bookedSeats,
    bookedCount,
    totalSeats,
    fillPercent,
  };
};

// Hàm phụ: kiểm tra 1 suất chiếu mới có bị trùng giờ với suất đã có trong cùng phòng & cùng ngày không
export const findOverlappingShowtime = (
  candidate,
  existingShowtimes,
  ignoreId = null
) => {
  const candidateMovie = mockData.movies.find(
    (item) => String(item.id) === String(candidate.movieId)
  );
  const candidateDuration = candidateMovie ? Number(candidateMovie.duration) : 120;
  const candidateStart = timeToMinutes(candidate.time);
  const candidateEnd = candidateStart + candidateDuration;

  for (const item of existingShowtimes) {
    // Nếu đang chỉnh sửa chính suất chiếu đó thì bỏ qua chính nó
    if (ignoreId && String(item.id) === String(ignoreId)) {
      continue;
    }

    const isSameRoom = String(item.roomId) === String(candidate.roomId);
    const isSameDate = String(item.date) === String(candidate.date);

    if (isSameRoom && isSameDate) {
      const existingMovie = mockData.movies.find(
        (m) => String(m.id) === String(item.movieId)
      );
      const existingDuration = existingMovie ? Number(existingMovie.duration) : 120;
      const existingStart = timeToMinutes(item.time || item.startTime);
      const existingEnd = existingStart + existingDuration;

      // Hai khoảng thời gian [A, B) và [C, D) bị chồng lên nhau khi A < D và B > C
      if (candidateStart < existingEnd && candidateEnd > existingStart) {
        return {
          ...item,
          movieTitle: existingMovie ? existingMovie.title : 'Suất chiếu khác',
          endTime: calculateEndTime(item.time || item.startTime, existingDuration),
        };
      }
    }
  }

  return null;
};

// 1. Lấy danh sách Phim và Phòng chiếu để đổ vào 2 ô chọn trong Form
export const getMoviesAndRooms = () => {
  return {
    movies: mockData.movies,
    rooms: mockData.rooms,
  };
};

// 2. Lấy toàn bộ danh sách suất chiếu (ưu tiên API, fallback sang localStorage/mockData)
export const getAllShowtimes = async () => {
  const url = `${API_BASE_URL}/showtimes`;

  try {
    const response = await axios.get(url, getRequestConfig());
    const data = response.data;
    const rawList = data.showtimes || data.data || data;

    if (Array.isArray(rawList)) {
      return rawList.map((item) => enrichShowtime(item));
    }
    return [];
  } catch (error) {
    console.warn('Lấy danh sách suất chiếu từ dữ liệu cục bộ:', error.message);
    const localList = readLocalShowtimes();
    return localList.map((item) => enrichShowtime(item));
  }
};

// 3. Tạo suất chiếu mới (có kiểm tra chống trùng giờ trong cùng phòng chiếu)
export const createShowtime = async (formData) => {
  const url = `${API_BASE_URL}/showtimes`;
  const basePrice = Number(formData.basePrice);
  const vipPrice = Number(formData.vipPrice);

  const payload = {
    movieId: formData.movieId,
    roomId: formData.roomId,
    date: formData.date,
    time: formData.time,
    basePrice,
    vipPrice,
    vipSurcharge: Math.max(0, vipPrice - basePrice),
  };

  try {
    const response = await axios.post(url, payload, getRequestConfig());
    const data = response.data;
    const created = data.showtime || data.data || data;
    return enrichShowtime(created);
  } catch (error) {
    // Nếu server đang bật và báo lỗi (VD: 409 chồng giờ chiếu, 400, 403) thì báo lỗi ngay
    if (error.response) {
      const serverData = error.response.data || {};
      const message =
        serverData.message || 'Không thể tạo suất chiếu. Vui lòng thử lại.';
      const apiError = new Error(message);
      apiError.status = error.response.status;
      throw apiError;
    }

    // Fallback khi server tắt: kiểm tra chồng giờ trực tiếp trong dữ liệu cục bộ
    const currentList = readLocalShowtimes();
    const conflict = findOverlappingShowtime(payload, currentList);

    if (conflict) {
      const overlapError = new Error(
        `Phòng chiếu đã bị trùng giờ với phim "${conflict.movieTitle}" (${conflict.time} → ${conflict.endTime}). Vui lòng chọn giờ hoặc phòng khác!`
      );
      overlapError.status = 409;
      throw overlapError;
    }

    // Không bị trùng giờ -> tạo mã suất chiếu mới và lưu vào localStorage
    const newId = `st-${Date.now()}`;
    const newShowtime = {
      id: newId,
      ...payload,
      bookedSeats: [],
    };

    const updatedList = [newShowtime, ...currentList];
    saveLocalShowtimes(updatedList);

    return enrichShowtime(newShowtime);
  }
};

// 4. Cập nhật suất chiếu đã có (có kiểm tra chống trùng giờ với các suất khác)
export const updateShowtime = async (showtimeId, formData) => {
  const url = `${API_BASE_URL}/showtimes/${showtimeId}`;
  const basePrice = Number(formData.basePrice);
  const vipPrice = Number(formData.vipPrice);

  const payload = {
    movieId: formData.movieId,
    roomId: formData.roomId,
    date: formData.date,
    time: formData.time,
    basePrice,
    vipPrice,
    vipSurcharge: Math.max(0, vipPrice - basePrice),
  };

  try {
    const response = await axios.put(url, payload, getRequestConfig());
    const data = response.data;
    const updated = data.showtime || data.data || data;
    return enrichShowtime(updated);
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      const message =
        serverData.message || 'Không thể cập nhật suất chiếu. Vui lòng thử lại.';
      const apiError = new Error(message);
      apiError.status = error.response.status;
      throw apiError;
    }

    const currentList = readLocalShowtimes();
    const conflict = findOverlappingShowtime(payload, currentList, showtimeId);

    if (conflict) {
      const overlapError = new Error(
        `Phòng chiếu đã bị trùng giờ với phim "${conflict.movieTitle}" (${conflict.time} → ${conflict.endTime}). Vui lòng chọn giờ hoặc phòng khác!`
      );
      overlapError.status = 409;
      throw overlapError;
    }

    let updatedItem = null;
    const updatedList = currentList.map((item) => {
      if (String(item.id) === String(showtimeId)) {
        updatedItem = { ...item, ...payload };
        return updatedItem;
      }
      return item;
    });

    if (!updatedItem) {
      throw new Error('Không tìm thấy suất chiếu cần chỉnh sửa.', { cause: error });
    }

    saveLocalShowtimes(updatedList);
    return enrichShowtime(updatedItem);
  }
};

// 5. Xóa suất chiếu theo ID
export const deleteShowtime = async (showtimeId) => {
  const url = `${API_BASE_URL}/showtimes/${showtimeId}`;

  try {
    await axios.delete(url, getRequestConfig());
    return true;
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      const message =
        serverData.message || 'Không thể xóa suất chiếu. Vui lòng thử lại.';
      throw new Error(message, { cause: error });
    }

    const currentList = readLocalShowtimes();
    const updatedList = currentList.filter((item) => {
      return String(item.id) !== String(showtimeId);
    });

    saveLocalShowtimes(updatedList);
    return true;
  }
};