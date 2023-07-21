const routeNotFound = require('./middlewares/routeNotFound')
const dotenv = require('dotenv')
dotenv.config()
const express = require('express')
const cors = require('cors')
const v1Router = require('./v1/routes/index')
const errorHandler = require('./middlewares/error')
const path = require('path')

// Configure express
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
//supply static files
app.use(express.static(path.join(__dirname, 'public')))

// Hello World endpoint
app.get('/', (req, res) => {
  res
    .status(200)
    .send(
      `E-PHOTOZ API v${process.env.API_VERSION || 1} running on PORT: ${
        process.env.PORT
      } successfully`
    )
})

// register v1 endpoints
app.use('/api/v1', v1Router)

// wild catch
app.use('*', routeNotFound)

// Global error handler
app.use(errorHandler)

module.exports = app
