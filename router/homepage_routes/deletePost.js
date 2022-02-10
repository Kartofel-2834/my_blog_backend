const fs = require("fs").promises
const path = require("path")
const staticData = require("../../static.js")

async function getUser(id, authkey, dbManager){
  if ( !id || !authkey ){ return null }

  let user = await dbManager.selectFrom("users", { id, authkey })

  return Array.isArray(user) && user.length > 0 ? user[0] : null
}

async function deletePostImages(postId, dbManager){
  let answer = { err: null }
  let images = null
  let postImagesPath = path.join(staticData.dirname, "public", "post_images")

  try {
    images = await dbManager.selectFrom("post_images", { post_id: postId })
  } catch (err) {
    answer.err = err; return answer
  }

  if ( !Array.isArray(images) || images.length == 0 ){
    answer.err = true; return answer
  }

  try {
    await dbManager.deleteFrom("post_images", { post_id: postId })
  } catch (err) { answer.err = err; return }


  for (let img of images){
    try {
      await fs.unlink(path.join(postImagesPath, img.filename))
    } catch (err) { answer.err = err; return }
  }

  return answer
}

async function deletePost(req, res, dbManager){
  let postId = req.body.postId
  let post = null
  let user = null

  if( !postId || typeof postId != "number" ){
    res.status(400).send("Bad request!"); return
  }

  try {
    post = await dbManager.selectFrom("posts", { id: postId })
    post = post.length > 0 ? post[0] : null
  } catch (err) {
    res.status(500).send("Server error"); return
  }

  if ( !post || !post.id ){ res.status(404).send("Post not found"); return }

  try {
    user = await getUser(req.body.userId, req.body.authkey, dbManager)
  } catch (err){
    res.status(500).send("Server error"); return
  }

  if ( !user || user.id != post.owner_id ){ res.status(403).send("Forbidden"); return }

  if ( post.images ){
    let imageDeleteRes = await deletePostImages(post.id, dbManager)

    if ( imageDeleteRes.err ){ res.status(500).send("Server error"); return }
  }

  try {
    await dbManager.deleteFrom("likes", { post_id: postId })
    await dbManager.deleteFrom("posts", { id: postId })
  } catch (err) {
    res.status(500).send("Server error"); return
  }

  res.status(200).send("Post deleted")
}

module.exports = deletePost
