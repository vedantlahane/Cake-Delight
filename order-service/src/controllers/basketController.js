const axios = require('axios');
const Basket = require('../models/Basket');

exports.getBasket = async (req, res, next) => {
    try {
        const basket = await Basket.find({
            userId: req.params.userId
        })
        res.json(basket || { userId: req.params.userId, items: [] });

    }
    catch (err) {
        next(err);
    }
}

exports.addItem = async (req, res, next) => {
    try {
        const { cakeId, quantity } = req.body;

        const catalogRes = await axios.get(
            '${process.env.CATALOG_SERVICE_URL}/cakes/${cakeId}'
        );
        const cake = catalogRes.data;

        let basket = await Basket.findOne({userId: req.params.userId});
        if(!basket){
            basket = new Basket({userId: req.params.userId, items: []});
        }

        const existingItem = basket.items.find(
            item => item.cakeId.toString() === cakeId
        )

        if(existi9ngItem){
            existingItem.quantity += quantity;
        }
        else{
            basket.items.push({
                cakeId,
                name: cake.name,
                price: cake.price,
                quantity
            });
        }
        await basket.savve();
        res.status(201).json(basket);
    }
    catch(err){
        if(err.respose && err.response.status === 404){
            return res.status(404).json({error: 'Cake not found in catalog'});
        }
        next(err);
    }
}