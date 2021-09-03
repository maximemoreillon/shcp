const { MongoClient} = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()

const db_url = process.env.MONGODB_URL || 'mongodb://mongo'
const db_name = process.env.MONGODB_DB || 'shcp'
const collection = process.env.MONGODB_COLLECTION || 'devices'


const mongodb_options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

let db

const connect = () => {
    return new Promise((resolve, reject) => {
        console.log(`[MongoDB] Connecting...`)
        MongoClient.connect(db_url, mongodb_options)
            .then(client => {

                console.log(`[MongoDB] Connected`)
                db = client.db(db_name)

                resolve(db)

            })
            .catch(error => {
                console.log(error)
                console.log(`[MongoDB] Connection failed`)
                //setTimeout(mongodb_connect, 5000)

                reject(error)
            })
    })
    
}



exports.collection = collection
exports.db_name = db_name
exports.url = db_url
exports.get_db = () => db
exports.get_collection = () => db.collection(collection)
exports.connect = connect