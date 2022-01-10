const { getRandom } = require("../../utils/helpers.js")

function generateAuthToken(len){
  let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"
  let ans = ""

  for (let i=0; i<len; i++){
    ans += alpha[ getRandom(alpha.length) ]
  }

  return ans
}

async function signIn(req, res, dbManager){
  if( !req.body.mail || !req.body.password ){
    res.status(400).send("Bad request"); return
  }

  let user = null

  try {
    user = await dbManager.selectFrom("users", {
      mail: req.body.mail,
      password: req.body.password
    })
  } catch(err) { res.status(500).send("Server error"); return }

  if ( user.length == 0 ){
    res.status(401).send("Wrong password or e-mail"); return
  } else {
    user = user[0]
  }

  if ( !user || !user.tagname ){
    res.status(500).send("Something went wrong"); return
  }

  let authKey = generateAuthToken(16)

  try {
    await dbManager.update("users", { authkey: authKey }, { id: user.id })
  } catch(err) { console.log(err); res.status(500).send("Server error"); return }

  res.status(200).json({ tagname: user.tagname, authKey: authKey })
}

module.exports = signIn
