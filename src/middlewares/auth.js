const jwt = require('jsonwebtoken')
const User = require('../models/User')
const NotFound = require('../errors/not-found')
const catchAsync = require('../utils/catchAsync')
const UnAuthenticated = require('../errors/unAuthenticated')

/**
 * Protect a Route (Authentication)
 * Only Accessible when logged in
 */
exports.protectedRoute = catchAsync(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1]

    // Set token from cookie
  } else if (req.cookies?.token) {
    token = req.cookies.token
  }

  // Make sure token exists
  if (!token) {
    return next(
      new UnAuthenticated(
        'You are not logged in, please login to access this route'
      )
    )
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
    return next(err)
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

/**
 * Protects a Route (Authorization)
 * Only Users with the specified roles can access
 * @param  {...string} roles
 * @returns
 */
exports.restrictRouteTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnAuthenticated(
        'Ooops you are not cleared to perform this action'
      )
    }
    next()
  }
}
