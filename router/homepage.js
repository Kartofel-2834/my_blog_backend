const express = require("express")
const SqlManagerConstructor = require('../utils/sqlManager.js')
const staticData = require('../static.js')

// ROUTES LISTENERS
const sendUserInfo = require("./homepage_routes/sendUserInfo.js")
const createPost = require("./homepage_routes/createPost.js")
const deletePost = require("./homepage_routes/deletePost.js")
const { follow, unfollow } = require("./homepage_routes/follow.js")
const { likePost, dislikePost } = require("./homepage_routes/likePost.js")
const exitAccount = require("./homepage_routes/exitAccount.js")

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

  router.delete("/post", async (req, res)=>{
    await deletePost(req, res, dbManager)
  })

  router.post("/follow", async (req, res)=>{
    await follow(req, res, dbManager)
  })

  router.delete("/follow", async (req, res)=>{
    await unfollow(req, res, dbManager)
  })

  router.post("/like", async (req, res)=>{
    await likePost(req, res, dbManager)
  })

  router.delete("/like", async (req, res)=>{
    await dislikePost(req, res, dbManager)
  })

  router.post("/exitAccount", async (req, res)=>{
    await exitAccount(req, res, dbManager)
  })

  return router
}

module.exports = homePageRouter
