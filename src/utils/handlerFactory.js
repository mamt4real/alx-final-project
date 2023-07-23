const QueryHandler = require('./queryHandler')
const { default: mongoose, Model } = require('mongoose')
const catchAsync = require('../utils/catchAsync')
const NotFound = require('../errors/not-found')
const BadRequest = require('../errors/badRequest')
const Forbidden = require('../errors/forbidden')
const UnAuthenticated = require('../errors/unAuthenticated')

const confirmExistence = (doc, docName) => {
  if (!doc) {
    return Error(`No ${docName} found with that ID`)
  }
  return false
}

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const id = req.params[Model.modelName.toLowerCase() + 'ID']
    const [valid, invalid] = exports.validateIds(id)
    if (!valid) {
      return res.status(400).json({ message: `${invalid} is an Invalid Id` })
    }
    const doc = await Model.findByIdAndDelete(id)
    const err = confirmExistence(doc, Model.modelName)
    if (err) return res.status(404).json({ message: err.message })
    res.status(204).send()
  })

/**
 * Update a Document using the cotent from body
 * @param {Object} Model Model to update its doc
 * @param {[string]} forbiddenFields array of fields not allowed to be updated
 * @returns
 */
exports.updateOne = (Model, forbiddenFields = []) =>
  catchAsync(async (req, res, next) => {
    const id = req.params[Model.modelName.toLowerCase() + 'ID']
    const [valid, invalid] = exports.validateIds(id)
    if (!valid) {
      return res.status(400).json({ message: `${invalid} is an Invalid Id` })
    }

    forbiddenFields.forEach((field) => {
      if (req.body[field]) delete req.body[field]
    })

    // If There is a loggedIn User set updatedBy
    if (req.user) req.body.updatedBy = req.user._id

    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    const err = confirmExistence(doc, Model.modelName)
    if (err) return res.status(404).json({ message: err.message })
    res.status(200).json({ status: 'success', data: doc })
  })

/**
 * Get one Document from a collection
 * @param {Model} Model mongoose collection model
 * @param {[string[]]} populateOptions optional arguments to populate the document
 * @returns an express handler/middleware
 */

exports.getOne = (Model, populateOptions = []) =>
  catchAsync(async (req, res, next) => {
    const id = req.params[Model.modelName.toLowerCase() + 'ID']
    const [valid, invalid] = exports.validateIds(id)
    if (!valid) {
      return res.status(400).json({ message: `${invalid} is an Invalid Id` })
    }
    let query = Model.findById(id)
    if (populateOptions.length) {
      populateOptions.forEach((option) => {
        query = query.populate(...option)
      })
    }
    const doc = await query
    const err = confirmExistence(doc, Model.modelName)
    if (err) return next(new NotFound(err.message))
    res.status(200).json({ status: 'succcess', data: doc })
  })

/**
 * Retrieve All Documents from a Model.
 * Uses query string to execut Pagination Projection Sorting
 * @param {*} Model Model to retrieve from
 * @param {(data:Document)=>any} restructureFunction (optional) a function to format the output
 * @returns
 */

exports.getAll = (Model, restructureFunction = null) =>
  catchAsync(async (req, res, next) => {
    const filter = req.filter ? req.filter : {}
    const Processor = new QueryHandler(Model, { ...req.query, ...filter })
    let results = await Processor.process()
    if (restructureFunction) results = results.map(restructureFunction)
    res
      .status(200)
      .json({ status: 'success', result: results.length, data: results })
  })

/**
 *
 * @param {Model} Model
 * @param {(body:object)=>Error | undefined} validator To validate the body
 * @param {(doc:Document, user:Document)=> Promise<void>} callback Possible callback to execute
 * on the newly created document
 * @returns
 */

exports.createOne = (Model, validator = false, callback = false) =>
  catchAsync(async (req, res, next) => {
    // Validate Body if validator is passed
    if (validator) {
      const { error } = validator(req.body)
      if (error) return next(new BadRequest(error.message))
    }
    // If There is a loggedIn User set createdBy
    if (req.user) req.body.createdBy = req.user._id

    const newDoc = await Model.create(req.body)
    callback && (await callback(newDoc, req.user))
    res.status(201).json({ status: 'success', data: newDoc })
  })

/**
 *
 * @param {Model} Model the Model / Table
 * @param {[String]} prohibited List of fields not allowed to be edited by user
 * @returns {Function}
 */
exports.updateMe = (Model, prohibited = []) =>
  catchAsync(async (req, res, next) => {
    const data = req.body

    if (data.hasOwnProperty('password') || data.hasOwnProperty('type'))
      return res.status(200).json({ message: 'Unauthorized field included!' })

    // Remove prohibited Fields
    prohibited.forEach((field) => {
      if (data.hasOwnProperty(field)) delete data[field]
    })
    const updated = await Model.findByIdAndUpdate(req.user._id, data, {
      new: true,
    })
    res.status(200).json({ status: 'success', data: updated })
  })

/**
 *
 * @param {Object} Model
 * @param {[String]} keys array of keys to compare against user ID
 * @param {(doc) => [Boolean, String]} addedCheckFxn A function to check against the document
 * returns an array with first element as true and second as message
 * @returns
 */
exports.allowEdits = (Model, keys, addedCheckFxn = (doc) => [true, '']) =>
  catchAsync(async (req, res, next) => {
    const id = req.params[Model.modelName.toLowerCase() + 'ID']
    const [valid, invalid] = exports.validateIds(id)
    if (!valid) {
      return next(new BadRequest(`${invalid} is an Invalid Id`))
    }
    const doc = await Model.findById(id)
    if (!doc) return next(new NotFound(`No document with id: ${id}`))
    const checkValue = addedCheckFxn(doc)
    if (!checkValue[0]) return res.status(400).json({ message: checkValue[1] })
    req.targetDoc = doc
    for (const key of keys) {
      const id = doc[key]?._id || doc[key]
      if (id.toString() === req.user?._id.toString()) {
        return next()
      }
    }
    next(
      new Forbidden(
        `You can only ${req.method.toLowerCase()} ${Model.modelName.toLowerCase()} you created`
      )
    )
  })

/**
 * A generic Handler for Like
 * @param {Model} Model
 * @returns
 */
exports.like = (Model) =>
  catchAsync(async (req, res, next) => {
    if (!req.user)
      return next(
        new UnAuthenticated('You are not logged in!, please login to proceed')
      )
    const id = Model.modelName.toLowerCase() + 'ID'
    const method = req.method.toLowerCase()
    let updated
    if (method === 'post') {
      updated = await Model.updateOne(
        { _id: req.params[id], likes: { $ne: req.user._id } },
        { $addToSet: { likes: req.user.id } }
      )
    } else {
      // method === delete
      updated = await Model.updateOne(
        { _id: req.params[id], likes: req.user._id },
        { $pull: { likes: req.user.id } }
      )
    }
    res.status(200).json({
      status: 'success',
      message: `Updated successfully`,
      data: updated,
    })
  })

/**
 * Validate if a field is a valid Mongoose ID
 * @param {[String]} keyValues An array of potential mongoose Ids
 * @return {[Boolean, String]} an Array with first value of validity status and second value that fails
 */

exports.validateIds = (...keyValues) => {
  for (const val of keyValues)
    if (!mongoose.Types.ObjectId.isValid(val)) return [false, val]
  return [true, null]
}
