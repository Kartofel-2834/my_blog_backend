const { randomToken, sendMail } = require("../../utils/helpers.js")

async function passwordRecoveryAccessToken(req, res, dbManager, mailTransporter){
  if ( !req.body || !req.body.mail ){ res.status(400).send("Bad request"); return }

  let user = null
  let token = randomToken(6)

  try {
    user = await dbManager.selectFrom("users", { mail: req.body.mail })
    user = user.length && user.length == 1 ? user[0] : null
  } catch(err) { res.status(500).send("Server error"); return }

  if( !user || !user.mail ){ res.status(404).send("User with this mail not exist"); return }

  try {
    console.log(user.mail)
    await sendMail(mailTransporter, user.mail, `Your auth token: ${ token }`, `Token: <b>${ token }</b>`)
  } catch(err) {
    console.log(err)
    res.status(520).send("We can't send auth token on this e-mail"); return
  }

  try {
    let notVerUser = await dbManager.selectFrom("not_verifyed_users", { mail: user.mail, tagname: user.tagname })

    if ( notVerUser.length == 0 ){
      await dbManager.insertIn("not_verifyed_users", {
        name: user.name,
        surname: user.surname,
        tagname: user.tagname,
        mail: user.mail,
        password: user.password,
        token: token,
      })
    } else {
      await dbManager.update("not_verifyed_users", { token: token }, {
        mail: user.mail,
        tagname: user.tagname
      })
    }
  } catch(err) { res.status(500).send("Server error"); return }

  res.status(200).send("Password recovery token was send on your mail")
}



async function passwordRecovery(req, res, dbManager){
  const body = req.body

  if ( !(body && body.password && body.mail && body.token) ){
    res.status(400).send("Bad request"); return
  }

  if ( body.password.length <= 5 || body.password.length >= 20){
    res.status(400).send("Bad request"); return
  }

  let tokenUser = null

  try {
    tokenUser = await dbManager.selectFrom("not_verifyed_users", { mail: body.mail, token: body.token })
    tokenUser = tokenUser.length && tokenUser.length == 1 ? tokenUser[0] : null
  } catch(err) { res.status(500).send("Server error"); return }

  if ( !tokenUser ){ res.status(400).send("Wrong token"); return }

  try {
    await dbManager.update("users", { password: body.password }, {
      mail: tokenUser.mail,
      tagname: tokenUser.tagname
    })
  } catch(err) { res.status(500).send("Server error"); return }

  res.status(202).send("Password was successfully changed")

  try {
    await dbManager.deleteFrom("not_verifyed_users", {
      mail: tokenUser.mail,
      tagname: tokenUser.tagname
    })
  } catch(err) { console.log(err) }
}

module.exports = { passwordRecovery, passwordRecoveryAccessToken }
