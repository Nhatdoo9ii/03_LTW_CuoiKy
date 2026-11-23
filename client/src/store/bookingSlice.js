import { createSlice } from '@reduxjs/toolkit';

export const MAX_SEATS_PER_BOOKING = 8;
export const HOLD_DURATION_SECONDS = 5 * 60;
export const HOLD_DURATION_MS = HOLD_DURATION_SECONDS * 1000;

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

const initialState = {
  showtimeInfo: null,
  selectedSeats: [],
  selectedCombos: [],
  appliedPromo: null,
  holdExpiresAt: null,
  seatLimitWarning: '',
  lastCompletedBooking: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    /**
     * Khởi tạo phiên chọn ghế cho một suất chiếu.
     * Nếu đổi sang suất chiếu khác, tự động xóa ghế cũ và tạo mốc giữ ghế 5 phút mới.
     */
    initBookingSession: (state, action) => {
      const nextShowtime = action.payload;
      if (!nextShowtime) return;

      const isSameShowtime =
        state.showtimeInfo &&
        String(state.showtimeInfo.id) === String(nextShowtime.id);

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

    /**
     * Chọn hoặc bỏ chọn 1 ghế (tối đa 8 ghế/lần đặt).
     * Payload: { code: 'F5', type: 'vip' | 'standard', price: 100000 }
     */
    toggleSeat: (state, action) => {
      const seat = action.payload;
      if (!seat || !seat.code) return;

      const exists = state.selectedSeats.some(
        (item) => item.code === seat.code
      );

      if (exists) {
        state.selectedSeats = state.selectedSeats.filter(
          (item) => item.code !== seat.code
        );
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

    /**
     * Xóa các ghế bị trùng (khi server trả 409 Conflict) khỏi danh sách đang chọn.
     */
    removeConflictSeats: (state, action) => {
      const conflictCodes = Array.isArray(action.payload) ? action.payload : [];
      state.selectedSeats = state.selectedSeats.filter(
        (seat) => !conflictCodes.includes(seat.code)
      );
      state.seatLimitWarning = '';
    },

    clearSeatLimitWarning: (state) => {
      state.seatLimitWarning = '';
    },

    /**
     * Thêm hoặc cập nhật số lượng combo bắp nước (immutable update).
     * Payload: { combo: { id, name, description, price }, delta: 1 | -1 }
     */
    updateComboQuantity: (state, action) => {
      const { combo, delta } = action.payload || {};
      if (!combo || !combo.id || typeof delta !== 'number') return;

      const existing = state.selectedCombos.find((item) => item.id === combo.id);

      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) {
          state.selectedCombos = state.selectedCombos.filter(
            (item) => item.id !== combo.id
          );
        } else {
          state.selectedCombos = state.selectedCombos.map((item) =>
            item.id === combo.id
              ? { ...item, quantity: Math.min(nextQty, 10) }
              : item
          );
        }
      } else if (delta > 0) {
        state.selectedCombos = [
          ...state.selectedCombos,
          { ...combo, quantity: Math.min(delta, 10) },
        ];
      }
    },

    clearCombos: (state) => {
      state.selectedCombos = [];
    },

    /**
     * Áp dụng mã khuyến mãi (hỗ trợ mặc định PTIT35 hoặc object từ API/PromotionPage).
     */
    applyPromoCode: (state, action) => {
      const payload = action.payload;
      if (!payload) return;

      if (typeof payload === 'string') {
        const normalized = payload.trim().toUpperCase();
        if (normalized === DEFAULT_PTIT_PROMO.code) {
          state.appliedPromo = DEFAULT_PTIT_PROMO;
        }
        return;
      }

      state.appliedPromo = {
        ...payload,
        code: String(payload.code || '').trim().toUpperCase(),
      };
    },

    removePromoCode: (state) => {
      state.appliedPromo = null;
    },

    refreshHoldTimer: (state) => {
      state.holdExpiresAt = Date.now() + HOLD_DURATION_MS;
    },

    /**
     * Xử lý khi hết 5 phút giữ ghế: xóa ghế, combo và hủy mốc hẹn giờ.
     */
    expireBookingHold: (state) => {
      state.selectedSeats = [];
      state.selectedCombos = [];
      state.holdExpiresAt = null;
      state.seatLimitWarning = '';
    },

    /**
     * Lưu đơn đặt vé vừa hoàn tất và dọn dẹp phiên chọn ghế hiện tại.
     */
    setLastCompletedBooking: (state, action) => {
      state.lastCompletedBooking = action.payload || null;
      state.selectedSeats = [];
      state.selectedCombos = [];
      state.holdExpiresAt = null;
      state.seatLimitWarning = '';
    },

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

// Hàm thuần tính toán tổng tiền (dùng kết hợp với useMemo ở các component UI)
export const calculateBookingAmounts = (
  selectedSeats = [],
  selectedCombos = [],
  appliedPromo = null
) => {
  const ticketSubtotal = selectedSeats.reduce(
    (sum, seat) => sum + (Number(seat.price) || 0),
    0
  );

  const comboSubtotal = selectedCombos.reduce(
    (sum, combo) =>
      sum + (Number(combo.price) || 0) * (Number(combo.quantity) || 0),
    0
  );

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

  const minOrder = Number(appliedPromo.minOrderValue) || 0;
  if (subtotal < minOrder) {
    return {
      ticketSubtotal,
      comboSubtotal,
      subtotal,
      discountAmount: 0,
      totalPrice: subtotal,
    };
  }

  const discountBase =
    appliedPromo.applyScope === 'all' ? subtotal : ticketSubtotal;

  // eslint-disable-next-line no-useless-assignment
  let rawDiscount = 0;
  if (appliedPromo.discountType === 'fixed') {
    rawDiscount = Number(appliedPromo.discountValue) || 0;
  } else {
    const percent = Number(appliedPromo.discountValue) || 0;
    rawDiscount = Math.round((discountBase * percent) / 100);
  }

  if (
    typeof appliedPromo.maxDiscount === 'number' &&
    appliedPromo.maxDiscount > 0
  ) {
    rawDiscount = Math.min(rawDiscount, appliedPromo.maxDiscount);
  }

  const discountAmount = Math.min(rawDiscount, subtotal);
  const totalPrice = Math.max(0, subtotal - discountAmount);

  return {
    ticketSubtotal,
    comboSubtotal,
    subtotal,
    discountAmount,
    totalPrice,
  };
};

// Selectors
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