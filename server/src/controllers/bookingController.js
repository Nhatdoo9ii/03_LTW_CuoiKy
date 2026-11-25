// Skeleton Booking Controller - Thành viên phụ trách Đặt vé & Thanh toán (Hoàng Hải) triển khai chi tiết tại đây

// @desc    Đặt vé mới (cần chặn trùng ghế trả mã 409 Conflict)
// @route   POST /api/bookings
// @access  Private (Member, Admin)
export const createBooking = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng đặt vé chưa được triển khai (TODO: bookingController.createBooking)',
  });
};

// @desc    Lấy lịch sử đặt vé của người dùng đang đăng nhập
// @route   GET /api/bookings/my-tickets
// @access  Private
export const getMyBookings = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng xem lịch sử vé chưa được triển khai (TODO: bookingController.getMyBookings)',
  });
};

// @desc    Lấy chi tiết 1 vé
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng xem chi tiết vé chưa được triển khai (TODO: bookingController.getBookingById)',
  });
};

// @desc    Hủy vé (kiểm tra điều kiện trước giờ chiếu >= 2 tiếng)
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng hủy vé chưa được triển khai (TODO: bookingController.cancelBooking)',
  });
};

