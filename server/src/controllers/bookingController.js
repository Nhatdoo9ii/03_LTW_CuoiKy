import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';

// Chuẩn hóa dữ liệu vé trả về để tương thích cả MyTicketsPage và BookingSuccessPage
const formatBookingResponse = (bookingDoc, fallbackUser = null) => {
  const obj = bookingDoc.toObject ? bookingDoc.toObject() : bookingDoc;
  const populatedUser =
    obj.userId && typeof obj.userId === 'object' && obj.userId._id
      ? obj.userId
      : null;
  const userObj = populatedUser || fallbackUser;
  const rawUserId = populatedUser
    ? String(populatedUser._id)
    : String(obj.userId || fallbackUser?._id || '');

  const showtime =
    obj.showtimeId && typeof obj.showtimeId === 'object' && obj.showtimeId._id
      ? obj.showtimeId
      : null;
  const movie =
    showtime?.movieId && typeof showtime.movieId === 'object'
      ? showtime.movieId
      : null;
  const room =
    showtime?.roomId && typeof showtime.roomId === 'object'
      ? showtime.roomId
      : null;

  const seatDetails = (obj.seats || []).map((s) => ({
    seatId: s.seatId,
    code: s.seatId,
    type: s.type,
    price: s.price,
  }));
  const seatCodes = seatDetails.map((s) => s.seatId);

  const digitsOnly = String(obj.bookingCode || '').replace(/\D/g, '');
  const shortCode = digitsOnly.slice(-6) || '000000';

  return {
    ...obj,
    id: String(obj._id),
    shortCode,
    userId: rawUserId,
    userName: userObj?.fullName || '',
    userEmail: userObj?.email || '',
    userPhone: userObj?.phone || '',
    showtimeId: showtime ? String(showtime._id) : String(obj.showtimeId || ''),
    movieId: movie ? String(movie._id) : '',
    movieTitle: movie?.title || 'Phim chiếu rạp PTIT',
    originalTitle: movie?.originalTitle || '',
    posterUrl: movie?.posterUrl || '',
    ageRating: movie?.ageRating || 'P',
    roomId: room ? String(room._id) : '',
    roomName: room?.name || 'Phòng chiếu',
    date: showtime?.date || '',
    time: showtime?.startTime || '',
    startTime: showtime?.startTime || '',
    seats: seatCodes,
    seatDetails,
    subtotal: obj.originalPrice,
    totalAmount: obj.totalPrice,
  };
};

