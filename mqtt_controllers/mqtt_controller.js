const mongodb = require('mongodb')
const dotenv = require('dotenv')
const io = require('../socketio.js')
const mqtt_client  = require('../mqtt.js')

dotenv.config()

const MongoClient = mongodb.MongoClient
const ObjectID = mongodb.ObjectID

const db_config = {
  db_url : process.env.MONGODB_URL,
  db_name : "shcp",
  collection_name : "devices",
  options: { useNewUrlParser: true, useUnifiedTopology: true }
}

let subscribe_all = () => {
  console.log(`[MQTT] Subscribing to all topics`);
  // Subscribe to all topics
  MongoClient.connect(db_config.db_url, db_config.options, (err, db) => {
    if (err) return console.error(err)

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

exports.message_callback = (status_topic, payload) => {
  // Callback for MQTT messages
  // Used to update the state of devices in the back and front end

  MongoClient.connect(db_config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) throw err;
    var dbo = db.db(db_config.db_name);

    var query = { status_topic: String(status_topic) };
    var action = { $set: {state: String(payload)} };
    let options = { returnOriginal: false }

    // Update DB
    dbo.collection(db_config.collection_name).findOneAndUpdate( query, action,options, (err, result) => {
      if (err) return console.log("[DB] Error upating devices");
      db.close()
      io.sockets.emit('add_or_update_some_in_front_end', [result.value]);
    })
  })
}
