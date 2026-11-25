import express from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movieController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(getMovies).post(protect, requireRole('admin'), createMovie);

router
  .route('/:id')
  .get(getMovieById)
  .put(protect, requireRole('admin'), updateMovie)
  .delete(protect, requireRole('admin'), deleteMovie);

export default router;

