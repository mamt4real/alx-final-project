const Photo = require('../../models/Photo')
const catchAsync = require('../../utils/catchAsync')
const GeneralController = require('../../utils/handlerFactory')

const downloadPhoto = catchAsync(async (req, res, next) => {
  res.status(200).send('Not Implemented')
})

const uploadPhoto = catchAsync(async (req, res, next) => {
  res.status(200).send('Not Implemented')
})

const likeDislikePhoto = catchAsync(async (req, res, next) => {
  res.status(200).send('Not Implemented')
})

const getAllPhotos = GeneralController.getAll(Photo)
const getOnePhoto = GeneralController.getOne(Photo)
const updatePhoto = GeneralController.updateOne(Photo, ['owner', 'url'])

module.exports = {
  getAllPhotos,
  getOnePhoto,
  downloadPhoto,
  uploadPhoto,
  updatePhoto,
}
