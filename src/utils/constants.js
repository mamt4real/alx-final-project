/**
 * Confirm the Environment the applicatiois running
 */
const isDevEnv = process.env.NODE_ENV == 'development'

const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
})

module.exports = {
  isDevEnv,
  ROLES,
}
