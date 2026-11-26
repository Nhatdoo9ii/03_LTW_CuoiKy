import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Hàm phụ tạo JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400);
      throw new Error('Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Kiểm tra trùng email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409);
      throw new Error('Email này đã được sử dụng');
    }

    // Tự động nhận diện sinh viên PTIT
    const isStudent = normalizedEmail.endsWith('@stu.ptit.edu.vn');

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      password,
      role: 'member',
      isStudent,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isStudent: user.isStudent,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Vui lòng nhập email và mật khẩu');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Lấy kèm trường password (vốn đang select: false trong Model)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isStudent: user.isStudent,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin tài khoản hiện tại
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};