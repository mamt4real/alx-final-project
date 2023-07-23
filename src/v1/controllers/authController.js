const User = require('../../models/User')
const catchAsync = require('../../utils/catchAsync')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const BadRequest = require('../../errors/badRequest')
const UnAuthenticated = require('../../errors/unAuthenticated')
const NotFound = require('../../errors/not-found')
const InternalServerError = require('../../errors/internalError')

const createAndSendToken = (user, code, res) => {
  const token = user.getSignedJwtToken()
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  })
  user.password = undefined
  res.status(code).json({ status: 'success', token, user })
}

/**
 * Handlker for signing in a new user
 */
exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(
      new BadRequest(`Please enter your ${!email ? 'email' : 'password'}!!`)
    )
  }
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    return next(new UnAuthenticated('Invalid email or password', 401))
  }
  const verified = await user.matchPassword(password)
  if (!verified) {
    return next(new UnAuthenticated('Invalid email or password', 401))
  }
  createAndSendToken(user, 200, res)
})

exports.logout = (req, res) => {
  res.cookie('jwt', 'Logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })
  res
    .status(200)
    .json({ status: 'success', message: 'Logged out Successfully!' })
}

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    about: req.body.about,
  })

  createAndSendToken(newUser, 201, res)
})

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(new BadRequest('Please provide an email!!'))
  }
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new NotFound('User does not exist!!'))
  }
  const resetToken = user.getPasswordResetToken()
  await user.save({ validateBeforeSave: false })
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`
  try {
    await new Email(user, resetURL).sendPasswordReset()
    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email success fully!!',
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.resetTokenExpiresAt = undefined
    await user.save({ validateBeforeSave: false })
    return next(
      new InternalServerError(
        'There is an error sending the email, please try again later!'
      )
    )
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    resetTokenExpiresAt: { $gte: Date.now() },
  })

  if (!user) {
    return next(new UnAuthenticated('Token is invalid or has expired!'))
  }
  user.password = req.body.password
  user.confirmpass = req.body.confirmpass
  user.passwordResetToken = undefined
  user.resetTokenExpiresAt = undefined
  await user.save()
  createAndSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')
  const oldPass = req.body.password
  if (!(await user.verifyPassword(oldPass, user.password))) {
    return next(new Error('Invalid password', 401))
  }
  user.password = req.body.newpassword
  user.confirmpass = req.body.confirmpass
  await user.save()
  createAndSendToken(user, 200, res)
})
