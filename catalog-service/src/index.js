const express = require('express');
const connectDB = require('./config/index');
const cakeRoutes = require('./routes/cakeRoutes');
const morgan = require('morgan');
require('dotenv').config();

connectDB();
const app = express();
app.use(morgan('combined'));
app.use(express.json());

app.use('/cakes', cakeRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
    console.error(err.message);
    if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Catalog service is running on port ${PORT}`);
});
