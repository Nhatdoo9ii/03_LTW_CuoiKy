import Movie from '../models/Movie.js';
import Showtime from '../models/Showtime.js';

// @desc    Lấy danh sách phim (tìm kiếm $regex, lọc thể loại $in, lọc trạng thái, phân trang)
// @route   GET /api/movies
// @access  Public
export const getMovies = async (req, res, next) => {
  try {
    const { search, genre, genres, status, date, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: { $regex: regex } }, { originalTitle: { $regex: regex } }];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const genreQuery = genres || genre;
    if (genreQuery && genreQuery !== 'all') {
      const genreList = genreQuery
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
      if (genreList.length > 0) {
        filter.genres = { $in: genreList };
      }
    }

    // Nếu lọc theo ngày chiếu, tìm các movieId có suất chiếu vào ngày đó
    if (date) {
      const movieIdsOnDate = await Showtime.distinct('movieId', { date });
      filter._id = { $in: movieIdsOnDate };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Movie.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: movies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết 1 phim kèm danh sách suất chiếu
// @route   GET /api/movies/:id
// @access  Public
export const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      res.status(404);
      throw new Error('Không tìm thấy phim');
    }

    const showtimes = await Showtime.find({ movieId: movie._id })
      .populate('roomId', 'name totalRows seatsPerRow vipRows')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        movie,
        showtimes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Thêm phim mới
// @route   POST /api/movies
// @access  Private (Admin)
export const createMovie = async (req, res, next) => {
  try {
    const { title, genres, duration, releaseDate } = req.body;

    if (!title || !genres || !genres.length || !duration || !releaseDate) {
      res.status(400);
      throw new Error('Vui lòng nhập đầy đủ tên phim, thể loại, thời lượng và ngày khởi chiếu');
    }

    const movie = await Movie.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Thêm phim mới thành công',
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin phim
// @route   PUT /api/movies/:id
// @access  Private (Admin)
export const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      res.status(404);
      throw new Error('Không tìm thấy phim cần cập nhật');
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật phim thành công',
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa phim
// @route   DELETE /api/movies/:id
// @access  Private (Admin)
export const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      res.status(404);
      throw new Error('Không tìm thấy phim cần xóa');
    }

    res.status(200).json({
      success: true,
      message: 'Xóa phim thành công',
    });
  } catch (error) {
    next(error);
  }
};

