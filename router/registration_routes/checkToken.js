async function checkToken(req, res, dbManager){
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

  try {
    await dbManager.deleteFrom('not_verifyed_users', { tagname: body.tag })
  } catch(err) { res.status(500).send("Server error"); return }

  res.status(202).send("Registration complete")
}

module.exports = checkToken
