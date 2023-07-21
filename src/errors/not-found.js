import ErrorResponse from "./errorResponse.js"

class NotFound extends ErrorResponse {
  name = 'NotFound'
  constructor(message:string) {
    super(message, 404)
  }
}

export default NotFound
