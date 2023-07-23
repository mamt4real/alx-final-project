const { isValidObjectId } = require('mongoose')
const Photo = require('../../models/Photo')
const catchAsync = require('../../utils/catchAsync')
const GeneralController = require('../../utils/handlerFactory')
const BadRequest = require('../../errors/badRequest')
const NotFound = require('../../errors/not-found')
const fs = require('fs')
const { getPhotoLocalPath } = require('../../utils/multerHandler')

const downloadPhoto = catchAsync(async (req, res, next) => {
  const { photoID } = req.params
  if (!isValidObjectId(photoID)) return next(new BadRequest('Invalid ID'))
  const photo = await Photo.findById(photoID).select('url')
  if (!photo) return next(new NotFound('Photo not found'))

  const subPath = photo.url.split('/images/')[1]
  const fullPath = getPhotoLocalPath(subPath)
  const filename = photo.url.substring(photo.url.lastIndexOf('/'))
  const ws = fs.createWriteStream(fullPath)

  const reply = req.query.inline ? 'inline' : 'attachment'

  res.setHeader('Content-Disposition', `${reply}; filename=${filename}`)
  res.setHeader('Content-Type', 'image/jpeg')
  return ws.write(res, function () {
    res.status(200).end()
  })
})

const likeDislikePhoto = GeneralController.like(Photo)
const allowPhotoEdit = GeneralController.allowEdits(Photo, ['owner'])
const uploadPhoto = GeneralController.createOne(Photo)
const getAllPhotos = GeneralController.getAll(Photo)
const getOnePhoto = GeneralController.getOne(Photo)
const updatePhoto = GeneralController.updateOne(Photo, ['owner', 'url'])
const deletePhoto = GeneralController.deleteOne(Photo)

module.exports = {
  getAllPhotos,
  getOnePhoto,
  downloadPhoto,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
  allowPhotoEdit,
  likeDislikePhoto,
}
