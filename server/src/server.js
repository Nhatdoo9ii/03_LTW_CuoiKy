import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import showtimeRoutes from './routes/showtimeRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

// Load biến môi trường
dotenv.config();

// Khởi tạo app
const app = express();

// Kết nối database MongoDB
connectDB();

// Middlewares xử lý request
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route kiểm tra sức khỏe server (Health check)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PTIT Cinema API Server đang hoạt động tốt!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Mount các REST API routes theo tài nguyên (danh từ số nhiều)
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stats', statsRoutes);

// Middleware xử lý lỗi tập trung
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 [Server] Đang chạy tại cổng ${PORT} (http://localhost:${PORT})`);
});
