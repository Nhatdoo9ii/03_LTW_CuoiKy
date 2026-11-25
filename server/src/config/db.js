import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB] Đã kết nối thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Lỗi kết nối: ${error.message}`);
    // Không crash server ngay để vẫn test được các route tĩnh hoặc mock
  }
};

export default connectDB;
