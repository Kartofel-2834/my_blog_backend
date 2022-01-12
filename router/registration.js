const express = require("express")
const SqlManagerConstructor = require('../utils/sqlManager.js')

//ROUTE LISTENERS
const checkRegistrationForm = require("./registration_routes/checkRegistrationForm.js")
const checkToken = require("./registration_routes/checkToken.js")
const setNewToken = require("./registration_routes/setNewToken.js")
const signIn = require("./registration_routes/signIn.js")
const { passwordRecovery, passwordRecoveryAccessToken } = require("./registration_routes/passwordRecovery.js")

const staticData = require('../static.js')
const nodemailer = require('nodemailer')

function registrationRouter(db){
  const router = express.Router()
  const dbManager = new SqlManagerConstructor(db)
  const mailTransporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: staticData.server_mail,
  })

  router.post("/registration", async (req, res)=>{
    await checkRegistrationForm(req, res, dbManager, mailTransporter)
  })

  router.post("/token", async (req, res)=>{
    await checkToken(req, res, dbManager)
  })

  router.post("/newToken", async (req, res)=>{
    await setNewToken(req, res, dbManager, mailTransporter)
  })

  router.post("/signin", async (req, res)=>{
    await signIn(req, res, dbManager)
  })

  router.post("/password-recovery", async (req, res)=>{
    await passwordRecoveryAccessToken(req, res, dbManager, mailTransporter)
  })

  router.patch("/password-recovery", async (req, res)=>{
    await passwordRecovery(req, res, dbManager)
  })

  return router
}

module.exports = registrationRouter
