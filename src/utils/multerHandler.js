const multer = require('multer')
const BadRequest = require('../errors/badRequest')
const memStorage = multer.memoryStorage()
const sharp = require('sharp')
const catchAsync = require('./catchAsync')

/**
 * Disk Storage
 */
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.originalname.trim().replace(/\s/, '_')}-${
        req.user?._id
      }-${Date.now()}`
    )
  },
})

/**
 * Multer middleware to only allow image files
 * @param {*} req
 * @param {*} file
 * @param {*} cb
 * @returns
 */
const imageFilter = function (req, file, cb) {
  // Check if the file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new BadRequest('Only image files are allowed!'), false)
  }
  cb(null, true)
}

/**
 * Middleware to resize a profile image into square
 */
const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next()
  req.file.filename = `user-${req.user?._id}-profile.jpeg`

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/images/users/${req.file.filename}`)

  req.body.image = `${req.protocol}://${req.get('host')}/images/${
    req.file.filename
  }`
  next()
})

/**
 * Middleware to resize an uploaded photo into 4:3 aspect ratio
 */
const resizeSinglePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next()
  const filename = `photo-${req.user?._id}-${req.file.originalname}.jpg`
  await sharp(inputImagePath)
    .resize({
      width: 800,
      height: 600,
      fit: sharp.fit.inside,
      position: sharp.strategy.entropy,
    })
    .jpeg({ quality: 85 })
    .toFile(`public/images/photos/${filename}`)
  req.body.url = `${req.protocol}://${req.get('host')}/images/${filename}`
  next()
})

/**
 * Middleware to upload a single photo
 */
const uploadSinglePhoto = multer({
  storage: memStorage,
  fileFilter: imageFilter,
}).single('image')

module.exports = {
  uploadSinglePhoto,
  resizeSinglePhoto,
}
