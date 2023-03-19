const express = require('express')
const sqlite3 = require('sqlite3').verbose();
const CryptoJS = require("crypto-js")
const app = express()
const port = 4000
app.use(express.json())
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer")
const crypto = require('crypto');

let db = new sqlite3.Database('database.db')
db.run("Create table if not exists users(id integer primary key, email text, password text, is_verified integer DEFAULT 0)")

const SECRET = "LLL"
function generateAccessToken(email, is_verified) {
    return jwt.sign({email, is_verified}, SECRET, { expiresIn: '36000s' });
}

function authenticateToken(req, res, next) {
  const token= req.headers.authorization
  console.log(token)
  if (token == null) {
    return res.sendStatus(401)
  }
  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403)
    }
    next()
  })
}

function checkUser(req,res){
  const token = req.headers['authorization']
  const decoded = jwt.decode(token)
  return decoded
}

app.get('/hello', authenticateToken, (req,res)=>{
  const user=checkUser(req,res)
  if(user.is_verified==1){
    res.send("hello")
  }
      res.send(`not verify`);
  })

app.post('/register', (req, res) => {
    const email = req.body.email
    const password = req.body.password
    const hashed_password = CryptoJS.SHA256(password).toString();
    let sql = "INSERT INTO users (email, password, is_verified) VALUES (?, ?, ?)"
    db.run(sql, [email,hashed_password, 0], function(err){
          if(err){
              res.send(JSON.stringify({status: "Error Reigstering"}))
          }
          let token = generateAccessToken(email, 0)
          send_mail(email, token)
          res.send(JSON.stringify({status: "User Created"}))
      })  
  })

app.post('/login', (req, res) => {
    const email = req.body.email
    const password = req.body.password
    const hashed_password = CryptoJS.SHA256(password).toString();
    let token = generateAccessToken(email)
    console.log(token)
    let sql = "SELECT * from users WHERE email = ?"
    db.get(sql,[email], function(err, row){   
        if(err || !row){
            res.send(JSON.stringify({status:"Wrong credentials"}))
        }
      if(email == row.email && hashed_password == row.password) {
          res.send(JSON.stringify({status: "Logged in", jwt: token}));
      }else {
          res.send(JSON.stringify({status: "Wrong credentials"}));
      }  
    }) 
  })


  function send_mail(mail,token){
  const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
          user: "liana.matshkalyan01@gmail.com",
          pass: "yaaklbpwupfofbsr"
      }
  })
  
  const mailOptions = {
      from: "liana.matshkalyan01@gmail.com",
      to: mail,
      subject: "Sending Email using Node.js",
      text: `sexmel http://localhost:4000/verify?token=${token}`
  }
  
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          console.log(error)
      } else{
          console.log(`Email sent: ` + info.response)
      }
  })
}

app.get("/verify",(req,res)=>{
    const token=req.query.token
    const decoded=jwt.verify(token,SECRET)
      const sql="UPDATE users set is_verified=1 where email=?"
    db.run(sql,[decoded.email],(err)=>{
      if(err){
        res.send("err")
    
      }
      res.send("Email verified")
    })
    })


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })