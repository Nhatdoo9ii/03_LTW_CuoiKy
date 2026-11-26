import axios from 'axios';
import mockData from '../data/mockData.json';

// Địa chỉ gốc của Backend API (mặc định cổng 5001 khớp với server)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Khóa lưu danh sách phòng trong localStorage khi server chưa chạy
export const LOCAL_ROOMS_KEY = 'ptit_rooms';

// Danh sách cụm rạp chi nhánh hiển thị trong form
export const CINEMA_BRANCHES = [
  'PTIT Cinema Hà Đông - Trụ sở chính',
  'PTIT Cinema Hoàng Quốc Việt',
];

// Danh sách công nghệ trình chiếu & âm thanh (khớp theo giao diện mẫu)
export const ROOM_TECHNOLOGIES = [
  {
    id: 'imax',
    shortLabel: 'IMAX Laser',
    fullLabel: 'IMAX Laser 4K & Dolby Atmos 64.2',
  },
  {
    id: 'digital',
    shortLabel: '2D Digital Cinema',
    fullLabel: '2D Digital Cinema & Âm thanh vòm 5.1',
  },
  {
    id: 'dolby',
    shortLabel: '2D Dolby 7.1',
    fullLabel: '2D Dolby 7.1 Surround',
  },
  {
    id: 'vip',
    shortLabel: 'VIP Gold Class',
    fullLabel: 'VIP Gold Class (Ghế ngả cao cấp)',
  },
];

// Hàm phụ: tạo cấu hình gửi kèm JWT token lên server (dành cho quyền Admin)
const getRequestConfig = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    timeout: 5000,
    headers,
  };
};

// Hàm phụ: nhận diện công nghệ chiếu dựa trên tên phòng hoặc sức chứa (không cần sửa Schema Room.js)
export const detectRoomTechnology = (roomName, totalSeats) => {
  const lowerName = String(roomName || '').toLowerCase();

  if (lowerName.includes('imax')) {
    return ROOM_TECHNOLOGIES[0];
  }
  if (lowerName.includes('dolby')) {
    return ROOM_TECHNOLOGIES[2];
  }
  if (lowerName.includes('gold') || lowerName.includes('vip')) {
    return ROOM_TECHNOLOGIES[3];
  }
  if (lowerName.includes('digital')) {
    return ROOM_TECHNOLOGIES[1];
  }

  // Nếu là dữ liệu phòng mẫu cũ chưa ghi kèm tên công nghệ thì tự phân loại theo sức chứa
  const seats = Number(totalSeats) || 80;
  if (seats >= 110) {
    return ROOM_TECHNOLOGIES[0];
  }
  if (seats <= 50) {
    return ROOM_TECHNOLOGIES[3];
  }
  return ROOM_TECHNOLOGIES[1];
};

// Hàm phụ: chuẩn hóa object phòng chiếu từ MongoDB hoặc mockData về cùng 1 cấu trúc thống nhất
export const normalizeRoom = (room) => {
  if (!room) {
    return null;
  }

  let totalRows = 8;
  if (room.totalRows !== undefined) {
    totalRows = Number(room.totalRows);
  } else if (room.rows !== undefined) {
    totalRows = Number(room.rows);
  }

  let seatsPerRow = 10;
  if (room.seatsPerRow !== undefined) {
    seatsPerRow = Number(room.seatsPerRow);
  } else if (room.cols !== undefined) {
    seatsPerRow = Number(room.cols);
  }

  let isActive = true;
  if (room.isActive !== undefined) {
    isActive = Boolean(room.isActive);
  } else if (room.status === 'maintenance' || room.status === 'inactive') {
    isActive = false;
  }

  let vipRows = [];
  if (Array.isArray(room.vipRows)) {
    vipRows = room.vipRows.map((row) => String(row).trim().toUpperCase());
  }

  const totalSeats = totalRows * seatsPerRow;
  const name = room.name || 'Phòng chiếu';
  const techInfo = detectRoomTechnology(name, totalSeats);

  return {
    id: room._id || room.id,
    _id: room._id || room.id,
    name,
    totalRows,
    seatsPerRow,
    totalSeats,
    vipRows,
    isActive,
    status: isActive ? 'active' : 'maintenance',
    technologyId: techInfo.id,
    technologyLabel: techInfo.shortLabel,
  };
};

// Hàm phụ: đọc danh sách phòng từ localStorage (nếu chưa có thì nạp từ mockData.json)
const readLocalRooms = () => {
  try {
    const savedText = localStorage.getItem(LOCAL_ROOMS_KEY);
    if (savedText) {
      const parsed = JSON.parse(savedText);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizeRoom(item));
      }
    }
  } catch (error) {
    console.warn('Không thể đọc danh sách phòng từ localStorage:', error);
  }

  const initialRooms = (mockData.rooms || []).map((item) => normalizeRoom(item));
  localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(initialRooms));
  return initialRooms;
};

