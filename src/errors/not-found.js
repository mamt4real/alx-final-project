const ErrorResponse = require('./errorResponse.js')

class NotFound extends ErrorResponse {
  name = 'NotFound'
  constructor(message) {
    super(message, 404)
  }
}

module.exports = NotFound
