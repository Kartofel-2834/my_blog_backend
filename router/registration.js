const express = require("express")
const SqlManagerConstructor = require('../sqlManager.js')

function registrationRouter(db){
  const router = express.Router()
  const sqlManager = new SqlManagerConstructor(db)

  router.post("/registration", async (req, res)=>{
    /*
    await sqlManager.insertIn('not_verifyed_users', req.body)

    let response = await sqlManager.simpleSelectFrom('not_verifyed_users', {
      name: "Umar",
    })
    */

    res.sendStatus(200)
  })

  return router
}

module.exports = registrationRouter
