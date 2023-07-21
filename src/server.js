const app = require('./app')
const connnectDb = require('./db')

// connect database
connnectDb()

const PORT = process.env.PORT || 5500

app.listen(PORT, () => {
  console.log('server listenening on port ' + PORT)
})
