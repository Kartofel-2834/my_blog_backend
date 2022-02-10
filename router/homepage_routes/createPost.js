const fs = require("fs").promises
const path = require("path")
const staticData = require("../../static.js")

const { cloneFile } = require("../../utils/helpers.js")

async function sortFileByMimetype(file){
  let answer = { err: null, filetype: null }
  let publicPath = path.join(staticData.dirname, "public")

  switch (file.mimetype) {
    case "image/jpeg":
    case "image/png":
      try {
        await cloneFile(file.path, path.join(publicPath, "post_images", file.filename))
      } catch(err) { answer.err = err }

      answer.filetype = "images"
    break
  }

  try {
    await fs.unlink(file.path)
  } catch(err) {
    console.log(err)
  }

  return answer
}

async function getUser(id, authkey, dbManager){
  if ( !id || !authkey ){ return null }

  let user = await dbManager.selectFrom("users", { id, authkey })

  return Array.isArray(user) && user.length > 0 ? user[0] : null
}

async function sortAndParseFiles(files){
  let answer = {}

  for (let file of files){
    let sortAns = await sortFileByMimetype(file)

    if ( sortAns.err ){ return null }

    if ( sortAns.filetype ){
      let dbFile = {
        filename: file.filename,
        ext: path.extname(file.filename),
      }

      if ( answer[sortAns.filetype] ){
        answer[sortAns.filetype].push(dbFile)
      } else {
        answer[sortAns.filetype] = [ dbFile ]
      }
    }
  }

  return answer
}

async function packPost(sqlPost, postFiles, dbManager){
  let post = sqlPost

  post.date = Number(post.date)

  post.likes = await dbManager.selectFrom("likes", { post_id: post.id })
  post.likes = Array.isArray(post.likes) ? post.likes : []

  for ( let filetype of ["images"] ){
    post[filetype] = postFiles[filetype] ? postFiles[filetype] : []
  }

  return post
}

async function insertPostFilesInfoInDb(postId, postFiles, dbManager){
  let files = postFiles

  for ( let filetype of Object.keys(files) ){
    for ( let fileInfo of files[filetype] ){
      fileInfo.post_id = postId

      await dbManager.insertIn(`post_${ filetype }`, fileInfo)
    }
  }

  return files
}

//ROUTE LISTENER


async function createPost(req, res, dbManager){
  let authkey = req.body.authkey

  let newPost = req.body
  delete newPost.authkey

  if ( !authkey || !newPost.owner_id && !(newPost.text || req.files.length > 0) ){
    res.status(400).send("Bad request"); return
  }

  newPost.owner_id = Number(newPost.owner_id)

  try {
    let user = await getUser(newPost.owner_id, authkey, dbManager)

    if ( !user ){ res.status(404).send("User not found"); return }
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  let postFiles = await sortAndParseFiles(req.files)

  if ( postFiles == null ){
    res.status(500).send("Server error"); return
  }

  for ( let filetype of Object.keys(postFiles) ){ newPost[filetype] = true }

  let createdPost = null

  try {
    createdPost = await dbManager.insertIn("posts", newPost)
    createdPost = Array.isArray(createdPost) && createdPost.length > 0 ? createdPost[0] : null
  } catch(err) {
    res.status(500).send("Server error"); return
  }

  if ( !createdPost ){ res.status(500).send("Server error"); return }

  try {
     postFiles = await insertPostFilesInfoInDb(createdPost.id, postFiles, dbManager)
  }
  catch (err){
    res.status(500).send("Server error"); return
  }

  try {
    createdPost = await packPost(createdPost, postFiles, dbManager)
  } catch (err) {
    res.status(500).send("Server error"); return
  }

  res.status(200).json({ created: createdPost })
}

module.exports = createPost
