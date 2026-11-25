import express from 'express';
import {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from '../controllers/showtimeController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getShowtimes)
  .post(protect, requireRole('admin'), createShowtime);

router
  .route('/:id')
  .get(getShowtimeById)
  .put(protect, requireRole('admin'), updateShowtime)
  .delete(protect, requireRole('admin'), deleteShowtime);

export default router;