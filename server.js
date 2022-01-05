const express = require("express")
const app = express()
const cors = require("cors")
const path = require("path")
const bodyParser = require("body-parser")
const mysql = require("mysql2");
const staticData = require('./static.js')

const registrationRouter = require(`./router/registration.js`)

const db = mysql.createConnection({
  host: "localhost",
  database: "users",
  user: staticData.sqlUser.name,
  password: staticData.sqlUser.password,
})

const SqlManagerConstructor = require('./sqlManager.js')
const sqlManager = new SqlManagerConstructor(db)

sqlManager.createTable('users', staticData.users_info_schema)

let usersSchemaWithToken = staticData.users_info_schema
usersSchemaWithToken.token = "varchar(255)"

sqlManager.createTable('not_verifyed_users', usersSchemaWithToken)

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json()

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000
}

app.use(cors())
app.use(urlencodedParser)
app.use(jsonParser)
app.use(registrationRouter(db))

//app.use(express.static(srcPath))

app.listen(port, ()=>{ console.log(`Server working on port ${port}`) })
