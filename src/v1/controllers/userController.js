const User = require('../../models/User')
const catchAsync = require('../../utils/catchAsync')
const factory = require('../../utils/handlerFactory')
const multer = require('multer')
const sharp = require('sharp')
const BadRequest = require('../../errors/badRequest')

/* const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
}); */

const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true)
  else cb(new BadRequest('Error: You can only upload an image'), false)
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
})

exports.uploadUserPhoto = upload.single('image')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next()
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)

  next()
})

const filterBody = (body, ...valids) => {
  const filtered = {}
  Object.keys(body)
    .filter((key) => valids.includes(key))
    .forEach((element) => {
      filtered[element] = body[element]
    })
  return filtered
}

exports.getMe = (req, res, next) => {
  req.params.userID = req.user.id
  next()
}

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
  if (req.file) filteredBody.image = req.file.filename
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

exports.getAllUsers = factory.getAll(User)
exports.createUser = factory.createOne(User)
exports.getUser = factory.getOne(User)
exports.deleteUser = factory.deleteOne(User)
exports.updateUser = factory.updateOne(User)
