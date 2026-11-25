import express from 'express';
import {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  deleteShowtime,
} from '../controllers/showtimeController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(getShowtimes).post(protect, requireRole('admin'), createShowtime);

router
  .route('/:id')
  .get(getShowtimeById)
  .delete(protect, requireRole('admin'), deleteShowtime);

export default router;

