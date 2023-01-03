const nodemailer = require("nodemailer")
const sendEmail = async(object)=>{
    // create a transport
    const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "774e27a7e2a469",
      pass: "4a3fc3e5cfdc5d"
    }
    })
    // define the email options
    const emailOptions = {
        from:"bader zaouich <baderzaouichbz@gmail.com>",
        to : object.to,
        subject :object.subject,
        text : object.message
    }
    // send the email
    await transport.sendMail(emailOptions)
}
module.exports = sendEmail