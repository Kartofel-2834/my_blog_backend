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
  const dbManager = new SqlManagerConstructor(db)

  router.post("/registration", async (req, res)=>{
    let body = req.body
    body.tagname = body.tagname.toLowerCase()

    if ( regBodyFieldError(body) ){ res.status(406).send("Field error"); return }

    let repeatParams = { mail: body.mail, tagname: body.tagname }
    let repeatsInUsers = await repeats(dbManager, "users", repeatParams, "OR")
    let repeatsInNotVerUsers = await repeats(dbManager, "not_verifyed_users", repeatParams, "OR")

    if (typeof repeatsInUsers != "boolean" && typeof repeatsInNotVerUsers != "boolean"){
      res.status(500).send("Server error"); return
    }

    if ( repeatsInUsers || repeatsInNotVerUsers ){
      res.status(406).send('User with this mail or tagnmae already exists'); return
    }

    body.token = randomToken(6)

    try {
      await dbManager.insertIn("not_verifyed_users", body)
    } catch(err) { res.status(500).send("Server error"); return }

    try {
      await sendMail(mailTransporter, body.mail, `Your auth token: ${ body.token }`, `Token: <b>${ body.token }</b>`)
    } catch(err) {
      res.status(520).send("We can't send auth token on this e-mail"); return
    }

    res.sendStatus(204)
  })

  router.post("/token", async (req, res)=>{
    const body = req.body
    let user = null

    if ( !body.tag || !body.token ){ res.status(406).send("Field error"); return }

    try {
      user = await dbManager.selectFrom("not_verifyed_users", { tagname: body.tag })
      user = user && user.length > 0 ? user[0] : null
    } catch(err) { res.status(500).send("Server error"); return }

    if ( !user ){ res.status(500).send("Server error"); return }

    if ( !user.token || user.token != body.token ){
      res.status(423).send("Wrong token"); return
    }

    try {
      await dbManager.insertIn("users", user)
    } catch(err) { res.status(500).send("Server error"); return }

    res.status(202).send("Registration complete")
  })

  return router
}

//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////


async function repeats(dbManager, tableName, params, searchType){
  let rep = null

  try {
    rep = await dbManager.selectFrom(tableName, params, searchType ? searchType : "AND")
  } catch(err) { console.log(err); return err }

  if ( !rep || rep.length > 0 ){ return true }

  return false
}

function regBodyFieldError(body){
  const fieldError = (text)=>{
    const forbiddenSymbols = /^[^\%/\\&\?\,\'\;:!-+!@#\$\^*)(]{0,20}$/

    return !text || !text.length || (text.length <= 1) || (text.length >= 20) || !forbiddenSymbols.test(text)
  }

  let ans = !body || fieldError(body.name) || fieldError(body.surname)
  ans = ans || fieldError(body.tagname)
  ans = ans || !body.password || !body.password.length
  ans = ans || (body.password.length <= 5) || (body.password.length >= 20)
  ans = ans || !(/[a-z]@[a-z]/.test(body.mail))

  return ans
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
