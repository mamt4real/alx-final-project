const mongoose = require('mongoose')

mongoose.set('strictQuery', false)
const connnectDb = async () => {
  const { NODE_ENV, DB_CONNECTION, DB_USERNAME, DB_PASSWORD, mongo_URI } =
    process.env

  const connUrl =
    NODE_ENV === 'production'
      ? DB_CONNECTION.replace('<password>', DB_PASSWORD).replace(
          '<username>',
          DB_USERNAME
        )
      : mongo_URI
  const conn = await mongoose.connect(connUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  console.log(`Connected to database on ${conn.connection.host}`)
  conn.connection.on('error', console.error.bind(console, 'connection error: '))
  conn.connection.once('disconnected', function (conn) {
    console.log(`Disconnected from database on ${conn.connection.host}`)
  })
}
module.exports = connnectDb
