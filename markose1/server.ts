import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { OrderService } from './src/lib/orderService';
import { OrderStatus, InteractionType } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Request ID & Timing Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = 'req_' + Math.random().toString(36).substring(2, 10);
    res.setHeader('X-Request-Id', reqId);
    (req as any).requestId = reqId;
    next();
  });

  // Body parser with 32KB body limit as mandated in Section 9.2 of the design document
  app.use(express.json({ limit: '32kb' }));

  // CORS middleware for public orders API (Section 8.3 & 9.2)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string;
    res.setHeader('Vary', 'Origin');
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, X-Captcha-Token, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health check endpoint (Section 8.2 & 14)
  app.get('/api/v1/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Markose OMS API',
      timestamp: new Date().toISOString(),
      timezone: 'Africa/Cairo',
      version: '1.0.0'
    });
  });

  // OpenAPI spec raw file endpoint
  app.get('/docs/openapi.yaml', (req: Request, res: Response) => {
    const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');
    if (fs.existsSync(openapiPath)) {
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      res.sendFile(openapiPath);
    } else {
      res.status(404).send('Not Found');
    }
  });

  // 1. PUBLIC ORDERS CREATION ENDPOINT (POST /api/v1/public/orders)
  app.post('/api/v1/public/orders', (req: Request, res: Response) => {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const result = OrderService.createPublicOrder(req.body, idempotencyKey);

    if (result.idempotentReplay) {
      res.setHeader('Idempotent-Replay', 'true');
    }

    if (!result.success) {
      const code = result.error?.code;
      let statusCode = 400;
      if (code === 'IDEMPOTENCY_KEY_REQUIRED') statusCode = 400;
      else if (code === 'IDEMPOTENCY_KEY_REUSED') statusCode = 409;
      else if (code === 'FORBIDDEN' || code === 'CAPTCHA_FAILED') statusCode = 403;
      else if (code === 'LANDING_PAGE_NOT_FOUND') statusCode = 404;
      else if (code === 'VALIDATION_ERROR' || code === 'INVALID_PHONE' || code === 'PRODUCT_NOT_AVAILABLE') statusCode = 422;
      res.status(statusCode).json(result);
      return;
    }

    res.status(201).json(result);
  });

  // 2. ORDERS LIST & SEARCH (GET /api/v1/orders)
  app.get('/api/v1/orders', (req: Request, res: Response) => {
    let orders = OrderService.getOrders();
    const { status, governorate, search, duplicatesOnly } = req.query;

    if (status && status !== 'ALL') {
      orders = orders.filter(o => o.status === status);
    }
    if (governorate && governorate !== 'ALL') {
      orders = orders.filter(o => o.ship_governorate === governorate);
    }
    if (duplicatesOnly === 'true') {
      orders = orders.filter(o => o.duplicate_review_status === 'PENDING_REVIEW');
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      orders = orders.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.ship_name.toLowerCase().includes(q) ||
        o.ship_phone.includes(q)
      );
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 25));
    const total = orders.length;
    const paginated = orders.slice((page - 1) * pageSize, page * pageSize);

    res.json({
      success: true,
      data: paginated,
      meta: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize) || 1
      }
    });
  });

  // 3. EXPORT ORDERS CSV (GET /api/v1/orders/export)
  app.get('/api/v1/orders/export', (req: Request, res: Response) => {
    const orders = OrderService.getOrders();
    const csvData = OrderService.exportOrdersCSV(orders);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvData);
  });

  // 4. ORDER DETAILS (GET /api/v1/orders/:id)
  app.get('/api/v1/orders/:id', (req: Request, res: Response) => {
    const order = OrderService.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'الطلب غير موجود', request_id: (req as any).requestId }
      });
      return;
    }
    res.json({ success: true, data: order });
  });

  // 5. ORDER STATUS TRANSITION (PATCH /api/v1/orders/:id/status)
  app.patch('/api/v1/orders/:id/status', (req: Request, res: Response) => {
    const { status, reason, carrier_name, tracking_number, expectedVersion } = req.body;
    const shippingDetails = carrier_name ? { carrier_name, tracking_number } : undefined;

    const result = OrderService.transitionOrderStatus(
      req.params.id,
      status as OrderStatus,
      reason,
      shippingDetails,
      expectedVersion
    );

    if (!result.success) {
      const isConflict = result.error?.startsWith('STATE_CONFLICT');
      res.status(isConflict ? 409 : 422).json({
        success: false,
        error: {
          code: isConflict ? 'STATE_CONFLICT' : 'INVALID_TRANSITION',
          message: result.error || 'فشل تحديث الحالة',
          request_id: (req as any).requestId
        }
      });
      return;
    }

    res.json({ success: true, data: result.order });
  });

  // 6. CUSTOMER INTERACTIONS (POST /api/v1/orders/:id/interactions)
  app.post('/api/v1/orders/:id/interactions', (req: Request, res: Response) => {
    const { customer_id, interaction_type, note, outcome } = req.body;
    const interaction = OrderService.logInteraction(
      req.params.id,
      customer_id,
      interaction_type as InteractionType,
      note,
      outcome
    );
    res.status(201).json({ success: true, data: interaction });
  });

  // 7. DUPLICATE FLAGS REVIEW (GET, PATCH /api/v1/duplicate-flags)
  app.get('/api/v1/duplicate-flags', (req: Request, res: Response) => {
    const flags = OrderService.getDuplicateFlags();
    res.json({ success: true, data: flags });
  });

  app.patch('/api/v1/duplicate-flags/:id', (req: Request, res: Response) => {
    const { resolution, note } = req.body;
    const result = OrderService.resolveDuplicateFlag(req.params.id, resolution, note);
    if (!result.success) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: result.error || 'سجل التكرار غير موجود' }
      });
      return;
    }
    res.json({ success: true, message: 'تم تحديث قرار مراجعة التكرار' });
  });

  // 8. FOLLOW-UPS (GET, PATCH /api/v1/follow-ups)
  app.get('/api/v1/follow-ups', (req: Request, res: Response) => {
    const tasks = OrderService.getFollowUps();
    res.json({ success: true, data: tasks });
  });

  app.patch('/api/v1/follow-ups/:id', (req: Request, res: Response) => {
    const { note } = req.body;
    OrderService.completeFollowUpTask(req.params.id, note);
    res.json({ success: true, message: 'تم إتمام المهمة بنجاح' });
  });

  // 9. CUSTOMERS DIRECTORY (GET /api/v1/customers)
  app.get('/api/v1/customers', (req: Request, res: Response) => {
    const customers = OrderService.getCustomers();
    res.json({ success: true, data: customers });
  });

  // 10. PRODUCTS & LANDING PAGES (GET, POST)
  app.get('/api/v1/products', (req: Request, res: Response) => {
    res.json({ success: true, data: OrderService.getProducts() });
  });

  app.post('/api/v1/products', (req: Request, res: Response) => {
    const product = OrderService.saveProduct(req.body);
    res.status(201).json({ success: true, data: product });
  });

  app.get('/api/v1/landing-pages', (req: Request, res: Response) => {
    res.json({ success: true, data: OrderService.getLandingPages() });
  });

  app.get('/api/v1/campaigns', (req: Request, res: Response) => {
    res.json({ success: true, data: OrderService.getCampaigns() });
  });

  // 11. AUDIT LOGS & SETTINGS (GET, PATCH)
  app.get('/api/v1/audit-logs', (req: Request, res: Response) => {
    res.json({ success: true, data: OrderService.getAuditLogs() });
  });

  app.get('/api/v1/settings', (req: Request, res: Response) => {
    res.json({ success: true, data: OrderService.getSettings() });
  });

  app.patch('/api/v1/settings', (req: Request, res: Response) => {
    const updated = OrderService.updateSettings(req.body);
    res.json({ success: true, data: updated });
  });

  // Vite Integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Markose OMS Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start Markose server:', err);
  process.exit(1);
});
