import Room from '../models/Room.js';
import Showtime from '../models/Showtime.js';

// Hàm phụ: tạo danh sách tên các hàng ghế hợp lệ từ số hàng (VD: 4 hàng -> ['A', 'B', 'C', 'D'])
const getValidRowLabels = (totalRows) => {
  let labels = [];
  for (let i = 0; i < totalRows; i += 1) {
    // Mã ASCII của chữ 'A' là 65
    const rowLetter = String.fromCharCode(65 + i);
    labels = [...labels, rowLetter];
  }
  return labels;
};

// Hàm phụ: chuẩn hóa danh sách hàng ghế VIP (in hoa, bỏ trùng lặp và chỉ giữ các hàng tồn tại trong phòng)
const normalizeVipRows = (rawVipRows, totalRows) => {
  let rawList = [];

  if (Array.isArray(rawVipRows)) {
    rawList = rawVipRows;
  } else if (typeof rawVipRows === 'string' && rawVipRows.trim() !== '') {
    // Hỗ trợ trường hợp gửi chuỗi ngăn cách bằng dấu phẩy (VD: "D, E, F")
    rawList = rawVipRows.split(',');
  }

  const validLabels = getValidRowLabels(totalRows);
  let cleanedRows = [];

  for (const item of rawList) {
    const cleanLetter = String(item || '').trim().toUpperCase();
    const isValidRow = validLabels.includes(cleanLetter);
    const isNotDuplicate = !cleanedRows.includes(cleanLetter);

    if (cleanLetter && isValidRow && isNotDuplicate) {
      cleanedRows = [...cleanedRows, cleanLetter];
    }
  }

  // Sắp xếp theo thứ tự bảng chữ cái A -> Z cho gọn đẹp
  return [...cleanedRows].sort();
};

// Hàm phụ: kiểm tra dữ liệu đầu vào khi thêm hoặc sửa phòng chiếu
const validateRoomInput = (name, totalRows, seatsPerRow) => {
  if (!name || String(name).trim() === '') {
    return 'Vui lòng nhập tên phòng chiếu';
  }

  if (Number.isNaN(totalRows) || !Number.isInteger(totalRows)) {
    return 'Số hàng ghế phải là số nguyên';
  }
  if (totalRows < 1 || totalRows > 26) {
    return 'Số hàng ghế phải nằm trong khoảng từ 1 đến 26 (tương ứng hàng A đến Z)';
  }

  if (Number.isNaN(seatsPerRow) || !Number.isInteger(seatsPerRow)) {
    return 'Số ghế mỗi hàng phải là số nguyên';
  }
  if (seatsPerRow < 1 || seatsPerRow > 30) {
    return 'Số ghế mỗi hàng phải nằm trong khoảng từ 1 đến 30';
  }

  return '';
};

