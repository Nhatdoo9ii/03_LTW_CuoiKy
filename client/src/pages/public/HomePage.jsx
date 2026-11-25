import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import mockData from '../../data/mockData.json';
import useDebounce from '../../hooks/useDebounce';
import movieService from '../../services/movieService';
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

  // State phân trang & dữ liệu từ API
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [movies, setMovies] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('api');

  // Reset về trang 1 khi từ khóa debounced thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Đồng bộ tab khi người dùng bấm link trên Header (/ hoặc /upcoming)
  useEffect(() => {
    setActiveTab(isUpcomingRoute ? 'coming-soon' : 'now-showing');
    setCurrentPage(1);
  }, [isUpcomingRoute]);

  // Gọi API lấy danh sách phim (lọc & phân trang ở server)
  useEffect(() => {
    let isCancelled = false;

    const fetchMovies = async () => {
      setLoading(true);
      try {
        const params = {
          status: activeTab,
          page: currentPage,
          limit: itemsPerPage,
        };
        if (debouncedSearchTerm.trim()) {
          params.search = debouncedSearchTerm.trim();
        }
        if (selectedGenre) {
          params.genre = selectedGenre;
        }
        if (selectedDate) {
          params.date = selectedDate;
        }

        const result = await movieService.getMovies(params);
        if (isCancelled) return;

        setMovies(result.movies);
        setDataSource(result.source);
        setTotalItems(result.pagination?.total ?? result.movies.length);
        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err) {
        if (!isCancelled) {
          console.error('Lỗi tải danh sách phim:', err);
          setMovies([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchMovies();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, debouncedSearchTerm, selectedGenre, selectedDate, currentPage]);

  // Nếu server offline và đang dùng fallback mockData.json thì lọc & phân trang tại client
  const displayState = useMemo(() => {
    if (dataSource === 'api') {
      return {
        list: movies,
        total: totalItems,
        pages: totalPages,
      };
    }

    const filtered = movies.filter((movie) => {
      const matchesStatus = movie.status === activeTab;
      const keyword = debouncedSearchTerm.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        movie.title.toLowerCase().includes(keyword) ||
        (movie.director || '').toLowerCase().includes(keyword) ||
        (movie.actors || '').toLowerCase().includes(keyword);
      const matchesGenre =
        !selectedGenre || movie.genres.includes(selectedGenre);
      const matchesDate =
        !selectedDate ||
        mockData.showtimes.some(
          (st) => st.movieId === movie.id && st.date === selectedDate
        );
      return matchesStatus && matchesSearch && matchesGenre && matchesDate;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return {
      list: filtered.slice(startIndex, startIndex + itemsPerPage),
      total: filtered.length,
      pages: Math.ceil(filtered.length / itemsPerPage) || 1,
    };
  }, [
    dataSource,
    movies,
    totalItems,
    totalPages,
    activeTab,
    debouncedSearchTerm,
    selectedGenre,
    selectedDate,
    currentPage,
  ]);

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
            Hiển thị <strong>{displayState.total}</strong> bộ phim
          </span>
        </div>

        {/* Lưới danh sách phim */}
        {loading ? (
          <div className={styles.emptyState}>
            <p>Đang tải danh sách phim từ máy chủ...</p>
          </div>
        ) : displayState.list.length > 0 ? (
          <div className={styles.moviesGrid}>
            {displayState.list.map((movie) => (
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
          totalPages={displayState.pages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}

export default HomePage;
