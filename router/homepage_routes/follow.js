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
    followExist = await dbManager.selectFrom("follows", { follower_tag: follower.tagname, blog_id: blogId })
    followExist = Array.isArray(followExist) && followExist.length > 0
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( followExist ){ res.status(400).send("You are already follow this blog"); return }

  let followedUser = null

  try {
    followedUser = await dbManager.insertIn("follows", {
      follower_tag: follower.tagname,
      follower_surname: follower.surname,
      follower_name: follower.name,
      blog_id: blogId,
    })

    followedUser = followedUser.length && followedUser.length > 0 ? followedUser[0] : null
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( followedUser && followedUser.blog_id ){
    res.status(200).json(followedUser)
  } else {
    res.status(500).send("Server error")
  }
}

async function unfollow(req, res, dbManager){
  let followerTag = req.body.followerTag
  let blogId = req.body.blogId

  if ( !followerTag || !blogId ){ res.status(400).send("Bad request"); return }

  let followedUser = null

  try {
    followedUser = await dbManager.deleteFrom("follows", { follower_tag: followerTag, blog_id: blogId })
  } catch(err) {
    res.status(500).send("Server error. Unfollow failed"); return
  }

  res.status(200).json("Unfollowed")
}

module.exports = { follow, unfollow }
