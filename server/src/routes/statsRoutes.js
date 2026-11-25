import express from 'express';
import { getRevenueStats } from '../controllers/statsController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/revenue', protect, requireRole('admin'), getRevenueStats);

export default router;

