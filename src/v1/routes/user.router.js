const { Router } = require('express')
const UserController = require('../controllers/userController')

const userRouter = Router({ mergeParams: true })

userRouter
  .route('/')
  .get(UserController.getAllUsers)
  .post(UserController.createUser)

module.exports = userRouter
