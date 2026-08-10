const jwt = require('jsonwebtoken');
function authMiddleware(req,res,next){
    const authHeadder = req.headers.authorization;
    if(!authHeadder || !authHeadder.startsWith('Bearer ')){
        return res.status(401).json({error:'Authorization header is missing or invalid'});
    }

    const token = authHeadder.split(' ')[1];
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        return res.status(401).json({error:'Invalid token'});
    }

}

module.exports = authMiddleware;