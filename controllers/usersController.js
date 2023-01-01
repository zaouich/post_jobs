const User = require("../models/userModel")
const catchAsync = require("../utils/CatchAsync")
const multer = require("multer")
const sharp = require("sharp")
const jwt = require("jsonwebtoken")
const crypto = require('crypto')
const AppError = require("../utils/AppError")
const fs = require("fs")
// give a passport 
const passport = catchAsync(async(user,res)=>{
     const token = jwt.sign({ id: user._id }, process.env.JWTSECRET, { expiresIn: process.env.JWTSECRETEXPIRES });
     return res.status(201).json({
        status:"success",
        user,
        token
        
    })
})
// upload files 
// 1) save the file in the memory
const multerStorage = multer.memoryStorage()
// 2) check if the ile is an image

/* const multerFilter = (req,file,cb)=>{
    console.log(file)
    if(file.mimetype.startsWith("image")) return cb(null,true)
    cb(new AppError(400,"you should enter a valid image format"),false)
} */
const fileFilter = (req,file,cb)=>{
    if(file.fieldname==="image"){
        if(file.mimetype.startsWith("image")) return cb(null,true)
        cb(new AppError(400,"you should enter a valid image format"),false)
    }if(file.fieldname==="resume"){
        if(file.mimetype==="application/pdf") return cb(null,true)
        cb(new AppError(400,"you should enter a valid PDF format"),false)
    }
    
}

// -3) upload the file 
const upload = multer({storage:multerStorage,fileFilter}).fields([
    {name:"image",maxCount:1},{name:"resume",maxCount:1}
])
// -4) sharp the file then save it
const modifyImage = async(req,res,next) => {
    console.log(req.files)
    //  check if the image exicts  if not call next
    if(!req.files.image) {
      return next();
    }
    // if the iamge exicts handle it
    const imageName = `${ crypto.randomBytes(10).toString('hex')}.jpeg`;
    await sharp(req.files.image[0].buffer).resize(500,500).toFormat("jpeg").jpeg({quality:90}).toFile(`public/img/users/${imageName}`);
    req.body.image = imageName;
    
    
    //  check if the image exicts  if not call next
    if(!req.files.resume) {
      console.log('req.files.resume is not present');
      return next();
    }
    console.log('req.files.resume is present');
    // if it exicts handle it
    const resumeName=`${ crypto.randomBytes(10).toString('hex')}.pdf`;
    req.body.resume =  resumeName
    // await sharp(req.files.resume[0].buffer).toFile("public/resumes/",resumeName)
    fs.writeFileSync(`public/resumes/${resumeName}`,req.files.resume[0].buffer,()=>{
        
    });
    return next()
  
  }
  
// sign up
const signUp = catchAsync(async(req,res,next)=>{
    console.log(req.body)
    var {first_name,last_name,email,image,password,confirmPassword,role,resume}= req.body
    const newUser = await User.create({
        first_name,last_name,email,image,password,confirmPassword,role,resume:req.body.resume
    })
    passport(newUser,res)
    
    
})
module.exports = {signUp,upload,modifyImage}