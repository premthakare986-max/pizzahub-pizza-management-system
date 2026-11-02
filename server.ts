import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  verifyMySQLConnection,
  getLastConnectionState,
} from './server/config/db.ts';
import { dbState } from './server/services/relationalStore.ts';
import authRoutes from './server/routes/authRoutes.ts';
import pizzaRoutes from './server/routes/pizzaRoutes.ts';
import categoryRoutes from './server/routes/categoryRoutes.ts';
import orderRoutes from './server/routes/orderRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Check MySQL connectivity on startup
  await verifyMySQLConnection(false);

  // GET /api/health — Checks actual MySQL connectivity (supports ?retry=true)
  app.get('/api/health', async (req, res) => {
    const shouldRetry = req.query.retry === 'true';
    const connState = shouldRetry
      ? await verifyMySQLConnection(true)
      : getLastConnectionState();

    return res.json({
      status: connState.status,
      service: 'PizzaHub – Pizza Management System API',
      mysql: {
        status: connState.status,
        connected: connState.connected,
        configured: connState.configured,
        environment: connState.environment,
        server_version: connState.serverVersion,
        error_code: connState.errorCode,
        error_message: connState.errorMessage,
        checked_at: connState.checkedAt,
        config: connState.configSummary,
      },
      schema_stats: {
        tables_count: 14,
        users: dbState.users.length,
        categories: dbState.categories.length,
        pizzas: dbState.pizzas.length,
        pizza_sizes: dbState.pizza_sizes.length,
        toppings: dbState.toppings.length,
        ingredients: dbState.ingredients.length,
        orders: dbState.orders.length,
      },
    });
  });

  // POST /api/health/retry — Explicit Retry Connection endpoint
  app.post('/api/health/retry', async (_req, res) => {
    const connState = await verifyMySQLConnection(true);
    return res.json({
      status: connState.status,
      mysql: {
        status: connState.status,
        connected: connState.connected,
        configured: connState.configured,
        environment: connState.environment,
        server_version: connState.serverVersion,
        error_code: connState.errorCode,
        error_message: connState.errorMessage,
        checked_at: connState.checkedAt,
        config: connState.configSummary,
      },
    });
  });

  // Core REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/pizzas', pizzaRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);

  // Serve static files from /public
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PizzaHub Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
