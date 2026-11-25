import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tên phim'],
      trim: true,
    },
    originalTitle: {
      type: String,
      default: '',
    },
    director: {
      type: String,
      default: '',
    },
    actors: {
      type: String,
      default: '',
    },
    genres: {
      type: [String],
      required: [true, 'Vui lòng chọn ít nhất một thể loại'],
    },
    duration: {
      type: Number,
      required: [true, 'Vui lòng nhập thời lượng phim (phút)'],
    },
    releaseDate: {
      type: String,
      required: [true, 'Vui lòng chọn ngày khởi chiếu'],
    },
    language: {
      type: String,
      default: 'Tiếng Việt',
    },
    ageRating: {
      type: String,
      default: 'P',
    },
    rating: {
      type: String,
      default: '9.0',
    },
    votes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['now-showing', 'coming-soon', 'ended'],
      default: 'now-showing',
    },
    posterUrl: {
      type: String,
      default: '',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    synopsis: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
