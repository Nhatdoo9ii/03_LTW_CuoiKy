import { createSlice } from '@reduxjs/toolkit';

// Các hằng số dùng chung cho luồng đặt vé
export const MAX_SEATS_PER_BOOKING = 8;
export const HOLD_DURATION_SECONDS = 300; // 5 phút = 300 giây
export const HOLD_DURATION_MS = HOLD_DURATION_SECONDS * 1000;

// Mã ưu đãi mặc định dành cho sinh viên PTIT
export const DEFAULT_PTIT_PROMO = {
  code: 'PTIT35',
  title: 'Đặc quyền Sinh viên PTIT (Giảm 35% vé)',
  description:
    'Giảm trực tiếp 35% giá vé cho sinh viên, học viên và cán bộ PTIT khi xác thực email @stu.ptit.edu.vn hoặc @ptit.edu.vn.',
  discountType: 'percent',
  discountValue: 35,
  maxDiscount: null,
  minOrderValue: 0,
  applyScope: 'tickets',
};

// Danh sách combo bắp nước hiển thị ở trang Thanh toán
export const AVAILABLE_COMBOS = [
  {
    id: 'combo-ptit-student',
    name: 'Combo PTIT Sinh viên',
    description: '1 Bắp phô mai lớn + 2 Nước vừa',
    price: 75000,
  },
  {
    id: 'combo-solo',
    name: 'Combo Solo Cinephile',
    description: '1 Bắp ngọt vừa + 1 Nước vừa',
    price: 55000,
  },
  {
    id: 'combo-couple',
    name: 'Combo Couple Premium',
    description: '1 Bắp lớn mix 2 vị + 2 Nước lớn',
    price: 99000,
  },
];

