const AppError = require("../utils/AppError")
const jwt = require("jsonwebtoken")
const catchAsync = require("../utils/CatchAsync")
const User = require("../models/userModel")
// authentication

const checkLogin = catchAsync(async(req,res,next)=>{
    //1 check if the jwt is exicts
    if(!req.headers.authorization || !req.headers.authorization.startsWith("Bearer"))  return next(new AppError(401,"please login first"))
    //2 get the jwt
    const token = req.headers.authorization.split(" ")[1]
    //3 check if the token is valid
    const verified = jwt.verify(token,process.env.JWTSECRET) // rise an error
    //4 check if the user is still exicts
    const user = await User.findOne({_id:verified.id})
    if(!user) return next(new AppError(401,"this user is no longer exicts"))
    //5 check if the user doenst  change the password after generating the jwt 
    if(user.isChanged(verified.iat))return next( new AppError(401,"the password has been changed plase try to loging first"))
    // 6 validate and call next
    req.user = user
    next()
})
// authorization
const restractTo = (...roles)=>{
    return (req,res,next)=>{
        // check if the user is ...
        if(! roles.includes(req.user.role)) return next(new AppError(401,"you are not autorised to do that"))
        // if he is autorised call next
        next()
    }
    
}
module.exports = checkLogin