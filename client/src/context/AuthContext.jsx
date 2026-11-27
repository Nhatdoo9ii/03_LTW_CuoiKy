import { createContext, useContext, useState, useEffect } from 'react';
import {
  getMeApi,
  loginApi,
  normalizeUser,
  registerApi,
} from '../services/authService';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    // Nếu còn sót token giả từ giai đoạn mock thì xóa để tránh lỗi 401 khi gọi API thật
    if (!token || token.startsWith('mock-jwt-token-') || !savedUser) {
      if (token && token.startsWith('mock-jwt-token-')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return null;
    }

    return normalizeUser(JSON.parse(savedUser));
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  // Đồng bộ thông tin tài khoản với /api/auth/me khi tải lại trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token.startsWith('mock-jwt-token-')) {
      return;
    }

    let isCancelled = false;

    const verifySession = async () => {
      try {
        const verifiedUser = await getMeApi(token);
        if (!isCancelled && verifiedUser) {
          localStorage.setItem('user', JSON.stringify(verifiedUser));
          setUser(verifiedUser);
        }
      } catch (err) {
        if (!isCancelled && err.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    };

    verifySession();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Lắng nghe thay đổi từ localStorage nếu mở nhiều tab
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(readStoredUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Đăng nhập bằng API thật và lưu JWT token vào localStorage
  const login = async (email, password) => {
    const { token, user: loggedInUser } = await loginApi(email, password);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  // Đăng ký tài khoản mới qua API thật
  const register = async ({ fullName, email, phone, password }) => {
    const { user: createdUser } = await registerApi({
      fullName,
      email,
      phone,
      password,
    });
    return createdUser;
  };

  // Đăng xuất thì xóa hết thông tin trong localStorage
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: readStoredUser(),
      login: async (email, password) => {
        const { token, user: loggedInUser } = await loginApi(email, password);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        return loggedInUser;
      },
      register: async (payload) => {
        const { user: createdUser } = await registerApi(payload);
        return createdUser;
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
    };
  }
  return context;
};
