const mongodb = require('mongodb')
const dotenv = require('dotenv')
const io = require('../socketio.js')
const mqtt_client  = require('../mqtt.js')

dotenv.config()

const MongoClient = mongodb.MongoClient
const ObjectID = mongodb.ObjectID

const db_config = require('../db_config.js')


let subscribe_all = () => {
  console.log(`[MQTT] Subscribing to all topics`);
  // Subscribe to all topics
  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.log('[DB] Error connecting to the database')

    db.db(db_config.db_name)
    .collection(db_config.collection_name).find({})
    .toArray((err, result) => {
      db.close();
      if (err) return console.error(err)

      // Subscribe to all topics
      result.forEach((device) => {
        if(device.status_topic) {
          console.log(`[MQTT] Subscribing to ${device.status_topic}`)
          mqtt_client.subscribe(device.status_topic)
        }
      })
    })
  })
}

exports.connection_callback = () => {
  // Callback when MQTT is connected
  console.log("[MQTT] connected")
  subscribe_all()
}

exports.message_callback = (topic, payload) => {
  // Callback for MQTT messages
  // Used to update the state of devices in the back and front end

  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {

    if (err) return console.log('[DB] Error connecting to the database')

    const dbo = db.db(db_config.db_name)

    const query = { status_topic: String(topic) }

    // Todo: consider parsing the payload
    const action = { $set: {state: String(payload)} }


    // Update DB
    // Apparenly no other way to find and update many documents
    dbo.collection(db_config.collection_name).updateMany(query, action, (err, update_result) => {

      if (err) {
        db.close()
        return console.log("[DB] Error upating devices");
      }

      // Update front end
      dbo.collection(db_config.collection_name).find(query).toArray( (err, find_result) => {
        db.close()
        if (err) return console.log("[DB] Error getting devices")

        // Broadcast to all clients
        io.sockets.emit('add_or_update_some_in_front_end', find_result);
      })
    })

  })
}
