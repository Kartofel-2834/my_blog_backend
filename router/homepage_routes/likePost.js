async function checkUser(tagname, authkey, dbManager){
  if ( !tagname || !authkey ){ return false }

  user = await dbManager.selectFrom("users", { tagname, authkey })

  return Array.isArray(user) && user.length > 0
}

async function likePost(req, res, dbManager){
  if ( !req.body.authkey || !req.body.userTag ){
    res.status(400).send("Bad request"); return
  }

  let reqHaveRights = false

  try {
    reqHaveRights = await checkUser(req.body.userTag, req.body.authkey, dbManager)
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( !reqHaveRights ){ res.status(403).send("Forbidden"); return }

  let like = {
    user_tag: req.body.userTag,
    owner_tag: req.body.ownerTag,
    post_id: req.body.postId,
  }

  for (let key of Object.keys(like)){
    if ( !like[key] ){ res.status(400).send("Bad request"); return }
  }

  if ( like.user_tag == like.owner_tag ){
    res.status(400).send("You can't like your own post!"); return
  }

  let alsoLiked = false

  try {
    alsoLiked = await dbManager.selectFrom("likes", like)
    alsoLiked = alsoLiked.length && alsoLiked.length
  } catch(err) {
    res.status(500).send("Server error")
  }

  if ( alsoLiked ){ res.status(400).send("Also liked"); return }

  let createdLike = null

  try {
    createdLike = await dbManager.insertIn("likes", like)
    createdLike = Array.isArray(createdLike) && createdLike.length > 0 ? createdLike[0] : null
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( createdLike ){
    createdLike.date = Number(createdLike.date)
    res.status(200).json(createdLike)
  } else {
    res.status(500).send("Server error")
  }
}

async function dislikePost(req, res, dbManager){
  if ( !req.body.authkey || !req.body.userTag || !req.body.postId ){
    res.status(400).send("Bad request"); return
  }

  let reqHaveRights = false

  try {
    reqHaveRights = await checkUser(req.body.userTag, req.body.authkey, dbManager)
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( !reqHaveRights ){ res.status(403).send("Forbidden"); return }

  try {
    await dbManager.deleteFrom("likes", {
      user_tag: req.body.userTag,
      post_id: req.body.postId,
    })
  } catch (err){
    res.status(500).send("Server error"); return
  }

  res.status(200).send("Disliked")
}

module.exports = { likePost, dislikePost }
