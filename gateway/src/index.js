require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use('/auth', express.json(), authRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Cake Delight API Gateway' });
});

// =============================================================
// CATALOG SERVICE — /api/cakes
// Public: GET (browse & filter)
// Admin-only: POST, PUT, DELETE (catalog management)
// NOTE: Express strips '/api/cakes', proxy receives '/' or '/:id'
//       pathRewrite(path) restores the full path to the target service.
// =============================================================
app.use('/api/cakes', (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return adminMiddleware(req, res, next);
    }
    next();
}, createProxyMiddleware({
    target: process.env.CATALOG_SERVICE_URL || 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: (path) => `/cakes${path}`
}));

// =============================================================
// ORDER SERVICE — /api/basket  (auth required)
// =============================================================
/**
 * Middleware to proxy requests to the Order Service's basket endpoints.
 * Requires authentication via JWT. Attaches userId and role headers to the proxied request.
 * @param {object} req - Express request object containing the Authorization header.
 * @param {object} res - Express response object used to return authentication errors.
 * @param {function} next - Express next middleware function.
 * @returns {void}
 */
app.use('/api/basket', authMiddleware, createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: (path) => `/basket${path}`,
    on: {
        proxyReq: (proxyReq, req) => {
            if (req.user && req.user.userId) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role || 'customer');
            }
        }
    }
}));

// =============================================================
// ORDER SERVICE — /api/orders
// GET /api/orders           → admin only (all orders)
// GET /api/orders/:userId   → auth required (own orders)
// POST /api/orders/checkout → auth required
// =============================================================
app.get('/api/orders', adminMiddleware, createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: () => '/orders',
    on: {
        proxyReq: (proxyReq, req) => {
            if (req.user && req.user.userId) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role || 'customer');
            }
        }
    }
}));

app.use('/api/orders', authMiddleware, createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: (path) => `/orders${path}`,
    on: {
        proxyReq: (proxyReq, req) => {
            if (req.user && req.user.userId) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role || 'customer');
            }
        }
    }
}));

// =============================================================
// RATING SERVICE — /api/ratings
// GET /api/ratings          → admin only (all ratings)
// GET /api/ratings/:cakeId  → public
// POST /api/ratings         → auth required (submit rating)
// =============================================================
app.get('/api/ratings', adminMiddleware, createProxyMiddleware({
    target: process.env.RATING_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: () => '/ratings'
}));

app.use('/api/ratings', (req, res, next) => {
    if (req.method === 'POST') {
        return authMiddleware(req, res, next);
    }
    next();
}, createProxyMiddleware({
    target: process.env.RATING_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: (path) => `/ratings${path}`
}));

// =============================================================
// NOTIFICATION SERVICE — /api/notifications
// GET /api/notifications            → admin only (all)
// GET /api/notifications/:userId    → auth required (own)
// =============================================================
app.get('/api/notifications', adminMiddleware, createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: () => '/notifications',
    on: {
        proxyReq: (proxyReq, req) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role || 'customer');
            }
        }
    }
}));

/**
 * Middleware to proxy requests to the Notification Service's endpoints.
 * Requires authentication via JWT. Attaches userId and role headers to the proxied request.
 */
app.use('/api/notifications', authMiddleware, createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: (path) => `/notifications${path}`,
    on: {
        proxyReq: (proxyReq, req) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role || 'customer');
            }
        }
    }
}));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
