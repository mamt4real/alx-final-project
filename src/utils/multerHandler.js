const multer = require('multer')
const BadRequest = require('../errors/badRequest')
const memStorage = multer.memoryStorage()
const sharp = require('sharp')
const catchAsync = require('./catchAsync')
const UnAuthenticated = require('../errors/unAuthenticated')
const path = require('path')

/**
 * Returns the full local path to an image file
 * @param {string} subPath the path to attach
 * @returns
 */
const getPhotoLocalPath = (subPath) =>
  path.join(__dirname, '../public/images', subPath)

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
    .resize(300, 320)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(getPhotoLocalPath(`users/${req.file.filename}`))

  req.body.image = `${req.protocol}://${req.get('host')}/images/users/${
    req.file.filename
  }`
  next()
})

/**
 * Middleware to resize an uploaded photo into 4:3 aspect ratio
 */
const resizeSinglePhoto = catchAsync(async (req, res, next) => {
  if (!req.user)
    return next(new UnAuthenticated('You must login to upload a file'))
  if (!req.file)
    return next(
      new BadRequest('you must upload an image file with fieldname image!')
    )
  const splitted = req.file.originalname?.trim().replace(/\s/, '_').split('.')
  const oname = splitted.splice(0, -1).join('')
  const ext = splitted.splice(-1)[0]
  const filename = `photo-${req.user?._id}-${oname}.jpg`
  await sharp(req.file.buffer)
    .resize({
      width: 800,
      height: 600,
      fit: sharp.fit.inside,
      position: sharp.strategy.entropy,
    })
    .toFormat('jpeg')
    .jpeg({ quality: 85 })
    .toFile(getPhotoLocalPath(`photos/${filename}`))
  req.body.url = `${req.protocol}://${req.get(
    'host'
  )}/images/photos/${filename}`
  req.body.owner = req.user._id
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
  resizeUserPhoto,
  uploadSinglePhoto,
  resizeSinglePhoto,
  getPhotoLocalPath,
}
