const Cake = require('../models/Cake');

exports.getAllCakes = async (req, res, next) =>{
    try{
        const cakes = await Cake.find();
        res.json(cakes);
    }
    catch(err){
        next(err);
    }
}

