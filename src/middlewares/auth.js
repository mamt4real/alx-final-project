const jwt = require('jsonwebtoken')
const asyncHandler = require('./async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')
const NotFound = require('../errors/not-found')

// Protect routes
exports.protectedRoute = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1]
    // Set token from cookie
  } else if (req.cookies.token) {
    token = req.cookies.token
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id)

    if (!user)
      return next(new NotFound('User with the auth token no longer Exist!'))

    req.user = user
    next()
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }
})

exports.isLoggedIn = async (req, res, next) => {
  let token
  if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  if (!token) {
    return next()
  }
  let payload
  try {
    payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  } catch (error) {
    return next()
  }
  const user = await User.findById(payload.id)
  if (!user) {
    return next()
  }

  if (user.changesPasswordAfter(payload.iat)) {
    return next()
  }
  res.locals.user = user
  next()
}
