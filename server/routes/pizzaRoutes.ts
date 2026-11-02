import { Router } from 'express';
import {
  getAllPizzas,
  getPizzaById,
  createPizza,
  updatePizza,
  deletePizza,
} from '../controllers/pizzaController.ts';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.ts';
import { validateRequiredFields } from '../middleware/validateMiddleware.ts';

const router = Router();

router.get('/', getAllPizzas);
router.get('/:id', getPizzaById);
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateRequiredFields(['category_id', 'name', 'description']),
  createPizza
);
router.put('/:id', authenticateToken, requireAdmin, updatePizza);
router.delete('/:id', authenticateToken, requireAdmin, deletePizza);

export default router;
