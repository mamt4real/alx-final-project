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

const csvFilter = function (req, file, cb) {
  file.mimetype === 'text/csv'
    ? cb(null, true)
    : cb(new BadRequest('You can only upload a single csv file'), false)
}

const uploadSingleCsvFile = multer({
  storage: memStorage,
  fileFilter: csvFilter,
}).single('file')

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
    .toFile(`public/img/users/${req.file.filename}`)

  req.body.image = `${req.protocol}://${req.get('host')}/images/${
    req.file.filename
  }`
  next()
})

const resizePhoto = catchAsync(async (req, res, next) => {})

const inputImagePath = 'path/to/input/image.jpg'
const outputImagePath = 'path/to/output/resized-image.jpg'

// Desired output image properties
const outputWidth = 800 // The width you want for the resized image
const outputHeight = 600 // The height you want for the resized image
const aspectRatio = '4:3' // The desired aspect ratio, 4:3 in this example
const quality = 80 // Quality factor between 1 and 100

sharp(inputImagePath)
  .resize({
    width: outputWidth,
    height: outputHeight,
    fit: sharp.fit.inside,
    position: sharp.strategy.entropy,
  })
  .jpeg({ quality: quality })
  .toFile(outputImagePath, (err, info) => {
    if (err) {
      console.error('Error resizing image:', err)
    } else {
      console.log('Image resized and saved successfully.')
    }
  })

// const uploadSingleImage

module.exports = {
  uploadSingleCsvFile,
}
