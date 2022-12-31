const { Router } = require("express")
const {signUp,upload,modifyImage} = require("../controllers/usersController")
const router = Router()
router.route("/").post(upload,modifyImage,signUp)
module.exports = router