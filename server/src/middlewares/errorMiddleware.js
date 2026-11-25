// Middleware bắt route không tồn tại (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy tài nguyên: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware xử lý lỗi tập trung chuẩn đề bài
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Lỗi máy chủ nội bộ';

  // Xử lý lỗi ObjectId không hợp lệ của Mongoose
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'ID tài nguyên không đúng định dạng';
  }

  // Xử lý lỗi validation của Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
