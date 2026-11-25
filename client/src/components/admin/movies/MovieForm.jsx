import { useState, useEffect } from 'react';
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

function MovieForm({ onAddMovie, editingMovie, onUpdateMovie, onCancelEdit }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  // Đổ dữ liệu lên form khi bấm nút Sửa phim ở bảng
  useEffect(() => {
    if (editingMovie) {
      setFormData({
        title: editingMovie.title || '',
        originalTitle: editingMovie.originalTitle || '',
        genres: Array.isArray(editingMovie.genres)
          ? editingMovie.genres.join(', ')
          : editingMovie.genres || '',
        duration: editingMovie.duration ? String(editingMovie.duration) : '',
        ageRating: editingMovie.ageRating || 'P',
        releaseDate: editingMovie.releaseDate || '',
        language: editingMovie.language || 'Tiếng Anh - Phụ đề Tiếng Việt',
        posterUrl: editingMovie.posterUrl || '',
        bannerUrl: editingMovie.bannerUrl || '',
        trailerUrl: editingMovie.trailerUrl || '',
        director: editingMovie.director || '',
        actors: editingMovie.actors || '',
        synopsis: editingMovie.synopsis || '',
        status: editingMovie.status || 'now-showing',
      });
      setErrors({});
    } else {
      setFormData(INITIAL_FORM);
      setErrors({});
    }
  }, [editingMovie]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = 'Vui lòng nhập tên phim.';
    }

    const parsedGenres = formData.genres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    if (parsedGenres.length === 0) {
      nextErrors.genres = 'Vui lòng nhập ít nhất 1 thể loại.';
    }

    const durationNum = Number(formData.duration);
    if (!formData.duration || Number.isNaN(durationNum) || durationNum <= 0) {
      nextErrors.duration = 'Thời lượng phải là số phút lớn hơn 0.';
    }

    if (!formData.releaseDate) {
      nextErrors.releaseDate = 'Vui lòng chọn ngày khởi chiếu.';
    }

    if (formData.posterUrl.trim() && !/^https?:\/\/.+/i.test(formData.posterUrl.trim())) {
      nextErrors.posterUrl = 'Link poster phải bắt đầu bằng http:// hoặc https://.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const parsedGenres = formData.genres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    const payload = {
      ...(editingMovie || {}),
      id: editingMovie ? editingMovie.id : `movie_${Date.now()}`,
      title: formData.title.trim(),
      originalTitle: formData.originalTitle.trim() || formData.title.trim(),
      genres: parsedGenres,
      duration: Number(formData.duration),
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
      rating: editingMovie?.rating || '9.0',
      votes: editingMovie?.votes ?? 10,
    };

    if (editingMovie) {
      onUpdateMovie(payload);
    } else {
      onAddMovie(payload);
      setFormData(INITIAL_FORM);
    }
    setErrors({});
  };

  const handleReset = () => {
    setErrors({});
    if (editingMovie && onCancelEdit) {
      onCancelEdit();
    } else {
      setFormData(INITIAL_FORM);
    }
  };

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <div className={styles.formIconBadge}>{editingMovie ? '✎' : '+'}</div>
        <div>
          <h2 className={styles.formTitle}>
            {editingMovie ? `Cập Nhật Phim: ${editingMovie.title}` : 'Thêm Phim Mới Vào Hệ Thống'}
          </h2>
          <p className={styles.formSubtitle}>
            {editingMovie
              ? 'Chỉnh sửa thông tin phim và bấm Lưu thay đổi để cập nhật lên hệ thống'
              : 'Nhập thông tin tác phẩm điện ảnh để phân bổ lịch chiếu và cập nhật hệ thống rạp PTIT Cinema'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
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
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            />
            {errors.title && <span className={styles.errorText}>{errors.title}</span>}
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
              className={`${styles.input} ${errors.genres ? styles.inputError : ''}`}
            />
            {errors.genres && <span className={styles.errorText}>{errors.genres}</span>}
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
              className={`${styles.input} ${errors.duration ? styles.inputError : ''}`}
            />
            {errors.duration && <span className={styles.errorText}>{errors.duration}</span>}
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
              className={`${styles.input} ${errors.releaseDate ? styles.inputError : ''}`}
            />
            {errors.releaseDate && (
              <span className={styles.errorText}>{errors.releaseDate}</span>
            )}
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
              className={`${styles.input} ${errors.posterUrl ? styles.inputError : ''}`}
            />
            {errors.posterUrl && <span className={styles.errorText}>{errors.posterUrl}</span>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Đạo diễn</label>
            <input
              type="text"
              name="director"
              value={formData.director}
              onChange={handleInputChange}
              placeholder="VD: Victor Vũ"
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
          <button type="button" onClick={handleReset} className={styles.resetBtn}>
            {editingMovie ? 'Hủy chỉnh sửa' : 'Làm mới'}
          </button>
          <button type="submit" className={styles.submitBtn}>
            {editingMovie ? 'Lưu Thay Đổi' : '+ Lưu & Thêm Phim Mới'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MovieForm;
