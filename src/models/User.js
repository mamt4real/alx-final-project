const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { ROLES } = require('../utils/constants')

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: [true, 'Email Already Exist'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    username: {
      type: String,
      default: function () {
        return this.email.split('@')[0]
      },
    },
    name: String,
    about: String,
    image: String,
    followers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    followings: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    active: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: ROLES.USER,
      required: true,
      enum: {
        values: Object.values(ROLES),
        message: 'invalid role',
      },
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
        delete ret.__v
        delete ret._id
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
    timestamps: true,
    discriminatorKey: '_kind',
  }
)

// Virtual Fields
UserSchema.virtual('noOfFollowers').get(function () {
  if (this.followers) return this.followers.length
  return 0
})

UserSchema.virtual('noOfFollowings').get(function () {
  if (this.followings) return this.followings.length
  return 0
})

UserSchema.virtual('photos', {
  localField: '_id',
  foreignField: 'owner',
  ref: 'Photo',
})

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  next()
})

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, username: this.username, iat: Date.now() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  )
}

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}

module.exports = mongoose.model('User', UserSchema)
