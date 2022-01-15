//ROUTE LISTENER
async function createPost(req, res, dbManager){
  if ( !req.body.owner_id && !(req.body.text || req.body.images) ){
    res.status(400).send("Bad request"); return
  }

  try {
    let user = dbManager.selectFrom("users", { id: req.body.owner_id })

    if ( !user || user.length == 0 ){
      res.status(404).send("User not found"); return
    }
  } catch(err) { res.status(500).send("Server error"); return }

  let createdPost = null

  try {
    createdPost = await dbManager.insertIn("posts", req.body)
    createdPost = Array.isArray(createdPost) && createdPost.length > 0 ? createdPost[0] : null
    createdPost.date = Number(createdPost.date)
  } catch(err) { res.status(500).send("Server error"); return }

  if ( !createdPost ) { res.status(500).send("Server error"); return }

  res.status(200).json({ created: createdPost })
}

module.exports = createPost
