exports.submitRting = aync(req,res,next) =>{
    const {cakeId,usrId,score,comment} = req.body;

}

exports.getRatingForCake = async(req,res,next) =>{
    const {cakeId} = req.params;
    if(!cakeId) return res.status(400).json({error:' Cake ID is required'});

}

exports.getAverageRating = async(req,res,next) =>{
    try{
        const {cakeId} = req.params;
        const result = await Rating.aggregate([
            {$match:{cakeId: new mongoose.Types.ObjectId(cakeId)}},
            {$group:{_id:'$cakeId', averageScore:{$avg:'$score'}, count:{$sum:1}}}
        ])
        if(result.length === 0) 
        return res.status({cakeId, averageScore: 0, count: 0});
        res.status(200).json({cakeId, averageScore: result[0].averageScore, count: result[0].count});
    }
    catch(err){
        next(err);
    }
}