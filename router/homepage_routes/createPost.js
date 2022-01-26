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
  } catch(err) { console.log(err) }

  return answer
}
//ROUTE LISTENER


async function createPost(req, res, dbManager){
  if ( !req.body.owner_id && !(req.body.text || req.files.length > 0) ){
    res.status(400).send("Bad request"); return
  }

  let newPost = req.body
  newPost.owner_id = Number(newPost.owner_id)

  try {
    let user = await dbManager.selectFrom("users", { id: newPost.owner_id })

    if ( !user || user.length == 0 ){
      res.status(404).send("User not found"); return
    }
  } catch(err) { res.status(500).send("Server error"); return }


  let postFiles = {}

  for (let file of req.files){
    let sortAns = await sortFileByMimetype(file)

    if ( sortAns.err ){ res.status(500).send("Server error"); return }

    if ( sortAns.filetype ){
      let dbFile = {
        filename: file.filename,
        ext: path.extname(file.filename),
      }

      if ( postFiles[sortAns.filetype] ){
        postFiles[sortAns.filetype].push(dbFile)
      } else { postFiles[sortAns.filetype] = [ dbFile ] }
    }
  }

  for ( let filetype of Object.keys(postFiles) ){ newPost[filetype] = true }

  let createdPost = null

  try {
    createdPost = await dbManager.insertIn("posts", newPost)
    createdPost = Array.isArray(createdPost) && createdPost.length > 0 ? createdPost[0] : null
    createdPost.date = Number(createdPost.date)
  } catch(err) { res.status(500).send("Server error"); return }

  if ( !createdPost ){ res.status(500).send("Server error"); return }


  for ( let filetype of Object.keys(postFiles) ){
    let err = null

    postFiles[filetype].map( async (f)=>{
      if ( err ){ return }

      let ans = f
      ans.post_id = createdPost.id

      try { await dbManager.insertIn("post_images", ans) }
      catch (e){ err = e; return }

      return ans
    })

    if (err){ res.status(500).send("Server error"); return }

    createdPost[filetype] = postFiles[filetype]
  }

  res.status(200).json({ created: createdPost })
}

module.exports = createPost
