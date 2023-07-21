import ErrorResponse from "./errorResponse.js"

class UnAuthenticated extends ErrorResponse {
  name = 'UnAuthenticated'
  constructor(message:string) {
    super(message, 401)
  }
}

export default UnAuthenticated
