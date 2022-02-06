async function getUserPosts(dbManager, user){
  let posts = await dbManager.selectFrom("posts", { owner_id: user.id })
  posts = posts && posts.length ? posts : []

  for (let p of posts){
    p.date = Number(p.date)

    if ( p.images ){
      p.images = await dbManager.selectFrom("post_images", { post_id: p.id })
    } else {
      p.images = []
    }
  }

  return posts.reverse()
}

async function getUser(userKeys, dbManager){
  let type = userKeys.authkey ? "owner" : "guest"

  let user = await dbManager.selectFrom("users", userKeys)
  user = user && user.length > 0 ? user[0] : null

  if ( !userKeys.authkey && !user ){
    return null
  } else if ( userKeys.authkey && !user ) {
    type = "guest"
    user = await dbManager.selectFrom("users", { tagname: userKeys.tagname })
    user = user && user.length > 0 ? user[0] : null
  }

  if ( !user || !user.id ){ return null }

  user.posts = await getUserPosts(dbManager, user)

  let followers = await dbManager.selectFrom("follows", { blog_id: user.id }, null, "COUNT(*)")
  user.followers = followers && followers.length > 0 ? followers[0]["COUNT(*)"] : 0

  let follows = await dbManager.selectFrom("follows", { follower_id: user.id }, null, "COUNT(*)")
  user.follows = follows && follows.length > 0 ? follows[0]["COUNT(*)"] : 0

  delete user.password
  if ( type == "guest" ){ delete user.authkey }

  return  { type, user }
}


//ROUTE LISTENER

async function sendUserInfo(req, res, dbManager){
  if ( !req.body.tagname ){ res.status(400).send("Bad request"); return }

  let answer = null

  try {
    answer = await getUser(req.body, dbManager)
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( !answer ){ res.status(404).send("User not found"); return }

  res.status(200).json(answer)

  /*
  if ( !req.body.authKey || !req.body.tagname ){
    res.status(400).send("Bad request"); return
  }

  let user = null

  try {
    user = await getUser(req.body, dbManager)
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( !user ){ res.status(500).send("Server error"); return }

  res.status(200).json(user)
  */
}

module.exports = sendUserInfo
