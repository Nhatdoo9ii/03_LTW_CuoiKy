import { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import ShowtimeForm from '../../../components/tickets-admin/showtimeform/ShowtimeForm';
import Pagination from '../../../components/common/Pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  createShowtime,
  deleteShowtime,
  getAllShowtimes,
  getMoviesAndRooms,
  timeToMinutes,
  updateShowtime,
} from '../../../services/showtimeService';
import styles from './AdminShowtimesPage.module.css';

// Số suất chiếu hiển thị trên mỗi trang của bảng
const ITEMS_PER_PAGE = 6;

// Hàm phụ: đổi ngày "2026-11-18" thành "18/11/2026"
const formatDateFull = (dateStr) => {
  if (!dateStr) {
    return '--/--/----';
  }
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) {
    return dateStr;
  }
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Hàm phụ: tạo nhãn ngắn gọn cho tab lọc ngày (VD: "Thứ Tư (18/11)")
const formatDateTabLabel = (dateStr) => {
  if (!dateStr) {
    return '';
  }

  const parts = String(dateStr).split('-');
  if (parts.length !== 3) {
    return dateStr;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const dateObj = new Date(year, month - 1, day);

  const weekdays = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`;

  const shortDate = `${parts[2]}/${parts[1]}`;
  if (dateStr === todayStr) {
    return `Hôm nay (${shortDate})`;
  }

  const dayName = weekdays[dateObj.getDay()];
  return `${dayName} (${shortDate})`;
};

// Hàm phụ: tạo mã suất chiếu hiển thị gọn đẹp (VD: "#SC-ST1")
const formatShowtimeCode = (id) => {
  const raw = String(id || '').toUpperCase();
  if (raw.length <= 6) {
    return `#SC-${raw}`;
  }
  return `#SC-${raw.slice(-4)}`;
};

// Hàm phụ: xác định nhãn định dạng phòng chiếu để hiển thị thẻ màu
const getRoomFormatInfo = (room) => {
  if (!room) {
    return { label: '2D Digital', badgeType: 'standard' };
  }

  const totalSeats = Number(room.totalSeats) || 80;
  if (totalSeats >= 110) {
    return { label: 'IMAX Laser 4K', badgeType: 'imax' };
  }
  if (totalSeats <= 50) {
    return { label: 'VIP Gold Class', badgeType: 'vip' };
  }
  if (String(room.id) === 'r2') {
    return { label: '2D Dolby 7.1', badgeType: 'dolby' };
  }
  return { label: '2D Digital', badgeType: 'standard' };
};

