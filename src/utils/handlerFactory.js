const QueryHandler = require('./queryHandler')
const {
  BadRequest,
  NotFound,
  RestrictedError,
  PolicyLockedError,
} = require('../errors')
const { default: mongoose, Model } = require('mongoose')
const asyncHandler = require('../../middleware/async')
const Policy = require('../../models/Policy')
const { toNDigits, generateRandomToken } = require('../../utils/helper')

const confirmExistence = (doc, docName) => {
  if (!doc) {
    return Error(`No ${docName} found with that ID`)
  }
  return false
}

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
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
  asyncHandler(async (req, res, next) => {
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
  asyncHandler(async (req, res, next) => {
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
  asyncHandler(async (req, res, next) => {
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
  asyncHandler(async (req, res, next) => {
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
  asyncHandler(async (req, res, next) => {
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
  asyncHandler(async (req, res, next) => {
    const id = req.params[Model.modelName.toLowerCase() + 'ID']
    const [valid, invalid] = exports.validateIds(id)
    if (!valid) {
      return next(new BadRequest(`${invalid} is an Invalid Id`))
    }
    const doc = await Model.findById(id)
    if (!doc)
      return res.status(404).json({ message: `No document with id: ${id}` })
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
      new RestrictedError(
        `You can only ${req.method.toLowerCase()} ${Model.modelName.toLowerCase()} you created`
      )
    )
  })

/**
 * Add aan array of Docs to a Model at Once
 * @param {Model} Model Model gto Create
 * @param {(any)=>boolean | undefined}
 * @returns
 */
exports.addFleetOfItems = (Model, validator = undefined) =>
  asyncHandler(async (req, res, next) => {
    const { items, policyId } = req.body
    if (!items || !policyId)
      return next(new BadRequest('items and policyId are required'))

    if (!(items instanceof Array))
      return next(
        new BadRequest(`items should be an array of ${Model.modelName} Objects`)
      )

    const policy = await Policy.findById(policyId)
    if (!policy) return next(new NotFound('Invalid policyId'))

    if (policy.isPosted) {
      return next(new PolicyLockedError())
    }

    const errors = []
    if (validator) {
      items.forEach((doc, i) => {
        const error = validator(doc)

        if (error)
          errors.push({
            error,
            index: i,
          })
        doc.policyId = policyId
      })

      if (errors.length)
        return res.status(400).json({
          success: false,
          message: 'Error Uploading ' + Model.modelName,
          errors,
        })
    }
    req.policyDoc = policy
    return exports.addPolicyItem(Model, policy.policyClass?.class)(
      req,
      res,
      next
    )
  })

exports.addFleetOfMembers = (Model, validator = undefined) =>
  asyncHandler(async (req, res, next) => {
    const { members, planId } = req.body
    if (!members || !planId)
      return next(new BadRequest('members and planId are required'))

    if (!(members instanceof Array))
      return next(
        new BadRequest(
          `members should be an array of ${Model.modelName} Objects`
        )
      )

    const plan = await Plan.findById(planId)
    if (!plan) return next(new NotFound('Invalid planId'))

    if (plan.isPosted) {
      return next(new PlanLockedError())
    }

    const errors = []
    if (validator) {
      members.forEach((doc, i) => {
        const error = validator(doc)

        if (error)
          errors.push({
            error,
            index: i,
          })
        doc.planId = planId
      })

      if (errors.length)
        return res.status(400).json({
          success: false,
          message: 'Error Uploading ' + Model.modelName,
          errors,
        })
    }
    const newMembers = await Model.create(members)
    res.status(201).json({
      success: true,
      data: newMembers,
    })
  })

/**
 * Create A new Policy Item(s)
 * @param {Model} Model Policy item Model
 * @param {"motor" | "fire" | "marine" | "agric" | "engineering" | "general accident"} policyClass
 * @returns
 */

exports.addPolicyItem = (Model, policyClass) =>
  asyncHandler(async (req, res, next) => {
    const id = req.params.policyID || req.body.policyId || req.body.policy
    if (!id) return next(new BadRequest('policyId is required'))

    req.body.policyId = id
    const policy =
      req.policyDoc || (await Policy.findById(id).populate('policyClass'))

    if (!policy) return next(new NotFound(`No policy found with ID: ${id}`))

    if (
      policy.policyClass.class?.toLowerCase() !==
      policyClass.toLocaleLowerCase()
    )
      return next(
        new BadRequest(`This policy is not in class of ${policyClass}`)
      )

    const lastItem = await Model.findOne({ policy: policy._id })
      .sort('-itemCode')
      .limit(1)

    const sno = parseInt(lastItem?.itemCode?.split('-')[1] || '0') + 1
    const fkey = policyClass.replace(' ', '_').toLowerCase()
    const items = (
      req.body.items && req.body.items instanceof Array
        ? req.body.items
        : [{ ...req.body }]
    ).map((item, i) => ({
      ...item,
      itemCode: `${fkey}-${policy.plid}-${generateRandomToken(3)}${toNDigits(
        2,
        sno + i
      )}`,
      policy: policy._id,
      policyId: policy._id,
    }))

    const data = await Model.create(items)
    res.status(201).json({
      success: true,
      data,
      ...(req.endorsement ? { endorsement: req.endorsement } : {}),
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
