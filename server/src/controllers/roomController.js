// Skeleton Room Controller - Thành viên phụ trách Phòng chiếu triển khai chi tiết tại đây

// @desc    Lấy danh sách phòng chiếu
// @route   GET /api/rooms
// @access  Public
export const getRooms = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng lấy danh sách phòng chưa được triển khai (TODO: roomController.getRooms)',
  });
};

// @desc    Lấy chi tiết phòng chiếu
// @route   GET /api/rooms/:id
// @access  Public
export const getRoomById = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng lấy chi tiết phòng chưa được triển khai (TODO: roomController.getRoomById)',
  });
};

// @desc    Tạo phòng chiếu mới
// @route   POST /api/rooms
// @access  Private (Admin)
export const createRoom = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng tạo phòng chưa được triển khai (TODO: roomController.createRoom)',
  });
};

// @desc    Cập nhật phòng chiếu
// @route   PUT /api/rooms/:id
// @access  Private (Admin)
export const updateRoom = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng cập nhật phòng chưa được triển khai (TODO: roomController.updateRoom)',
  });
};

// @desc    Xóa phòng chiếu
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
export const deleteRoom = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng xóa phòng chưa được triển khai (TODO: roomController.deleteRoom)',
  });
};

