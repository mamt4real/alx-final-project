const User = require('../../models/User')
const catchAsync = require('../utils/catchAsync')
const Error = require('../utils/Error')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })

const createAndSendToken = (user, code, res) => {
  const token = signToken(user.id)

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  })
  user.password = undefined
  res.status(code).json({ status: 'success', token, user })
}

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    throw new Error(`Please enter your ${!email ? 'email' : 'password'}!!`, 400)
  }
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new Error('Invalid email or password', 401)
  }
  const verified = await user.verifyPassword(password, user.password)
  if (!verified) {
    throw new Error('Invalid email or password', 401)
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
    username: req.body.username,
    password: req.body.password,
    confirmpass: req.body.confirmpass,
    email: req.body.email,
  })
  const url = `${req.protocol}://${req.get('host')}/me`
  await new Email(newUser, url).sendWelcome()
  createAndSendToken(newUser, 201, res)
})

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    throw new Error('Please provide an email!!', 404)
  }
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    throw new Error('User does not exist!!', 404)
  }
  const resetToken = user.getPasswordResetToken()
  await user.save({ validateBeforeSave: false })
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`
  try {
    await new Email(user, resetURL).sendPasswordReset()
    res
      .status(200)
      .json({
        status: 'success',
        message: 'Token sent to your email success fully!!',
      })
  } catch (err) {
    user.passwordResetToken = undefined
    user.resetTokenExpiresAt = undefined
    await user.save({ validateBeforeSave: false })
    return next(
      new Error(
        'There is an error sending the email, please try again later!',
        500
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
    throw new Error('Token is invalid or has expired!', 400)
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
    throw new Error('Invalid password', 401)
  }
  user.password = req.body.newpassword
  user.confirmpass = req.body.confirmpass
  await user.save()
  createAndSendToken(user, 200, res)
})
