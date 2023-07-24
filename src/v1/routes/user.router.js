const { Router } = require('express')
const UserController = require('../controllers/userController')
const { protectedRoute, restrictRouteTo } = require('../../middlewares/auth')
const {
  uploadSinglePhoto,
  resizeUserPhoto,
} = require('../../utils/multerHandler')
const photoRouter = require('./photo.router')

const userRouter = Router({ mergeParams: true })

userRouter.use(protectedRoute)

userRouter
  .route('/')
  .get(restrictRouteTo('admin'), UserController.getAllUsers)
  .post(restrictRouteTo('admin'), UserController.createUser)

userRouter
  .route('/me')
  .get(UserController.getMe)
  .patch(uploadSinglePhoto, resizeUserPhoto, UserController.updateMe)
  .delete(UserController.deleteMe)

userRouter
  .route('/:userID')
  .get(UserController.getUser)
  .patch(UserController.updateUser)
  .delete(UserController.deleteUser)

userRouter.use('/:userID/photos', UserController.userPhotoFilter, photoRouter)
userRouter.route('/me/followers').get(UserController.getMyFollowers)
userRouter
  .route('/me/followings')
  .get(UserController.getMyFollowings)
  .post(UserController.follow)
  .delete(UserController.unFollow)

module.exports = userRouter
