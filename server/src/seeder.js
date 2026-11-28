import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Movie from './models/Movie.js';
import Room from './models/Room.js';
import Showtime from './models/Showtime.js';
import Booking from './models/Booking.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.resolve(__dirname, '../../client/src/data/mockData.json');

// Tạo chuỗi ngày YYYY-MM-DD cộng thêm offsetDays kể từ hôm nay
const getDynamicDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Tính giờ kết thúc HH:mm từ startTime + duration
const calcEndTime = (startTime, durationMinutes = 120) => {
  const total = ((toMinutes(startTime) + durationMinutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const importData = async () => {
  try {
    await connectDB();

    const rawData = fs.readFileSync(mockDataPath, 'utf-8');
    const mockData = JSON.parse(rawData);

    // Xóa dữ liệu cũ trước khi nạp mới
    await Promise.all([
      Booking.deleteMany(),
      Showtime.deleteMany(),
      Room.deleteMany(),
      Movie.deleteMany(),
      User.deleteMany(),
    ]);
    console.log('[Seeder] Đã xóa dữ liệu cũ.');

    // 1. Nạp Users (dùng create từng user để kích hoạt hook băm mật khẩu bcrypt)
    const userMap = new Map();
    const rawUsers = [...(mockData.users || [])];

    const hasAdmin = rawUsers.some((u) => u.role === 'admin');
    if (!hasAdmin) {
      rawUsers.push({
        id: 'u_admin',
        fullName: 'Quản trị viên PTIT',
        email: 'admin@ptit.edu.vn',
        phone: '0900000001',
        role: 'admin',
        isStudent: false,
      });
    }

    for (const u of rawUsers) {
      const createdUser = await User.create({
        fullName: u.fullName,
        email: u.email,
        phone: u.phone || '',
        password: u.password || '123456',
        role: u.role === 'user' ? 'member' : u.role || 'member',
        isStudent: Boolean(u.isStudent),
      });
      userMap.set(u.id, createdUser);
    }

    // 2. Nạp Movies
    const movieMap = new Map();
    for (const m of mockData.movies || []) {
      const { id, ...movieFields } = m;
      const createdMovie = await Movie.create(movieFields);
      movieMap.set(id, createdMovie);
    }

    // 3. Nạp Rooms
    const roomMap = new Map();
    for (const r of mockData.rooms || []) {
      const createdRoom = await Room.create({
        name: r.name,
        totalRows: r.rows || 8,
        seatsPerRow: r.cols || 10,
        vipRows: r.vipRows || ['D', 'E', 'F'],
        isActive: r.status !== 'inactive',
      });
      roomMap.set(r.id, createdRoom);
    }

    // Bộ theo dõi khoảng giờ đã chiếm theo từng (roomId_date) để không bao giờ chồng giờ
    const occupiedMap = new Map();
    const movieDateCount = new Map();
    const bufferMinutes = 15;

    const hasOverlap = (roomId, date, startTime, duration) => {
      const key = `${roomId}_${date}`;
      const list = occupiedMap.get(key) || [];
      const newStart = toMinutes(startTime);
      const newEnd = newStart + duration + bufferMinutes;
      return list.some((slot) => newStart < slot.end && newEnd > slot.start);
    };

    const markOccupied = (roomId, movieId, date, startTime, duration) => {
      const key = `${roomId}_${date}`;
      const list = occupiedMap.get(key) || [];
      const start = toMinutes(startTime);
      list.push({ start, end: start + duration + bufferMinutes });
      occupiedMap.set(key, list);

      const mdKey = `${movieId}_${date}`;
      movieDateCount.set(mdKey, (movieDateCount.get(mdKey) || 0) + 1);
    };

    // 4a. Nạp 9 Showtimes mẫu gốc (giữ tham chiếu cho các Booking mẫu)
    const showtimeMap = new Map();
    const pastLikeIds = new Set(['st1', 'st6']);
    let totalShowtimes = 0;

    for (const st of mockData.showtimes || []) {
      const movieDoc = movieMap.get(st.movieId);
      const roomDoc = roomMap.get(st.roomId);
      if (!movieDoc || !roomDoc) continue;

      let dynamicDate = getDynamicDate(2);
      if (st.date === '2026-11-19') {
        dynamicDate = getDynamicDate(3);
      } else if (pastLikeIds.has(st.id)) {
        dynamicDate = getDynamicDate(0);
      }

      const createdShowtime = await Showtime.create({
        movieId: movieDoc._id,
        roomId: roomDoc._id,
        date: dynamicDate,
        startTime: st.time,
        endTime: calcEndTime(st.time, movieDoc.duration),
        price: st.basePrice || 85000,
        vipSurcharge: st.vipSurcharge || 15000,
        bookedSeats: st.bookedSeats || [],
      });
      showtimeMap.set(st.id, createdShowtime);
      markOccupied(roomDoc._id, movieDoc._id, dynamicDate, st.time, movieDoc.duration);
      totalShowtimes += 1;
    }

    // 4b. Tự động bổ sung suất chiếu để MỌI phim đang chiếu đều có suất ở MỌI ngày (0, +1, +2, +3)
    const activeRooms = [...roomMap.values()].filter((r) => r.isActive);
    const nowShowingMovies = [...movieMap.values()].filter(
      (m) => m.status === 'now-showing'
    );
    const targetDates = [0, 1, 2, 3].map((offset) => getDynamicDate(offset));
    const candidateSlots = ['09:00', '12:30', '16:00', '19:30', '22:45'];
    const sampleBookedPresets = [['D4', 'D5'], ['E5', 'E6'], ['F4'], []];

    let slotCursor = 0;
    for (const date of targetDates) {
      for (const movieDoc of nowShowingMovies) {
        const mdKey = `${movieDoc._id}_${date}`;
        const existingCount = movieDateCount.get(mdKey) || 0;
        const needed = Math.max(0, 2 - existingCount); // Đảm bảo ít nhất 2 suất/phim/ngày

        for (let k = 0; k < needed; k += 1) {
          let assigned = false;
          const totalAttempts = activeRooms.length * candidateSlots.length;

          for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
            const idx = (slotCursor + attempt) % totalAttempts;
            const roomDoc = activeRooms[idx % activeRooms.length];
            const startTime = candidateSlots[Math.floor(idx / activeRooms.length)];

            if (!hasOverlap(roomDoc._id, date, startTime, movieDoc.duration)) {
              const isEvening = startTime >= '18:00';
              await Showtime.create({
                movieId: movieDoc._id,
                roomId: roomDoc._id,
                date,
                startTime,
                endTime: calcEndTime(startTime, movieDoc.duration),
                price: isEvening ? 95000 : 85000,
                vipSurcharge: isEvening ? 20000 : 15000,
                bookedSeats:
                  sampleBookedPresets[totalShowtimes % sampleBookedPresets.length],
              });
              markOccupied(roomDoc._id, movieDoc._id, date, startTime, movieDoc.duration);
              totalShowtimes += 1;
              slotCursor = (idx + 1) % totalAttempts;
              assigned = true;
              break;
            }
          }

          if (!assigned) break;
        }
      }
    }

    // 5. Nạp Bookings mẫu
    for (const b of mockData.bookings || []) {
      const userDoc = userMap.get(b.userId);
      const showtimeDoc = showtimeMap.get(b.showtimeId);
      const roomDoc = showtimeDoc ? await Room.findById(showtimeDoc.roomId) : null;
      if (!userDoc || !showtimeDoc) continue;

      const vipRows = roomDoc?.vipRows || ['D', 'E', 'F'];
      const formattedSeats = (b.seats || []).map((seatId) => {
        const isVip = vipRows.includes(seatId.charAt(0).toUpperCase());
        return {
          seatId,
          type: isVip ? 'vip' : 'regular',
          price: showtimeDoc.price + (isVip ? showtimeDoc.vipSurcharge : 0),
        };
      });

      await Booking.create({
        bookingCode: b.id || `BK-${Date.now()}`,
        userId: userDoc._id,
        showtimeId: showtimeDoc._id,
        seats: formattedSeats,
        originalPrice: b.subtotal || b.totalPrice,
        discountAmount: b.discountAmount || 0,
        totalPrice: b.totalPrice,
        paymentMethod: b.paymentMethod || 'MoMo',
        status: b.status || 'confirmed',
        qrCode: `PTIT-CINEMA|${b.id}|${(b.seats || []).join(',')}`,
      });
    }

    console.log('✅ [Seeder] Đã nạp dữ liệu mẫu thành công!');
    console.log(`   - Users: ${userMap.size}`);
    console.log(`   - Movies: ${movieMap.size} (Đang chiếu: ${nowShowingMovies.length})`);
    console.log(`   - Rooms: ${roomMap.size} (Hoạt động: ${activeRooms.length})`);
    console.log(`   - Showtimes: ${totalShowtimes} (Ngày: ${targetDates.join(', ')})`);
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seeder] Lỗi nạp dữ liệu:', error);
    process.exit(1);
  }
};

importData();
