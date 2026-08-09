const express = require('express');
const connectDB = require('./config/index');
const app = express();
app.use(express.json());
require('dotenv').config();
connectDB();
app.listen(process.env.PORT, ()=> {
    console.log('Order service is running on port', process.env.PORT);
})