const { Schema, model } = require('mongoose')

const photoSchema = Schema(
  {
    title: String,
    description: String,
    url: {
      type: String,
      required: [true, 'url is missing'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'owener id is required'],
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

photoSchema.pre(/^find/, function (next) {
  this.populate('owner', 'image username')
  next()
})

photoSchema.pre('findOne', function (next) {
  this.populate('likes', 'image username')
  next()
})

const Photo = model('Photo', photoSchema)
module.exports = Photo
