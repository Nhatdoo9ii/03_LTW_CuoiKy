import { useState, useMemo, useEffect } from 'react';
import mockData from '../../data/mockData.json';
import useDebounce from '../../hooks/useDebounce';
import movieService from '../../services/movieService';
import MovieStatsCards from '../../components/admin/movies/MovieStatsCards';
import MovieForm from '../../components/admin/movies/MovieForm';
import MovieFilterBar from '../../components/admin/movies/MovieFilterBar';
import MovieTable from '../../components/admin/movies/MovieTable';
import styles from './AdminMoviesPage.module.css';

function AdminMoviesPage() {
  // 1. Quản lý danh sách phim (Ưu tiên tải từ Backend API, fallback localStorage/mockData)
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiNotice, setApiNotice] = useState('');
  const [editingMovie, setEditingMovie] = useState(null);

  // 2. State Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 3. State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    let isCancelled = false;

    const loadMovies = async () => {
      setLoading(true);
      try {
        const result = await movieService.getMovies({ limit: 50 });
        if (isCancelled) return;

        if (result.source === 'api') {
          setMovies(result.movies);
          setApiNotice('');
        } else {
          const saved = localStorage.getItem('ptit_admin_movies');
          setMovies(saved ? JSON.parse(saved) : mockData.movies);
          setApiNotice('Máy chủ API chưa bật — đang hiển thị dữ liệu mẫu cục bộ.');
        }
      } catch (err) {
        if (!isCancelled) {
          const saved = localStorage.getItem('ptit_admin_movies');
          setMovies(saved ? JSON.parse(saved) : mockData.movies);
          setApiNotice(err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadMovies();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Thêm phim mới (Gọi API POST /api/movies, fallback localStorage nếu chưa có JWT thật)
  const handleAddMovie = async (newMovie) => {
    try {
      const created = await movieService.createMovie(newMovie);
      setMovies((prev) => [created, ...prev]);
      setApiNotice('');
    } catch (error) {
      const status = error.response?.status;
      if (!error.response || status === 401) {
        const updated = [newMovie, ...movies];
        setMovies(updated);
        localStorage.setItem('ptit_admin_movies', JSON.stringify(updated));
        setApiNotice(
          status === 401
            ? 'Lưu tạm ở trình duyệt (cần JWT Admin thật từ API /auth/login để ghi vào MongoDB).'
            : 'Server offline — đã lưu tạm phim ở trình duyệt.'
        );
      } else {
        alert(error.response?.data?.message || 'Không thể thêm phim mới');
      }
    }
  };

  // Chọn phim để sửa và cuộn lên form
  const handleEditClick = (movie) => {
    setEditingMovie(movie);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cập nhật thông tin phim (Gọi API PUT /api/movies/:id)
  const handleUpdateMovie = async (updatedMovie) => {
    try {
      const savedMovie = await movieService.updateMovie(updatedMovie.id, updatedMovie);
      setMovies((prev) =>
        prev.map((m) => (m.id === savedMovie.id ? savedMovie : m))
      );
      setEditingMovie(null);
      setApiNotice('');
    } catch (error) {
      const status = error.response?.status;
      if (!error.response || status === 401) {
        const updatedList = movies.map((m) =>
          m.id === updatedMovie.id ? updatedMovie : m
        );
        setMovies(updatedList);
        localStorage.setItem('ptit_admin_movies', JSON.stringify(updatedList));
        setEditingMovie(null);
        setApiNotice(
          status === 401
            ? 'Đã cập nhật tạm ở trình duyệt (cần JWT Admin thật từ API /auth/login để lưu vào MongoDB).'
            : 'Server offline — đã cập nhật tạm phim ở trình duyệt.'
        );
      } else {
        alert(error.response?.data?.message || 'Không thể cập nhật phim');
      }
    }
  };

  // Xóa phim (Gọi API DELETE /api/movies/:id)
  const handleDeleteMovie = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phim "${title}" khỏi hệ thống?`)) {
      return;
    }

    try {
      await movieService.deleteMovie(id);
      setMovies((prev) => prev.filter((m) => m.id !== id));
      setApiNotice('');
    } catch (error) {
      const status = error.response?.status;
      if (!error.response || status === 401) {
        const updated = movies.filter((m) => m.id !== id);
        setMovies(updated);
        localStorage.setItem('ptit_admin_movies', JSON.stringify(updated));
        setApiNotice(
          status === 401
            ? 'Đã xóa tạm trên giao diện (cần JWT Admin thật từ API /auth/login để xóa trong MongoDB).'
            : 'Server offline — đã xóa tạm ở trình duyệt.'
        );
      } else {
        alert(error.response?.data?.message || 'Không thể xóa phim');
      }
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
        {apiNotice && (
          <p style={{ marginTop: '0.5rem', color: '#d97706', fontSize: '0.9rem' }}>
            {apiNotice}
          </p>
        )}
      </div>

      <MovieStatsCards
        totalCount={totalCount}
        nowShowingCount={nowShowingCount}
        comingSoonCount={comingSoonCount}
      />

      {/* 2. Form thêm / sửa phim */}
      <MovieForm
        onAddMovie={handleAddMovie}
        editingMovie={editingMovie}
        onUpdateMovie={handleUpdateMovie}
        onCancelEdit={() => setEditingMovie(null)}
      />

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
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>
          Đang tải danh sách phim từ máy chủ...
        </p>
      ) : (
        <MovieTable
          movies={paginatedMovies}
          onEditMovie={handleEditClick}
          onDeleteMovie={handleDeleteMovie}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}

export default AdminMoviesPage;
