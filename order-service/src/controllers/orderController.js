
exports.getOrder = async (req, res, next)=>{
    try{
        const {userId} = req.params;
        if(!userId) return res.status(404).json({error:' User ID is required'});


    }
    catch(err){
        next(err);
    }
};