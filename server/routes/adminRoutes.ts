import { Router } from 'express';
import {
  getDashboardStats,
  getCustomers,
  getInventory,
  addIngredient,
  updateIngredientStock,
  getPayments,
  getReportsSummary,
  getSalesReport,
  getPopularPizzasReport,
  getSqlScriptsAndViews,
} from '../controllers/adminController.ts';
import {
  getAllAdminOrders,
  updateAdminOrderStatus,
} from '../controllers/orderController.ts';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.ts';
import { validateRequiredFields } from '../middleware/validateMiddleware.ts';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/orders', getAllAdminOrders);
router.patch('/orders/:id/status', validateRequiredFields(['status']), updateAdminOrderStatus);
router.get('/customers', getCustomers);
router.get('/inventory', getInventory);
router.post('/inventory', validateRequiredFields(['name', 'sku', 'unit']), addIngredient);
router.patch('/inventory/:id/stock', updateIngredientStock);
router.get('/payments', getPayments);
router.get('/reports/summary', getReportsSummary);
router.get('/reports/sales', getSalesReport);
router.get('/reports/popular-pizzas', getPopularPizzasReport);
router.get('/sql-lab', getSqlScriptsAndViews);

export default router;
