const express = require("express")
const SqlManagerConstructor = require('../utils/sqlManager.js')
const staticData = require('../static.js')

// ROUTES LISTENERS
const sendUserInfo = require("./homepage_routes/sendUserInfo.js")
const createPost = require("./homepage_routes/createPost.js")

const { upload } = require("../utils/helpers.js")


function homePageRouter(db){
  const router = express.Router()
  const dbManager = new SqlManagerConstructor(db)

  router.post("/", async (req, res)=>{
    await sendUserInfo(req, res, dbManager)
  })

  router.put("/post", upload.array("clipedFiles"), async (req, res)=>{
    await createPost(req, res, dbManager)
  })

  return router
}

module.exports = homePageRouter
