import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
} from '../controllers/authController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { validateRequiredFields } from '../middleware/validateMiddleware.ts';

const router = Router();

router.post(
  '/register',
  validateRequiredFields(['full_name', 'mobile_number', 'email', 'password']),
  register
);
router.post('/login', validateRequiredFields(['email', 'password']), login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/addresses', authenticateToken, addAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);

export default router;
