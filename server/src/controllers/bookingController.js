import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';

// @desc    Đặt vé mới (tối đa 8 ghế, chặn trùng ghế trả mã 409 Conflict, tính giảm giá & sinh mã QR)
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res, next) => {
  try {
    const { showtimeId, seats, combos = [], paymentMethod = 'MoMo' } = req.body;

    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      res.status(400);
      throw new Error('Vui lòng chọn suất chiếu và ít nhất 1 ghế ngồi');
    }

    if (seats.length > 8) {
      res.status(400);
      throw new Error('Mỗi lần đặt chỉ được chọn tối đa 8 ghế');
    }

    const requestedSeatIds = seats.map((s) =>
      typeof s === 'string' ? s.trim().toUpperCase() : s.seatId.trim().toUpperCase()
    );

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
      res.status(409);
      throw new Error(
        `Ghế ${alreadyBooked.join(', ')} đã có người đặt. Vui lòng chọn ghế khác!`
      );
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

    const ticketSubtotal = formattedSeats.reduce((sum, item) => sum + item.price, 0);
    const comboSubtotal = Array.isArray(combos)
      ? combos.reduce((sum, c) => sum + (c.price || 0) * (c.quantity || 1), 0)
      : 0;

    const originalPrice = ticketSubtotal + comboSubtotal;
    const discountAmount = req.user.isStudent ? Math.round(ticketSubtotal * 0.15) : 0;
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
      res.status(409);
      throw new Error('Một hoặc nhiều ghế vừa được người khác đặt trước. Vui lòng thử lại!');
    }

    const booking = await Booking.create({
      bookingCode,
      userId: req.user._id,
      showtimeId,
      seats: formattedSeats,
      combos,
      originalPrice,
      discountAmount,
      totalPrice,
      paymentMethod,
      status: 'confirmed',
      qrCode,
    });

    const populatedBooking = await Booking.findById(booking._id).populate({
      path: 'showtimeId',
      populate: [
        { path: 'movieId', select: 'title posterUrl duration ageRating' },
        { path: 'roomId', select: 'name' },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Đặt vé thành công',
      data: populatedBooking,
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
          { path: 'movieId', select: 'title posterUrl duration ageRating genres' },
          { path: 'roomId', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
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
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'fullName email phone isStudent')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration ageRating genres' },
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
      data: booking,
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
    const booking = await Booking.findById(req.params.id).populate('showtimeId');

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
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};