// @desc    Đặt vé mới (tối đa 8 ghế, chặn trùng ghế trả mã 409 Conflict, tính giảm giá & sinh mã QR)
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res, next) => {
  try {
    const {
      showtimeId,
      seats,
      combos = [],
      paymentMethod = 'MoMo',
      promoCode,
    } = req.body;

    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      res.status(400);
      throw new Error('Vui lòng chọn suất chiếu và ít nhất 1 ghế ngồi');
    }

    if (seats.length > 8) {
      res.status(400);
      throw new Error('Mỗi lần đặt chỉ được chọn tối đa 8 ghế');
    }

    const requestedSeatIds = seats.map((s) => {
      const rawId = typeof s === 'string' ? s : s?.seatId || s?.code || '';
      return String(rawId).trim().toUpperCase();
    });

    if (requestedSeatIds.some((id) => !id)) {
      res.status(400);
      throw new Error('Danh sách ghế chứa mã ghế không hợp lệ');
    }

    const uniqueSeatIds = [...new Set(requestedSeatIds)];
    if (uniqueSeatIds.length !== requestedSeatIds.length) {
      res.status(400);
      throw new Error('Danh sách ghế chọn bị trùng lặp');
    }

    const showtime = await Showtime.findById(showtimeId).populate('roomId');
    if (!showtime) {
      res.status(404);
      throw new Error('Không tìm thấy suất chiếu');
    }

    const alreadyBooked = uniqueSeatIds.filter((seatId) =>
      showtime.bookedSeats.includes(seatId)
    );
    if (alreadyBooked.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ghế ${alreadyBooked.join(', ')} đã có người đặt. Vui lòng chọn ghế khác!`,
        conflictSeats: alreadyBooked,
      });
    }

    const vipRows = showtime.roomId?.vipRows || ['D', 'E', 'F'];
    const formattedSeats = uniqueSeatIds.map((seatId) => {
      const rowLetter = seatId.charAt(0).toUpperCase();
      const isVip = vipRows.includes(rowLetter);
      const seatPrice = showtime.price + (isVip ? showtime.vipSurcharge : 0);
      return {
        seatId,
        type: isVip ? 'vip' : 'regular',
        price: seatPrice,
      };
    });

    const normalizedCombos = Array.isArray(combos)
      ? combos
          .filter((c) => (Number(c?.quantity) || 1) > 0)
          .map((c) => ({
            comboId: String(c.comboId || c.id || ''),
            name: String(c.name || ''),
            quantity: Number(c.quantity) || 1,
            price: Number(c.price) || 0,
          }))
      : [];

    const ticketSubtotal = formattedSeats.reduce((sum, item) => sum + item.price, 0);
    const comboSubtotal = normalizedCombos.reduce(
      (sum, c) => sum + c.price * c.quantity,
      0
    );

    const originalPrice = ticketSubtotal + comboSubtotal;
    const hasPromoField = Object.prototype.hasOwnProperty.call(req.body, 'promoCode');
    const cleanPromoCode = promoCode ? String(promoCode).trim().toUpperCase() : null;

    let discountAmount = 0;
    if (cleanPromoCode === 'PTIT35') {
      discountAmount = Math.round(ticketSubtotal * 0.35);
    } else if (!hasPromoField && req.user.isStudent) {
      discountAmount = Math.round(ticketSubtotal * 0.15);
    }

    const totalPrice = Math.max(0, originalPrice - discountAmount);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `BK-${Date.now().toString().slice(-6)}${randomSuffix}`;
    const qrCode = `PTIT-CINEMA|${bookingCode}|${uniqueSeatIds.join(',')}`;

    const updatedShowtime = await Showtime.findOneAndUpdate(
      {
        _id: showtimeId,
        bookedSeats: { $nin: uniqueSeatIds },
      },
      {
        $addToSet: { bookedSeats: { $each: uniqueSeatIds } },
      },
      { new: true }
    );

    if (!updatedShowtime) {
      return res.status(409).json({
        success: false,
        message: 'Một hoặc nhiều ghế vừa được người khác đặt trước. Vui lòng thử lại!',
        conflictSeats: uniqueSeatIds,
      });
    }

    const booking = await Booking.create({
      bookingCode,
      userId: req.user._id,
      showtimeId,
      seats: formattedSeats,
      combos: normalizedCombos,
      originalPrice,
      discountAmount,
      totalPrice,
      promoCode: cleanPromoCode,
      paymentMethod,
      status: 'confirmed',
      qrCode,
    });

    const populatedBooking = await Booking.findById(booking._id).populate({
      path: 'showtimeId',
      populate: [
        { path: 'movieId', select: 'title originalTitle posterUrl duration ageRating genres' },
        { path: 'roomId', select: 'name' },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Đặt vé thành công',
      data: formatBookingResponse(populatedBooking, req.user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy lịch sử đặt vé của người dùng đang đăng nhập
// @route   GET /api/bookings/my-tickets
// @access  Private
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title originalTitle posterUrl duration ageRating genres' },
          { path: 'roomId', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map((b) => formatBookingResponse(b, req.user)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết 1 vé
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? Booking.findById(id)
      : Booking.findOne({ bookingCode: id });

    const booking = await query
      .populate('userId', 'fullName email phone isStudent')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title originalTitle posterUrl duration ageRating genres' },
          { path: 'roomId', select: 'name' },
        ],
      });

    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy thông tin vé');
    }

    if (
      booking.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Bạn không có quyền xem vé này');
    }

    res.status(200).json({
      success: true,
      data: formatBookingResponse(booking),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hủy vé (kiểm tra điều kiện trước giờ chiếu >= 2 tiếng, hoàn ghế)
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'showtimeId',
      populate: [
        { path: 'movieId', select: 'title originalTitle posterUrl duration ageRating genres' },
        { path: 'roomId', select: 'name' },
      ],
    });

    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy vé cần hủy');
    }

    if (
      booking.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Bạn không có quyền hủy vé này');
    }

    if (booking.status === 'cancelled') {
      res.status(400);
      throw new Error('Vé này đã được hủy trước đó');
    }

    const showtime = booking.showtimeId;
    if (!showtime) {
      res.status(404);
      throw new Error('Không tìm thấy dữ liệu suất chiếu của vé');
    }

    const showtimeDateTime = new Date(`${showtime.date}T${showtime.startTime}:00+07:00`);
    const now = new Date();
    const diffHours = (showtimeDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      res.status(400);
      throw new Error('Chỉ được phép hủy vé trước giờ chiếu ít nhất 2 tiếng');
    }

    booking.status = 'cancelled';
    await booking.save();

    const seatsToRelease = booking.seats.map((s) => s.seatId);
    await Showtime.findByIdAndUpdate(showtime._id, {
      $pull: { bookedSeats: { $in: seatsToRelease } },
    });

    res.status(200).json({
      success: true,
      message: 'Hủy vé thành công và đã hoàn trả ghế',
      data: formatBookingResponse(booking, req.user),
    });
  } catch (error) {
    next(error);
  }
};