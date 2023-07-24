const User = require('../../models/User')
const catchAsync = require('../../utils/catchAsync')
const factory = require('../../utils/handlerFactory')
const multer = require('multer')
const sharp = require('sharp')
const BadRequest = require('../../errors/badRequest')
const { isValidObjectId } = require('mongoose')

const filterBody = (body, ...valids) => {
  const filtered = {}
  Object.keys(body)
    .filter((key) => valids.includes(key))
    .forEach((element) => {
      filtered[element] = body[element]
    })
  return filtered
}

exports.userPhotoFilter = catchAsync(async (req, res, next) => {
  const uid = req.params.userID
  const filter = req.filter || {}
  if (!filter.owner) filter.owner = uid
  if (req.body.owner) req.body.owner = uid
  req.filter = filter
  next()
})

const followUnfollow = async (req, res, followerUpdate, followingUpdate) => {
  const id = req.body.user || req.body.userId || req.body.userID
  if (!isValidObjectId(id)) throw new BadRequest('invalid user id provided')

  const updates = [
    User.findByIdAndUpdate(req.user._id, followerUpdate),
    User.findByIdAndUpdate(id, followingUpdate),
  ]

  await Promise.all(updates)

  res.status(200).json({ status: 'success', message: 'Operation Successful' })
}

exports.follow = catchAsync(async (req, res, next) => {
  const id = req.body.user || req.body.userId || req.body.userID
  if (!id) {
    throw new BadRequest('Please provide the userID you wish to follow')
  }
  if (req.user.followings.includes(id)) {
    throw new BadRequest('You are already following this member')
  }

  if (req.user.id === id) {
    throw new BadRequest("You can't follow yourself")
  }
  const followUpdate = { $addToSet: { followings: id } }
  const followingUpdate = { $addToSet: { followers: req.user._id } }
  await followUnfollow(req, res, followUpdate, followingUpdate)
})

exports.unFollow = catchAsync(async (req, res, next) => {
  const id = req.body.user || req.body.userId || req.body.userID
  if (!req.user.followings.includes(id)) {
    throw new BadRequest('You are already not following this member')
  }
  const followUpdate = { $pull: { followings: id } }
  const followingUpdate = { $pull: { followers: req.user.id } }
  const user = await followUnfollow(req, res, followUpdate, followingUpdate)
})

exports.getMe = catchAsync(async (req, res, next) => {
  const me = await User.findById(req.user._id)
    .populate('followers', 'username image about')
    .populate('followings', 'username image about')
    .populate('photos', '-owner')

  res.status(200).json({
    status: 'success',
    data: me,
  })
})

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmpass) {
    throw new BadRequest(
      'This is not for password updates, please use /updatepassword'
    )
  }
  const filteredBody = filterBody(
    req.body,
    'name',
    'email',
    'image',
    'username',
    'about'
  )
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  })
  res.status(201).json({ status: 'success', data: updatedUser })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { active: false },
    { new: true }
  )
  res.status(204).json({ status: 'success', data: null })
})

exports.getMyFollowers = catchAsync(async (req, res, next) => {
  const filter = req.filter || {}
  filter.followings = req.user._id
  req.filter = filter
  req.query.fields = ['username', 'image', 'about']
  return factory.getAll(User)(req, res, next)
})

exports.getMyFollowings = catchAsync(async (req, res, next) => {
  const filter = req.filter || {}
  filter.followers = req.user._id
  req.filter = filter
  req.query.fields = ['username', 'image', 'about']
  return factory.getAll(User)(req, res, next)
})

exports.getAllUsers = factory.getAll(User)
exports.createUser = factory.createOne(User)
exports.getUser = factory.getOne(User)
exports.deleteUser = factory.deleteOne(User)
exports.updateUser = factory.updateOne(User)
