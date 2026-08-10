const express = require('express');
const connectDB = require('./config/index');
const notificationRoutes = require('./routes/notificationRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

connectDB();

app.use('/notifications', notificationRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`);
});