const { Router } = require("express")
const { forgotPassword,resetPassword } = require("../controllers/authController")
const {signUp,upload,modifyImage,login} = require("../controllers/usersController")
const router = Router()
router.route("/signUp").post(upload,modifyImage,signUp)
router.route("/login").post(login)
router.post("/forgotPassword",forgotPassword)
router.post("/resetPassword/:token",resetPassword)
module.exports = router