// Hàm phụ: kiểm tra trạng thái thời gian của 1 suất chiếu (đã chiếu xong / đang chiếu / sắp chiếu)
const getTimePhase = (showtime) => {
  if (!showtime || !showtime.date) {
    return 'upcoming';
  }

  const parts = String(showtime.date).split('-');
  if (parts.length !== 3) {
    return 'upcoming';
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const startMinutes = timeToMinutes(showtime.time || showtime.startTime);
  const startHours = Math.floor(startMinutes / 60);
  const startMins = startMinutes % 60;

  const duration =
    showtime.movie && showtime.movie.duration
      ? Number(showtime.movie.duration)
      : 120;

  const startTimeObj = new Date(year, month - 1, day, startHours, startMins);
  const endTimeObj = new Date(startTimeObj.getTime() + duration * 60 * 1000);
  const now = new Date();

  if (now > endTimeObj) {
    return 'finished';
  }
  if (now >= startTimeObj && now <= endTimeObj) {
    return 'playing';
  }
  return 'upcoming';
};

// Hàm phụ: xác định nhãn trạng thái bán vé & màu thanh tiến độ
const getBookingStatusInfo = (showtime, timePhase) => {
  const fillPercent = Number(showtime.fillPercent) || 0;

  if (fillPercent >= 100) {
    return { label: 'Cháy vé', type: 'soldout' };
  }
  if (timePhase === 'finished') {
    return { label: 'Đã chiếu xong', type: 'finished' };
  }
  if (timePhase === 'playing') {
    return { label: 'Đang chiếu', type: 'playing' };
  }
  if (fillPercent >= 80) {
    return { label: 'Gần hết vé', type: 'almostFull' };
  }
  return { label: 'Đang mở bán', type: 'open' };
};

// Hàm phụ: gom danh sách các ngày có suất chiếu (không trùng lặp) để làm thanh tab lọc
const collectUniqueDates = (showtimes) => {
  let dates = [];

  for (const item of showtimes) {
    if (item.date && !dates.includes(item.date)) {
      dates = [...dates, item.date];
    }
  }

  // Sắp xếp ngày tăng dần theo thứ tự thời gian
  const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
  return sortedDates;
};

// Trang Quản lý Lịch chiếu & Suất chiếu dành cho Admin (/admin/showtimes)
const AdminShowtimesPage = () => {
  // Lấy danh sách phim và phòng chiếu từ dữ liệu mẫu
  const { movies, rooms } = getMoviesAndRooms();

  // State danh sách suất chiếu và trạng thái tải
  const [showtimes, setShowtimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State lọc theo ngày, ô tìm kiếm và phân trang
  const [selectedDate, setSelectedDate] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // State quản lý suất chiếu đang sửa, modal xác nhận xóa và thông báo nhanh
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [showtimeToDelete, setShowtimeToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Dùng custom hook useDebounce để tránh lọc lại bảng liên tục khi đang gõ tìm kiếm
  const debouncedSearch = useDebounce(searchText, 300);

  // Bước 1: Tải toàn bộ danh sách suất chiếu khi mở trang
  useEffect(() => {
    let isCancelled = false;

    const loadShowtimes = async () => {
      try {
        const list = await getAllShowtimes();
        if (!isCancelled) {
          setShowtimes(list);
        }
      } catch (error) {
        console.warn('Lỗi tải danh sách suất chiếu:', error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadShowtimes();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Bước 2: Tự động ẩn thông báo toast sau 3.5 giây (có cleanup clearTimeout)
  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timerId = setTimeout(() => {
      setToastMessage('');
    }, 3500);

    return () => {
      clearTimeout(timerId);
    };
  }, [toastMessage]);

  // Bước 3: Lọc danh sách suất chiếu theo ngày đang chọn
  const availableDates = collectUniqueDates(showtimes);

  let dateFilteredShowtimes = showtimes;
  if (selectedDate !== 'all') {
    dateFilteredShowtimes = showtimes.filter((item) => {
      return item.date === selectedDate;
    });
  }

  // Bước 4: Tính 3 thẻ số liệu thống kê (Tổng suất, Đang & Sắp chiếu, Đã chiếu xong)
  let upcomingOrPlayingCount = 0;
  let finishedCount = 0;

  for (const item of dateFilteredShowtimes) {
    const phase = getTimePhase(item);
    if (phase === 'finished') {
      finishedCount = finishedCount + 1;
    } else {
      upcomingOrPlayingCount = upcomingOrPlayingCount + 1;
    }
  }

  const totalStatCount = dateFilteredShowtimes.length;

  // Bước 5: Tiếp tục lọc theo từ khóa tìm kiếm (tên phim, tên phòng hoặc mã suất)
  const cleanKeyword = debouncedSearch.trim().toLowerCase();
  let finalShowtimes = dateFilteredShowtimes;

  if (cleanKeyword) {
    finalShowtimes = dateFilteredShowtimes.filter((item) => {
      const movieTitle =
        item.movie && item.movie.title ? item.movie.title.toLowerCase() : '';
      const roomName =
        item.room && item.room.name ? item.room.name.toLowerCase() : '';
      const codeText = formatShowtimeCode(item.id).toLowerCase();
      const rawId = String(item.id || '').toLowerCase();

      if (movieTitle.includes(cleanKeyword)) {
        return true;
      }
      if (roomName.includes(cleanKeyword)) {
        return true;
      }
      if (codeText.includes(cleanKeyword) || rawId.includes(cleanKeyword)) {
        return true;
      }
      return false;
    });
  }

  // Sắp xếp bảng theo ngày và giờ bắt đầu tăng dần để Admin dễ theo dõi lịch
  const sortedShowtimes = [...finalShowtimes].sort((a, b) => {
    const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  // Bước 6: Tính phân trang cho danh sách đã lọc
  const totalPages = Math.max(
    1,
    Math.ceil(sortedShowtimes.length / ITEMS_PER_PAGE)
  );
  let safeCurrentPage = currentPage;
  if (safeCurrentPage > totalPages) {
    safeCurrentPage = totalPages;
  }

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedShowtimes = sortedShowtimes.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Các hàm xử lý lọc ngày & tìm kiếm (đưa trang về 1 ngay khi người dùng thay đổi bộ lọc)
  const handleSelectDateTab = (dateValue) => {
    setSelectedDate(dateValue);
    setCurrentPage(1);
  };

  const handleDatePickerChange = (event) => {
    const pickedDate = event.target.value;
    if (pickedDate) {
      setSelectedDate(pickedDate);
    } else {
      setSelectedDate('all');
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setCurrentPage(1);
  };

  // Xử lý lưu suất chiếu (tạo mới hoặc cập nhật suất đang chỉnh sửa)
  const handleSubmitShowtime = async (formValues) => {
    if (editingShowtime) {
      const updated = await updateShowtime(editingShowtime.id, formValues);
      const nextList = showtimes.map((item) => {
        if (String(item.id) === String(editingShowtime.id)) {
          return updated;
        }
        return item;
      });

      setShowtimes(nextList);
      setEditingShowtime(null);
      setToastMessage(
        `Đã cập nhật thành công suất chiếu ${formatShowtimeCode(updated.id)}`
      );
      return;
    }

    const created = await createShowtime(formValues);
    setShowtimes([created, ...showtimes]);
    setSelectedDate('all');
    setCurrentPage(1);
    setToastMessage(
      `Đã tạo thành công suất chiếu mới (${created.time} ngày ${formatDateFull(
        created.date
      )})`
    );
  };

  // Bắt đầu chỉnh sửa 1 suất chiếu và cuộn lên vị trí Form
  const handleStartEdit = (showtime) => {
    setEditingShowtime(showtime);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hủy chế độ chỉnh sửa
  const handleCancelEdit = () => {
    setEditingShowtime(null);
  };

  // Xác nhận xóa suất chiếu trong modal
  const handleConfirmDelete = async () => {
    if (!showtimeToDelete) {
      return;
    }

    try {
      await deleteShowtime(showtimeToDelete.id);
      const remaining = showtimes.filter((item) => {
        return String(item.id) !== String(showtimeToDelete.id);
      });

      setShowtimes(remaining);

      if (
        editingShowtime &&
        String(editingShowtime.id) === String(showtimeToDelete.id)
      ) {
        setEditingShowtime(null);
      }

      setToastMessage(
        `Đã xóa suất chiếu ${formatShowtimeCode(showtimeToDelete.id)}`
      );
    } catch (error) {
      window.alert(error.message || 'Không thể xóa suất chiếu này.');
    } finally {
      setShowtimeToDelete(null);
    }
  };

  // Tiêu đề thẻ thống kê đầu tiên thay đổi theo ngày đang chọn
  let totalCardTitle = 'Tổng số suất chiếu';
  if (selectedDate !== 'all') {
    totalCardTitle = `Tổng suất chiếu (${formatDateFull(selectedDate)})`;
  }

  // Ngày mặc định cho form tạo mới (lấy theo tab ngày đang chọn nếu có)
  let defaultFormDate = '';
  if (selectedDate !== 'all') {
    defaultFormDate = selectedDate;
  } else if (availableDates.length > 0) {
    defaultFormDate = availableDates[0];
  }

  // Key giúp Form tự nạp lại giá trị khi chuyển giữa "Tạo mới" và "Chỉnh sửa"
  let formKey = `create-${defaultFormDate}`;
  if (editingShowtime) {
    formKey = `edit-${editingShowtime.id}`;
  }

  return (
    <section className={styles.pageWrapper}>
      {/* Thông báo nhanh sau khi thêm / sửa / xóa */}
      {toastMessage && (
        <div className={styles.toastBanner} role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TIÊU ĐỀ TRANG */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Quản lý Lịch chiếu & Suất chiếu</h1>
        <p className={styles.pageSubtitle}>
          Sắp xếp khung giờ phát hành, phân bổ phòng chiếu và theo dõi tỷ lệ lấp
          đầy theo thời gian thực.
        </p>
      </header>

      {/* 2. BA THẺ THỐNG KÊ NHANH */}
      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <div className={styles.statText}>
            <span className={styles.statLabel}>{totalCardTitle}</span>
            <div className={styles.statNumberRow}>
              <strong className={styles.statValue}>{totalStatCount}</strong>
              <span className={styles.statUnit}>suất</span>
            </div>
          </div>
          <div className={`${styles.statIconBox} ${styles.iconRed}`}>
            <Ticket size={22} aria-hidden="true" />
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statText}>
            <span className={styles.statLabel}>Đang & Sắp chiếu</span>
            <div className={styles.statNumberRow}>
              <strong className={styles.statValue}>
                {upcomingOrPlayingCount}
              </strong>
              <span className={styles.statUnit}>suất</span>
            </div>
          </div>
          <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
            <Clock size={22} aria-hidden="true" />
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statText}>
            <span className={styles.statLabel}>Đã chiếu xong</span>
            <div className={styles.statNumberRow}>
              <strong className={styles.statValue}>{finishedCount}</strong>
              <span className={styles.statUnit}>suất</span>
            </div>
          </div>
          <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
            <CheckCircle2 size={22} aria-hidden="true" />
          </div>
        </article>
      </div>

      {/* 3. FORM THÊM / CHỈNH SỬA SUẤT CHIẾU */}
      <ShowtimeForm
        key={formKey}
        movies={movies}
        rooms={rooms}
        defaultDate={defaultFormDate}
        editingShowtime={editingShowtime}
        onSubmitShowtime={handleSubmitShowtime}
        onCancelEdit={handleCancelEdit}
      />

      {/* 4. BỘ LỌC NGÀY, TÌM KIẾM VÀ BẢNG DANH SÁCH SUẤT CHIẾU */}
      <section className={styles.tableCard} aria-label="Danh sách suất chiếu">
        {/* Thanh lọc theo ngày dạng tab + ô chọn ngày tùy ý */}
        <div className={styles.filterToolbar}>
          <div className={styles.dateTabs} role="tablist" aria-label="Lọc theo ngày chiếu">
            <button
              type="button"
              role="tab"
              aria-selected={selectedDate === 'all'}
              onClick={() => handleSelectDateTab('all')}
              className={
                selectedDate === 'all'
                  ? `${styles.dateTab} ${styles.dateTabActive}`
                  : styles.dateTab
              }
            >
              Tất cả ngày ({showtimes.length})
            </button>

            {availableDates.map((dateStr) => {
              const isActive = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectDateTab(dateStr)}
                  className={
                    isActive
                      ? `${styles.dateTab} ${styles.dateTabActive}`
                      : styles.dateTab
                  }
                >
                  {formatDateTabLabel(dateStr)}
                </button>
              );
            })}
          </div>

          <div className={styles.datePickerWrap}>
            <Calendar size={15} className={styles.datePickerIcon} aria-hidden="true" />
            <label htmlFor="filter-showtime-date" className={styles.srOnly}>
              Chọn ngày chiếu cần lọc
            </label>
            <input
              id="filter-showtime-date"
              type="date"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={handleDatePickerChange}
              className={styles.datePickerInput}
            />
          </div>
        </div>

        {/* Thanh tìm kiếm dùng useDebounce */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <label htmlFor="search-showtimes-input" className={styles.srOnly}>
              Tìm kiếm suất chiếu theo tên phim hoặc mã suất
            </label>
            <input
              id="search-showtimes-input"
              type="text"
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Tìm theo tên phim, phòng chiếu, mã suất (#SC-ST1)..."
              className={styles.searchInput}
            />
            {searchText && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={handleClearSearch}
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <span className={styles.resultCount}>
            Hiển thị <strong>{paginatedShowtimes.length}</strong> /{' '}
            {sortedShowtimes.length} suất chiếu
          </span>
        </div>

        {/* Nội dung bảng */}
        {isLoading ? (
          <div className={styles.emptyBox}>
            <p>Đang tải danh sách lịch chiếu...</p>
          </div>
        ) : paginatedShowtimes.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyTitle}>
              Không tìm thấy suất chiếu nào phù hợp.
            </p>
            <p className={styles.emptySub}>
              Hãy thử chọn ngày khác, xóa từ khóa tìm kiếm hoặc tạo suất chiếu mới
              ở form phía trên.
            </p>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.showtimeTable}>
              <thead>
                <tr>
                  <th>MÃ SUẤT</th>
                  <th>THÔNG TIN PHIM</th>
                  <th>PHÒNG & ĐỊNH DẠNG</th>
                  <th>KHUNG GIỜ</th>
                  <th>GIÁ VÉ (THƯỜNG / VIP)</th>
                  <th>TỶ LỆ BÁN & TRẠNG THÁI</th>
                  <th className={styles.actionsColHeader}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShowtimes.map((item) => {
                  const movie = item.movie;
                  const room = item.room;
                  const formatInfo = getRoomFormatInfo(room);
                  const timePhase = getTimePhase(item);
                  const statusInfo = getBookingStatusInfo(item, timePhase);

                  let genresText = '';
                  if (movie && Array.isArray(movie.genres)) {
                    genresText = movie.genres.join(', ');
                  }

                  // Chọn màu cho thanh tiến độ và thẻ trạng thái
                  let progressClass = styles.progressBlue;
                  let badgeClass = styles.statusOpen;

                  if (statusInfo.type === 'soldout') {
                    progressClass = styles.progressRed;
                    badgeClass = styles.statusSoldout;
                  } else if (statusInfo.type === 'almostFull') {
                    progressClass = styles.progressRed;
                    badgeClass = styles.statusAlmostFull;
                  } else if (statusInfo.type === 'playing') {
                    progressClass = styles.progressGreen;
                    badgeClass = styles.statusPlaying;
                  } else if (statusInfo.type === 'finished') {
                    progressClass = styles.progressMuted;
                    badgeClass = styles.statusFinished;
                  }

                  let formatBadgeClass = styles.formatStandard;
                  if (formatInfo.badgeType === 'imax') {
                    formatBadgeClass = styles.formatImax;
                  } else if (formatInfo.badgeType === 'vip') {
                    formatBadgeClass = styles.formatVip;
                  } else if (formatInfo.badgeType === 'dolby') {
                    formatBadgeClass = styles.formatDolby;
                  }

                  const isBeingEdited =
                    editingShowtime &&
                    String(editingShowtime.id) === String(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={isBeingEdited ? styles.editingRow : ''}
                    >
                      {/* Cột 1: Mã suất & ngày */}
                      <td>
                        <div className={styles.codeCell}>
                          <strong className={styles.showtimeCode}>
                            {formatShowtimeCode(item.id)}
                          </strong>
                          <span className={styles.dateSub}>
                            {formatDateFull(item.date)}
                          </span>
                        </div>
                      </td>

                      {/* Cột 2: Thông tin phim */}
                      <td>
                        <div className={styles.movieCell}>
                          <div className={styles.posterThumb}>
                            {movie && movie.posterUrl ? (
                              <img
                                src={movie.posterUrl}
                                alt={movie.title || 'Poster'}
                                className={styles.posterImg}
                              />
                            ) : (
                              <span className={styles.posterFallback}>PTIT</span>
                            )}
                            {movie && movie.ageRating && (
                              <span className={styles.ageTag}>
                                {movie.ageRating}
                              </span>
                            )}
                          </div>

                          <div className={styles.movieMeta}>
                            <strong className={styles.movieTitle}>
                              {movie ? movie.title : `Phim #${item.movieId}`}
                            </strong>
                            <span className={styles.movieSub}>
                              {genresText}
                              {movie && movie.duration
                                ? ` • ${movie.duration} phút`
                                : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Phòng & định dạng */}
                      <td>
                        <div className={styles.roomCell}>
                          <strong className={styles.roomName}>
                            {room ? room.name : `Phòng #${item.roomId}`}
                          </strong>
                          <span
                            className={`${styles.formatBadge} ${formatBadgeClass}`}
                          >
                            {formatInfo.label}
                          </span>
                          <span className={styles.capacityText}>
                            Sức chứa: {item.totalSeats} ghế
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Khung giờ */}
                      <td>
                        <div className={styles.timeCell}>
                          <strong className={styles.startTime}>
                            {item.time}
                          </strong>
                          <span className={styles.timeArrow}>→</span>
                          <span className={styles.endTime}>{item.endTime}</span>
                        </div>
                      </td>

                      {/* Cột 5: Giá vé Thường / VIP */}
                      <td>
                        <div className={styles.priceCell}>
                          <strong className={styles.basePrice}>
                            {item.basePrice.toLocaleString('vi-VN')}đ
                          </strong>
                          <span className={styles.vipPrice}>
                            {item.vipPrice.toLocaleString('vi-VN')}đ (VIP)
                          </span>
                        </div>
                      </td>

                      {/* Cột 6: Tỷ lệ lấp đầy & Trạng thái */}
                      <td>
                        <div className={styles.occupancyCell}>
                          <div className={styles.occupancyTop}>
                            <span className={styles.seatRatio}>
                              {item.bookedCount} / {item.totalSeats} ghế
                            </span>
                            <strong className={styles.fillPercentText}>
                              {item.fillPercent}%
                            </strong>
                          </div>

                          <div className={styles.progressTrack}>
                            <div
                              className={`${styles.progressBar} ${progressClass}`}
                              style={{ width: `${item.fillPercent}%` }}
                            />
                          </div>

                          <span className={`${styles.statusBadge} ${badgeClass}`}>
                            • {statusInfo.label}
                          </span>
                        </div>
                      </td>

                      {/* Cột 7: Nút Sửa / Xóa */}
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => handleStartEdit(item)}
                            title="Chỉnh sửa suất chiếu"
                            aria-label={`Chỉnh sửa suất chiếu ${formatShowtimeCode(
                              item.id
                            )}`}
                          >
                            <Edit3 size={15} aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => setShowtimeToDelete(item)}
                            title="Xóa suất chiếu"
                            aria-label={`Xóa suất chiếu ${formatShowtimeCode(
                              item.id
                            )}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Thanh phân trang tái sử dụng từ components/common/Pagination.jsx */}
        <div className={styles.paginationWrap}>
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={(nextPage) => setCurrentPage(nextPage)}
          />
        </div>
      </section>

      {/* Modal xác nhận xóa suất chiếu */}
      {showtimeToDelete && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowtimeToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-showtime-title"
        >
          <div
            className={styles.modalBox}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-showtime-title" className={styles.modalTitle}>
              Xác nhận xóa suất chiếu?
            </h2>
            <p className={styles.modalDesc}>
              Bạn có chắc chắn muốn xóa suất chiếu này khỏi lịch chiếu không?
            </p>

            <div className={styles.modalInfoBox}>
              <p>
                <strong>Mã suất:</strong>{' '}
                {formatShowtimeCode(showtimeToDelete.id)}
              </p>
              <p>
                <strong>Phim:</strong>{' '}
                {showtimeToDelete.movie
                  ? showtimeToDelete.movie.title
                  : showtimeToDelete.movieId}
              </p>
              <p>
                <strong>Thời gian:</strong> {showtimeToDelete.time} →{' '}
                {showtimeToDelete.endTime} ({formatDateFull(showtimeToDelete.date)}
                )
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setShowtimeToDelete(null)}
              >
                Giữ lại
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminShowtimesPage;