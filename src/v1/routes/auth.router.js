const { Router } = require('express')
const authController = require('../controllers/authController')
const { protectedRoute } = require('../../middlewares/auth')

const authRouter = Router()

authRouter.post('/login', authController.signin)
authRouter.get('/logout', authController.logout)
authRouter.post('/signup', authController.signup)
authRouter.post('/forgotpassword', authController.forgotPassword)
authRouter.patch('/resetpassword/:token', authController.resetPassword)
authRouter.post(
  '/update-password',
  protectedRoute,
  authController.updatePassword
)

module.exports = authRouter
