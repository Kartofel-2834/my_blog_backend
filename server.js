const express = require("express")
const app = express()
const path = require("path")

let port = process.env.PORT;

if (port == null || port == "") {
  port = 8000;
}

let srcPath = __dirname.split("\\")
srcPath.length = srcPath.length-1
srcPath = srcPath.join("\\")
srcPath = path.join(srcPath, "src")

app.use(express.static(srcPath));


app.get("/", (req, res)=>{
  res.sendFile( path.join(srcPath, "html", "index.html") )
})

app.listen(port, ()=>{ console.log(`Server working on port ${port}`) })
