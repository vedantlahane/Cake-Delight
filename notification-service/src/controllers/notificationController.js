exports.getNotificationStatus = async(req,res,next)=>{
    const {userId} = req.params;
    if(!userId) return res.status(400).json({error:' User ID is required'});
    
}