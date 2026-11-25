import express from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(getRooms).post(protect, requireRole('admin'), createRoom);

router
  .route('/:id')
  .get(getRoomById)
  .put(protect, requireRole('admin'), updateRoom)
  .delete(protect, requireRole('admin'), deleteRoom);

export default router;

