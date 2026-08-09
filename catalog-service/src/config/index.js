const mongoose = require('mongoose');
async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB_Atlas')
    }
    catch(err){
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
}

module.exports = connectDB;