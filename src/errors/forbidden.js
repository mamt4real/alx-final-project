const ErrorResponse = require('./errorResponse.js')

class Forbidden extends ErrorResponse {
  constructor(message) {
    super(message, 403)
  }
}
module.exports = Forbidden
