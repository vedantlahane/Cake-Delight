const express = require('express');
const connectDB = require('./config/index');
const ratingRoutes = require('./routers/ratingRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

connectDB();

app.use('/ratings', ratingRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Rating service is running on port ${PORT}`);
});