const { MongoClient } = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()


const {
  MONGODB_URL = 'mongodb://mongo',
  MONGODB_DB = 'shcp',
  MONGODB_COLLECTION = 'devices',
} = process.env


const mongodb_options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}

let db

const connect = () => new Promise((resolve, reject) => {
  console.log(`[MongoDB] Connecting...`)
  MongoClient.connect(MONGODB_URL, mongodb_options)
    .then(client => {

        console.log(`[MongoDB] Connected`)
        db = client.db(MONGODB_DB)

        resolve(db)

    })
    .catch(error => {
        console.log(error)
        console.log(`[MongoDB] Connection failed`)
        //setTimeout(connect, 5000)

        reject(error)
    })
})




exports.url = MONGODB_URL
exports.db_name = MONGODB_DB
exports.collection = MONGODB_COLLECTION
exports.get_db = () => db
exports.get_collection = () => db.collection(MONGODB_COLLECTION)
exports.connect = connect
