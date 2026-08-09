require('dotenv').config()
const mongoose = require('mongoose')
const Cake = require('./models/Cake')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  await Cake.deleteMany({})  // clear old data so re-running this is safe
  await Cake.insertMany([
    { name: 'Chocolate Truffle', category: 'Chocolate', price: 22.99 },
    { name: 'Red Velvet', category: 'Classic', price: 24.99 },
  ])
  console.log('Seeded!')
  process.exit(0)
}

seed()