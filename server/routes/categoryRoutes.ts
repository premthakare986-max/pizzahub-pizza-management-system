import { Router } from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.ts';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.ts';
import { validateRequiredFields } from '../middleware/validateMiddleware.ts';

const router = Router();

router.get('/', getAllCategories);
router.post('/', authenticateToken, requireAdmin, validateRequiredFields(['name']), createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

export default router;
