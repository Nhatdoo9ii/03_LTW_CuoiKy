import { useState, useMemo } from 'react';
import mockData from '../../data/mockData.json';
import useDebounce from '../../hooks/useDebounce';
import MovieStatsCards from '../../components/admin/movies/MovieStatsCards';
import MovieForm from '../../components/admin/movies/MovieForm';
import MovieFilterBar from '../../components/admin/movies/MovieFilterBar';
import MovieTable from '../../components/admin/movies/MovieTable';
import styles from './AdminMoviesPage.module.css';

function AdminMoviesPage() {
  // 1. Quản lý danh sách phim (Lấy từ localStorage hoặc mockData)
  const [movies, setMovies] = useState(() => {
    const saved = localStorage.getItem('ptit_admin_movies');
    return saved ? JSON.parse(saved) : mockData.movies;
  });

  // 2. State Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 3. State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Thêm phim mới
  const handleAddMovie = (newMovie) => {
    const updated = [newMovie, ...movies];
    setMovies(updated);
    localStorage.setItem('ptit_admin_movies', JSON.stringify(updated));
  };

  // Xóa phim
  const handleDeleteMovie = (id, title) => {
    if (window.confirm(`Bạn có chắc muốn xóa phim "${title}" khỏi hệ thống?`)) {
      const updated = movies.filter((m) => m.id !== id);
      setMovies(updated);
      localStorage.setItem('ptit_admin_movies', JSON.stringify(updated));
    }
  };

  // Reset bộ lọc
  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedGenre('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // Thống kê số liệu
  const totalCount = movies.length;
  const nowShowingCount = movies.filter((m) => m.status === 'now-showing').length;
  const comingSoonCount = movies.filter((m) => m.status === 'coming-soon').length;

  // Lọc danh sách phim
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const keyword = debouncedSearchTerm.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        movie.title?.toLowerCase().includes(keyword) ||
        movie.originalTitle?.toLowerCase().includes(keyword) ||
        movie.director?.toLowerCase().includes(keyword) ||
        movie.actors?.toLowerCase().includes(keyword);

      const matchGenre = !selectedGenre || movie.genres?.includes(selectedGenre);
      const matchStatus = !selectedStatus || movie.status === selectedStatus;

      return matchSearch && matchGenre && matchStatus;
    });
  }, [movies, debouncedSearchTerm, selectedGenre, selectedStatus]);

  // Phân trang
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage) || 1;
  const paginatedMovies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMovies.slice(start, start + itemsPerPage);
  }, [filteredMovies, currentPage]);

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Header & 3 Thẻ thống kê */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Quản lý Phim</h1>
        <p className={styles.subtitle}>
          Hệ thống quản lý danh mục và danh sách phim rạp PTIT Cinema toàn hệ thống phòng chiếu.
        </p>
      </div>

      <MovieStatsCards
        totalCount={totalCount}
        nowShowingCount={nowShowingCount}
        comingSoonCount={comingSoonCount}
      />

      {/* 2. Form thêm phim mới */}
      <MovieForm onAddMovie={handleAddMovie} />

      {/* 3. Thanh tìm kiếm & Bộ lọc */}
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
        selectedStatus={selectedStatus}
        onStatusChange={(val) => {
          setSelectedStatus(val);
          setCurrentPage(1);
        }}
        onReset={handleResetFilter}
      />

      {/* 4. Bảng danh sách phim + Tái sử dụng Pagination */}
      <MovieTable
        movies={paginatedMovies}
        onDeleteMovie={handleDeleteMovie}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}

export default AdminMoviesPage;
