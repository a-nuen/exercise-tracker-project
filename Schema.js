const mongoose = require('mongoose')
const shortid = require('shortid')

const userSchema = mongoose.Schema({
  _id: {type: String, 'default': shortid.generate},
  username: String,
  log: []
})

const exerciseSchema = mongoose.Schema({
  _id: String,
  description: String,
  duration: Number,
  date: String
})

exports.User = mongoose.model('User', userSchema)
exports.Exercise = mongoose.model('Exercise', exerciseSchema)
