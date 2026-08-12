const express = require('express');
const connectDB = require('./config/index');
const basketRoutes = require('./routes/basketRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { connectRabbitMQ } = require('./services/eventPublisher');
require('dotenv').config();

const app = express();
app.use(express.json());

connectDB();
connectRabbitMQ();

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/basket', basketRoutes);
app.use('/orders', orderRoutes);

app.use((err, req, res, next) => {
    console.error('Order service error:', err.message);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Order service is running on port ${PORT}`);
});