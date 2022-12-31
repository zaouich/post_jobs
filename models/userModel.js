const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcrypt")
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
    ,resume:{
        type:String,
        required : [function(){
            return this.role==="researcher"
        },'you should upload your resume']
    },active:{
        type:Boolean,
        default:true
    },changedAt:{
        type:Date
    }
})

userSchema.pre("save",async function(next){
    if(! this.isNew) return next()
    this.password =await bcrypt.hash(this.password,12)
    this.confirmPassword = undefined
})
const User = mongoose.model("User",userSchema)
module.exports = User