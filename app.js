const express = require("express")
const dotenv = require("dotenv")
const usersRouter = require("./routers/usersRouter")
const jobsRouter = require("./routers/jobsRouter")
const errController = require("./controllers/errController")

const app = express()
app.use(express.json())
dotenv.config({path:"./config.env"})

app.use("/api/v1/users",usersRouter)
app.use("/api/v1/jobs",jobsRouter)
app.use(errController)

module.exports = app