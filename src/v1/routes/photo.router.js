const { Router } = require('express')
const PhotoController = require('../controllers/photoController')

const photoRouter = Router({ mergeParams: true })

photoRouter.get('/', PhotoController.getAllPhotos)

module.exports = photoRouter
