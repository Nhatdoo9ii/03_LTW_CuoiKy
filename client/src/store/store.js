import { configureStore } from '@reduxjs/toolkit';
import bookingReducer from './bookingSlice';

export const store = configureStore({
  reducer: {
    // Khai báo nhánh state "booking" quản lý ghế, combo và mã ưu đãi
    booking: bookingReducer,
  },
});

export default store;