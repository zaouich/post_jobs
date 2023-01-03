const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const userSchema = new mongoose.Schema({
    first_name :{
        type : String,
        required : [true,"Why No First Name ?"]
    },last_name:{
        type : String,
        required : [true,"Why No Last Name ?"]
    },email:{
        type:String,
        unique:true,
        required:[true,"Why No Email ?"],
        validate :[validator.isEmail,"Please Provide A valid email"]
    },
    image:{
        type:String,
        required:[true,"Why No image pic ?"],
    },
    password:{
        type:String,
        required:[true,"Why No Password"],
    },confirmPassword:{
        required:[true,"Please Repate Your Passord"],
        type:String,
        validate:{
            validator:function(value){
               return this.password===value
            },
            message:"The passwords do not match"
        }
    },role:{
        required:[true,"why to role"],
        type:String,
        enum:{
            values:["director","researcher"],
            message:"can only be director or researcher"
        }
    }
    , resume:{
        type:String,
        required : [function(){
            return this.role==="researcher"
        },'you should upload your resume']
    },active:{
        type:Boolean,
        default:true
    },changedAt:{
        type:Date
    },resetToken:{
        type:String
    },expireResetToken : {
        type : String
    }
})

userSchema.pre("save",async function(next){
    /* if(! this.isNew) return next() */
    this.password =await bcrypt.hash(this.password,12)
    this.confirmPassword = undefined
    next()
})
// check if the password is true
userSchema.methods.isCorrectPassword=async function (condidatPassword,password){
    return  await  bcrypt.compare(condidatPassword,password)
}
// check if the user doesnt change the password after generating the jwt
userSchema.methods.isChanged = function(JWTCreated){
    if(!this.changedAt) return false
    return this.changedAt.getTime()/1000 < JWTCreated
}
// create an reset token
userSchema.methods.resetPassword = function(){
    // create a random string
    const token = crypto.randomBytes(12).toString("hex")
    // add crypted string to the document
    this.resetToken = crypto.createHash("sha256").update(token).digest("hex")
    // add exipre time 
    this.expireResetToken =  Date.now()+10*60*60*1000
    // send in the email
    return token

}
const User = mongoose.model("User",userSchema)
module.exports = User