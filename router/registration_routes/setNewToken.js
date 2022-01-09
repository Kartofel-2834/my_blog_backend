const { randomToken, sendMail } = require("../../utils/helpers.js")

async function setNewToken(req, res, dbManager, mailTransporter){
  let token = randomToken(6)
  let user = null

  try {
    user = await dbManager.selectFrom("not_verifyed_users", { tagname: req.body.tag })
    user = user && user.length > 0 ? user[0] : null
  } catch(err) { res.status(500).send("Server error"); return }

  if ( !user || !user.mail ){ res.status(500).send("Server error"); return }

  try {
    await sendMail(mailTransporter, user.mail, `Your auth token: ${ token }`, `Token: <b>${ token }</b>`)
  } catch(err) {
    console.log(err)
    res.status(520).send("We can't send auth token on this e-mail"); return
  }

  try {
    await dbManager.update("not_verifyed_users", { token: token }, { tagname: req.body.tag, mail: user.mail })
  } catch(err) { res.status(500).send("Server error"); return }

  res.status(200).send("Token was changed. Check your mail")
}

module.exports = setNewToken
