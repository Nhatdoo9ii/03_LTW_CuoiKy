// Skeleton Auth Controller - Thành viên phụ trách Auth (Bảo Long) triển khai chi tiết tại đây

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng đăng ký chưa được triển khai (TODO: authController.register)',
  });
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng đăng nhập chưa được triển khai (TODO: authController.login)',
  });
};

// @desc    Lấy thông tin tài khoản hiện tại
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Chức năng lấy thông tin user chưa được triển khai (TODO: authController.getMe)',
  });
};

