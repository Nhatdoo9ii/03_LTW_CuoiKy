import Showtime from '../models/Showtime.js';
import Movie from '../models/Movie.js';
import Room from '../models/Room.js';

// Hàm phụ: đổi chuỗi giờ "18:30" thành tổng số phút tính từ 00:00 (VD: 1110 phút)
const timeToMinutes = (timeStr) => {
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

// Hàm phụ: tính giờ kết thúc từ giờ bắt đầu và thời lượng phim (VD: "18:30" + 135p -> "20:45")
const calculateEndTime = (startTime, durationMinutes) => {
  const startTotal = timeToMinutes(startTime);
  const duration = Number(durationMinutes) || 120;
  const endTotal = startTotal + duration;

  // Chia lấy dư cho 24 giờ nếu suất chiếu kéo dài qua 00:00
  const endHours = Math.floor(endTotal / 60) % 24;
  const endMinutes = endTotal % 60;

  const hourText = String(endHours).padStart(2, '0');
  const minuteText = String(endMinutes).padStart(2, '0');

  return `${hourText}:${minuteText}`;
};

// Hàm phụ: kiểm tra xem khung giờ mới có bị chồng lên suất chiếu nào trong cùng phòng & cùng ngày không
const findOverlappingShowtime = (
  newStartTime,
  newDuration,
  existingList,
  ignoreShowtimeId = null
) => {
  const newStart = timeToMinutes(newStartTime);
  const newEnd = newStart + Number(newDuration);

  for (const existing of existingList) {
    // Nếu đang sửa chính suất chiếu này thì bỏ qua không so sánh với chính nó
    if (ignoreShowtimeId && String(existing._id) === String(ignoreShowtimeId)) {
      continue;
    }

    let existingDuration = 120;
    if (existing.movieId && existing.movieId.duration) {
      existingDuration = Number(existing.movieId.duration);
    }

    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = existingStart + existingDuration;

    // Hai khoảng thời gian bị trùng nhau khi: bắt đầu suất mới < kết thúc suất cũ VÀ kết thúc suất mới > bắt đầu suất cũ
    if (newStart < existingEnd && newEnd > existingStart) {
      const conflictMovieTitle =
        existing.movieId && existing.movieId.title
          ? existing.movieId.title
          : 'Suất chiếu khác';

      const conflictEndTime =
        existing.endTime ||
        calculateEndTime(existing.startTime, existingDuration);

      return {
        movieTitle: conflictMovieTitle,
        startTime: existing.startTime,
        endTime: conflictEndTime,
      };
    }
  }

  return null;
};

// Hàm phụ: đọc và chuẩn hóa giá vé thường + phụ thu VIP từ req.body
const parseShowtimePrices = (body) => {
  // Hỗ trợ cả 2 tên trường: price (chuẩn Backend) và basePrice (từ Frontend)
  let basePrice = 85000;
  if (body.price !== undefined) {
    basePrice = Number(body.price);
  } else if (body.basePrice !== undefined) {
    basePrice = Number(body.basePrice);
  }

  // Nếu gửi lên vipSurcharge thì dùng trực tiếp, nếu gửi vipPrice thì lấy hiệu (vipPrice - basePrice)
  let vipSurcharge = 15000;
  if (body.vipSurcharge !== undefined) {
    vipSurcharge = Number(body.vipSurcharge);
  } else if (body.vipPrice !== undefined) {
    vipSurcharge = Number(body.vipPrice) - basePrice;
  }

  return { basePrice, vipSurcharge };
};

// @desc    Lấy danh sách suất chiếu (hỗ trợ lọc theo movieId, roomId, date)
// @route   GET /api/showtimes
// @access  Public
export const getShowtimes = async (req, res, next) => {
  try {
    const { movieId, roomId, date } = req.query;
    const filter = {};

    // Bước 1: Tạo điều kiện lọc nếu người dùng có truyền tham số trên URL
    if (movieId) {
      filter.movieId = movieId;
    }
    if (roomId) {
      filter.roomId = roomId;
    }
    if (date) {
      filter.date = date;
    }

    // Bước 2: Truy vấn MongoDB kèm thông tin chi tiết phim và phòng chiếu bằng .populate()
    const showtimes = await Showtime.find(filter)
      .populate('movieId', 'title originalTitle genres duration ageRating posterUrl status')
      .populate('roomId', 'name totalRows seatsPerRow vipRows isActive')
      .sort({ date: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      total: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Lấy chi tiết 1 suất chiếu (dùng cho trang SeatSelectionPage lấy sơ đồ phòng và ghế đã bán)
// @route   GET /api/showtimes/:id
// @access  Public
export const getShowtimeById = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movieId', 'title originalTitle genres duration ageRating posterUrl status')
      .populate('roomId', 'name totalRows seatsPerRow vipRows isActive');

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy suất chiếu này',
      });
    }

    return res.status(200).json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Tạo suất chiếu mới (chặn trùng giờ trong cùng phòng chiếu -> trả lỗi 409)
// @route   POST /api/showtimes
// @access  Private (Admin)
export const createShowtime = async (req, res, next) => {
  try {
    const body = req.body || {};
    const movieId = body.movieId;
    const roomId = body.roomId;
    const date = body.date;
    // Hỗ trợ cả 2 tên trường: startTime (chuẩn Backend) và time (từ Frontend)
    const startTime = body.startTime || body.time;

    // Bước 1: Kiểm tra các trường bắt buộc
    if (!movieId || !roomId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn đầy đủ phim, phòng chiếu, ngày chiếu và giờ bắt đầu',
      });
    }

    // Bước 2: Kiểm tra giá vé hợp lệ
    const { basePrice, vipSurcharge } = parseShowtimePrices(body);

    if (Number.isNaN(basePrice) || basePrice < 30000) {
      return res.status(400).json({
        success: false,
        message: 'Giá vé thường phải là số và từ 30.000đ trở lên',
      });
    }

    if (Number.isNaN(vipSurcharge) || vipSurcharge < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá vé VIP phải lớn hơn hoặc bằng giá vé thường',
      });
    }

    // Bước 3: Kiểm tra phim và phòng chiếu có tồn tại trong MongoDB không
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bộ phim đã chọn',
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chiếu đã chọn',
      });
    }

    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        message: `Phòng "${room.name}" hiện đang tạm ngưng/bảo trì, không thể tạo suất chiếu`,
      });
    }

    // Bước 4: Kiểm tra trùng giờ với các suất chiếu đã có trong cùng phòng và cùng ngày
    const sameRoomShowtimes = await Showtime.find({ roomId, date }).populate(
      'movieId',
      'title duration'
    );

    const conflict = findOverlappingShowtime(
      startTime,
      movie.duration,
      sameRoomShowtimes
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Trùng giờ chiếu tại ${room.name}! Phim "${conflict.movieTitle}" đang chiếu từ ${conflict.startTime} đến ${conflict.endTime}.`,
      });
    }

    // Bước 5: Tự tính giờ kết thúc và lưu suất chiếu mới vào MongoDB
    const endTime = calculateEndTime(startTime, movie.duration);

    const createdShowtime = await Showtime.create({
      movieId,
      roomId,
      date,
      startTime,
      endTime,
      price: basePrice,
      vipSurcharge,
      bookedSeats: [],
    });

    // Nạp thêm thông tin phim và phòng để trả về cho giao diện Admin hiển thị ngay
    const populatedShowtime = await Showtime.findById(createdShowtime._id)
      .populate('movieId', 'title originalTitle genres duration ageRating posterUrl status')
      .populate('roomId', 'name totalRows seatsPerRow vipRows isActive');

    return res.status(201).json({
      success: true,
      message: 'Tạo suất chiếu mới thành công',
      data: populatedShowtime,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Cập nhật suất chiếu (vẫn kiểm tra chống chồng giờ trong cùng phòng -> trả lỗi 409)
// @route   PUT /api/showtimes/:id
// @access  Private (Admin)
export const updateShowtime = async (req, res, next) => {
  try {
    const existingShowtime = await Showtime.findById(req.params.id);
    if (!existingShowtime) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy suất chiếu cần cập nhật',
      });
    }

    const body = req.body || {};
    const movieId = body.movieId || existingShowtime.movieId;
    const roomId = body.roomId || existingShowtime.roomId;
    const date = body.date || existingShowtime.date;
    const startTime = body.startTime || body.time || existingShowtime.startTime;

    // Kiểm tra giá vé mới
    const { basePrice, vipSurcharge } = parseShowtimePrices({
      price: body.price !== undefined ? body.price : body.basePrice !== undefined ? body.basePrice : existingShowtime.price,
      vipSurcharge: body.vipSurcharge,
      vipPrice: body.vipPrice,
    });

    if (Number.isNaN(basePrice) || basePrice < 30000) {
      return res.status(400).json({
        success: false,
        message: 'Giá vé thường phải từ 30.000đ trở lên',
      });
    }

    if (Number.isNaN(vipSurcharge) || vipSurcharge < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá vé VIP phải lớn hơn hoặc bằng giá vé thường',
      });
    }

    // Kiểm tra phim và phòng chiếu có tồn tại không
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bộ phim đã chọn',
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chiếu đã chọn',
      });
    }

    // Kiểm tra trùng giờ với các suất chiếu khác trong cùng phòng & ngày (bỏ qua chính nó)
    const sameRoomShowtimes = await Showtime.find({ roomId, date }).populate(
      'movieId',
      'title duration'
    );

    const conflict = findOverlappingShowtime(
      startTime,
      movie.duration,
      sameRoomShowtimes,
      existingShowtime._id
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Trùng giờ chiếu tại ${room.name}! Phim "${conflict.movieTitle}" đang chiếu từ ${conflict.startTime} đến ${conflict.endTime}.`,
      });
    }

    // Cập nhật thông tin và lưu lại
    existingShowtime.movieId = movieId;
    existingShowtime.roomId = roomId;
    existingShowtime.date = date;
    existingShowtime.startTime = startTime;
    existingShowtime.endTime = calculateEndTime(startTime, movie.duration);
    existingShowtime.price = basePrice;
    existingShowtime.vipSurcharge = vipSurcharge;

    await existingShowtime.save();

    const populatedShowtime = await Showtime.findById(existingShowtime._id)
      .populate('movieId', 'title originalTitle genres duration ageRating posterUrl status')
      .populate('roomId', 'name totalRows seatsPerRow vipRows isActive');

    return res.status(200).json({
      success: true,
      message: 'Cập nhật suất chiếu thành công',
      data: populatedShowtime,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Xóa suất chiếu
// @route   DELETE /api/showtimes/:id
// @access  Private (Admin)
export const deleteShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy suất chiếu cần xóa',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa suất chiếu thành công',
    });
  } catch (error) {
    return next(error);
  }
};