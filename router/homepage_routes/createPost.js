//ROUTE LISTENER
async function createPost(req, res, dbManager){
  if ( !req.body.owner_id && !(req.body.text || req.body.images) ){
    res.status(400).send("Bad request"); return
  }

  try {
    let user = dbManager.selectFrom("users", { id: req.body.owner_id })

    if ( !user || user.length == 0 ){ res.status(404).send("User not found") }
  } catch(err) { res.status(500).send("Server error") }

  try {
    dbManager.insertIn("posts", req.body)
  } catch(err) { res.status(500).send("Server error") }

  res.sendStatus(204)
}

module.exports = createPost
