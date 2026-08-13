const mongoose = require('mongoose');
/**
 * Asynchronously establishes a connection to the MongoDB database using Mongoose.
 * Uses the connection URI provided in the `MONGODB_URI` environment variable.
 * Logs a success message upon successful connection or logs an error and terminates the process on failure.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when database connection is established.
 */
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