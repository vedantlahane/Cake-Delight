const express = require('express');
const connectDB = require('./config/index')
const cakeRoutes = require('./routers/cakeRoutes');
require('dotenv').config();
connectDB();
const app = express();
app.use('/cakes', cakeRoutes);
app.get('/health',(req,res)=>{
    res.json({status:'ok'})
});

app.listen(3000,()=>{
    console.log('Catalog service is running on port 3000');
});
