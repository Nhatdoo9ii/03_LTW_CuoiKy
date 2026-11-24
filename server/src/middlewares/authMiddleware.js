import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Xác thực JWT token
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('Người dùng không còn tồn tại');
      }
      return next();
    } catch (error) {
      res.status(401);
      return next(new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn (401)'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Yêu cầu token xác thực, vui lòng đăng nhập trước (401)'));
  }
};

// Kiểm tra quyền (Role-based Authorization: admin, member)
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Bạn không có quyền truy cập tài nguyên này (403 Forbidden)'));
    }
    next();
  };
};
