const app = require("./app");
const mongoose = require("mongoose")
mongoose.connect(process.env.DB).then(()=>{
    console.log("connected to the DB ✔")
})
app.listen(3000,()=>{
    console.log("listning to the port 3000 .......")
    
})