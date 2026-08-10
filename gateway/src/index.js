require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use('/auth', express.json(), authRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/cakes', createProxyMiddleware({
    target: process.env.CATALOG_SERVICE_URL || 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/cakes': '/cakes'
    }
}));

app.use('/api/basket',authMiddleware, createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/basket': '/basket'
    },
    on:{
        proxyReq:(proxyReq,req,res)=>{
            if(req.user && req.user.userId){
                proxyReq.setHeader('X-User-Id',req.user.userId);
            }
        }
    }
}));

app.use('/api/orders', authMiddleware,createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/orders': '/orders'
    },
    on:{
        proxyReq:(proxyReq,req,res)=>{
            if(req.user && req.user.userId){
                proxyReq.setHeader('X-User-Id',req.user.userId);
            }
        }
    }    
}));

app.use('/api/ratings', createProxyMiddleware({
    target: process.env.RATING_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: {
        '^/api/ratings': '/ratings'
    }
}));

app.use('/api/notifications', createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
        '^/api/notifications': '/notifications'
    }
}));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
