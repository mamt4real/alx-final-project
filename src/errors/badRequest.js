const ErrorResponse = require('./errorResponse.js')

class BadRequest extends ErrorResponse {
  constructor(message) {
    super(message, 400)
  }
}

module.exports = BadRequest
