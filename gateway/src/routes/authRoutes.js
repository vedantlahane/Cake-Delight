const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login',(req,res)=>{
    const {userId} = req.body;
    if(!userId){
        return res.status(400).json({error:'userId is required'});
    }
    const token = jwt.sign({userId},
        process.env.JWT_SECRET,
        {expiresIn:'7d'}
    )
    res.json({token});
});
module.exports = router;
