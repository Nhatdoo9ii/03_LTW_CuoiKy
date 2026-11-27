import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mockData from '../../data/mockData.json';
import useFetch from '../../hooks/useFetch';
import { normalizeMovie } from '../../services/movieService';
import MovieDetailHero from '../../components/movies/MovieDetailHero';
import ShowtimeSelector from '../../components/movies/ShowtimeSelector';
import TrailerModal from '../../components/movies/TrailerModal';

const WEEKDAY_NAMES = [
  'Chủ Nhật',
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
];

// Chuyển chuỗi YYYY-MM-DD thành nhãn hiển thị (Hôm nay / Thứ ... + dd/mm)
const formatDateOption = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return {
    id: dateStr,
    dayName: dateStr === todayStr ? 'Hôm nay' : WEEKDAY_NAMES[dateObj.getDay()],
    dateLabel: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
  };
};

// Tạo sẵn 5 ngày kể từ hôm nay làm danh sách mặc định khi phim chưa có suất chiếu
const getUpcomingDefaultDates = () => {
  const list = [];
  const base = new Date();
  for (let i = 0; i < 5; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    list.push(formatDateOption(iso));
  }
  return list;
};

function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedDateOverride, setSelectedDateOverride] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Gọi API lấy chi tiết phim + suất chiếu bằng custom hook useFetch
  const { data: apiResponse, loading } = useFetch(`/movies/${id}`);

  // Ưu tiên dữ liệu từ MongoDB API, fallback sang mockData nếu server offline
  const movie = useMemo(() => {
    if (apiResponse?.data?.movie) {
      return normalizeMovie(apiResponse.data.movie);
    }
    return (
      mockData.movies.find((item) => item.id === id) || mockData.movies[0]
    );
  }, [apiResponse, id]);

  // Lấy danh sách ngày chiếu động từ suất chiếu thật trong DB (hoặc 5 ngày tới nếu chưa có suất)
  const dateOptions = useMemo(() => {
    const apiShowtimes = apiResponse?.data?.showtimes;
    if (Array.isArray(apiShowtimes) && apiShowtimes.length > 0) {
      const uniqueDates = [...new Set(apiShowtimes.map((st) => st.date))].sort();
      return uniqueDates.map(formatDateOption);
    }

    if (apiResponse?.data?.movie) {
      return getUpcomingDefaultDates();
    }

    const mockDates = [
      ...new Set(
        mockData.showtimes
          .filter((st) => st.movieId === movie.id)
          .map((st) => st.date)
      ),
    ].sort();

    return mockDates.length > 0
      ? mockDates.map(formatDateOption)
      : getUpcomingDefaultDates();
  }, [apiResponse, movie.id]);

  const selectedDate =
    selectedDateOverride &&
    dateOptions.some((d) => d.id === selectedDateOverride)
      ? selectedDateOverride
      : dateOptions[0]?.id || '';

  // Lấy danh sách suất chiếu thật theo phim & ngày (không tự sinh suất giả)
  const availableShowtimes = useMemo(() => {
    const apiShowtimes = apiResponse?.data?.showtimes;

    if (apiResponse?.data?.movie) {
      if (!Array.isArray(apiShowtimes)) return [];
      return apiShowtimes
        .filter((st) => st.date === selectedDate)
        .map((st) => {
          const room = st.roomId || {};
          const totalSeats =
            (room.totalRows || 8) * (room.seatsPerRow || 10);
          const bookedCount = st.bookedSeats ? st.bookedSeats.length : 0;

          return {
            ...st,
            id: st._id || st.id,
            time: st.startTime || st.time,
            basePrice: st.price || st.basePrice,
            roomName: room.name || 'Phòng chiếu 01',
            totalSeats,
            availableSeats: totalSeats - bookedCount,
          };
        });
    }

    // Fallback khi server offline
    return mockData.showtimes
      .filter((st) => st.movieId === movie.id && st.date === selectedDate)
      .map((st) => {
        const room = mockData.rooms.find((r) => r.id === st.roomId) || {
          name: 'Phòng chiếu 01',
          totalSeats: 80,
        };
        const bookedCount = st.bookedSeats ? st.bookedSeats.length : 0;

        return {
          ...st,
          roomName: room.name,
          totalSeats: room.totalSeats,
          availableSeats: room.totalSeats - bookedCount,
        };
      });
  }, [apiResponse, movie.id, selectedDate]);

  // Chuyển sang trang chọn ghế /booking/:showtimeId
  const handleSelectSlot = (slot) => {
    navigate(`/booking/${slot.id}`, {
      state: {
        showtime: slot,
        movie,
      },
    });
  };

  if (loading && !apiResponse) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        Đang tải thông tin chi tiết phim...
      </div>
    );
  }

  return (
    <div>
      <MovieDetailHero
        movie={movie}
        onOpenTrailer={() => setIsTrailerOpen(true)}
      />

      <ShowtimeSelector
        status={movie.status}
        releaseDate={movie.releaseDate}
        dates={dateOptions}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDateOverride}
        showtimes={availableShowtimes}
        onSelectSlot={handleSelectSlot}
      />

      <TrailerModal
        isOpen={isTrailerOpen}
        title={movie.title}
        trailerUrl={movie.trailerUrl}
        onClose={() => setIsTrailerOpen(false)}
      />
    </div>
  );
}

export default MovieDetailPage;
