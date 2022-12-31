const {promisify} = require("util")
const User = require("../models/usersModel")
const jwt = require("jsonwebtoken")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/errClass")
const { findById } = require("../models/usersModel")
const sendEmail = require("../utils/sendmail")
const crypto = require("crypto")
const multer = require("multer")
const sharp = require("sharp")

const Passport = (user,res)=>{
    const token = jwt.sign({id:user._id},process.env.JWT,{expiresIn:process.env.JWTEXPIRES})
    res.cookie("jwt",token,{
        expires:new Date(Date.now()+process.env.COOKIESEXPIRES*24*60*60*1000) ,
        secure:process.env.NODE_ENV!="dev" ? true : false,
        httpOnly: true
    })
    return token
}

const getUsers = catchAsync(async(req,res,next)=>{
    const users =await User.find()
    res.status(200).json({
        status : "succses",
        data : {
            
            users
        }
    })
})
// check login
const checkLogin = catchAsync(async(req,res,next)=>{
    var token = ""
    // check if the token is exicts
    if(!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")){
        if(!req.cookies.jwt) return next(new AppError(401,"please login first"))
       
    }
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) token = req.headers.authorization.split(" ")[1]
    if(req.cookies.jwt) token = req.cookies.jwt
     
    console.log(token )
    // check if the jwt is true or not expired
    const verified = await promisify(jwt.verify)(token,process.env.JWT) // rise error
    // check if the user still exicts 
    const freshUser = await User.findById(verified.id)
    if(!freshUser){
        return next(new AppError(401,"the user is no longer exicts"))
    }
    // check if user changes passord before the token
    const changed = await freshUser.changed(verified.iat)
    if(changed){
        return next(new AppError(401,"the password was changed please try to login again"))
    }
    // send response
    res.locals.user = freshUser
    req.user = freshUser
    next()

     
})
// check login in views
const checkLoginView = async(req,res,next)=>{
    // check if the token is exicts
    if(!req.cookies.jwt){
        return next()
    }
    const token = req.cookies.jwt
    
    // check if the jwt is true or not expired
    try{
        jwt.verify(token,process.env.JWT)
    }catch{
        return next()
    }
    // check if the user still exicts 
    const verified = jwt.verify(token,process.env.JWT)
    const freshUser = await User.findById(verified.id)
    if(!freshUser){
        return next()
    }
    // check if user changes passord before the token
    const changed = await freshUser.changed(verified.iat)
    if(changed){
        return next()
    }
    // send response
    res.locals.user = freshUser
    next()

     
}
const signUp = catchAsync(async(req,res,next)=>{
    const user =await User.create(req.body)
    const token = Passport(user,res)
    res.status(201).json({
        status : "succses",
        token,
        data : {
            
            user
        }
    })
})
//check permition
const restrictTo = (...roles)=>{ // roles is an array
   return (req,res,next)=>{
     if(! roles.includes(req.user.role) ) return next(new AppError(405,"you are not autorised to do that"))
     next()
    }
    
}
const login = catchAsync(async(req,res,next)=>{
const {email , password} = req.body
//check if the email and password  are exict
    if(!email || !password) return next(new AppError(401,"plase enter email and password"))
// check if the user is exicts
    const user  =await User.findOne({email}).select("+ password")
    
    console.log(user)
     if(!user || ! (await user.correctPassword(password,user.password)) ) return next(new AppError(401,"incorrect email or password"))
// give token
const token = Passport(user,res)
// get res 
    res.status(200).json({
        status : "succses",
        token,
        data : {
            
            user
        }
    })
})
const deleteUser = (req,res,next)=>{
    User.findByIdAndDelete(req.params.id)
    res.status(400).json({
        message : "deleted with succsesfully"
    })
}
// reset password 
const forgotPassword = catchAsync(async(req,res,next)=>{
    // get the user by his email
    const {email} = req.body
    if(!email) return next(new AppError(400,"please enter your email adresse"))
    const user =await User.findOne({email})
    if(!user)return next(new AppError(400,"no user found by this email"))
    // generat the random token
    const resetToken =await user.createPasswordResetToken()
    await user.save({validateBeforeSave : false})
    /* console.log(resetToken) */
    //send it to the user email
    const link = `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${resetToken}`
    try {
        sendEmail({
            email : email,
            subject : "reset password request" ,
            message : `forgot your password ? send a patch request to reset it \n ${link} \n if you dont plase just egnor this mail`  
        })
    } catch (error) {
        console.error("an error during sending email 💥")
        user.resetToken = undefined
        user.expireResetToken = undefined
        user.save({validateBeforeSave:false})
        return next(new AppError(500,"some thing wrong please send a reset password request again"))
    }
    res.status(200).send("email have been sent to the email")
})
const resetPassword = catchAsync(async(req,res,next)=>{
    // 1 get user based on the token
    const {token} = req.params
    const cryptedPassword  = crypto.createHash('sha256').update(token).digest("hex")
    const user =await User.findOne({resetToken : cryptedPassword})
    // check to reset token
    if(!user || new Date(user.expireResetToken).getTime() < Date.now()) return next(new AppError(400,"link not correct or expire"))
    // save the new password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
   user.expireResetToken=undefined
   user.resetToken = undefined
   user.changedAt =  Date.now()
   await user.save()
  // sing in the user
  Passport(user,res)
    res.send(req.params.token)

} )
const changePassword =catchAsync( async(req,res,next)=>{
    const {old,newPassword,passwordConfirm} = req.body
         // get the user
     const user = await User.findOne({_id:req.user._id}).select(" + password")
     
    // check the old password
     if(! (await user.correctPassword(old,user.password)))return next(new AppError(400,"your oldpassword isnt true"))
     user.password = newPassword
     console.log(newPassword,passwordConfirm)
     user.passwordConfirm = passwordConfirm
     await user.save()
     res.send("changed ")
})
const updateMe =catchAsync(async(req,res,next)=>{
    const alowed = ["name","email"]
    const body_ = req.body
    const new_ = {}
 Object.keys(body_).forEach(el=>{
     if(alowed.includes(el)) new_[el]=body_[el]
 })
 if(req.file) new_.photo = req.file.filename

    const user =await User.findByIdAndUpdate(req.user._id,new_,{new:true,runValidators:true,runSettersOnQuery:true})
    const token = Passport(user,res)
    res.status(201).json({
        status  :'success',
        user,
        token
    })
})
const deleteMe = async(req,res,next)=>{
    const {password} = req.body
    const user = await User.findOne({_id:req.user._id}).select("+ password")
    if(!password)return next(new AppError(401,"please provide your password"))
    if(!await user.correctPassword(password,user.password)) return next(new AppError(401,"password incorrect"))
    user.active = false
    await user.save({validateBeforeSave:false})
    res.status(200).json({
        status : "succsses",
        message : "deleted"
    })
}
const logout = async(req,res,next)=>{
    await res.cookie("jwt","logout",{
        expires : new Date(Date.now()+1*24*60*60*1000) ,
        secure:process.env.NODE_ENV!="dev" ? true : false,
        httpOnly : true,
    })
    res.status(200).json({
        status : "success",
        message : "loged out"
    })
}
// upload files 

// multerStorage
//   **** save in the disk direclty
// const multerStorage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,"public/img/users")
//     },
//     filename:(req,file,cb)=>{
//         const ext = file.mimetype.split("/")[1]
//         cb(null,`user-${req.user._id}-${Date.now()}.${ext}`)
//     }
// })
const multerStorage = multer.memoryStorage() // it saves it the buffer
const multerFilter = async(req,file,cb)=>{
    if(file.mimetype.startsWith("image")){
        return cb(null,true)
    }
    cb(new AppError(400,"please enter a valid image"),false)
}
const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
}).single('photo')

// modify the image
const modifyImage = (req,res,next)=>{
    if(!req.file) return next()
    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`
    sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/users/${req.file.filename}`)
}

module.exports = {getUsers,signUp,login,checkLogin,deleteUser,restrictTo,forgotPassword,resetPassword,changePassword,updateMe,deleteMe,checkLoginView,logout,upload}