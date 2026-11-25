import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên phòng chiếu'],
      trim: true,
    },
    totalRows: {
      type: Number,
      required: true,
      default: 8,
    },
    seatsPerRow: {
      type: Number,
      required: true,
      default: 10,
    },
    vipRows: {
      type: [String],
      default: ['D', 'E', 'F'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;
