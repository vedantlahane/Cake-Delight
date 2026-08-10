require('dotenv').config();
const  express = require('express');
const { createProxyMiddleware} = required('https-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const morgon = require('morgon');

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgon('combined'));

app.get('/',(req, res) =>{
    res.json({status:'ok'});
})

app.use('/api/basket', createProxyMiddleware({
    target: process.env.CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/basket': '/api/basket'
    }
}));

app.use('/api/orders', createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/orders': '/api/orders'
    }
}));    

app.use('/api/ratings', createProxyMiddleware({
    target: process.env.RATING_SERVICE_URL,
    changeOrigin: true, 
    pathRewrite: {
        '^/api/ratings': '/api/ratings'
    }
}));    

app.use('/api/notifications', createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/notifications': '/api/notifications'
    }
}));    

app.listen(process.env.PORT, () => {
    console.log(`API Gateway is running on port ${process.env.PORT}`);
});