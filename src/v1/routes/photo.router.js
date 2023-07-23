const { Router } = require('express')
const PhotoController = require('../controllers/photoController')
const { protectedRoute } = require('../../middlewares/auth')
const {
  uploadSinglePhoto,
  resizeSinglePhoto,
} = require('../../utils/multerHandler')

const photoRouter = Router({ mergeParams: true })

photoRouter
  .route('/')
  .get(PhotoController.getAllPhotos)
  .post(
    protectedRoute,
    uploadSinglePhoto,
    resizeSinglePhoto,
    PhotoController.uploadPhoto
  )

photoRouter
  .route('/:photoID')
  .get(PhotoController.getOnePhoto)
  .patch(
    protectedRoute,
    PhotoController.allowPhotoEdit,
    PhotoController.updatePhoto
  )
  .delete(
    protectedRoute,
    PhotoController.allowPhotoEdit,
    PhotoController.deletePhoto
  )

photoRouter
  .route('/:photoID/like')
  .post(protectedRoute, PhotoController.likeDislikePhoto)
  .delete(protectedRoute, PhotoController.likeDislikePhoto)

photoRouter.get('/:photoID/download', PhotoController.downloadPhoto)

module.exports = photoRouter
