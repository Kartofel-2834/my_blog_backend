async function getUserPosts(dbManager, user){
  let posts = await dbManager.selectFrom("posts", { owner_id: user.id })
  posts = posts && posts.length ? posts : []

  posts = posts.map((p)=>{
    let ans = p

    ans.date = Number(p.date)

    if ( p.images ){
      p.images = dbManager.selectFrom("post_images", { post_id: p.id })
    } else { p.images = [] }

    return ans
  })

  return posts
}

async function getUser(userKeys, dbManager){
  let user = await dbManager.selectFrom("users", {
    authkey: userKeys.authKey,
    tagname: userKeys.tagname
  })

  user = user && user.length > 0 ? user[0] : null

  user.posts = await getUserPosts(dbManager, user)

  let followers = await dbManager.selectFrom("follows", { blog_id: user.id }, null, "COUNT(*)")
  user.followers = followers && followers.length > 0 ? followers[0]["COUNT(*)"] : 0

  return user
}


//ROUTE LISTENER

async function sendUserInfo(req, res, dbManager){
  if ( !req.body.authKey || !req.body.tagname ){
    res.status(400).send("Bad request"); return
  }

  let user = null

  try {
    user = await getUser(req.body, dbManager)
  } catch(err) { console.log(err);res.status(500).send("Server error"); return }

  if ( !user ){ res.status(500).send("Server error"); return }

  res.status(200).json(user)
}

module.exports = sendUserInfo
