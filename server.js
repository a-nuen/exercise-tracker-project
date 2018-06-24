const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const shortid = require('shortid')
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

const User = require('./Schema').User
const Exercise = require('./Schema').Exercise

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// end point for getting user's exercise log
app.get('/api/exercise/log', (req, res) =>{
  const userid = req.query.userId
  const from = Date.parse(req.query.from)
  const to = Date.parse(req.query.to)
  const limit = parseInt(req.query.limit)
  
  User.findById({_id: userid}, { log: {$slice: limit ? limit : 99} }, (err, user) => {
    if (err) return res.json(err)
    
    let output;
    if (from && to) {output = user.log.filter(item => Date.parse(item.date) >= from && Date.parse(item.date) <= to)}
    else if (from) {output = user.log.filter(item => Date.parse(item.date) >= from)}
    else if (to) {output = user.log.filter(item => Date.parse(item.date) <= to)}
    else {output = user.log.filter(item => item.description + item.duration + item.date)}
    res.json(output)
  })
})

// end point to make new user
app.post('/api/exercise/new-user', (req, res) => {
  const username = req.body.username
  
  if (!username) return res.json('username is required') 
  
  User.findOne({username}, (err, user) => {
    if (err) return res.json(err)
    else if (user) return res.json('user already exists')
    else {
      const user = new User({
        username,
      })
      user.save()
      res.json({user: user.username, id: user._id})
    } 
  })
})

// end point to add new exercise to log
app.post("/api/exercise/add", (req, res) => {
  const userid = req.body.userId
  const description = req.body.description
  const duration = req.body.duration
  const date = req.body.date
  
  if (!userid) return res.json('userId is required')
  if (!description) return res.json('description is required')
  if (!duration) return res.json('duration is required')
  User.findById({_id:userid}, (err, user) => {
    if (err) res.json(err)
    else if (!user) res.json('user not found')
    else {
      const exercise = new Exercise({
        _id: userid,
        description,
        duration,
        date
      })
      user.log.push(exercise)
      user.save()
      res.json(exercise)
    }
  })
})  

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
