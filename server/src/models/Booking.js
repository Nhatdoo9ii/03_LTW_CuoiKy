import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    showtimeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
    },
    seats: [
      {
        seatId: { type: String, required: true },
        type: { type: String, enum: ['regular', 'vip'], default: 'regular' },
        price: { type: Number, required: true },
      },
    ],
    combos: [
      {
        comboId: String,
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    originalPrice: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'mock_wallet',
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    qrCode: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index hỗ trợ thống kê và tìm vé của user
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ showtimeId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
