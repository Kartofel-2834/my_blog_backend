const { regBodyFieldError, randomToken, sendMail } = require("../../utils/helpers.js")

async function checkRegistrationForm(req, res, dbManager, mailTransporter){
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
}


async function repeats(dbManager, tableName, params, searchType){
  let rep = null

  try {
    rep = await dbManager.selectFrom(tableName, params, searchType ? searchType : "AND")
  } catch(err) { console.log(err); return err }

  if ( !rep || rep.length > 0 ){ return true }

  return false
}

module.exports = checkRegistrationForm
