// Middleware bắt route không tồn tại (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy tài nguyên: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware xử lý lỗi tập trung chuẩn đề bài
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
