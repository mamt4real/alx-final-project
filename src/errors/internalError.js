class InternalServerError extends Error {
  isUserError = false

  constructor(message) {
    super(message)
    this.statusCode = 500
  }
}

module.exports = InternalServerError