// Trạng thái ban đầu của giỏ đặt vé trong Redux
const initialState = {
  showtimeInfo: null,             // Thông tin suất chiếu đang chọn
  selectedSeats: [],            // Danh sách ghế đang chọn (tối đa 8 ghế)
  selectedCombos: [],             // Danh sách combo bắp nước đã chọn
  appliedPromo: null,             // Mã khuyến mãi đang áp dụng
  holdExpiresAt: null,            // Mốc thời gian hết hạn giữ ghế (tính bằng ms)
  seatLimitWarning: '',             // Câu cảnh báo khi người dùng bấm chọn quá 8 ghế
  lastCompletedBooking: null,             // Lưu đơn vé vừa đặt xong để hiện ở trang Thành công
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // Khởi tạo phiên chọn ghế khi vào một suất chiếu
    initBookingSession: (state, action) => {
      const nextShowtime = action.payload;
      if (!nextShowtime) {
        return;
      }

      let isSameShowtime = false;
      if (state.showtimeInfo) {
        if (String(state.showtimeInfo.id) === String(nextShowtime.id)) {
          isSameShowtime = true;
        }
      }

      state.showtimeInfo = nextShowtime;
      state.seatLimitWarning = '';

      if (!isSameShowtime) {
        state.selectedSeats = [];
        state.selectedCombos = [];
        state.holdExpiresAt = Date.now() + HOLD_DURATION_MS;
      } else if (!state.holdExpiresAt || state.holdExpiresAt <= Date.now()) {
        state.holdExpiresAt = Date.now() + HOLD_DURATION_MS;
      }
    },

    // Chọn hoặc bỏ chọn 1 ghế trên sơ đồ (giới hạn tối đa 8 ghế)
    toggleSeat: (state, action) => {
      const seat = action.payload;
      if (!seat || !seat.code) {
        return;
      }


      const existingSeat = state.selectedSeats.find((item) => {
        return item.code === seat.code;
      });


      if (existingSeat) {
        state.selectedSeats = state.selectedSeats.filter((item) => {
          return item.code !== seat.code;
        });
        state.seatLimitWarning = '';
        return;
      }

      if (state.selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
        state.seatLimitWarning = `Bạn chỉ được chọn tối đa ${MAX_SEATS_PER_BOOKING} ghế trong mỗi lần đặt vé.`;
        return;
      }


      state.selectedSeats = [...state.selectedSeats, seat];
      state.seatLimitWarning = '';

    
      if (!state.holdExpiresAt || state.holdExpiresAt <= Date.now()) {
        state.holdExpiresAt = Date.now() + HOLD_DURATION_MS;
      }
    },

    // Xóa các ghế bị trùng khỏi danh sách đang chọn (khi server báo lỗi 409)
    removeConflictSeats: (state, action) => {
      const conflictCodes = action.payload;
      if (!Array.isArray(conflictCodes)) {
        return;
      }

      state.selectedSeats = state.selectedSeats.filter((seat) => {
        return !conflictCodes.includes(seat.code);
      });
      state.seatLimitWarning = '';
    },

    // Tắt thông báo cảnh báo chọn quá 8 ghế
    clearSeatLimitWarning: (state) => {
      state.seatLimitWarning = '';
    },

    // Tăng (+1) hoặc giảm (-1) số lượng combo bắp nước
    updateComboQuantity: (state, action) => {
      const payload = action.payload;
      if (!payload || !payload.combo || !payload.combo.id) {
        return;
      }

      const combo = payload.combo;
      const delta = payload.delta;

      const existingCombo = state.selectedCombos.find((item) => {
        return item.id === combo.id;
      });

      if (existingCombo) {
        const nextQuantity = existingCombo.quantity + delta;

        if (nextQuantity <= 0) {
          state.selectedCombos = state.selectedCombos.filter((item) => {
            return item.id !== combo.id;
          });
        } else {
          let finalQuantity = nextQuantity;
          if (finalQuantity > 10) {
            finalQuantity = 10;
          }

          state.selectedCombos = state.selectedCombos.map((item) => {
            if (item.id === combo.id) {
              return { ...item, quantity: finalQuantity };
            }
            return item;
          });
        }
      } else if (delta > 0) {
        // Nếu chưa có trong giỏ và bấm dấu cộng thì thêm mới vào danh sách
        const newComboItem = {
          ...combo,
          quantity: delta,
        };
        state.selectedCombos = [...state.selectedCombos, newComboItem];
      }
    },

    // Xóa toàn bộ combo đã chọn
    clearCombos: (state) => {
      state.selectedCombos = [];
    },

    // Áp dụng mã khuyến mãi (nhận chuỗi "PTIT35" hoặc object khuyến mãi)
    applyPromoCode: (state, action) => {
      const payload = action.payload;
      if (!payload) {
        return;
      }

      if (typeof payload === 'string') {
        const cleanCode = payload.trim().toUpperCase();
        if (cleanCode === DEFAULT_PTIT_PROMO.code) {
          state.appliedPromo = DEFAULT_PTIT_PROMO;
        }
        return;
      }

      const formattedCode = String(payload.code || '').trim().toUpperCase();
      state.appliedPromo = {
        ...payload,
        code: formattedCode,
      };
    },

    // Gỡ mã khuyến mãi đang áp dụng
    removePromoCode: (state) => {
      state.appliedPromo = null;
    },

    // Cấp lại thời gian giữ ghế 5 phút mới
    refreshHoldTimer: (state) => {
      state.holdExpiresAt = Date.now() + HOLD_DURATION_MS;
    },

    // Xử lý khi hết 5 phút giữ ghế: bỏ hết ghế, combo và hủy hẹn giờ
    expireBookingHold: (state) => {
      state.selectedSeats = [];
      state.selectedCombos = [];
      state.holdExpiresAt = null;
      state.seatLimitWarning = '';
    },

    // Lưu thông tin vé vừa thanh toán thành công và làm sạch giỏ đặt vé
    setLastCompletedBooking: (state, action) => {
      if (action.payload) {
        state.lastCompletedBooking = action.payload;
      } else {
        state.lastCompletedBooking = null;
      }
      state.selectedSeats = [];
      state.selectedCombos = [];
      state.holdExpiresAt = null;
      state.seatLimitWarning = '';
    },

    // Đặt lại toàn bộ state đặt vé về rỗng ban đầu
    resetBookingFlow: (state) => {
      state.showtimeInfo = null;
      state.selectedSeats = [];
      state.selectedCombos = [];
      state.appliedPromo = null;
      state.holdExpiresAt = null;
      state.seatLimitWarning = '';
    },
  },
});

