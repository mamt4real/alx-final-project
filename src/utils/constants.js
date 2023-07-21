/**
 * Confirm the Environment the applicatiois running
 */
const isDevEnv = process.env.NODE_ENV == 'development'

module.exports = {
  isDevEnv,
}
