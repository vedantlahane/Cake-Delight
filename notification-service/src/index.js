const express = require('express');
const connectDB = require('./config/index');
const notificationRoutes = require('./routes/notificationRoutes');
const { connectConsumer } = require('./services/eventConsumer');
require('dotenv').config();

const app = express();
app.use(express.json());

connectDB();
connectConsumer();

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/notifications', notificationRoutes);

app.use((err, req, res, next) => {
    console.error('Notification service error:', err.message);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`);
});