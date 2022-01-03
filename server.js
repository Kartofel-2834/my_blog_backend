const express = require("express")
const cors = require("cors")
const app = express()
const path = require("path")
const bodyParser = require("body-parser")

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json()

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000
}

let srcPath = __dirname.split("\\")
srcPath.length = srcPath.length-1
srcPath = srcPath.join("\\")
srcPath = path.join(srcPath, "src")

app.use(cors())
app.use(urlencodedParser)
app.use(jsonParser)
app.use(express.static(srcPath))


app.get("/", (req, res)=>{
  res.sendFile( path.join(srcPath, "html", "index.html") )
})

app.post("/registration", (req, res)=>{
  console.log(req.body)
  res.sendStatus(200)
})

app.listen(port, ()=>{ console.log(`Server working on port ${port}`) })
