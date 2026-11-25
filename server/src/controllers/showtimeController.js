// Skeleton Showtime Controller - Thành viên phụ trách Suất chiếu triển khai chi tiết tại đây

// @desc    Lấy danh sách suất chiếu
// @route   GET /api/showtimes
// @access  Public
export const getShowtimes = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng lấy danh sách suất chiếu chưa được triển khai (TODO: showtimeController.getShowtimes)',
  });
};

// @desc    Lấy chi tiết 1 suất chiếu
// @route   GET /api/showtimes/:id
// @access  Public
export const getShowtimeById = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng lấy chi tiết suất chiếu chưa được triển khai (TODO: showtimeController.getShowtimeById)',
  });
};

// @desc    Tạo suất chiếu mới (cần chặn chồng giờ trong cùng phòng)
// @route   POST /api/showtimes
// @access  Private (Admin)
export const createShowtime = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng tạo suất chiếu chưa được triển khai (TODO: showtimeController.createShowtime)',
  });
};

// @desc    Xóa suất chiếu
// @route   DELETE /api/showtimes/:id
// @access  Private (Admin)
export const deleteShowtime = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng xóa suất chiếu chưa được triển khai (TODO: showtimeController.deleteShowtime)',
  });
};

