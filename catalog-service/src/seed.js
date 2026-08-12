require('dotenv').config()
const mongoose = require('mongoose')
const Cake = require('./models/Cake')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  await Cake.deleteMany({})  // clear old data so re-running this is safe
  
  const cakes = [
    { 
      name: 'Classic Chocolate Truffle', 
      category: 'Chocolate', 
      price: 1999,
      description: 'A decadent layered chocolate cake finished with smooth dark chocolate ganache.',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80'
    },
    { 
      name: 'Red Velvet Supreme', 
      category: 'Classic', 
      price: 2280,
      description: 'Signature red velvet sponge with rich cream cheese frosting.',
      imageUrl: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=500&q=80'
    },
    { 
      name: 'Strawberry Shortcake', 
      category: 'Fruit', 
      price: 1760,
      description: 'Light vanilla sponge layered with fresh strawberries and whipped cream.',
      imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&q=80'
    },
    { 
      name: 'Lemon Meringue Bliss', 
      category: 'Citrus', 
      price: 2159,
      description: 'Zesty lemon curd topped with perfectly toasted Italian meringue.',
      imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=500&q=80'
    },
    { 
      name: 'Matcha Green Tea', 
      category: 'Specialty', 
      price: 2560,
      description: 'Earthy premium matcha layers with subtle white chocolate sweetness.',
      imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80'
    },
    { 
      name: 'Caramel Macchiato', 
      category: 'Coffee', 
      price: 2360,
      description: 'Espresso-infused sponge cake with salted caramel drip.',
      imageUrl: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=500&q=80'
    },
    { 
      name: 'Vanilla Bean Dream', 
      category: 'Classic', 
      price: 1720,
      description: 'Soft vanilla sponge made with real Madagascar vanilla beans and buttercream.',
      imageUrl: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=80'
    },
    { 
      name: 'Black Forest Gateau', 
      category: 'Chocolate', 
      price: 2720,
      description: 'Chocolate sponge with cherry liqueur, fresh cherries, and whipped cream.',
      imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&q=80'
    },
    { 
      name: 'Mango Tango', 
      category: 'Fruit', 
      price: 2239,
      description: 'Tropical mango mousse layered over a delicate coconut sponge cake.',
      imageUrl: 'https://picsum.photos/seed/mangotango/500/500'
    },
    { 
      name: 'Pistachio Rosewater', 
      category: 'Specialty', 
      price: 2800,
      description: 'Elegant pistachio sponge gently infused with rosewater and crushed nuts.',
      imageUrl: 'https://picsum.photos/seed/pistachio/500/500'
    },
    { 
      name: 'Tiramisu Crepe Cake', 
      category: 'Coffee', 
      price: 3080,
      description: 'Twenty layers of delicate crepes with espresso-infused mascarpone cream.',
      imageUrl: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=80'
    },
    { 
      name: 'Funfetti Birthday', 
      category: 'Classic', 
      price: 2000,
      description: 'Colorful sprinkle-filled vanilla cake with nostalgic sweet buttercream.',
      imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=80'
    },
    { 
      name: 'Hazelnut Praline', 
      category: 'Chocolate', 
      price: 2559,
      description: 'Rich chocolate cake with a crunchy hazelnut praline center.',
      imageUrl: 'https://picsum.photos/seed/hazelnut/500/500'
    },
    { 
      name: 'Blueberry Lemon', 
      category: 'Citrus', 
      price: 2120,
      description: 'Zesty lemon sponge dotted with fresh wild blueberries.',
      imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&q=80'
    },
    { 
      name: 'Earl Grey Lavender', 
      category: 'Specialty', 
      price: 2640,
      description: 'Sophisticated Earl Grey tea infused cake with lavender honey frosting.',
      imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=500&q=80'
    }
  ];
  
  await Cake.insertMany(cakes);
  console.log(`Seeded ${cakes.length} cakes!`)
  process.exit(0)
}

seed()