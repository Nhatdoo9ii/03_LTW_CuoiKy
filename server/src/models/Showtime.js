import mongoose from 'mongoose';

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Vui lòng chọn phim'],
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Vui lòng chọn phòng chiếu'],
    },
    date: {
      type: String,
      required: [true, 'Vui lòng chọn ngày chiếu (YYYY-MM-DD)'],
    },
    startTime: {
      type: String,
      required: [true, 'Vui lòng chọn giờ bắt đầu (HH:mm)'],
    },
    endTime: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      default: 80000,
    },
    vipSurcharge: {
      type: Number,
      default: 15000,
    },
    bookedSeats: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index hỗ trợ truy vấn nhanh và chặn trùng suất chiếu
showtimeSchema.index({ roomId: 1, date: 1, startTime: 1 });

const Showtime = mongoose.model('Showtime', showtimeSchema);
export default Showtime;
