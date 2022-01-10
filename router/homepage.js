const express = require("express")
const SqlManagerConstructor = require('../utils/sqlManager.js')
const staticData = require('../static.js')

function homePageRouter(db){
  const router = express.Router()
  const dbManager = new SqlManagerConstructor(db)

  router.post("/", async (req, res)=>{
    if ( !req.body.authKey || !req.body.tagname ){
      res.status(400).send("Bad request"); return
    }

    let user = null

    try {
      user = await dbManager.selectFrom("users", {
        authkey: req.body.authKey,
        tagname: req.body.tagname
      })

      user = user && user.length > 0 ? user[0] : null
    } catch(err) { res.status(500).send("Server error"); return }

    if ( !user ){ res.status(500).send("Server error"); return }

    res.status(200).json(user)
  })

  return router
}

module.exports = homePageRouter
