class ErrorResponse extends Error {
  statusCode:number
  isUserError = true
  constructor(message:string, statusCode:number) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
export default ErrorResponse;
