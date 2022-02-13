async function exitAccount(req, res, dbManager){
  let id = req.body.id
  let tagname = req.body.tagname
  let authkey = req.body.authkey

  if( !id || !authkey || !tagname ){
    res.status(400).send("Bad request"); return
  }

  let user = null

  try {
    user = await dbManager.selectFrom("users", { id, authkey, tagname })
    user = Array.isArray(user) && user.length > 0 ? user[0] : null
  } catch (err) {
    res.status(500).send("Server error"); return
  }

  if ( !user ){
    res.status(404).send("User not found"); return
  }

  try {
    await dbManager.update("users", { authkey: null }, { id, authkey, tagname })
  } catch (err) {
    res.status(500).send("Server error"); return
  }


  res.status(200).send("Exit success")
}

module.exports = exitAccount
