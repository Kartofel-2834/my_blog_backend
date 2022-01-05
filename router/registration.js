const express = require("express")
const SqlManagerConstructor = require('../sqlManager.js')

const staticData = require('../static.js')

const nodemailer = require('nodemailer')
const mailTransporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: staticData.server_mail,
})


function registrationRouter(db){
  const router = express.Router()
  const sqlManager = new SqlManagerConstructor(db)

  router.post("/registration", async (req, res)=>{
    if ( registrationBodyFieldError(req.body) ){
      res.status(406).send('Field error')
      return
    }

    let repeats = null

    try {
      repeats = await sqlManager.simpleSelectFrom('not_verifyed_users', {
        mail: req.body.mail,
        tagname: req.body.tagname,
      }, "OR")
    } catch (err) { res.sendStatus(500); return }

    if ( !repeats || repeats.length > 0 ){
      res.status(406).send('User with this mail or tagnmae already exists')
      return
    }

    let token = randomToken(6)

    try {
      await sendMail(mailTransporter, req.body.mail, `Your auth token: ${ token }`, `Token: <b>${ token }</b>`)
    } catch (err){ res.sendStatus(520); return }

    let notVerifyedUser = req.body
    notVerifyedUser.token = token

    try {
      await sqlManager.insertIn('not_verifyed_users', notVerifyedUser)
    } catch (err) { res.sendStatus(500); return }

    res.sendStatus(200)
  })

  return router
}

function registrationBodyFieldError(body){
  const fieldError = (text)=>{
    const forbiddenSymbols = /^[^\%/\\&\?\,\'\;:!-+!@#\$\^*)(]{0,20}$/

    return !text || !text.length || (text.length <= 1) || (text.length >= 20) || !forbiddenSymbols.test(text)
  }

  let fieldErrorFinded = !body || fieldError(body.name) || fieldError(body.surname)
  fieldErrorFinded = fieldErrorFinded || fieldError(body.tagname)
  fieldErrorFinded = fieldErrorFinded || !body.password || !body.password.length
  fieldErrorFinded = fieldErrorFinded || (body.password.length <= 5) || (body.password.length >= 20)
  fieldErrorFinded = fieldErrorFinded || !(/[a-z]@[a-z]/.test(body.mail))

  return fieldErrorFinded
}

async function sendMail(transporter, adress, text, html){
  let defaultText = 'This message was sent from Blogpost server'

  let result = await transporter.sendMail({
    from: `"Blogpost" <${ staticData.server_mail.user }>`,
    to: adress,
    subject: 'Message from Blogpost',
    text: text ? text : defaultText,
    html: html ? html : defaultText,
  })

  return result
}

function getRandom( limit ){
	return Math.floor(Math.random() * limit)
}

function randomToken(len){
  let ans = ''

  for (let i=0; i<len; i++){ ans += getRandom(10) }

  return ans
}

module.exports = registrationRouter
