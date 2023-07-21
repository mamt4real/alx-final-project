import ErrorResponse from './errorResponse.js'

class Forbidden extends ErrorResponse {
  constructor(message: string) {
    super(message, 403)
  }
}
export default Forbidden
