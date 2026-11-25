import { useState } from 'react';
import { AlertCircle, Plus, RotateCcw, Save, X } from 'lucide-react';
import { calculateEndTime } from '../../services/showtimeService';
import styles from './ShowtimeForm.module.css';

// Hàm phụ: lấy ngày hôm nay định dạng YYYY-MM-DD làm giá trị mặc định
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Hàm phụ: kiểm tra 1 phòng chiếu có đang bảo trì hay không
const isRoomMaintenance = (room) => {
  if (!room) {
    return false;
  }
  if (room.isActive === false) {
    return true;
  }
  if (room.status === 'maintenance' || room.status === 'inactive') {
    return true;
  }
  return false;
};

// Hàm phụ: tạo giá trị ban đầu cho các ô nhập liệu của Form
const getInitialFormValues = (editingShowtime, movies, rooms, defaultDate) => {
  if (editingShowtime) {
    return {
      movieId: String(editingShowtime.movieId || ''),
      roomId: String(editingShowtime.roomId || ''),
      date: editingShowtime.date || defaultDate || getTodayDateString(),
      time: editingShowtime.startTime || editingShowtime.time || '18:30',
      basePrice: String(editingShowtime.basePrice || editingShowtime.price || 85000),
      vipPrice: String(editingShowtime.vipPrice || 100000),
    };
  }

  // Chọn mặc định phòng đầu tiên đang hoạt động
  const firstActiveRoom = rooms.find((room) => !isRoomMaintenance(room));
  let defaultRoomId = '';
  if (firstActiveRoom) {
    defaultRoomId = String(firstActiveRoom.id);
  } else if (rooms.length > 0) {
    defaultRoomId = String(rooms[0].id);
  }

  let defaultMovieId = '';
  if (movies.length > 0) {
    defaultMovieId = String(movies[0].id);
  }

  return {
    movieId: defaultMovieId,
    roomId: defaultRoomId,
    date: defaultDate || getTodayDateString(),
    time: '18:30',
    basePrice: '85000',
    vipPrice: '100000',
  };
};

// Hàm phụ: kiểm tra hợp lệ toàn bộ các trường nhập trong form suất chiếu
const validateShowtimeForm = (values, rooms) => {
  const errors = {};

  if (!values.movieId) {
    errors.movieId = 'Vui lòng chọn phim.';
  }

  if (!values.roomId) {
    errors.roomId = 'Vui lòng chọn phòng chiếu.';
  } else {
    const selectedRoom = rooms.find((r) => {
      return String(r.id) === String(values.roomId);
    });
    if (isRoomMaintenance(selectedRoom)) {
      errors.roomId = 'Phòng này đang bảo trì, vui lòng chọn phòng khác.';
    }
  }

  if (!values.date) {
    errors.date = 'Vui lòng chọn ngày chiếu.';
  }

  if (!values.time) {
    errors.time = 'Vui lòng chọn giờ bắt đầu.';
  }

  const basePriceNum = Number(values.basePrice);
  const vipPriceNum = Number(values.vipPrice);

  if (!values.basePrice || Number.isNaN(basePriceNum) || basePriceNum < 30000) {
    errors.basePrice = 'Giá vé thường phải từ 30.000đ trở lên.';
  }

  if (!values.vipPrice || Number.isNaN(vipPriceNum) || vipPriceNum < 30000) {
    errors.vipPrice = 'Giá vé VIP phải từ 30.000đ trở lên.';
  } else if (!Number.isNaN(basePriceNum) && vipPriceNum < basePriceNum) {
    errors.vipPrice = 'Giá vé VIP phải lớn hơn hoặc bằng giá vé thường.';
  }

  return errors;
};