// @desc    Lấy danh sách tất cả phòng chiếu (hỗ trợ lọc theo tên hoặc trạng thái hoạt động)
// @route   GET /api/rooms
// @access  Public
export const getRooms = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const filter = {};

    // Lọc theo từ khóa tên phòng nếu có truyền ?search=...
    if (search && search.trim() !== '') {
      filter.name = { $regex: new RegExp(search.trim(), 'i') };
    }

    // Lọc theo trạng thái hoạt động nếu có truyền ?isActive=true hoặc false
    if (isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }

    const rooms = await Room.find(filter).sort({ name: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      total: rooms.length,
      data: rooms,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Lấy thông tin chi tiết 1 phòng chiếu theo ID
// @route   GET /api/rooms/:id
// @access  Public
export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chiếu này',
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Tạo phòng chiếu mới
// @route   POST /api/rooms
// @access  Private (Admin)
export const createRoom = async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();

    // Hỗ trợ cả tên trường chuẩn Backend (totalRows/seatsPerRow) lẫn tên ngắn (rows/cols)
    let totalRows = 8;
    if (body.totalRows !== undefined) {
      totalRows = Number(body.totalRows);
    } else if (body.rows !== undefined) {
      totalRows = Number(body.rows);
    }

    let seatsPerRow = 10;
    if (body.seatsPerRow !== undefined) {
      seatsPerRow = Number(body.seatsPerRow);
    } else if (body.cols !== undefined) {
      seatsPerRow = Number(body.cols);
    }

    // Bước 1: Kiểm tra hợp lệ tên phòng, số hàng, số ghế mỗi hàng
    const validationError = validateRoomInput(name, totalRows, seatsPerRow);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Bước 2: Kiểm tra trùng tên phòng chiếu trong hệ thống
    const existingRoom = await Room.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: `Phòng chiếu "${name}" đã tồn tại. Vui lòng đặt tên khác.`,
      });
    }

    // Bước 3: Chuẩn hóa danh sách hàng VIP và trạng thái hoạt động
    const vipRows = normalizeVipRows(body.vipRows, totalRows);
    let isActive = true;
    if (body.isActive !== undefined) {
      isActive = Boolean(body.isActive);
    }

    // Bước 4: Lưu phòng chiếu mới vào MongoDB
    const createdRoom = await Room.create({
      name,
      totalRows,
      seatsPerRow,
      vipRows,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo phòng chiếu mới thành công',
      data: createdRoom,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Cập nhật thông tin phòng chiếu
// @route   PUT /api/rooms/:id
// @access  Private (Admin)
export const updateRoom = async (req, res, next) => {
  try {
    // Bước 1: Tìm phòng chiếu cần chỉnh sửa
    const existingRoom = await Room.findById(req.params.id);
    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chiếu cần cập nhật',
      });
    }

    const body = req.body || {};

    let nextName = existingRoom.name;
    if (body.name !== undefined) {
      nextName = String(body.name).trim();
    }

    let nextTotalRows = existingRoom.totalRows;
    if (body.totalRows !== undefined) {
      nextTotalRows = Number(body.totalRows);
    } else if (body.rows !== undefined) {
      nextTotalRows = Number(body.rows);
    }

    let nextSeatsPerRow = existingRoom.seatsPerRow;
    if (body.seatsPerRow !== undefined) {
      nextSeatsPerRow = Number(body.seatsPerRow);
    } else if (body.cols !== undefined) {
      nextSeatsPerRow = Number(body.cols);
    }

    // Bước 2: Kiểm tra dữ liệu sau khi cập nhật có hợp lệ không
    const validationError = validateRoomInput(
      nextName,
      nextTotalRows,
      nextSeatsPerRow
    );
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Bước 3: Kiểm tra xem tên mới có bị trùng với một phòng chiếu khác không
    const duplicateRoom = await Room.findOne({
      _id: { $ne: existingRoom._id },
      name: { $regex: new RegExp(`^${nextName}$`, 'i') },
    });

    if (duplicateRoom) {
      return res.status(409).json({
        success: false,
        message: `Tên phòng "${nextName}" đã được sử dụng bởi phòng khác.`,
      });
    }

    // Bước 4: Cập nhật từng trường và lưu lại vào MongoDB
    const rawVipRows =
      body.vipRows !== undefined ? body.vipRows : existingRoom.vipRows;
    const nextVipRows = normalizeVipRows(rawVipRows, nextTotalRows);

    existingRoom.name = nextName;
    existingRoom.totalRows = nextTotalRows;
    existingRoom.seatsPerRow = nextSeatsPerRow;
    existingRoom.vipRows = nextVipRows;

    if (body.isActive !== undefined) {
      existingRoom.isActive = Boolean(body.isActive);
    }

    await existingRoom.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật phòng chiếu thành công',
      data: existingRoom,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Xóa phòng chiếu (chặn xóa nếu phòng đang được gắn vào suất chiếu)
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
export const deleteRoom = async (req, res, next) => {
  try {
    // Bước 1: Kiểm tra phòng chiếu có tồn tại không
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chiếu cần xóa',
      });
    }

    // Bước 2: Kiểm tra xem phòng này đang có suất chiếu nào sử dụng không
    const relatedShowtime = await Showtime.findOne({ roomId: room._id });
    if (relatedShowtime) {
      return res.status(409).json({
        success: false,
        message: `Không thể xóa "${room.name}" vì phòng đang có lịch chiếu. Hãy xóa các suất chiếu liên quan hoặc chuyển phòng sang trạng thái Tạm ngưng.`,
      });
    }

    // Bước 3: Thực hiện xóa phòng chiếu khỏi MongoDB
    await Room.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Xóa phòng chiếu thành công',
    });
  } catch (error) {
    return next(error);
  }
};