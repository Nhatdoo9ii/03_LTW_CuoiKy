import axios from 'axios';
import mockData from '../data/mockData.json';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chuẩn hóa dữ liệu phim từ MongoDB (_id) sang format id dùng chung ở giao diện
export const normalizeMovie = (movie) => {
  if (!movie) return null;
  return {
    ...movie,
    id: movie._id || movie.id,
  };
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const movieService = {
  // Lấy danh sách phim (có hỗ trợ tìm kiếm, lọc thể loại, trạng thái, ngày chiếu, phân trang ở server)
  async getMovies(params = {}) {
    try {
      const response = await apiClient.get('/movies', { params });
      const { data = [], pagination = {} } = response.data;
      return {
        movies: data.map(normalizeMovie),
        pagination,
        source: 'api',
      };
    } catch (error) {
      // Fallback sang mockData nếu server chưa bật
      if (!error.response) {
        console.warn('[movieService] Server offline, dùng dữ liệu mockData.json');
        const list = (mockData.movies || []).map(normalizeMovie);
        return {
          movies: list,
          pagination: {
            page: 1,
            limit: list.length || 12,
            total: list.length,
            totalPages: 1,
          },
          source: 'mock',
        };
      }
      throw new Error(error.response?.data?.message || 'Lỗi tải danh sách phim', {
        cause: error,
      });
    }
  },

  // Lấy chi tiết phim kèm danh sách suất chiếu
  async getMovieById(id) {
    try {
      const response = await apiClient.get(`/movies/${id}`);
      const { movie, showtimes = [] } = response.data.data || {};
      return {
        movie: normalizeMovie(movie),
        showtimes: showtimes.map((st) => ({
          ...st,
          id: st._id || st.id,
          time: st.startTime || st.time,
          basePrice: st.price || st.basePrice,
        })),
        source: 'api',
      };
    } catch (error) {
      if (!error.response) {
        const found =
          mockData.movies.find((m) => String(m.id) === String(id)) ||
          mockData.movies[0];
        return {
          movie: normalizeMovie(found),
          showtimes: (mockData.showtimes || []).filter(
            (st) => String(st.movieId) === String(found?.id)
          ),
          source: 'mock',
        };
      }
      throw new Error(error.response?.data?.message || 'Không tìm thấy phim', {
        cause: error,
      });
    }
  },

  // Thêm phim mới (Admin)
  async createMovie(movieData) {
    const response = await apiClient.post('/movies', movieData, {
      headers: getAuthHeaders(),
    });
    return normalizeMovie(response.data.data);
  },

  // Cập nhật phim (Admin)
  async updateMovie(id, movieData) {
    const response = await apiClient.put(`/movies/${id}`, movieData, {
      headers: getAuthHeaders(),
    });
    return normalizeMovie(response.data.data);
  },

  // Xóa phim (Admin)
  async deleteMovie(id) {
    const response = await apiClient.delete(`/movies/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export default movieService;
