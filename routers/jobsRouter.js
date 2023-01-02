const getAllJobs = require("../controllers/jobsControllers")
const {Router} = require("express")
const checkLogin = require("../controllers/authController")
const router = Router()
router.route("/").get(checkLogin,getAllJobs)
module.exports = router