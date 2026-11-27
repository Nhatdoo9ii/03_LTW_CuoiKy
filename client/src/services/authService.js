import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chuẩn hóa thông tin user từ MongoDB (_id) về format id dùng chung trên Frontend
export const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  const userId = String(rawUser._id || rawUser.id || '');
  return {
    ...rawUser,
    id: userId,
    _id: userId,
    role: rawUser.role === 'user' ? 'member' : rawUser.role || 'member',
  };
};

// Đăng nhập tài khoản qua POST /api/auth/login
export const loginApi = async (email, password) => {
  try {
    const response = await authClient.post('/auth/login', {
      email: String(email || '').trim(),
      password,
    });
    const { token, data } = response.data || {};
    if (!token || !data) {
      throw new Error('Phản hồi đăng nhập từ máy chủ không hợp lệ');
    }
    return {
      token,
      user: normalizeUser(data),
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.response
        ? 'Đăng nhập thất bại, vui lòng thử lại!'
        : 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra server!');
    throw new Error(message, { cause: error });
  }
};

// Đăng ký tài khoản mới qua POST /api/auth/register
export const registerApi = async ({ fullName, email, phone, password }) => {
  try {
    const response = await authClient.post('/auth/register', {
      fullName: String(fullName || '').trim(),
      email: String(email || '').trim(),
      phone: String(phone || '').trim(),
      password,
    });
    const { token, data } = response.data || {};
    if (!data) {
      throw new Error('Phản hồi đăng ký từ máy chủ không hợp lệ');
    }
    return {
      token,
      user: normalizeUser(data),
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.response
        ? 'Đăng ký thất bại, vui lòng thử lại!'
        : 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra server!');
    throw new Error(message, { cause: error });
  }
};

// Xác thực lại token hiện tại qua GET /api/auth/me
export const getMeApi = async (token) => {
  try {
    const response = await authClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return normalizeUser(response.data?.data);
  } catch (error) {
    const apiError = new Error(
      error.response?.data?.message || 'Phiên đăng nhập không hợp lệ',
      { cause: error }
    );
    apiError.status = error.response?.status;
    throw apiError;
  }
};
