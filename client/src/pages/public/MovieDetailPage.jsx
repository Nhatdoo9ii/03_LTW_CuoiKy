import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mockData from '../../data/mockData.json';
import MovieDetailHero from '../../components/movies/MovieDetailHero';
import ShowtimeSelector from '../../components/movies/ShowtimeSelector';
import TrailerModal from '../../components/movies/TrailerModal';

const SHOW_DATES = [
  { id: '2026-11-18', dayName: 'Hôm nay', dateLabel: '18/11' },
  { id: '2026-11-19', dayName: 'Thứ 5', dateLabel: '19/11' },
  { id: '2026-11-20', dayName: 'Thứ 6', dateLabel: '20/11' },
  { id: '2026-11-21', dayName: 'Thứ 7', dateLabel: '21/11' },
  { id: '2026-11-22', dayName: 'Chủ Nhật', dateLabel: '22/11' },
];

function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(SHOW_DATES[0].id);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Tìm phim từ mockData.json theo URL param :id
  const movie = useMemo(() => {
    return (
      mockData.movies.find((item) => item.id === id) || mockData.movies[0]
    );
  }, [id]);

  // Lấy danh sách suất chiếu theo phim & ngày, ghép tên phòng từ mockData.rooms
  const availableShowtimes = useMemo(() => {
    const matched = mockData.showtimes.filter(
      (st) => st.movieId === movie.id && st.date === selectedDate
    );

    // Nếu phim đang chiếu chưa có lịch riêng trong mockData.showtimes, tạo suất mẫu để test đặt vé
    const rawList =
      matched.length > 0
        ? matched
        : [
            {
              id: `${movie.id}-st1`,
              movieId: movie.id,
              roomId: 'r1',
              date: selectedDate,
              time: '10:30',
              basePrice: 85000,
              vipSurcharge: 15000,
              bookedSeats: ['D4', 'D5'],
            },
            {
              id: `${movie.id}-st2`,
              movieId: movie.id,
              roomId: 'r2',
              date: selectedDate,
              time: '15:45',
              basePrice: 85000,
              vipSurcharge: 15000,
              bookedSeats: ['E5', 'E6', 'E7'],
            },
            {
              id: `${movie.id}-st3`,
              movieId: movie.id,
              roomId: 'r3',
              date: selectedDate,
              time: '20:15',
              basePrice: 95000,
              vipSurcharge: 20000,
              bookedSeats: ['F4', 'F5'],
            },
          ];

    return rawList.map((st) => {
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
  }, [movie.id, selectedDate]);

  // Chuyển sang trang chọn ghế /booking/:showtimeId
  const handleSelectSlot = (slot) => {
    navigate(`/booking/${slot.id}`, {
      state: {
        showtime: slot,
        movie,
      },
    });
  };

  return (
    <div>
      <MovieDetailHero
        movie={movie}
        onOpenTrailer={() => setIsTrailerOpen(true)}
      />

      <ShowtimeSelector
        status={movie.status}
        releaseDate={movie.releaseDate}
        dates={SHOW_DATES}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
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