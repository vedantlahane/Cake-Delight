const express = require('express');
const connectDB = require('./config/index');
const basketRoutes = require('./routes/basketRoutes');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

connectDB();

app.use('/basket', basketRoutes);
app.use('/orders', orderRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Order service is running on port ${PORT}`);
});