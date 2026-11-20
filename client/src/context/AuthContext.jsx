import { createContext, useContext, useState, useEffect } from 'react';
import mockData from '../data/mockData.json';

const AuthContext = createContext(null);

// Thêm sẵn tài khoản sinh viên để test đăng nhập
const defaultDemoUsers = [
  ...mockData.users,
  {
    id: 'u_longtb',
    fullName: 'Trần Bảo Long',
    email: 'longtb.b25cc130@stu.ptit.edu.vn',
    phone: '0364054979',
    role: 'member',
    isStudent: true,
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Lắng nghe thay đổi từ localStorage nếu mở nhiều tab
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Xử lý đăng nhập (tạm check với danh sách mẫu và user đăng ký lưu ở localStorage)
  const login = async (email, password) => {
    const registeredUsers = JSON.parse(localStorage.getItem('ptit_registered_users') || '[]');
    const allUsers = [...defaultDemoUsers, ...registeredUsers];

    const foundUser = allUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!foundUser) {
      throw new Error('Email không tồn tại trong hệ thống!');
    }

    // Tài khoản mới tạo thì check mật khẩu, còn tài khoản mẫu thì bỏ qua
    if (foundUser.password && foundUser.password !== password) {
      throw new Error('Mật khẩu không chính xác!');
    }

    // Đổi 'user' trong mockData thành 'member' cho khớp với phân quyền bên App.jsx
    const normalizedUser = {
      ...foundUser,
      role: foundUser.role === 'user' ? 'member' : foundUser.role,
    };

    const fakeToken = `mock-jwt-token-${normalizedUser.id}-${Date.now()}`;
    localStorage.setItem('token', fakeToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);

    return normalizedUser;
  };

  // Xử lý đăng ký tài khoản mới
  const register = async ({ fullName, email, phone, password }) => {
    const registeredUsers = JSON.parse(localStorage.getItem('ptit_registered_users') || '[]');
    const allUsers = [...defaultDemoUsers, ...registeredUsers];

    const isEmailExist = allUsers.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (isEmailExist) {
      throw new Error('Email này đã được sử dụng!');
    }

    // Check đuôi mail sinh viên PTIT để áp dụng ưu đãi vé
    const isStudent = email.trim().toLowerCase().endsWith('@stu.ptit.edu.vn');

    const newUser = {
      id: `u_${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: 'member',
      isStudent,
    };

    localStorage.setItem('ptit_registered_users', JSON.stringify([...registeredUsers, newUser]));
    return newUser;
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Phòng trường hợp App.jsx chưa bọc AuthProvider thì vẫn chạy được qua localStorage
  if (!context) {
    const savedUser = localStorage.getItem('user');
    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      login: async (email, password) => {
        const registeredUsers = JSON.parse(localStorage.getItem('ptit_registered_users') || '[]');
        const allUsers = [...defaultDemoUsers, ...registeredUsers];
        const foundUser = allUsers.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!foundUser) throw new Error('Email không tồn tại trong hệ thống!');
        if (foundUser.password && foundUser.password !== password) {
          throw new Error('Mật khẩu không chính xác!');
        }
        const normalizedUser = {
          ...foundUser,
          role: foundUser.role === 'user' ? 'member' : foundUser.role,
        };
        localStorage.setItem('token', `mock-jwt-token-${normalizedUser.id}-${Date.now()}`);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        return normalizedUser;
      },
      register: async ({ fullName, email, phone, password }) => {
        const registeredUsers = JSON.parse(localStorage.getItem('ptit_registered_users') || '[]');
        const allUsers = [...defaultDemoUsers, ...registeredUsers];
        if (allUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
          throw new Error('Email này đã được sử dụng!');
        }
        const newUser = {
          id: `u_${Date.now()}`,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role: 'member',
          isStudent: email.trim().toLowerCase().endsWith('@stu.ptit.edu.vn'),
        };
        localStorage.setItem('ptit_registered_users', JSON.stringify([...registeredUsers, newUser]));
        return newUser;
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
    };
  }
  return context;
};