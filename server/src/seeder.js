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

    // 4. Nạp Showtimes
    const showtimeMap = new Map();
    for (const st of mockData.showtimes || []) {
      const movieDoc = movieMap.get(st.movieId);
      const roomDoc = roomMap.get(st.roomId);
      if (!movieDoc || !roomDoc) continue;

      const createdShowtime = await Showtime.create({
        movieId: movieDoc._id,
        roomId: roomDoc._id,
        date: st.date,
        startTime: st.time,
        price: st.basePrice || 85000,
        vipSurcharge: st.vipSurcharge || 15000,
        bookedSeats: st.bookedSeats || [],
      });
      showtimeMap.set(st.id, createdShowtime);
    }

    // 5. Nạp Bookings
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
    console.log(`   - Movies: ${movieMap.size}`);
    console.log(`   - Rooms: ${roomMap.size}`);
    console.log(`   - Showtimes: ${showtimeMap.size}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seeder] Lỗi nạp dữ liệu:', error);
    process.exit(1);
  }
};

importData();

