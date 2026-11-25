import { useState } from 'react';
import styles from '../../../pages/admin/AdminMoviesPage.module.css';

const AGE_RATINGS = ['P', 'K', 'T13', 'T16', 'T18', 'C'];

const INITIAL_FORM = {
  title: '',
  originalTitle: '',
  genres: '',
  duration: '',
  ageRating: 'P',
  releaseDate: '',
  language: 'Tiếng Anh - Phụ đề Tiếng Việt',
  posterUrl: '',
  bannerUrl: '',
  trailerUrl: '',
  director: '',
  actors: '',
  synopsis: '',
  status: 'now-showing',
};

function MovieForm({ onAddMovie }) {
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.duration || !formData.releaseDate) {
      alert('Vui lòng điền các trường bắt buộc: Tên phim, thời lượng, ngày khởi chiếu!');
      return;
    }

    const parsedGenres = formData.genres
      ? formData.genres.split(',').map((g) => g.trim()).filter(Boolean)
      : ['Chưa phân loại'];

    const newMovie = {
      id: `movie_${Date.now()}`,
      title: formData.title.trim(),
      originalTitle: formData.originalTitle.trim() || formData.title.trim(),
      genres: parsedGenres,
      duration: Number(formData.duration) || 120,
      ageRating: formData.ageRating,
      releaseDate: formData.releaseDate,
      language: formData.language.trim() || 'Tiếng Việt',
      posterUrl:
        formData.posterUrl.trim() ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      bannerUrl:
        formData.bannerUrl.trim() ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80',
      trailerUrl: formData.trailerUrl.trim() || 'https://www.youtube.com/embed/avz06PDqDbM',
      director: formData.director.trim() || 'Chưa rõ đạo diễn',
      actors: formData.actors.trim() || 'Chưa rõ diễn viên',
      synopsis: formData.synopsis.trim() || 'Nội dung đang được cập nhật...',
      status: formData.status,
      rating: '9.0',
      votes: 10,
    };

    onAddMovie(newMovie);
    setFormData(INITIAL_FORM);
    alert('Thêm phim mới vào hệ thống thành công!');
  };

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <div className={styles.formIconBadge}>+</div>
        <div>
          <h2 className={styles.formTitle}>Thêm Phim Mới Vào Hệ Thống</h2>
          <p className={styles.formSubtitle}>
            Nhập thông tin tác phẩm điện ảnh để phân bổ lịch chiếu và cập nhật hệ thống rạp PTIT Cinema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.grid2}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tên phim (Tiếng Việt) <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="VD: Đào, Phở và Piano"
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên gốc / Tiếng Anh</label>
            <input
              type="text"
              name="originalTitle"
              value={formData.originalTitle}
              onChange={handleInputChange}
              placeholder="VD: Peach Blossom, Pho and Piano"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.grid3}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Thể loại (cách nhau dấu phẩy) <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="genres"
              value={formData.genres}
              onChange={handleInputChange}
              placeholder="VD: Hành Động, Điệp Viên"
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Thời lượng (phút) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="VD: 120"
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Giới hạn độ tuổi</label>
            <select
              name="ageRating"
              value={formData.ageRating}
              onChange={handleInputChange}
              className={styles.select}
            >
              {AGE_RATINGS.map((rate) => (
                <option key={rate} value={rate}>
                  {rate} - {rate === 'P' ? 'Phổ biến mọi lứa tuổi' : `Phim giới hạn (${rate})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.grid3}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Ngày khởi chiếu <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleInputChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Trạng thái chiếu</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="now-showing">Đang chiếu</option>
              <option value="coming-soon">Sắp chiếu</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Ngôn ngữ / Bản dịch</label>
            <input
              type="text"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              placeholder="VD: Tiếng Anh - Phụ đề Tiếng Việt"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Poster phim (Link URL ảnh)</label>
            <input
              type="url"
              name="posterUrl"
              value={formData.posterUrl}
              onChange={handleInputChange}
              placeholder="VD: https://images.unsplash.com/..."
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Đạo diễn & Diễn viên</label>
            <input
              type="text"
              name="director"
              value={formData.director}
              onChange={handleInputChange}
              placeholder="VD: Victor Vũ - Kaity Nguyễn, Thuận Nguyễn..."
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
          <label className={styles.label}>Tóm tắt nội dung phim</label>
          <textarea
            name="synopsis"
            value={formData.synopsis}
            onChange={handleInputChange}
            placeholder="Nhập nội dung tóm tắt giới thiệu tác phẩm điện ảnh (2-3 dòng)..."
            className={styles.textarea}
            rows={3}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => setFormData(INITIAL_FORM)}
            className={styles.resetBtn}
          >
            Làm mới
          </button>
          <button type="submit" className={styles.submitBtn}>
            + Lưu & Thêm Phim Mới
          </button>
        </div>
      </form>
    </div>
  );
}

export default MovieForm;
