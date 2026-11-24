import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

// Load biến môi trường
dotenv.config();

// Khởi tạo app
const app = express();

// Kết nối database MongoDB
connectDB();

// Middlewares xử lý request
app.use(cors());
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

// Middleware xử lý lỗi tập trung
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 [Server] Đang chạy tại cổng ${PORT} (http://localhost:${PORT})`);
});