export const {
  initBookingSession,
  toggleSeat,
  removeConflictSeats,
  clearSeatLimitWarning,
  updateComboQuantity,
  clearCombos,
  applyPromoCode,
  removePromoCode,
  refreshHoldTimer,
  expireBookingHold,
  setLastCompletedBooking,
  resetBookingFlow,
} = bookingSlice.actions;

// Hàm tính tiền vé, tiền combo, tiền giảm giá và tổng thanh toán
export const calculateBookingAmounts = (
  selectedSeats = [],
  selectedCombos = [],
  appliedPromo = null
) => {
  let ticketSubtotal = 0;
  for (const seat of selectedSeats) {
    const seatPrice = Number(seat.price) || 0;
    ticketSubtotal = ticketSubtotal + seatPrice;
  }

  let comboSubtotal = 0;
  for (const combo of selectedCombos) {
    const comboPrice = Number(combo.price) || 0;
    const comboQuantity = Number(combo.quantity) || 0;
    comboSubtotal = comboSubtotal + comboPrice * comboQuantity;
  }

  const subtotal = ticketSubtotal + comboSubtotal;

  if (!appliedPromo || subtotal <= 0) {
    return {
      ticketSubtotal,
      comboSubtotal,
      subtotal,
      discountAmount: 0,
      totalPrice: subtotal,
    };
  }

  const minOrderValue = Number(appliedPromo.minOrderValue) || 0;
  if (subtotal < minOrderValue) {
    return {
      ticketSubtotal,
      comboSubtotal,
      subtotal,
      discountAmount: 0,
      totalPrice: subtotal,
    };
  }

  let discountBase = ticketSubtotal;
  if (appliedPromo.applyScope === 'all') {
    discountBase = subtotal;
  }

  // eslint-disable-next-line no-useless-assignment
  let rawDiscount = 0;
  if (appliedPromo.discountType === 'fixed') {
    rawDiscount = Number(appliedPromo.discountValue) || 0;
  } else {
    const percent = Number(appliedPromo.discountValue) || 0;
    rawDiscount = Math.round((discountBase * percent) / 100);
  }

  if (appliedPromo.maxDiscount && appliedPromo.maxDiscount > 0) {
    if (rawDiscount > appliedPromo.maxDiscount) {
      rawDiscount = appliedPromo.maxDiscount;
    }
  }

  let discountAmount = rawDiscount;
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  let totalPrice = subtotal - discountAmount;
  if (totalPrice < 0) {
    totalPrice = 0;
  }

  return {
    ticketSubtotal,
    comboSubtotal,
    subtotal,
    discountAmount,
    totalPrice,
  };
};

// Các hàm selector để lấy dữ liệu từ Redux store bằng useSelector()
export const selectBookingState = (state) => state.booking;
export const selectShowtimeInfo = (state) => state.booking.showtimeInfo;
export const selectSelectedSeats = (state) => state.booking.selectedSeats;
export const selectSelectedCombos = (state) => state.booking.selectedCombos;
export const selectAppliedPromo = (state) => state.booking.appliedPromo;
export const selectHoldExpiresAt = (state) => state.booking.holdExpiresAt;
export const selectSeatLimitWarning = (state) => state.booking.seatLimitWarning;
export const selectLastCompletedBooking = (state) =>
  state.booking.lastCompletedBooking;

export default bookingSlice.reducer;