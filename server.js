const express = require("express")
const app = express()
const cors = require("cors")
const path = require("path")
const bodyParser = require("body-parser")
const mysql = require("mysql2");
const staticData = require('./static.js')

const SqlManagerConstructor = require('./utils/sqlManager.js')
const registrationRouter = require(`./router/registration.js`)
const homePageRouter = require(`./router/homepage.js`)

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json()

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000
}

app.use(cors())
app.use(urlencodedParser)
app.use(jsonParser)
app.use(express.static(`${ __dirname }/public`))

function timeNowInSqlFormat(){
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

async function deleteOldNotVerUsers(dbManager){
  let users = await dbManager.selectFrom("not_verifyed_users")
  users = users.filter( (user)=>{
    let stamp = Math.floor((Date.now() - user.date) / 60000)
    return stamp > 20
  })

  for (let user of users){
    try {
      dbManager.deleteFrom("not_verifyed_users", { id: user.id })
    } catch(err) { throw err }
  }
}

async function start(){
  let db, dbManager

  try {
    db = await mysql.createConnection({
      host: "localhost",
      database: "users",
      user: staticData.sqlUser.name,
      password: staticData.sqlUser.password,
    })
  } catch(err) { throw err }

  dbManager = new SqlManagerConstructor(db)

  await dbManager.createTable('users', staticData.user_info_schema)
  await dbManager.createTable('not_verifyed_users', staticData.not_ver_user_schema)

  await dbManager.createTable('posts', staticData.posts_schema)
  await dbManager.createTable('post_images', staticData.post_images_schema)
  await dbManager.createTable('follows', staticData.follows_schema)


  setInterval(()=>{ deleteOldNotVerUsers(dbManager) }, 20*60*1000)

  //routers
  app.use(registrationRouter(db))
  app.use(homePageRouter(db))

  app.listen(port, ()=>{ console.log(`Server working on port ${port}`) })
}

start()
