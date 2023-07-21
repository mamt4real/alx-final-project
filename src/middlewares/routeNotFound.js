/**
 * Wild Card Handler for undefined routes
 * @param {Request} req request object
 * @param {Response} res response object
 */

const routeNotFound = (req, res) => {
  res.status(404).send(`Route: ${req.method} ${req.originalUrl} does not exist`)
}

module.exports = routeNotFound