// Hàm phụ: lưu danh sách phòng vào localStorage
const saveLocalRooms = (rooms) => {
  try {
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
  } catch (error) {
    console.warn('Không thể lưu danh sách phòng vào localStorage:', error);
  }
};

// 1. Lấy danh sách toàn bộ phòng chiếu
export const getAllRooms = async () => {
  const url = `${API_BASE_URL}/rooms`;

  try {
    const response = await axios.get(url, getRequestConfig());
    const data = response.data;
    const rawList = data.data || data.rooms || [];

    if (Array.isArray(rawList)) {
      return rawList.map((item) => normalizeRoom(item));
    }
    return [];
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      throw new Error(
        serverData.message || 'Không thể tải danh sách phòng chiếu.', { cause: error }
      );
    }

    console.warn('Server offline, chuyển sang lấy danh sách phòng cục bộ');
    return readLocalRooms();
  }
};

// 2. Tạo phòng chiếu mới (gửi đúng 5 trường của Room.js lên POST /api/rooms)
export const createRoom = async (formData) => {
  const url = `${API_BASE_URL}/rooms`;
  const payload = {
    name: String(formData.name || '').trim(),
    totalRows: Number(formData.totalRows),
    seatsPerRow: Number(formData.seatsPerRow),
    vipRows: Array.isArray(formData.vipRows) ? formData.vipRows : [],
    isActive: formData.isActive !== undefined ? Boolean(formData.isActive) : true,
  };

  try {
    const response = await axios.post(url, payload, getRequestConfig());
    const created = response.data.data || response.data;
    return normalizeRoom(created);
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      // eslint-disable-next-line preserve-caught-error
      throw new Error(
        serverData.message || 'Không thể tạo phòng chiếu mới. Vui lòng thử lại.'
      );
    }

    // Fallback khi server tắt: kiểm tra trùng tên và lưu vào localStorage
    const currentRooms = readLocalRooms();
    const isDuplicate = currentRooms.some((room) => {
      return room.name.toLowerCase() === payload.name.toLowerCase();
    });

    if (isDuplicate) {
      // eslint-disable-next-line preserve-caught-error
      throw new Error(
        `Phòng chiếu "${payload.name}" đã tồn tại. Vui lòng đặt tên khác.`
      );
    }

    const newRoom = normalizeRoom({
      id: `r-${Date.now()}`,
      ...payload,
    });

    saveLocalRooms([...currentRooms, newRoom]);
    return newRoom;
  }
};

// 3. Cập nhật phòng chiếu hoặc bật/tắt trạng thái Bảo trì (PUT /api/rooms/:id)
export const updateRoom = async (roomId, formData) => {
  const url = `${API_BASE_URL}/rooms/${roomId}`;
  const payload = {
    name: String(formData.name || '').trim(),
    totalRows: Number(formData.totalRows),
    seatsPerRow: Number(formData.seatsPerRow),
    vipRows: Array.isArray(formData.vipRows) ? formData.vipRows : [],
    isActive: Boolean(formData.isActive),
  };

  try {
    const response = await axios.put(url, payload, getRequestConfig());
    const updated = response.data.data || response.data;
    return normalizeRoom(updated);
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      // eslint-disable-next-line preserve-caught-error
      throw new Error(
        serverData.message || 'Không thể cập nhật phòng chiếu. Vui lòng thử lại.'
      );
    }

    const currentRooms = readLocalRooms();
    const isDuplicate = currentRooms.some((room) => {
      const isOtherRoom = String(room.id) !== String(roomId);
      const isSameName = room.name.toLowerCase() === payload.name.toLowerCase();
      return isOtherRoom && isSameName;
    });

    if (isDuplicate) {
      // eslint-disable-next-line preserve-caught-error
      throw new Error(
        `Tên phòng "${payload.name}" đã được sử dụng bởi phòng khác.`
      );
    }

    let updatedRoom = null;
    const updatedList = currentRooms.map((room) => {
      if (String(room.id) === String(roomId)) {
        updatedRoom = normalizeRoom({ ...room, ...payload });
        return updatedRoom;
      }
      return room;
    });

    if (!updatedRoom) {
      // eslint-disable-next-line preserve-caught-error
      throw new Error('Không tìm thấy phòng chiếu cần chỉnh sửa.');
    }

    saveLocalRooms(updatedList);
    return updatedRoom;
  }
};

// 4. Xóa phòng chiếu (DELETE /api/rooms/:id)
export const deleteRoom = async (roomId) => {
  const url = `${API_BASE_URL}/rooms/${roomId}`;

  try {
    await axios.delete(url, getRequestConfig());
    return true;
  } catch (error) {
    if (error.response) {
      const serverData = error.response.data || {};
      // eslint-disable-next-line preserve-caught-error
      throw new Error(
        serverData.message || 'Không thể xóa phòng chiếu. Vui lòng thử lại.'
      );
    }

    const currentRooms = readLocalRooms();
    const remaining = currentRooms.filter((room) => {
      return String(room.id) !== String(roomId);
    });

    saveLocalRooms(remaining);
    return true;
  }
};