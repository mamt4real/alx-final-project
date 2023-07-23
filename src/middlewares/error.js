const BadRequest = require('../errors/badRequest')
const { isDevEnv } = require('../utils/constants')
const ErrorResponse = require('../errors/errorResponse')
const UnAuthenticated = require('../errors/unAuthenticated')

const errorHandler = (err, req, res, next) => {
  let error = { ...err }

  error.message = err.message

  // Log to console for dev
  if (isDevEnv) console.log(err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = err.message
    error = new BadRequest(message)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    //let valArray = err.errmsg?.match(/(["'])(\\?.)*?\1/);
    let valArray = err.errmsg?.match(/\b\w+(\b)/g)
    let value
    if (valArray) value = valArray[11].toUpperCase()
    else {
      valArray = err.message.split('key: ')
      if (valArray) {
        value = valArray[1]
      }
    }
    // console.log(value)
    error = new BadRequest(
      `Duplicate field value. ${value} please use another value`
    )
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message)
    error = new ErrorResponse(message, 400)
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired, please login again'
    error = new UnAuthenticated(message)
  }
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  })
}

module.exports = errorHandler
