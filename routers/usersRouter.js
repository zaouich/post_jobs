const { Router } = require("express")
const {signUp,upload,modifyImage,login} = require("../controllers/usersController")
const router = Router()
router.route("/signUp").post(upload,modifyImage,signUp)
router.route("/login").post(login)
module.exports = router