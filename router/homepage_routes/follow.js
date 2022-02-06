async function follow(req, res, dbManager){
  let followerTag = req.body.followerTag
  let followerKey = req.body.followerAuthkey
  let blogId = req.body.blogId

  if ( !followerTag || !followerKey || !blogId ){
    res.status(400).send("Bad request"); return
  }

  let follower = null

  try {
    follower = await dbManager.selectFrom("users", { tagname: followerTag, authkey: followerKey })
    follower = Array.isArray(follower) && follower.length > 0 ? follower[0] : null
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( !follower || !follower.id ){ res.status(404).send("User not found"); return }

  let followExist = false

  try {
    followExist = await dbManager.selectFrom("follows", { follower_id: follower.id, blog_id: blogId })
    followExist = Array.isArray(followExist) && followExist.length > 0
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( followExist ){ res.status(400).send("You are already follow this blog"); return }

  try {
    await dbManager.insertIn("follows", { follower_id: follower.id, blog_id: blogId })
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  res.status(200).send("Follow complete")
}

module.exports = follow
