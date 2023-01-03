const AppError = require("../utils/AppError")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const catchAsync = require("../utils/CatchAsync")
const User = require("../models/userModel")
const sendEmail = require("../utils/sendEmail")
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
// forgot password
const forgotPassword = async(req,res,next)=>{
    // check if the user enter a  email
    const {email} = req.body
    if(!email ) return next(new AppError(400,"please enter an email"))
    // check if the user enter a correct email
    const user = await User.findOne({email}) 
    if(!user)return next(new AppError(400,"no user found by that id please try again"))
    // create a reset token
    const token =await user.resetPassword()
     user.save({validateBeforeSave:false})
    // send email
    const link = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${token}`
    await sendEmail({
        to:email,
        subject : "reset password",
        message:`did you forgot your password ? \n if you do please send a patch request to this link : \n ${link}`,
    })
    // send res
    res.status(200).json({
        message : "an email sent to you "
    })
}
// resetPassword
const resetPassword = catchAsync(async(req,res,next)=>{
    const token = req.params.token
    // crypt the token again
    const cryptedToken = crypto.createHash("sha256").update(token).digest("hex")
    // check if the token correct or expired
    const user =await  User.findOne({resetToken:cryptedToken})
    if(!user || user.expireResetToken < Date.now()) return next(new AppError(400,"invalid or expired token"))
   // create new password
   const {password,confirmPassword} = req.body
   user.password = password 
   user.confirmPassword = confirmPassword
   user.changedAt = Date.now()
   user.expireResetToken= undefined
   user.resetToken = undefined
   await user.save()
   res.send("password have been changed")

})
module.exports = {checkLogin,forgotPassword,resetPassword}