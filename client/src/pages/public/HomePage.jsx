import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import mockData from '../../data/mockData.json';
import useDebounce from '../../hooks/useDebounce';
import HeroBanner from '../../components/movies/HeroBanner';
import MovieFilterBar from '../../components/movies/MovieFilterBar';
import MovieCard from '../../components/movies/MovieCard';
import Pagination from '../../components/common/Pagination';
import styles from './HomePage.module.css';

function HomePage() {
  const location = useLocation();
  const isUpcomingRoute = location.pathname === '/upcoming';

  // Tab trạng thái phim: 'now-showing' | 'coming-soon'
  const [activeTab, setActiveTab] = useState(
    isUpcomingRoute ? 'coming-soon' : 'now-showing'
  );

  // State bộ lọc & tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Reset về trang 1 khi từ khóa debounced thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Đồng bộ tab khi người dùng bấm link trên Header (/ hoặc /upcoming)
  useEffect(() => {
    setActiveTab(isUpcomingRoute ? 'coming-soon' : 'now-showing');
    setCurrentPage(1);
  }, [isUpcomingRoute]);

  // Lấy danh sách phim trực tiếp từ mockData.json
  const movies = mockData.movies || [];

  // Lọc danh sách phim theo tab, từ khóa tìm kiếm và thể loại
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesStatus = movie.status === activeTab;

      const keyword = debouncedSearchTerm.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        movie.title.toLowerCase().includes(keyword) ||
        movie.director.toLowerCase().includes(keyword) ||
        movie.actors.toLowerCase().includes(keyword);

      const matchesGenre =
        !selectedGenre || movie.genres.includes(selectedGenre);

      // Lọc theo ngày chiếu (kiểm tra trong mockData.showtimes nếu có chọn ngày)
      const matchesDate =
        !selectedDate ||
        mockData.showtimes.some(
          (st) => st.movieId === movie.id && st.date === selectedDate
        );

      return matchesStatus && matchesSearch && matchesGenre && matchesDate;
    });
  }, [movies, activeTab, debouncedSearchTerm, selectedGenre, selectedDate]);

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const currentMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMovies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMovies, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGenre('');
    setSelectedDate('');
    setCurrentPage(1);
  };

  return (
    <div className={styles.homeWrapper}>
      <HeroBanner />

      <div className={styles.container}>
        <MovieFilterBar
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          selectedGenre={selectedGenre}
          onGenreChange={(val) => {
            setSelectedGenre(val);
            setCurrentPage(1);
          }}
          selectedDate={selectedDate}
          onDateChange={(val) => {
            setSelectedDate(val);
            setCurrentPage(1);
          }}
          onReset={handleResetFilters}
        />

        {/* Thanh chuyển Tab Đang chiếu / Sắp chiếu */}
        <div className={styles.tabHeader}>
          <div className={styles.tabButtons}>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === 'now-showing' ? styles.tabBtnActive : ''
              }`}
              onClick={() => {
                setActiveTab('now-showing');
                setCurrentPage(1);
              }}
            >
              Phim Đang Chiếu
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === 'coming-soon' ? styles.tabBtnActive : ''
              }`}
              onClick={() => {
                setActiveTab('coming-soon');
                setCurrentPage(1);
              }}
            >
              Phim Sắp Chiếu
            </button>
          </div>

          <span className={styles.resultCount}>
            Hiển thị <strong>{filteredMovies.length}</strong> bộ phim
          </span>
        </div>

        {/* Lưới danh sách phim */}
        {currentMovies.length > 0 ? (
          <div className={styles.moviesGrid}>
            {currentMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Không tìm thấy bộ phim nào phù hợp với điều kiện lọc.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className={styles.resetBtn}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Thanh phân trang */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}

export default HomePage;