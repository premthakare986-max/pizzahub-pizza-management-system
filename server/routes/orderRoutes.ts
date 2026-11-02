import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
} from '../controllers/orderController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = Router();

router.post('/', authenticateToken, createOrder);
router.get('/my', authenticateToken, getMyOrders);
router.get('/:id', authenticateToken, getOrderById);
router.patch('/:id/cancel', authenticateToken, cancelMyOrder);

export default router;
