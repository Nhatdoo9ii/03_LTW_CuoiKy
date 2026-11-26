import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';

// @desc    Thống kê doanh thu theo phim và theo ngày ($match, $lookup, $group, $sort)
// @route   GET /api/stats/revenue
// @access  Private (Admin)
export const getRevenueStats = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;

    // 1. Pipeline thống kê doanh thu theo từng phim
    const moviePipeline = [
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtimeId',
          foreignField: '_id',
          as: 'showtime',
        },
      },
      { $unwind: '$showtime' },
    ];

    // Lọc theo khoảng ngày chiếu nếu client truyền query ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = fromDate;
      if (toDate) dateFilter.$lte = toDate;
      moviePipeline.push({ $match: { 'showtime.date': dateFilter } });
    }

    moviePipeline.push(
      {
        $lookup: {
          from: 'movies',
          localField: 'showtime.movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      {
        $group: {
          _id: '$movie._id',
          movieTitle: { $first: '$movie.title' },
          genres: { $first: '$movie.genres' },
          posterUrl: { $first: '$movie.posterUrl' },
          revenue: { $sum: '$totalPrice' },
          ticketsSold: { $sum: { $size: '$seats' } },
          bookingCount: { $sum: 1 },
          showtimesSet: { $addToSet: '$showtime._id' },
        },
      },
      {
        $project: {
          _id: 0,
          movieId: '$_id',
          movieTitle: 1,
          genres: 1,
          posterUrl: 1,
          revenue: 1,
          ticketsSold: 1,
          bookingCount: 1,
          showtimeCount: { $size: '$showtimesSet' },
        },
      },
      { $sort: { revenue: -1 } }
    );

    // 2. Pipeline thống kê doanh thu theo ngày
    const dailyPipeline = [
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtimeId',
          foreignField: '_id',
          as: 'showtime',
        },
      },
      { $unwind: '$showtime' },
      {
        $group: {
          _id: '$showtime.date',
          date: { $first: '$showtime.date' },
          revenue: { $sum: '$totalPrice' },
          ticketsSold: { $sum: { $size: '$seats' } },
          bookingCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
      { $sort: { date: 1 } },
    ];

    const [byMovie, byDate, totalMovies] = await Promise.all([
      Booking.aggregate(moviePipeline),
      Booking.aggregate(dailyPipeline),
      Movie.countDocuments(),
    ]);

    const totalRevenue = byMovie.reduce((sum, item) => sum + item.revenue, 0);
    const totalTickets = byMovie.reduce((sum, item) => sum + item.ticketsSold, 0);
    const topMovie = byMovie.length > 0 ? byMovie[0] : null;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTickets,
          totalMovies,
          topMovieTitle: topMovie ? topMovie.movieTitle : 'Chưa có dữ liệu',
        },
        byMovie,
        byDate,
      },
    });
  } catch (error) {
    next(error);
  }
};