// Component Form thêm mới / chỉnh sửa suất chiếu cho Admin
const ShowtimeForm = ({
  movies = [],
  rooms = [],
  defaultDate = '',
  editingShowtime = null,
  onSubmitShowtime,
  onCancelEdit,
}) => {
  const isEditMode = Boolean(editingShowtime);
  const initialValues = getInitialFormValues(
    editingShowtime,
    movies,
    rooms,
    defaultDate
  );

  const [movieId, setMovieId] = useState(initialValues.movieId);
  const [roomId, setRoomId] = useState(initialValues.roomId);
  const [date, setDate] = useState(initialValues.date);
  const [time, setTime] = useState(initialValues.time);
  const [basePrice, setBasePrice] = useState(initialValues.basePrice);
  const [vipPrice, setVipPrice] = useState(initialValues.vipPrice);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tìm phim đang chọn để tự tính giờ "Dự kiến kết thúc"
  const selectedMovie = movies.find((item) => {
    return String(item.id) === String(movieId);
  });
  const movieDuration = selectedMovie ? Number(selectedMovie.duration) : 120;
  const estimatedEndTime = calculateEndTime(time, movieDuration);

  // Xóa lỗi của 1 trường khi người dùng thay đổi giá trị
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors({ ...fieldErrors, [fieldName]: '' });
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  // Đặt lại form về giá trị mặc định ban đầu
  const handleResetForm = () => {
    const resetValues = getInitialFormValues(null, movies, rooms, defaultDate);
    setMovieId(resetValues.movieId);
    setRoomId(resetValues.roomId);
    setDate(resetValues.date);
    setTime(resetValues.time);
    setBasePrice(resetValues.basePrice);
    setVipPrice(resetValues.vipPrice);
    setFieldErrors({});
    setSubmitError('');
  };

  // Xử lý bấm nút "TẠO SUẤT CHIẾU" hoặc "LƯU THAY ĐỔI"
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const formValues = {
      movieId,
      roomId,
      date,
      time,
      basePrice,
      vipPrice,
    };

    const errors = validateShowtimeForm(formValues, rooms);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitShowtime({
        movieId,
        roomId,
        date,
        time,
        basePrice: Number(basePrice),
        vipPrice: Number(vipPrice),
      });

      if (!isEditMode) {
        setFieldErrors({});
        setSubmitError('');
      }
    } catch (error) {
      setSubmitError(
        error.message || 'Không thể lưu suất chiếu. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  let formTitle = 'Thêm suất chiếu mới vào lịch';
  if (isEditMode) {
    const shortId = String(editingShowtime.id || '').slice(-4).toUpperCase();
    formTitle = `Chỉnh sửa suất chiếu #SC-${shortId}`;
  }

  return (
    <section className={styles.formCard} aria-labelledby="showtime-form-title">
      <div className={styles.formHeader}>
        <h2 id="showtime-form-title" className={styles.formTitle}>
          {formTitle}
        </h2>

        {isEditMode && typeof onCancelEdit === 'function' && (
          <button
            type="button"
            className={styles.cancelEditLink}
            onClick={onCancelEdit}
          >
            <X size={15} aria-hidden="true" />
            <span>Hủy chỉnh sửa</span>
          </button>
        )}
      </div>

      {/* Thông báo lỗi nghiệp vụ từ API (VD: 409 trùng giờ chiếu, 401/403) */}
      {submitError && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={17} className={styles.errorIcon} aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formBody} noValidate>
        {/* Hàng 1: Chọn Phim, Chọn Phòng chiếu, Ngày chiếu */}
        <div className={styles.rowTop}>
          <div className={styles.fieldGroup}>
            <label htmlFor="showtime-movie" className={styles.fieldLabel}>
              Chọn Phim <span className={styles.required}>*</span>
            </label>
            <select
              id="showtime-movie"
              value={movieId}
              onChange={(event) => {
                setMovieId(event.target.value);
                clearFieldError('movieId');
              }}
              className={
                fieldErrors.movieId
                  ? `${styles.fieldControl} ${styles.controlError}`
                  : styles.fieldControl
              }
            >
              <option value="">-- Chọn bộ phim --</option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title} ({movie.duration}p - {movie.ageRating})
                </option>
              ))}
            </select>
            {fieldErrors.movieId && (
              <span className={styles.fieldError}>{fieldErrors.movieId}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="showtime-room" className={styles.fieldLabel}>
              Chọn Phòng chiếu <span className={styles.required}>*</span>
            </label>
            <select
              id="showtime-room"
              value={roomId}
              onChange={(event) => {
                setRoomId(event.target.value);
                clearFieldError('roomId');
              }}
              className={
                fieldErrors.roomId
                  ? `${styles.fieldControl} ${styles.controlError}`
                  : styles.fieldControl
              }
            >
              <option value="">-- Chọn phòng chiếu --</option>
              {rooms.map((room) => {
                const isMaintenance = isRoomMaintenance(room);
                const roomLabel = isMaintenance
                  ? `${room.name} (${room.totalSeats} ghế - Đang bảo trì)`
                  : `${room.name} (${room.totalSeats} ghế)`;

                return (
                  <option
                    key={room.id}
                    value={room.id}
                    disabled={isMaintenance}
                  >
                    {roomLabel}
                  </option>
                );
              })}
            </select>
            {fieldErrors.roomId && (
              <span className={styles.fieldError}>{fieldErrors.roomId}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="showtime-date" className={styles.fieldLabel}>
              Ngày chiếu <span className={styles.required}>*</span>
            </label>
            <input
              id="showtime-date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                clearFieldError('date');
              }}
              className={
                fieldErrors.date
                  ? `${styles.fieldControl} ${styles.controlError}`
                  : styles.fieldControl
              }
            />
            {fieldErrors.date && (
              <span className={styles.fieldError}>{fieldErrors.date}</span>
            )}
          </div>
        </div>

        {/* Hàng 2: Giờ bắt đầu (+ Dự kiến kết thúc), Giá Thường, Giá VIP, Nút hành động */}
        <div className={styles.rowBottom}>
          <div className={styles.fieldGroup}>
            <div className={styles.labelWithBadge}>
              <label htmlFor="showtime-time" className={styles.fieldLabel}>
                Giờ bắt đầu <span className={styles.required}>*</span>
              </label>
              <span className={styles.endTimeBadge}>
                Dự kiến kết thúc: ~{estimatedEndTime}
              </span>
            </div>
            <input
              id="showtime-time"
              type="time"
              value={time}
              onChange={(event) => {
                setTime(event.target.value);
                clearFieldError('time');
              }}
              className={
                fieldErrors.time
                  ? `${styles.fieldControl} ${styles.controlError}`
                  : styles.fieldControl
              }
            />
            {fieldErrors.time && (
              <span className={styles.fieldError}>{fieldErrors.time}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="showtime-base-price" className={styles.fieldLabel}>
              Giá Thường (VNĐ) <span className={styles.required}>*</span>
            </label>
            <input
              id="showtime-base-price"
              type="number"
              min="30000"
              step="5000"
              value={basePrice}
              onChange={(event) => {
                setBasePrice(event.target.value);
                clearFieldError('basePrice');
              }}
              placeholder="85000"
              className={
                fieldErrors.basePrice
                  ? `${styles.fieldControl} ${styles.controlError}`
                  : styles.fieldControl
              }
            />
            {fieldErrors.basePrice && (
              <span className={styles.fieldError}>{fieldErrors.basePrice}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="showtime-vip-price" className={styles.fieldLabel}>
              Giá VIP (VNĐ) <span className={styles.required}>*</span>
            </label>
            <input
              id="showtime-vip-price"
              type="number"
              min="30000"
              step="5000"
              value={vipPrice}
              onChange={(event) => {
                setVipPrice(event.target.value);
                clearFieldError('vipPrice');
              }}
              placeholder="100000"
              className={
                fieldErrors.vipPrice
                  ? `${styles.fieldControl} ${styles.controlError}`
                  : styles.fieldControl
              }
            />
            {fieldErrors.vipPrice && (
              <span className={styles.fieldError}>{fieldErrors.vipPrice}</span>
            )}
          </div>

          <div className={styles.actionButtons}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitBtn}
            >
              {isEditMode ? (
                <>
                  <Save size={16} aria-hidden="true" />
                  <span>{isSubmitting ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}</span>
                </>
              ) : (
                <>
                  <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
                  <span>
                    {isSubmitting ? 'ĐANG TẠO...' : 'TẠO SUẤT CHIẾU'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={isEditMode ? onCancelEdit : handleResetForm}
              className={styles.resetBtn}
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>{isEditMode ? 'Hủy' : 'Đặt lại'}</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default ShowtimeForm;